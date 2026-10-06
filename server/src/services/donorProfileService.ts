import { Types } from "mongoose";
import EmergencyRequest from "../models/EmergencyRequest.js";
import { isBloodGroupCompatible } from "../utils/bloodGroupUtils.js";
import { calculateHaversineDistanceKm, formatDistanceStr } from "../controllers/nearbyController.js";

export interface IDonorProfileStats {
  donationsCount: number;
  lastDonationDate: Date | null;
  responseRate: number | null;
  eligibleRequestsCount: number;
  respondedRequestsCount: number;
}

export interface IPublicDonorProfile {
  _id: string;
  name: string;
  bloodGroup: string | null;
  isAvailableDonor: boolean;
  location: {
    district: string;
    state: string;
  } | null;
  approxDistanceKm: number | null;
  approxDistanceStr: string | null;
  phone?: string;
  donorStats: IDonorProfileStats;
}

/**
 * Computes verified donor statistics strictly from authentic MongoDB records.
 * Never manufactures or fakes any donation counts, response rates, or dates.
 */
export const computeDonorProfileStats = async (
  userId: string | Types.ObjectId,
  userBloodGroup?: string | null,
  userCreatedAt?: Date | null
): Promise<IDonorProfileStats> => {
  const userObjectId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
  const userStr = userObjectId.toString();

  // 1. Genuine verified donations: Completed emergency requests where donation was reported & confirmed
  const completedRequests = await EmergencyRequest.find({
    status: "Completed",
    $or: [
      { donationReportedBy: userObjectId },
      { donationConfirmedBy: { $ne: null }, acceptedBy: userObjectId }
    ]
  }).sort({ donationConfirmedAt: -1, donationReportedAt: -1, updatedAt: -1 });

  const donationsCount = completedRequests.length;

  let lastDonationDate: Date | null = null;
  if (completedRequests.length > 0) {
    const latest = completedRequests[0];
    lastDonationDate = latest.donationConfirmedAt || latest.donationReportedAt || null;
  }

  // 2. Response Rate Calculation:
  // Responded donor requests / Eligible donor requests * 100
  // Eligible: requests not created by the donor, created on/after donor signup, compatible with blood group
  const nonOwnRequests = await EmergencyRequest.find({
    requestBy: { $ne: userObjectId },
    createdAt: { $gte: userCreatedAt || new Date(0) }
  }).select("bloodGroup acceptedBy declinedBy withdrawnBy donationReportedBy");

  const eligibleRequests = userBloodGroup
    ? nonOwnRequests.filter((req) => isBloodGroupCompatible(userBloodGroup, req.bloodGroup))
    : nonOwnRequests;

  const eligibleRequestsCount = eligibleRequests.length;

  let respondedRequestsCount = 0;
  for (const req of eligibleRequests) {
    const hasAccepted = (req.acceptedBy || []).some((id: any) => (id?._id || id).toString() === userStr);
    const hasDeclined = (req.declinedBy || []).some((d: any) => (d.donor?._id || d.donor).toString() === userStr);
    const hasWithdrawn = (req.withdrawnBy || []).some((w: any) => (w.donor?._id || w.donor).toString() === userStr);
    const hasReported = (req.donationReportedBy || []).some((id: any) => (id?._id || id).toString() === userStr);

    if (hasAccepted || hasDeclined || hasWithdrawn || hasReported) {
      respondedRequestsCount++;
    }
  }

  // Insufficient historical data: return null to display "Not enough data" instead of misleading 0%
  let responseRate: number | null = null;
  if (eligibleRequestsCount > 0) {
    const denominator = Math.max(eligibleRequestsCount, respondedRequestsCount);
    responseRate = Math.min(100, Math.round((respondedRequestsCount / denominator) * 100));
  }

  return {
    donationsCount,
    lastDonationDate,
    responseRate,
    eligibleRequestsCount,
    respondedRequestsCount
  };
};

/**
 * Calculates approximate distance between donor and reference coordinates if both exist.
 * Returns null if coordinates are missing or invalid.
 */
export const calculateApproxDistance = (
  donorLat?: number,
  donorLng?: number,
  refLat?: number,
  refLng?: number
): { approxDistanceKm: number | null; approxDistanceStr: string | null } => {
  if (
    typeof donorLat !== "number" ||
    typeof donorLng !== "number" ||
    typeof refLat !== "number" ||
    typeof refLng !== "number" ||
    (donorLat === 0 && donorLng === 0) ||
    (refLat === 0 && refLng === 0)
  ) {
    return { approxDistanceKm: null, approxDistanceStr: null };
  }

  const distKm = calculateHaversineDistanceKm(refLat, refLng, donorLat, donorLng);
  const roundedKm = Math.round(distKm * 10) / 10;
  return {
    approxDistanceKm: roundedKm,
    approxDistanceStr: formatDistanceStr(distKm)
  };
};
