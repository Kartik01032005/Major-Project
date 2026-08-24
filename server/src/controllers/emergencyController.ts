import { Request, Response } from "express";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import EmergencyRequest from "../models/EmergencyRequest.js";
import User from "../models/User.js";
import { broadcast } from "../socket/socket.js";
import { enqueueNotification } from "../services/notificationQueue.js";

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

    // Find donors matching the blood group who are available (excluding the creator)
    const matchingDonors = await User.find({
      bloodGroup,
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
