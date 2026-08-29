import { Request, Response } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import EmergencyRequest from "../models/EmergencyRequest.js";
import User from "../models/User.js";
import { broadcast } from "../socket/socket.js";
import { enqueueNotification } from "../services/notificationQueue.js";
import { isBloodGroupCompatible, getCompatibleDonorGroups } from "../utils/bloodGroupUtils.js";

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
      state,
      district,
      address,
      latitude,
      longitude,
      contactNumber
    } = req.body;

    const hosp = (hospitalName && hospitalName.trim()) || (hospital && hospital.trim()) || "General Hospital";

    const newRequest = await EmergencyRequest.create({
      requestBy: req.user._id,
      bloodGroup,
      unitsRequired: unitsRequired ?? 1,
      hospital: hosp,
      state,
      district,
      address,
      contactNumber,
      location: {
        latitude: latitude ?? 0,
        longitude: longitude ?? 0
      }
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
    const requests = await EmergencyRequest.find()
      .populate("requestBy", "name email phone location")
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
      .populate("requestBy", "name email phone location");

    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

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

    if (request.status !== "Pending") {
      res.status(409).json({ success: false, message: "Only pending requests can be cancelled" });
      return;
    }

    request.status = "Cancelled";
    await request.save();

    const populatedRequest = await request.populate("requestBy", "name email phone location");
    broadcast("request_updated", populatedRequest);

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

