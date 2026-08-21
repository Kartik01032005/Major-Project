import { Request, Response } from "express";
import BloodInventory from "../models/BloodInventory.js";
import InventoryUploadLog from "../models/InventoryUploadLog.js";
import InventoryThreshold from "../models/InventoryThreshold.js";
import { computeFileHash, parseUploadBuffer } from "../services/bulkUploadService.js";
import { emitToUser } from "../socket/socket.js";
import { enqueueNotification } from "../services/notificationQueue.js";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

// Helper to check critical threshold and send automated alert
async function checkInventoryThresholdsAndNotify(bloodBankId: string) {
  try {
    const threshold = await InventoryThreshold.findOne({ bloodBankId }) ?? {
      critical: 5,
      almostEmpty: 0
    };

    const inventory = await BloodInventory.find({ bloodBankId });
    const lowGroups = inventory.filter((item) => item.units <= threshold.critical);

    if (lowGroups.length > 0) {
      const summaryText = lowGroups
        .map((item) => `${item.bloodGroup}: ${item.units} units`)
        .join(", ");

      enqueueNotification({
        receiverId: bloodBankId,
        title: "⚠️ Critical Stock Alert",
        message: `Inventory is critically low for: ${summaryText}. Consider updating stock or requesting donors.`,
        type: "Inventory",
      });

      emitToUser(bloodBankId, "inventory_alert", {
        lowGroups: lowGroups.map(g => ({ group: g.bloodGroup, units: g.units }))
      });
    }
  } catch (err) {
    console.error("Error evaluating threshold alerts:", err);
  }
}

// @desc    Get blood inventory for authenticated admin
// @route   GET /api/inventory
// @access  Private/Admin
export const getInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const bloodBankId = req.user._id;

    // Upsert all 8 blood group records so admin always sees a full table
    const upsertOps = BLOOD_GROUPS.map((bg) => ({
      updateOne: {
        filter: { bloodBankId, bloodGroup: bg },
        update: { $setOnInsert: { bloodBankId, bloodGroup: bg, units: 0 } },
        upsert: true,
      },
    }));

    await BloodInventory.bulkWrite(upsertOps);

    const inventory = await BloodInventory.find({ bloodBankId }).sort({ bloodGroup: 1 });

    res.status(200).json({
      success: true,
      message: "Blood inventory retrieved successfully",
      data: inventory,
    });
  } catch (error: any) {
    console.error("❌ Get inventory error:", error);
    res.status(500).json({ success: false, message: "Server error during inventory retrieval" });
  }
};

// @desc    Update blood inventory units for a specific record
// @route   PUT /api/inventory/:id
// @access  Private/Admin
export const updateInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { units } = req.body;

    if (typeof units !== "number" || units < 0) {
      res.status(400).json({ success: false, message: "Units must be a non-negative number" });
      return;
    }

    const item = await BloodInventory.findOneAndUpdate(
      { _id: req.params.id, bloodBankId: req.user._id },
      { units: Math.max(0, Math.round(units)) },
      { new: true }
    );

    if (!item) {
      res.status(404).json({ success: false, message: "Inventory record not found" });
      return;
    }

    // Evaluate inventory alert condition
    await checkInventoryThresholdsAndNotify(req.user._id.toString());

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: item,
    });
  } catch (error: any) {
    console.error("❌ Update inventory error:", error);
    res.status(500).json({ success: false, message: "Server error during inventory update" });
  }
};

// @desc    Adjust blood inventory units by a delta (add/remove)
// @route   POST /api/inventory/:id/adjust
// @access  Private/Admin
export const adjustInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { delta } = req.body;

    if (typeof delta !== "number" || !Number.isFinite(delta)) {
      res.status(400).json({ success: false, message: "delta must be a finite number" });
      return;
    }

    const existing = await BloodInventory.findOne({ _id: req.params.id, bloodBankId: req.user._id });
    if (!existing) {
      res.status(404).json({ success: false, message: "Inventory record not found" });
      return;
    }

    const newUnits = Math.max(0, Math.round(existing.units + delta));
    existing.units = newUnits;
    await existing.save();

    await checkInventoryThresholdsAndNotify(req.user._id.toString());

    res.status(200).json({
      success: true,
      message: `Units ${delta >= 0 ? "added" : "removed"} successfully`,
      data: existing,
    });
  } catch (error: any) {
    console.error("❌ Adjust inventory error:", error);
    res.status(500).json({ success: false, message: "Server error adjusting inventory" });
  }
};

// @desc    Sync a blood group's inventory back to the latest uploaded file value
// @route   POST /api/inventory/:id/sync
// @access  Private/Admin
export const syncInventoryFromUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const item = await BloodInventory.findOne({ _id: req.params.id, bloodBankId: req.user._id });
    if (!item) {
      res.status(404).json({ success: false, message: "Inventory record not found" });
      return;
    }

    // Find the most recent upload log for this blood bank
    const latestLog = await InventoryUploadLog.findOne({ bloodBankId: req.user._id }).sort({ createdAt: -1 });

    if (!latestLog) {
      res.status(404).json({ success: false, message: "No upload history found. Please upload a file first." });
      return;
    }

    // Extract the units for this blood group from the latest log summary
    const bloodGroup = item.bloodGroup;
    // unitsByGroup is stored as a Mongoose Map – convert to plain object for lookup
    const unitsByGroup: Map<string, number> | Record<string, number> = latestLog.summary?.unitsByGroup ?? {};
    const uploadedUnits: number | undefined =
      unitsByGroup instanceof Map ? unitsByGroup.get(bloodGroup) : (unitsByGroup as Record<string, number>)[bloodGroup];

    if (uploadedUnits === undefined || uploadedUnits === null) {
      res.status(404).json({
        success: false,
        message: `No data for ${bloodGroup} found in the latest uploaded file.`,
      });
      return;
    }

    item.units = Math.max(0, Math.round(uploadedUnits));
    await item.save();

    await checkInventoryThresholdsAndNotify(req.user._id.toString());

    res.status(200).json({
      success: true,
      message: `${bloodGroup} inventory synced to ${item.units} units from latest upload.`,
      data: item,
    });
  } catch (error: any) {
    console.error("❌ Sync inventory error:", error);
    res.status(500).json({ success: false, message: "Server error syncing inventory" });
  }
};

// @desc    Upload bulk blood inventory file (.xlsx, .xls, .csv, .pdf)
// @route   POST /api/inventory/upload
// @access  Private/Admin
export const uploadInventoryFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const file = req.file;
    if (!file || !file.buffer) {
      res.status(400).json({ success: false, message: "No inventory file uploaded." });
      return;
    }

    const mode = (req.body.mode === "replace" ? "replace" : "merge") as "replace" | "merge";
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    
    let fileType: "xlsx" | "xls" | "csv" | "pdf";
    if (ext === "xlsx") fileType = "xlsx";
    else if (ext === "xls") fileType = "xls";
    else if (ext === "csv") fileType = "csv";
    else if (ext === "pdf") fileType = "pdf";
    else {
      res.status(400).json({ success: false, message: "Unsupported file type. Please upload Excel (.xlsx, .xls), CSV, or PDF." });
      return;
    }

    const bloodBankId = req.user._id;
    const fileHash = computeFileHash(file.buffer);

    // Smart parsing
    const { validRecords, summary } = await parseUploadBuffer(file.buffer, fileType);

    if (summary.validRecords === 0 && summary.errors.length > 0) {
      res.status(400).json({
        success: false,
        message: "No valid blood group records could be extracted from file.",
        summary,
      });
      return;
    }

    // Apply inventory updates
    if (mode === "replace") {
      // Set all 8 blood groups to parsed units (or 0 if absent)
      for (const bg of BLOOD_GROUPS) {
        const units = summary.unitsByGroup[bg] ?? 0;
        await BloodInventory.findOneAndUpdate(
          { bloodBankId, bloodGroup: bg },
          { units },
          { upsert: true }
        );
      }
    } else {
      // Merge mode: Increment existing inventory by parsed units
      for (const bg of BLOOD_GROUPS) {
        const addedUnits = summary.unitsByGroup[bg] ?? 0;
        if (addedUnits > 0) {
          await BloodInventory.findOneAndUpdate(
            { bloodBankId, bloodGroup: bg },
            { $inc: { units: addedUnits } },
            { upsert: true }
          );
        }
      }
    }

    // Save upload history log
    const uploadLog = await InventoryUploadLog.create({
      bloodBankId,
      fileName: file.originalname,
      fileType,
      fileHash,
      mode,
      summary,
    });

    const updatedInventory = await BloodInventory.find({ bloodBankId }).sort({ bloodGroup: 1 });

    // Check critical stock thresholds
    await checkInventoryThresholdsAndNotify(bloodBankId.toString());

    res.status(200).json({
      success: true,
      message: `File processed successfully. ${summary.validRecords} records (${summary.unitsAdded} units) updated in stock (${mode} mode).`,
      summary,
      log: uploadLog,
      inventory: updatedInventory,
    });
  } catch (error: any) {
    console.error("❌ File upload error:", error);
    res.status(500).json({ success: false, message: `Server error parsing inventory file: ${error.message || error}` });
  }
};

// @desc    Get upload history logs
// @route   GET /api/inventory/upload-history
// @access  Private/Admin
export const getUploadHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const logs = await InventoryUploadLog.find({ bloodBankId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error("❌ Get upload history error:", error);
    res.status(500).json({ success: false, message: "Server error fetching upload history" });
  }
};

// @desc    Get configurable availability thresholds
// @route   GET /api/inventory/thresholds
// @access  Private/Admin
export const getThresholds = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    let threshold = await InventoryThreshold.findOne({ bloodBankId: req.user._id });
    if (!threshold) {
      threshold = await InventoryThreshold.create({ bloodBankId: req.user._id });
    }

    res.status(200).json({
      success: true,
      data: threshold,
    });
  } catch (error: any) {
    console.error("❌ Get thresholds error:", error);
    res.status(500).json({ success: false, message: "Server error fetching thresholds" });
  }
};

// @desc    Update configurable availability thresholds
// @route   PUT /api/inventory/thresholds
// @access  Private/Admin
export const updateThresholds = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const {
      highlyAvailable,
      veryHigh,
      high,
      good,
      available,
      moderate,
      low,
      veryLow,
      critical,
      almostEmpty,
    } = req.body;

    const threshold = await InventoryThreshold.findOneAndUpdate(
      { bloodBankId: req.user._id },
      {
        highlyAvailable: Math.max(1, Number(highlyAvailable) || 200),
        veryHigh: Math.max(1, Number(veryHigh) || 150),
        high: Math.max(1, Number(high) || 100),
        good: Math.max(1, Number(good) || 70),
        available: Math.max(1, Number(available) || 50),
        moderate: Math.max(1, Number(moderate) || 30),
        low: Math.max(1, Number(low) || 15),
        veryLow: Math.max(1, Number(veryLow) || 10),
        critical: Math.max(1, Number(critical) || 5),
        almostEmpty: Math.max(0, Number(almostEmpty) || 0),
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Thresholds updated successfully",
      data: threshold,
    });
  } catch (error: any) {
    console.error("❌ Update thresholds error:", error);
    res.status(500).json({ success: false, message: "Server error updating thresholds" });
  }
};
