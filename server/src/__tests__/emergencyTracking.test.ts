import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import Notification from "../models/Notification.js";
import { computeTrackingStats } from "../controllers/emergencyController.js";

const requesterData = {
  name: "Tracking Requester",
  email: "requester_track@bloodlink.dev",
  password: "Pass@1234",
  phone: "9100000001",
  role: "user",
  location: { state: "Karnataka", district: "Mysore" },
};

const otherRequesterData = {
  name: "Other User",
  email: "other_track@bloodlink.dev",
  password: "Pass@1234",
  phone: "9100000002",
  role: "user",
  location: { state: "Karnataka", district: "Mysore" },
};

const adminData = {
  name: "Tracking Admin",
  email: "admin_track@bloodlink.dev",
  password: "Pass@1234",
  phone: "9100000003",
  role: "admin",
  organizationName: "Mysore Red Cross",
  location: { state: "Karnataka", district: "Mysore" },
};

const donorAData = {
  name: "Donor Alpha",
  email: "donorA_track@bloodlink.dev",
  password: "Pass@1234",
  phone: "9100000004",
  role: "user",
  bloodGroup: "O+",
  isAvailableDonor: true,
  location: { state: "Karnataka", district: "Mysore" },
};

const donorBData = {
  name: "Donor Beta",
  email: "donorB_track@bloodlink.dev",
  password: "Pass@1234",
  phone: "9100000005",
  role: "user",
  bloodGroup: "O+",
  isAvailableDonor: true,
  location: { state: "Karnataka", district: "Mysore" },
};

const donorCData = {
  name: "Donor Gamma",
  email: "donorC_track@bloodlink.dev",
  password: "Pass@1234",
  phone: "9100000006",
  role: "user",
  bloodGroup: "O-", // Universal compatible
  isAvailableDonor: true,
  location: { state: "Karnataka", district: "Mysore" },
};

let requesterToken: string;
let requesterId: string;
let otherUserToken: string;
let adminToken: string;
let donorAToken: string;
let donorAId: string;
let donorBToken: string;
let donorBId: string;
let donorCToken: string;
let donorCId: string;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  // Clear previous test records
  await EmergencyRequest.deleteMany({});
  await Notification.deleteMany({});
  await User.deleteMany({
    email: {
      $in: [
        requesterData.email,
        otherRequesterData.email,
        adminData.email,
        donorAData.email,
        donorBData.email,
        donorCData.email,
      ],
    },
  });

  // Create Users & Tokens via register + login
  await request(app).post("/api/auth/register").send(requesterData);
  const loginReq = await request(app).post("/api/auth/login").send({
    email: requesterData.email,
    password: requesterData.password,
  });
  requesterToken = loginReq.body.data.token;
  requesterId = loginReq.body.data.user._id;

  await request(app).post("/api/auth/register").send(otherRequesterData);
  const loginOther = await request(app).post("/api/auth/login").send({
    email: otherRequesterData.email,
    password: otherRequesterData.password,
  });
  otherUserToken = loginOther.body.data.token;

  await request(app).post("/api/auth/register").send(adminData);
  const loginAdmin = await request(app).post("/api/auth/login").send({
    email: adminData.email,
    password: adminData.password,
  });
  adminToken = loginAdmin.body.data.token;

  await request(app).post("/api/auth/register").send(donorAData);
  const loginA = await request(app).post("/api/auth/login").send({
    email: donorAData.email,
    password: donorAData.password,
  });
  donorAToken = loginA.body.data.token;
  donorAId = loginA.body.data.user._id;

  await request(app).post("/api/auth/register").send(donorBData);
  const loginB = await request(app).post("/api/auth/login").send({
    email: donorBData.email,
    password: donorBData.password,
  });
  donorBToken = loginB.body.data.token;
  donorBId = loginB.body.data.user._id;

  await request(app).post("/api/auth/register").send(donorCData);
  const loginC = await request(app).post("/api/auth/login").send({
    email: donorCData.email,
    password: donorCData.password,
  });
  donorCToken = loginC.body.data.token;
  donorCId = loginC.body.data.user._id;
});

afterAll(async () => {
  await EmergencyRequest.deleteMany({});
  await Notification.deleteMany({});
  await User.deleteMany({
    email: {
      $in: [
        requesterData.email,
        otherRequesterData.email,
        adminData.email,
        donorAData.email,
        donorBData.email,
        donorCData.email,
      ],
    },
  });
  await mongoose.connection.close();
});

describe("Live Emergency Request Tracking & Stats", () => {
  let testRequestId: string;

  beforeEach(async () => {
    // Create fresh O+ emergency request
    const res = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        bloodGroup: "O+",
        unitsRequired: 2,
        hospitalName: "Apollo BGS Hospital",
        state: "Karnataka",
        district: "Mysore",
        address: "Adhichunchanagiri Road, Kuvempunagar",
        contactNumber: "9876543210",
      });

    testRequestId = res.body.data._id;
  });

  afterEach(async () => {
    await EmergencyRequest.deleteMany({});
    await Notification.deleteMany({});
  });

  // 1. Emergency request with no donor responses
  it("1. calculates correct tracking statistics for fresh request with no donor responses", async () => {
    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.requestId).toBe(testRequestId);
    expect(data.notifiedCount).toBeGreaterThanOrEqual(3); // Donor A, B, C (all compatible)
    expect(data.respondedCount).toBe(0);
    expect(data.acceptedCount).toBe(0);
    expect(data.unableToDonateCount).toBe(0);
    expect(data.withdrawnCount).toBe(0);
    expect(data.pendingCount).toBe(data.notifiedCount);
    expect(data.lifecycleStatus).toBe("Searching for Donors");
    expect(data.status).toBe("Pending");
  });

  // 2. One donor accepts
  it("2. updates stats when one donor accepts", async () => {
    await request(app)
      .put(`/api/emergency/${testRequestId}/accept`)
      .set("Authorization", `Bearer ${donorAToken}`);

    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.respondedCount).toBe(1);
    expect(data.acceptedCount).toBe(1);
    expect(data.unableToDonateCount).toBe(0);
    expect(data.pendingCount).toBe(data.notifiedCount - 1);
    expect(data.lifecycleStatus).toBe("Donor Response Received");
  });

  // 3. Multiple donors accept
  it("3. updates stats accurately when multiple donors accept", async () => {
    await request(app)
      .put(`/api/emergency/${testRequestId}/accept`)
      .set("Authorization", `Bearer ${donorAToken}`);

    await request(app)
      .put(`/api/emergency/${testRequestId}/accept`)
      .set("Authorization", `Bearer ${donorBToken}`);

    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.respondedCount).toBe(2);
    expect(data.acceptedCount).toBe(2);
    expect(data.unableToDonateCount).toBe(0);
    expect(data.pendingCount).toBe(data.notifiedCount - 2);
    expect(data.lifecycleStatus).toBe("Donor Response Received");
  });

  // 4. Donor marks unable to donate (declines upfront)
  it("4. records donor declining / unable to donate before accepting", async () => {
    const declineRes = await request(app)
      .post(`/api/emergency/${testRequestId}/decline`)
      .set("Authorization", `Bearer ${donorCToken}`)
      .send({ reason: "Out of station" });

    expect(declineRes.status).toBe(200);

    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.respondedCount).toBe(1);
    expect(data.acceptedCount).toBe(0);
    expect(data.unableToDonateCount).toBe(1);
    expect(data.lifecycleStatus).toBe("Searching for Donors"); // No accepted donors yet
  });

  // 5. Donor withdraws after accepting
  it("5. correctly updates statistics when an accepted donor withdraws", async () => {
    // Donor A accepts
    await request(app)
      .put(`/api/emergency/${testRequestId}/accept`)
      .set("Authorization", `Bearer ${donorAToken}`);

    // Donor A withdraws
    const withdrawRes = await request(app)
      .post(`/api/emergency/${testRequestId}/withdraw`)
      .set("Authorization", `Bearer ${donorAToken}`)
      .send({ reason: "Medically unfit today" });

    expect(withdrawRes.status).toBe(200);

    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.acceptedCount).toBe(0);
    expect(data.unableToDonateCount).toBe(1);
    expect(data.withdrawnCount).toBe(1);
    expect(data.respondedCount).toBe(1);
    expect(data.lifecycleStatus).toBe("Searching for Donors");
  });

  // 6. Multiple different response states & unique responder deduplication
  it("6. accurately handles concurrent/multiple response states without double-counting", async () => {
    // Donor A accepts
    await request(app)
      .put(`/api/emergency/${testRequestId}/accept`)
      .set("Authorization", `Bearer ${donorAToken}`);

    // Donor B declines
    await request(app)
      .post(`/api/emergency/${testRequestId}/decline`)
      .set("Authorization", `Bearer ${donorBToken}`)
      .send({ reason: "Unable to reach hospital" });

    // Donor C accepts
    await request(app)
      .put(`/api/emergency/${testRequestId}/accept`)
      .set("Authorization", `Bearer ${donorCToken}`);

    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.acceptedCount).toBe(2); // A, C
    expect(data.unableToDonateCount).toBe(1); // B
    expect(data.respondedCount).toBe(3); // A, B, C
    expect(data.pendingCount).toBe(Math.max(0, data.notifiedCount - 3));
    expect(data.lifecycleStatus).toBe("Donor Response Received");
  });

  // 7. Requester opens an existing request after responses already exist
  it("7. correctly computes statistics when opening an existing request with pre-existing responses", async () => {
    // Pre-populate response
    await request(app)
      .put(`/api/emergency/${testRequestId}/accept`)
      .set("Authorization", `Bearer ${donorAToken}`);

    // Re-fetch fresh
    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.acceptedCount).toBe(1);
    expect(res.body.data.respondedCount).toBe(1);
  });

  // 10. Requester cannot access another user's tracking information
  it("10. forbids non-owner user from accessing requester tracking information (403)", async () => {
    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${otherUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Not authorized to view tracking details");
  });

  // 11. Donor own response view only (no other donors' information)
  it("11. returns only donor's own response status and general lifecycle", async () => {
    // Donor A has not responded yet
    const pendingRes = await request(app)
      .get(`/api/emergency/${testRequestId}/donor-status`)
      .set("Authorization", `Bearer ${donorAToken}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.data.myResponse).toBe("Pending");
    expect(pendingRes.body.data.lifecycleStatus).toBe("Searching for Donors");
    // Ensure no other donors' counts or personal details are exposed
    expect(pendingRes.body.data.notifiedCount).toBeUndefined();
    expect(pendingRes.body.data.acceptedBy).toBeUndefined();

    // Donor A accepts
    await request(app)
      .put(`/api/emergency/${testRequestId}/accept`)
      .set("Authorization", `Bearer ${donorAToken}`);

    const acceptedRes = await request(app)
      .get(`/api/emergency/${testRequestId}/donor-status`)
      .set("Authorization", `Bearer ${donorAToken}`);

    expect(acceptedRes.status).toBe(200);
    expect(acceptedRes.body.data.myResponse).toBe("Accepted");
    expect(acceptedRes.body.data.lifecycleStatus).toBe("Donor Response Received");

    // Donor B views their own response (should still be Pending)
    const donorBRes = await request(app)
      .get(`/api/emergency/${testRequestId}/donor-status`)
      .set("Authorization", `Bearer ${donorBToken}`);

    expect(donorBRes.status).toBe(200);
    expect(donorBRes.body.data.myResponse).toBe("Pending");
  });

  // 12. Admin can view aggregate request information
  it("12. allows admin to view tracking information for any request", async () => {
    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requestId).toBe(testRequestId);
  });

  // 13. Fulfilled request
  it("13. sets lifecycle status to Request Fulfilled when donation is confirmed", async () => {
    // Donor A accepts
    await request(app)
      .put(`/api/emergency/${testRequestId}/accept`)
      .set("Authorization", `Bearer ${donorAToken}`);

    // Donor A reports donation
    await request(app)
      .post(`/api/emergency/${testRequestId}/donation-report`)
      .set("Authorization", `Bearer ${donorAToken}`);

    // Requester confirms donation
    await request(app)
      .post(`/api/emergency/${testRequestId}/donation-confirm`)
      .set("Authorization", `Bearer ${requesterToken}`);

    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("Completed");
    expect(res.body.data.lifecycleStatus).toBe("Request Fulfilled");
  });

  // 14. Cancelled request
  it("14. sets lifecycle status to Request Cancelled when owner cancels", async () => {
    await request(app)
      .delete(`/api/emergency/${testRequestId}`)
      .set("Authorization", `Bearer ${requesterToken}`);

    const res = await request(app)
      .get(`/api/emergency/${testRequestId}/tracking`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("Cancelled");
    expect(res.body.data.lifecycleStatus).toBe("Request Cancelled");
  });

  // 16. API error state (invalid id)
  it("16. handles invalid request ID gracefully", async () => {
    const res = await request(app)
      .get("/api/emergency/invalid-mongo-id/tracking")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
