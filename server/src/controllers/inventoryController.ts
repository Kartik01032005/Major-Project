import { Request, Response } from "express";
import BloodInventory from "../models/BloodInventory.js";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

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
