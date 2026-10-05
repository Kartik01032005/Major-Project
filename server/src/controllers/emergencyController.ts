import { Request, Response } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import EmergencyRequest from "../models/EmergencyRequest.js";
import User from "../models/User.js";
import RequestDismissal from "../models/RequestDismissal.js";
import { broadcast, emitToUser } from "../socket/socket.js";
import { enqueueNotification } from "../services/notificationQueue.js";
import { isBloodGroupCompatible, getCompatibleDonorGroups } from "../utils/bloodGroupUtils.js";
import { IEmergencyTrackingStats } from "../types/emergencyRequest.js";

// Expiry helper functions
export const getDefaultExpiryMinutes = (): number => {
  const envMin = process.env.EMERGENCY_REQUEST_DEFAULT_EXPIRY_MINUTES;
  if (envMin) {
    const parsed = parseFloat(envMin);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  const envHours = process.env.EMERGENCY_REQUEST_DEFAULT_EXPIRY_HOURS;
  if (envHours) {
    const parsed = parseFloat(envHours);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed * 60;
    }
  }
  return 20; // 20 minutes default
};

export const getDefaultExpiryHours = (): number => {
  return getDefaultExpiryMinutes() / 60;
};

export const calculateExpiresAt = (createdAt: Date = new Date()): Date => {
  const minutes = getDefaultExpiryMinutes();
  return new Date(createdAt.getTime() + minutes * 60 * 1000);
};

/**
 * Checks if a request is overdue and should be transitioned to 'Expired'.
 * Terminal states (Completed, Cancelled, Rejected) are preserved and never expire.
 * Handles old records lacking expiresAt safely by backfilling based on createdAt + default hours.
 * Returns true if request is expired.
 */
export const checkAndExpireRequest = async (request: any): Promise<boolean> => {
  if (!request) return false;

  // Terminal states cannot expire
  if (request.status === "Completed" || request.status === "Cancelled" || request.status === "Rejected") {
    return false;
  }

  // Safe handling of old records missing expiresAt
  if (!request.expiresAt) {
    const baseTime = request.createdAt ? new Date(request.createdAt) : new Date();
    request.expiresAt = calculateExpiresAt(baseTime);
  }

  if (request.status === "Expired") {
    return true;
  }

  const now = new Date();
  if (request.expiresAt && now.getTime() >= new Date(request.expiresAt).getTime()) {
    request.status = "Expired";
    await request.save();

    const populatedRequest = await EmergencyRequest.findById(request._id)
      .populate("requestBy", "name email phone location");

    broadcast("request_updated", populatedRequest || request);
    broadcast("request_expired", {
      requestId: request._id.toString(),
      status: "Expired",
      expiresAt: request.expiresAt
    });

    computeTrackingStats(request).then((stats) => {
      broadcast("request_tracking_updated", stats);
    }).catch(() => {});

    return true;
  }

  return false;
};

/**
 * Sweeps active requests in the database and transitions overdue requests to 'Expired'.
 */
export const expireOverdueRequests = async (): Promise<number> => {
  try {
    const now = new Date();
    const candidateRequests = await EmergencyRequest.find({
      status: { $in: ["Pending", "Approved"] }
    });

    let count = 0;
    for (const req of candidateRequests) {
      if (!req.expiresAt) {
        const baseTime = req.createdAt ? new Date(req.createdAt) : new Date();
        req.expiresAt = calculateExpiresAt(baseTime);
      }

      if (now.getTime() >= new Date(req.expiresAt).getTime()) {
        req.status = "Expired";
        await req.save();
        count++;

        const populatedRequest = await EmergencyRequest.findById(req._id)
          .populate("requestBy", "name email phone location");

        broadcast("request_updated", populatedRequest || req);
        broadcast("request_expired", {
          requestId: req._id.toString(),
          status: "Expired",
          expiresAt: req.expiresAt
        });

        computeTrackingStats(req).then((stats) => {
          broadcast("request_tracking_updated", stats);
        }).catch(() => {});
      } else if (req.isModified("expiresAt")) {
        // Persist backfilled expiresAt
        await req.save();
      }
    }
    return count;
  } catch (err) {
    console.error("❌ Error running expireOverdueRequests sweep:", err);
    return 0;
  }
};

let expiryWorkerTimer: NodeJS.Timeout | null = null;

/**
 * Starts a background periodic worker to expire overdue requests every 60 seconds.
 * Avoids duplicate timers in development.
 */
export const startExpiryWorker = (): void => {
  if (expiryWorkerTimer) {
    return;
  }
  // Run initial sweep
  expireOverdueRequests().catch((err) => {
    console.error("❌ Initial expiration sweep failed:", err);
  });
  // Sweep every 60 seconds
  expiryWorkerTimer = setInterval(() => {
    expireOverdueRequests().catch((err) => {
      console.error("❌ Scheduled expiration sweep failed:", err);
    });
  }, 60000);
};

export const stopExpiryWorker = (): void => {
  if (expiryWorkerTimer) {
    clearInterval(expiryWorkerTimer);
    expiryWorkerTimer = null;
  }
};

// @desc    Create emergency blood request
// @route   POST /api/emergency
// @access  Private
export const createRequest = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }

  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const {
      bloodGroup,
      unitsRequired,
      hospital,
      hospitalName, // Support both fields
      hospitalLatitude,
      hospitalLongitude,
      hospitalAddress,
      hospitalOsmId,
      state,
      district,
      address,
      latitude,
      longitude,
      contactNumber
    } = req.body;

    const hosp = (hospitalName && hospitalName.trim()) || (hospital && hospital.trim()) || "General Hospital";

    const parsedHospLat = typeof hospitalLatitude === "number" ? hospitalLatitude : (hospitalLatitude ? parseFloat(hospitalLatitude) : undefined);
    const parsedHospLng = typeof hospitalLongitude === "number" ? hospitalLongitude : (hospitalLongitude ? parseFloat(hospitalLongitude) : undefined);

    const expiresAt = calculateExpiresAt(new Date());

    const newRequest = await EmergencyRequest.create({
      requestBy: req.user._id,
      bloodGroup,
      unitsRequired: unitsRequired ?? 1,
      hospital: hosp,
      hospitalLatitude: typeof parsedHospLat === "number" && !isNaN(parsedHospLat) ? parsedHospLat : undefined,
      hospitalLongitude: typeof parsedHospLng === "number" && !isNaN(parsedHospLng) ? parsedHospLng : undefined,
      hospitalAddress: hospitalAddress ? String(hospitalAddress).trim() : undefined,
      hospitalOsmId: hospitalOsmId ? String(hospitalOsmId).trim() : undefined,
      state,
      district,
      address,
      contactNumber,
      location: {
        latitude: (typeof parsedHospLat === "number" && !isNaN(parsedHospLat) ? parsedHospLat : latitude) ?? 0,
        longitude: (typeof parsedHospLng === "number" && !isNaN(parsedHospLng) ? parsedHospLng : longitude) ?? 0
      },
      expiresAt
    });

    // Find donors matching/compatible with the blood group who are available (excluding the creator)
    const compatibleDonorGroups = getCompatibleDonorGroups(bloodGroup);
    const matchingDonors = await User.find({
      bloodGroup: { $in: compatibleDonorGroups.length > 0 ? compatibleDonorGroups : [bloodGroup] },
      isAvailableDonor: true,
      role: "user",
      _id: { $ne: req.user._id }
    });

    const notifMessage = `Urgent: ${bloodGroup} blood is required at ${hosp}, ${district}, ${state}.`;

    // Create notifications for matching donors
    for (const donor of matchingDonors) {
      enqueueNotification({
        receiverId: donor._id.toString(),
        title: "🚨 Emergency Blood Alert",
        message: notifMessage,
        type: "Emergency"
      });
    }

    // Find all admin users/blood banks to notify them
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      enqueueNotification({
        receiverId: admin._id.toString(),
        title: "📥 New Emergency Request Received",
        message: `${req.user.name} requested ${bloodGroup} blood at ${hosp}.`,
        type: "Emergency"
      });
    }

    // Populate creator's details for dashboard updates
    const populatedRequest = await newRequest.populate("requestBy", "name email phone location");

    // Broadcast update event to all active clients
    broadcast("request_created", populatedRequest);
    computeTrackingStats(newRequest).then((stats) => {
      broadcast("request_tracking_updated", stats);
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: "Emergency request submitted successfully",
      data: populatedRequest
    });
  } catch (error: any) {
    console.error("❌ Create emergency request error:", error);
    res.status(500).json({ success: false, message: "Server error during request creation" });
  }
};

// @desc    Get all active emergency requests
// @route   GET /api/emergency
// @access  Public
export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    await expireOverdueRequests();

    const requests = await EmergencyRequest.find()
      .populate("requestBy", "name email phone location")
      .populate("acceptedBy", "name phone bloodGroup")
      .populate("donationReportedBy", "name phone bloodGroup")
      .populate("donationConfirmedBy", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Emergency requests retrieved successfully",
      data: requests
    });
  } catch (error: any) {
    console.error("❌ Get emergency requests error:", error);
    res.status(500).json({ success: false, message: "Server error during request retrieval" });
  }
};

// @desc    Get single emergency request
// @route   GET /api/emergency/:id
// @access  Public
export const getRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await EmergencyRequest.findById(req.params.id)
      .populate("requestBy", "name email phone location")
      .populate("acceptedBy", "name phone bloodGroup")
      .populate("donationReportedBy", "name phone bloodGroup")
      .populate("donationConfirmedBy", "name phone");

    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    await checkAndExpireRequest(request);

    res.status(200).json({
      success: true,
      message: "Emergency request retrieved successfully",
      data: request
    });
  } catch (error: any) {
    console.error("❌ Get request details error:", error);
    res.status(500).json({ success: false, message: "Server error during request retrieval" });
  }
};

// @desc    Approve emergency request (Admin only)
// @route   PUT /api/emergency/:id/approve
// @access  Private/Admin
export const approveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    const isExpired = await checkAndExpireRequest(request);
    if (isExpired || request.status === "Expired") {
      res.status(409).json({ success: false, message: "This emergency request has expired." });
      return;
    }

    request.status = "Approved";
    request.approvedBy = req.user._id;
    await request.save();

    // Notify requester
    enqueueNotification({
      receiverId: request.requestBy.toString(),
      title: "✅ Emergency Request Approved",
      message: `Your emergency request for ${request.bloodGroup} at ${request.hospital} has been approved.`,
      type: "Approval"
    });

    // Broadcast request update to all clients
    const populatedRequest = await request.populate("requestBy", "name email phone location");
    broadcast("request_updated", populatedRequest);
    computeTrackingStats(request).then((stats) => {
      broadcast("request_tracking_updated", stats);
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Emergency request approved successfully",
      data: populatedRequest
    });
  } catch (error: any) {
    console.error("❌ Approve request error:", error);
    res.status(500).json({ success: false, message: "Server error during request approval" });
  }
};

// @desc    Reject emergency request (Admin only)
// @route   PUT /api/emergency/:id/reject
// @access  Private/Admin
export const rejectRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    const isExpired = await checkAndExpireRequest(request);
    if (isExpired || request.status === "Expired") {
      res.status(409).json({ success: false, message: "This emergency request has expired." });
      return;
    }

    request.status = "Rejected";
    await request.save();

    // Notify requester
    enqueueNotification({
      receiverId: request.requestBy.toString(),
      title: "❌ Emergency Request Rejected",
      message: `Your emergency request for ${request.bloodGroup} at ${request.hospital} has been rejected.`,
      type: "Rejection"
    });

    const populatedRequest = await request.populate("requestBy", "name email phone location");
    broadcast("request_updated", populatedRequest);
    computeTrackingStats(request).then((stats) => {
      broadcast("request_tracking_updated", stats);
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Emergency request rejected successfully",
      data: populatedRequest
    });
  } catch (error: any) {
    console.error("❌ Reject request error:", error);
    res.status(500).json({ success: false, message: "Server error during request rejection" });
  }
};

// @desc    Donor accepts an emergency request (intent to donate)
// @route   PUT /api/emergency/:id/accept
// @access  Private (donor)
export const acceptRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    if (req.user.role !== "user") {
      res.status(403).json({ success: false, message: "Only donors can accept requests" });
      return;
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: "Invalid request ID" });
      return;
    }

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    const isExpired = await checkAndExpireRequest(request);
    if (isExpired || request.status === "Expired") {
      res.status(409).json({ success: false, message: "This emergency request has expired." });
      return;
    }

    if (request.requestBy.toString() === req.user._id.toString()) {
      res.status(403).json({ success: false, message: "You cannot accept your own request" });
      return;
    }

    if (request.status !== "Pending" && request.status !== "Approved") {
      res.status(409).json({ success: false, message: "This request can no longer be accepted" });
      return;
    }

    if (req.user.bloodGroup && !isBloodGroupCompatible(req.user.bloodGroup, request.bloodGroup)) {
      res.status(403).json({ success: false, message: "Blood group does not match this request" });
      return;
    }

    const alreadyAccepted = (request.acceptedBy ?? []).some(
      (id) => id.toString() === req.user!._id.toString()
    );
    if (alreadyAccepted) {
      res.status(409).json({ success: false, message: "You have already accepted this request" });
      return;
    }

    const updated = await EmergencyRequest.findOneAndUpdate(
      {
        _id: request._id,
        status: { $in: ["Pending", "Approved"] },
        acceptedBy: { $ne: req.user._id }
      },
      { $addToSet: { acceptedBy: req.user._id } },
      { new: true }
    );

    if (!updated) {
      res.status(409).json({ success: false, message: "You have already accepted this request" });
      return;
    }

    enqueueNotification({
      receiverId: request.requestBy.toString(),
      title: "A donor can help",
      message: `${req.user.name} indicated they can donate ${request.bloodGroup} blood at ${request.hospital}.`,
      type: "Emergency"
    });

    const populatedRequest = await updated.populate("requestBy", "name email phone location");
    broadcast("request_updated", populatedRequest);
    computeTrackingStats(updated).then((stats) => {
      broadcast("request_tracking_updated", stats);
      if (request.requestBy) {
        emitToUser(request.requestBy.toString(), "request_tracking_updated", stats);
      }
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Request accepted successfully",
      data: populatedRequest
    });
  } catch (error: unknown) {
    console.error("❌ Accept request error:", error);
    res.status(500).json({ success: false, message: "Server error during request acceptance" });
  }
};

// @desc    Donor reports having donated blood
// @route   POST /api/emergency/:id/donation-report
// @access  Private (accepted donor)
export const reportDonation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: "Invalid request ID" });
      return;
    }

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    const isExpired = await checkAndExpireRequest(request);
    if (isExpired || request.status === "Expired") {
      res.status(409).json({ success: false, message: "This emergency request has expired." });
      return;
    }

    if (request.status === "Completed" || request.status === "Cancelled") {
      res.status(409).json({ success: false, message: "Cannot report donation on completed or cancelled requests" });
      return;
    }

    const hasAccepted = (request.acceptedBy ?? []).some(
      (id) => id.toString() === req.user!._id.toString()
    );
    if (!hasAccepted) {
      res.status(403).json({ success: false, message: "Only donors who accepted this request can report donation" });
      return;
    }

    const alreadyReported = (request.donationReportedBy ?? []).some(
      (id) => id.toString() === req.user!._id.toString()
    );
    if (alreadyReported) {
      res.status(409).json({ success: false, message: "You have already reported your donation for this request" });
      return;
    }

    request.donationReportedBy = [...(request.donationReportedBy ?? []), req.user._id];
    request.donationReportedAt = new Date();
    await request.save();

    enqueueNotification({
      receiverId: request.requestBy.toString(),
      title: "🩸 Donation Reported",
      message: `${req.user.name} reported that the blood donation for ${request.hospital} was completed. Please confirm the donation.`,
      type: "Emergency"
    });

    const populatedRequest = await request.populate("requestBy", "name email phone location");
    broadcast("request_updated", populatedRequest);
    computeTrackingStats(request).then((stats) => {
      broadcast("request_tracking_updated", stats);
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Donation reported successfully. Waiting for requester confirmation.",
      data: populatedRequest
    });
  } catch (error: any) {
    console.error("❌ Report donation error:", error);
    res.status(500).json({ success: false, message: "Server error during donation report" });
  }
};

// @desc    Requester confirms donation completed & fulfills request
// @route   POST /api/emergency/:id/donation-confirm
// @access  Private (requester)
export const confirmDonation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: "Invalid request ID" });
      return;
    }

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    if (request.status === "Expired") {
      res.status(409).json({ success: false, message: "This emergency request has expired." });
      return;
    }

    if (request.requestBy.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: "Only the requester can confirm donation fulfillment" });
      return;
    }

    if (request.status === "Completed") {
      res.status(409).json({ success: false, message: "Request is already fulfilled" });
      return;
    }

    if (!request.donationReportedBy || request.donationReportedBy.length === 0) {
      res.status(409).json({ success: false, message: "No donor has reported donation for this request yet" });
      return;
    }

    request.status = "Completed";
    request.donationConfirmedBy = req.user._id;
    request.donationConfirmedAt = new Date();
    await request.save();

    for (const donorId of request.acceptedBy) {
      enqueueNotification({
        receiverId: donorId.toString(),
        title: "✅ Donation Confirmed",
        message: `Your donation at ${request.hospital} was confirmed by the requester. Request is now fulfilled!`,
        type: "Emergency"
      });
    }

    const populatedRequest = await request.populate("requestBy", "name email phone location");
    broadcast("request_updated", populatedRequest);
    computeTrackingStats(request).then((stats) => {
      broadcast("request_tracking_updated", stats);
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Donation confirmed successfully. Request is now fulfilled.",
      data: populatedRequest
    });
  } catch (error: any) {
    console.error("❌ Confirm donation error:", error);
    res.status(500).json({ success: false, message: "Server error during donation confirmation" });
  }
};

// @desc    Donor withdraws acceptance with a required reason
// @route   POST /api/emergency/:id/withdraw
// @access  Private (accepted donor)
export const withdrawAcceptance = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: "Invalid request ID" });
      return;
    }

    const { reason } = req.body;
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      res.status(400).json({ success: false, message: "A reason is required to withdraw from a request" });
      return;
    }

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    const isExpired = await checkAndExpireRequest(request);
    if (isExpired || request.status === "Expired") {
      res.status(409).json({ success: false, message: "This emergency request has expired." });
      return;
    }

    if (request.status === "Completed") {
      res.status(409).json({ success: false, message: "Cannot withdraw from a request that is already fulfilled" });
      return;
    }

    const hasAccepted = (request.acceptedBy ?? []).some(
      (id) => id.toString() === req.user!._id.toString()
    );
    if (!hasAccepted) {
      res.status(403).json({ success: false, message: "You have not accepted this request" });
      return;
    }

    // Remove user from acceptedBy array and record withdrawal
    request.acceptedBy = (request.acceptedBy ?? []).filter(
      (id) => id.toString() !== req.user!._id.toString()
    );

    request.withdrawnBy = [
      ...(request.withdrawnBy ?? []),
      {
        donor: req.user._id,
        reason: reason.trim(),
        withdrawnAt: new Date()
      }
    ];

    await request.save();

    enqueueNotification({
      receiverId: request.requestBy.toString(),
      title: "⚠️ Donor Unable to Donate",
      message: `${req.user.name} is unable to complete the donation (${reason.trim()}). Another donor may be needed.`,
      type: "Emergency"
    });

    const populatedRequest = await request.populate("requestBy", "name email phone location");
    broadcast("request_updated", populatedRequest);
    computeTrackingStats(request).then((stats) => {
      broadcast("request_tracking_updated", stats);
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Withdrawal recorded successfully.",
      data: populatedRequest
    });
  } catch (error: any) {
    console.error("❌ Withdraw acceptance error:", error);
    res.status(500).json({ success: false, message: "Server error during withdrawal" });
  }
};

// @desc    Cancel pending emergency request (Owner only)
// @route   DELETE /api/emergency/:id
// @access  Private
export const cancelRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: "Invalid request ID" });
      return;
    }

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    if (request.requestBy.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: "Not authorized to cancel this request" });
      return;
    }

    const isExpired = await checkAndExpireRequest(request);
    if (isExpired || request.status === "Expired") {
      res.status(409).json({ success: false, message: "This emergency request has expired." });
      return;
    }

    if (request.status !== "Pending") {
      res.status(409).json({ success: false, message: "Only pending requests can be cancelled" });
      return;
    }

    request.status = "Cancelled";
    await request.save();

    const populatedRequest = await request.populate("requestBy", "name email phone location");
    broadcast("request_updated", populatedRequest);
    computeTrackingStats(request).then((stats) => {
      broadcast("request_tracking_updated", stats);
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Emergency request cancelled successfully",
      data: populatedRequest
    });
  } catch (error: any) {
    console.error("❌ Cancel request error:", error);
    res.status(500).json({ success: false, message: "Server error during request cancellation" });
  }
};

/**
 * Computes real-time tracking statistics from database models.
 * Calculates unique responders to avoid duplicates and safely handles concurrency.
 */
export const computeTrackingStats = async (request: any): Promise<IEmergencyTrackingStats> => {
  let notifiedCount = request.notifiedDonorsCount || 0;
  if (!notifiedCount || notifiedCount === 0) {
    const compatibleDonorGroups = getCompatibleDonorGroups(request.bloodGroup);
    const creatorId = typeof request.requestBy === "object" && request.requestBy !== null
      ? (request.requestBy._id || request.requestBy)
      : request.requestBy;
    notifiedCount = await User.countDocuments({
      bloodGroup: { $in: compatibleDonorGroups.length > 0 ? compatibleDonorGroups : [request.bloodGroup] },
      isAvailableDonor: true,
      role: "user",
      _id: { $ne: creatorId }
    });
  }

  const accepted = (request.acceptedBy || []).map((id: any) => (id?._id || id).toString());
  const acceptedCount = accepted.length;

  const withdrawnIds = (request.withdrawnBy || []).map((w: any) => (w.donor?._id || w.donor).toString());
  const declinedIds = (request.declinedBy || []).map((d: any) => (d.donor?._id || d.donor).toString());

  const unableSet = new Set([...withdrawnIds, ...declinedIds]);
  const unableToDonateCount = unableSet.size;
  const withdrawnCount = (request.withdrawnBy || []).length;

  const respondedSet = new Set([...accepted, ...unableSet]);
  const respondedCount = respondedSet.size;

  const pendingCount = Math.max(0, notifiedCount - respondedCount);

  let lifecycleStatus: IEmergencyTrackingStats["lifecycleStatus"] = "Searching for Donors";
  if (request.status === "Completed") {
    lifecycleStatus = "Request Fulfilled";
  } else if (request.status === "Cancelled") {
    lifecycleStatus = "Request Cancelled";
  } else if (request.status === "Rejected") {
    lifecycleStatus = "Request Rejected";
  } else if (request.status === "Expired") {
    lifecycleStatus = "Request Expired";
  } else if (acceptedCount > 0) {
    lifecycleStatus = "Donor Response Received";
  } else {
    lifecycleStatus = "Searching for Donors";
  }

  return {
    requestId: request._id.toString(),
    requestCreated: request.createdAt,
    expiresAt: request.expiresAt,
    notifiedCount,
    respondedCount,
    acceptedCount,
    unableToDonateCount,
    withdrawnCount,
    pendingCount,
    status: request.status,
    lifecycleStatus
  };
};

// @desc    Get live tracking stats for emergency request
// @route   GET /api/emergency/:id/tracking
// @access  Private (Requester or Admin)
export const getRequestTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: "Invalid request ID" });
      return;
    }

    const request = await EmergencyRequest.findById(req.params.id)
      .populate("requestBy", "name email phone location");

    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    await checkAndExpireRequest(request);

    const rawReqBy = request.requestBy as any;
    const creatorId = rawReqBy && typeof rawReqBy === "object" && rawReqBy._id
      ? rawReqBy._id.toString()
      : String(rawReqBy);

    const isRequester = creatorId === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isRequester && !isAdmin) {
      res.status(403).json({
        success: false,
        message: "Not authorized to view tracking details for this request"
      });
      return;
    }

    const stats = await computeTrackingStats(request);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error("❌ Get request tracking error:", error);
    res.status(500).json({ success: false, message: "Server error during tracking retrieval" });
  }
};

// @desc    Get donor's own response status for an emergency request
// @route   GET /api/emergency/:id/donor-status
// @access  Private (Authenticated user)
export const getDonorResponseStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: "Invalid request ID" });
      return;
    }

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    await checkAndExpireRequest(request);

    const userIdStr = req.user._id.toString();
    const hasAccepted = (request.acceptedBy || []).some((id) => id.toString() === userIdStr);
    const hasWithdrawn = (request.withdrawnBy || []).some(
      (w) => (w.donor?._id || w.donor).toString() === userIdStr
    );
    const hasDeclined = (request.declinedBy || []).some(
      (d) => (d.donor?._id || d.donor).toString() === userIdStr
    );

    let myResponse: "Accepted" | "Unable to Donate" | "Pending" = "Pending";
    if (hasAccepted) {
      myResponse = "Accepted";
    } else if (hasWithdrawn || hasDeclined) {
      myResponse = "Unable to Donate";
    }

    let lifecycleStatus = "Searching for Donors";
    if (request.status === "Completed") {
      lifecycleStatus = "Request Fulfilled";
    } else if (request.status === "Cancelled") {
      lifecycleStatus = "Request Cancelled";
    } else if (request.status === "Rejected") {
      lifecycleStatus = "Request Rejected";
    } else if (request.status === "Expired") {
      lifecycleStatus = "Request Expired";
    } else if ((request.acceptedBy?.length || 0) > 0) {
      lifecycleStatus = "Donor Response Received";
    }

    res.status(200).json({
      success: true,
      data: {
        requestId: request._id.toString(),
        expiresAt: request.expiresAt,
        myResponse,
        lifecycleStatus,
        requestStatus: request.status
      }
    });
  } catch (error: any) {
    console.error("❌ Get donor response status error:", error);
    res.status(500).json({ success: false, message: "Server error retrieving donor response status" });
  }
};

// @desc    Donor marks unable to donate (declines request)
// @route   POST /api/emergency/:id/decline
// @access  Private (Donor)
export const declineRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ success: false, message: "Invalid request ID" });
      return;
    }

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    const isExpired = await checkAndExpireRequest(request);
    if (isExpired || request.status === "Expired") {
      res.status(409).json({ success: false, message: "This emergency request has expired." });
      return;
    }

    if (request.status === "Completed" || request.status === "Cancelled") {
      res.status(409).json({ success: false, message: "Cannot decline a completed or cancelled request" });
      return;
    }

    const { reason } = req.body;
    const declineReason = reason && typeof reason === "string" ? reason.trim() : "Unable to donate";

    // Remove from acceptedBy if they had accepted
    request.acceptedBy = (request.acceptedBy || []).filter(
      (id) => id.toString() !== req.user!._id.toString()
    );

    // Check if already in declinedBy
    const alreadyDeclined = (request.declinedBy || []).some(
      (d) => (d.donor?._id || d.donor).toString() === req.user!._id.toString()
    );
    if (!alreadyDeclined) {
      request.declinedBy = [
        ...(request.declinedBy || []),
        {
          donor: req.user._id,
          reason: declineReason,
          declinedAt: new Date()
        }
      ];
    }

    await request.save();

    enqueueNotification({
      receiverId: request.requestBy.toString(),
      title: "⚠️ Donor Unable to Donate",
      message: `${req.user.name} is unable to donate for ${request.hospital}. Another donor may be needed.`,
      type: "Emergency"
    });

    const populatedRequest = await request.populate("requestBy", "name email phone location");
    const trackingStats = await computeTrackingStats(request);

    broadcast("request_updated", populatedRequest);
    broadcast("request_tracking_updated", trackingStats);

    res.status(200).json({
      success: true,
      message: "Response recorded: Unable to donate.",
      data: populatedRequest
    });
  } catch (error: any) {
    console.error("❌ Decline request error:", error);
    res.status(500).json({ success: false, message: "Server error recording response" });
  }
};


// @desc    Get this account's dismissed request IDs for each dashboard tab
// @route   GET /api/emergency/dismissals
// @access  Private
export const getRequestDismissals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const dismissals = await RequestDismissal.find({ userId: req.user._id })
      .select("requestId view -_id")
      .lean();
    const data = { my: [] as string[], donate: [] as string[] };

    for (const dismissal of dismissals) {
      data[dismissal.view as "my" | "donate"].push(String(dismissal.requestId));
    }

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("❌ Get request dismissals error:", error);
    res.status(500).json({ success: false, message: "Server error retrieving dismissed requests" });
  }
};

// @desc    Dismiss requests from one dashboard tab for the signed-in account only
// @route   POST /api/emergency/dismissals
// @access  Private
export const dismissRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    const { requestIds, view } = req.body ?? {};
    if (
      !Array.isArray(requestIds) ||
      requestIds.length > 500 ||
      (view !== "my" && view !== "donate")
    ) {
      res.status(400).json({ success: false, message: "Invalid request dismissal data" });
      return;
    }

    const uniqueIds = [...new Set(requestIds.map((id: unknown) => String(id)))];
    if (!uniqueIds.every((id) => mongoose.isValidObjectId(id))) {
      res.status(400).json({ success: false, message: "Invalid emergency request ID" });
      return;
    }

    const requestObjectIds = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));
    const dismissalView = view as "my" | "donate";

    if (uniqueIds.length === 0) {
      res.status(200).json({ success: true, data: { dismissedIds: [] } });
      return;
    }

    await RequestDismissal.bulkWrite(
      requestObjectIds.map((requestId) => ({
        updateOne: {
          filter: { userId: req.user!._id, view: dismissalView, requestId },
          update: { $setOnInsert: { userId: req.user!._id, view: dismissalView, requestId } },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    res.status(200).json({ success: true, data: { dismissedIds: uniqueIds } });
  } catch (error: any) {
    console.error("❌ Dismiss requests error:", error);
    res.status(500).json({ success: false, message: "Server error dismissing requests" });
  }
};

