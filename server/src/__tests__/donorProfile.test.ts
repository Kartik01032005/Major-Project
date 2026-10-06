import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/User.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import { computeDonorProfileStats, calculateApproxDistance } from "../services/donorProfileService.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_bloodlink_12345";

describe("Task #6 — Donor Profile Improvements Test Suite", () => {
  let donorUser: any;
  let requesterUser: any;
  let otherUser: any;
  let donorToken: string;
  let requesterToken: string;
  let otherToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/bloodlink_test");
    }
    // Drop test collections
    await User.deleteMany({});
    await EmergencyRequest.deleteMany({});

    // Create donor user
    donorUser = await User.create({
      name: "Ramesh Sharma",
      email: "ramesh.donor@test.com",
      password: "password123",
      phone: "9123456780",
      bloodGroup: "O+",
      role: "user",
      isAvailableDonor: true,
      location: {
        state: "Karnataka",
        district: "Mysore",
        latitude: 12.2958,
        longitude: 76.6394
      }
    });

    // Create requester user
    requesterUser = await User.create({
      name: "Pooja Patel",
      email: "pooja.req@test.com",
      password: "password123",
      phone: "9876543211",
      bloodGroup: "A+",
      role: "user",
      isAvailableDonor: false,
      location: {
        state: "Karnataka",
        district: "Mysore",
        latitude: 12.3150,
        longitude: 76.6500
      }
    });

    // Create third user
    otherUser = await User.create({
      name: "Suresh Kumar",
      email: "suresh@test.com",
      password: "password123",
      phone: "9988776655",
      bloodGroup: "B+",
      role: "user",
      isAvailableDonor: true,
      location: {
        state: "Karnataka",
        district: "Bangalore",
        latitude: 12.9716,
        longitude: 77.5946
      }
    });

    donorToken = jwt.sign({ id: donorUser._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
    requesterToken = jwt.sign({ id: requesterUser._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
    otherToken = jwt.sign({ id: otherUser._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await EmergencyRequest.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await EmergencyRequest.deleteMany({});
  });

  it("1. computeDonorProfileStats returns 0 donations and null lastDonationDate when no completed donations exist", async () => {
    const stats = await computeDonorProfileStats(donorUser._id, donorUser.bloodGroup, donorUser.createdAt);
    expect(stats.donationsCount).toBe(0);
    expect(stats.lastDonationDate).toBeNull();
    // Insufficient historical requests -> null response rate
    expect(stats.responseRate).toBeNull();
    expect(stats.eligibleRequestsCount).toBe(0);
    expect(stats.respondedRequestsCount).toBe(0);
  });

  it("2. computeDonorProfileStats counts ONLY genuine completed & verified donations and excludes pending/accepted/cancelled", async () => {
    // 1. Pending request - donor accepted, but not completed
    await EmergencyRequest.create({
      requestBy: requesterUser._id,
      bloodGroup: "O+",
      hospital: "Apollo BGS Mysore",
      state: "Karnataka",
      district: "Mysore",
      address: "Adichunchanagiri Road",
      contactNumber: "9876543211",
      status: "Pending",
      acceptedBy: [donorUser._id],
      expiresAt: new Date(Date.now() + 86400000)
    });

    // 2. Cancelled request - donor had accepted
    await EmergencyRequest.create({
      requestBy: requesterUser._id,
      bloodGroup: "O+",
      hospital: "Columbia Asia",
      state: "Karnataka",
      district: "Mysore",
      address: "Bangalore-Mysore Ring Road",
      contactNumber: "9876543211",
      status: "Cancelled",
      acceptedBy: [donorUser._id],
      expiresAt: new Date(Date.now() + 86400000)
    });

    // 3. Genuine completed & confirmed donation
    const confirmedDate = new Date("2026-07-15T10:30:00.000Z");
    await EmergencyRequest.create({
      requestBy: requesterUser._id,
      bloodGroup: "O+",
      hospital: "Mission Hospital",
      state: "Karnataka",
      district: "Mysore",
      address: "Tilak Nagar",
      contactNumber: "9876543211",
      status: "Completed",
      acceptedBy: [donorUser._id],
      donationReportedBy: [donorUser._id],
      donationReportedAt: confirmedDate,
      donationConfirmedBy: requesterUser._id,
      donationConfirmedAt: confirmedDate,
      expiresAt: new Date(Date.now() + 86400000)
    });

    const stats = await computeDonorProfileStats(donorUser._id, donorUser.bloodGroup, donorUser.createdAt);
    // Should be exactly 1 verified completed donation, NOT 3!
    expect(stats.donationsCount).toBe(1);
    expect(new Date(stats.lastDonationDate!).toISOString()).toBe(confirmedDate.toISOString());
  });

  it("3. computeDonorProfileStats accurately calculates response rate without duplicates", async () => {
    // Request 1: Compatible with O+ (A+ accepts O+ RBCs). Donor accepted.
    await EmergencyRequest.create({
      requestBy: requesterUser._id,
      bloodGroup: "A+",
      hospital: "Hospital 1",
      state: "Karnataka",
      district: "Mysore",
      address: "Street 1",
      contactNumber: "9876543211",
      status: "Pending",
      acceptedBy: [donorUser._id],
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date()
    });

    // Request 2: Compatible with O+ (O+ accepts O+). Donor declined (unable to donate).
    await EmergencyRequest.create({
      requestBy: requesterUser._id,
      bloodGroup: "O+",
      hospital: "Hospital 2",
      state: "Karnataka",
      district: "Mysore",
      address: "Street 2",
      contactNumber: "9876543211",
      status: "Pending",
      declinedBy: [{ donor: donorUser._id, reason: "Busy", declinedAt: new Date() }],
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date()
    });

    // Request 3: Compatible with O+ (B+ accepts O+). Donor did not respond.
    await EmergencyRequest.create({
      requestBy: requesterUser._id,
      bloodGroup: "B+",
      hospital: "Hospital 3",
      state: "Karnataka",
      district: "Mysore",
      address: "Street 3",
      contactNumber: "9876543211",
      status: "Pending",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date()
    });

    // Request 4: Incompatible with O+ (A- cannot receive O+ RBCs). Donor should not be penalized.
    await EmergencyRequest.create({
      requestBy: requesterUser._id,
      bloodGroup: "A-",
      hospital: "Hospital 4",
      state: "Karnataka",
      district: "Mysore",
      address: "Street 4",
      contactNumber: "9876543211",
      status: "Pending",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date()
    });

    const stats = await computeDonorProfileStats(donorUser._id, donorUser.bloodGroup, donorUser.createdAt);
    // Eligible: Requests 1, 2, 3 (A+, O+, B+ are compatible with O+ donor). Request 4 (A-) is excluded.
    expect(stats.eligibleRequestsCount).toBe(3);
    // Responded: Request 1 (accepted), Request 2 (declined) = 2
    expect(stats.respondedRequestsCount).toBe(2);
    // 2 / 3 * 100 = 67%
    expect(stats.responseRate).toBe(67);
  });

  it("4. calculateApproxDistance computes approximate distance and handles missing coordinates safely", () => {
    // Mysore coords: ~3 km apart
    const distResult = calculateApproxDistance(12.2958, 76.6394, 12.3150, 76.6500);
    expect(distResult.approxDistanceKm).toBeGreaterThan(1);
    expect(distResult.approxDistanceKm).toBeLessThan(5);
    expect(distResult.approxDistanceStr).toContain("km");

    // Missing coordinates -> null distance without crashing
    const invalidResult = calculateApproxDistance(0, 0, 12.3150, 76.6500);
    expect(invalidResult.approxDistanceKm).toBeNull();
    expect(invalidResult.approxDistanceStr).toBeNull();
  });

  it("5. GET /api/users/profile returns authenticated user data and genuine donorStats", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${donorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("ramesh.donor@test.com");
    expect(res.body.data.bloodGroup).toBe("O+");
    expect(res.body.data.isAvailableDonor).toBe(true);
    expect(res.body.data.donorStats).toBeDefined();
    expect(res.body.data.donorStats.donationsCount).toBe(0);
    expect(res.body.data.password).toBeUndefined();
  });

  it("6. GET /api/users/donor-profile requires authentication and returns 401 when no token provided", async () => {
    const res = await request(app).get("/api/users/donor-profile");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("7. GET /api/users/donor/:id enforces role-based privacy: hides exact GPS coordinates, address, and email", async () => {
    const res = await request(app)
      .get(`/api/users/donor/${donorUser._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .query({ lat: 12.9716, lng: 77.5946 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Ramesh Sharma");
    expect(res.body.data.bloodGroup).toBe("O+");
    expect(res.body.data.isAvailableDonor).toBe(true);
    // General location only
    expect(res.body.data.location).toEqual({ district: "Mysore", state: "Karnataka" });
    // NEVER expose raw latitude or longitude to other users
    expect(res.body.data.location.latitude).toBeUndefined();
    expect(res.body.data.location.longitude).toBeUndefined();
    // Email is private
    expect(res.body.data.email).toBeUndefined();
    // Phone is hidden because otherUser has no accepted request from donorUser
    expect(res.body.data.phone).toBeUndefined();
    // Distance is calculated
    expect(res.body.data.approxDistanceKm).toBeDefined();
    expect(res.body.data.donorStats).toBeDefined();
  });

  it("8. PUT /api/users/profile allows updating availability, blood group, and contact details safely", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${donorToken}`)
      .send({
        bloodGroup: "O+",
        isAvailableDonor: false,
        name: "Ramesh Sharma Updated"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAvailableDonor).toBe(false);
    expect(res.body.data.name).toBe("Ramesh Sharma Updated");

    // Restore availability
    await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${donorToken}`)
      .send({ isAvailableDonor: true });
  });

  it("9. PUT /api/users/profile rejects invalid blood group", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${donorToken}`)
      .send({
        bloodGroup: "INVALID_GROUP"
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
