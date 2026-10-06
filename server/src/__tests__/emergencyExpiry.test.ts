import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import {
  getDefaultExpiryHours,
  calculateExpiresAt,
  checkAndExpireRequest,
  expireOverdueRequests
} from "../controllers/emergencyController.js";

const requesterData = {
  name: "Expiry Requester",
  email: "requester_expiry@bloodlink.dev",
  password: "Pass@1234",
  phone: "9200000001",
  role: "user",
  location: { state: "Karnataka", district: "Bangalore" }
};

const donorData = {
  name: "Expiry Donor",
  email: "donor_expiry@bloodlink.dev",
  password: "Pass@1234",
  phone: "9200000002",
  role: "user",
  bloodGroup: "O+",
  isAvailableDonor: true,
  location: { state: "Karnataka", district: "Bangalore" }
};

const adminData = {
  name: "Expiry Admin",
  email: "admin_expiry@bloodlink.dev",
  password: "Pass@1234",
  phone: "9200000003",
  role: "admin",
  organizationName: "Bangalore Red Cross",
  location: { state: "Karnataka", district: "Bangalore" }
};

describe("Task #3 — Emergency Blood Request Expiry Test Suite", () => {
  let requesterToken: string;
  let requesterId: string;
  let donorToken: string;
  let donorId: string;
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bloodlink_test");
    }

    await User.deleteMany({
      email: { $in: [requesterData.email, donorData.email, adminData.email] }
    });
    await EmergencyRequest.deleteMany({});

    // Register & login requester
    await request(app).post("/api/auth/register").send(requesterData);
    const loginReq = await request(app).post("/api/auth/login").send({
      email: requesterData.email,
      password: requesterData.password,
    });
    requesterToken = loginReq.body.data.token;
    requesterId = loginReq.body.data.user._id;

    // Register & login donor
    await request(app).post("/api/auth/register").send(donorData);
    const loginDon = await request(app).post("/api/auth/login").send({
      email: donorData.email,
      password: donorData.password,
    });
    donorToken = loginDon.body.data.token;
    donorId = loginDon.body.data.user._id;

    // Register & login admin
    await request(app).post("/api/auth/register").send(adminData);
    const loginAdm = await request(app).post("/api/auth/login").send({
      email: adminData.email,
      password: adminData.password,
    });
    adminToken = loginAdm.body.data.token;
    adminId = loginAdm.body.data.user._id;
  });

  afterAll(async () => {
    await EmergencyRequest.deleteMany({});
    await User.deleteMany({
      email: { $in: [requesterData.email, donorData.email, adminData.email] }
    });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await EmergencyRequest.deleteMany({});
  });

  // 1 & 2. New request receives expiresAt & Default expiration duration works
  it("1 & 2. sets expiresAt on new emergency request with default duration (24h)", async () => {
    delete process.env.EMERGENCY_REQUEST_DEFAULT_EXPIRY_HOURS;
    delete process.env.EMERGENCY_REQUEST_DEFAULT_EXPIRY_MINUTES;
    const defaultHours = getDefaultExpiryHours();
    expect(defaultHours).toBe(24);

    const before = Date.now();
    const res = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        bloodGroup: "O+",
        hospital: "City Central Hospital",
        state: "Karnataka",
        district: "Bangalore",
        address: "123 Main Road",
        contactNumber: "9876543210"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.expiresAt).toBeDefined();

    const expiresAt = new Date(res.body.data.expiresAt).getTime();
    const expected = before + 24 * 3600 * 1000;
    // within 5 seconds tolerance
    expect(Math.abs(expiresAt - expected)).toBeLessThan(5000);
  });

  // 3. Custom configured duration works
  it("3. respects custom EMERGENCY_REQUEST_DEFAULT_EXPIRY_HOURS configuration", async () => {
    delete process.env.EMERGENCY_REQUEST_DEFAULT_EXPIRY_MINUTES;
    process.env.EMERGENCY_REQUEST_DEFAULT_EXPIRY_HOURS = "12";
    expect(getDefaultExpiryHours()).toBe(12);

    const now = new Date();
    const calculated = calculateExpiresAt(now);
    expect(calculated.getTime() - now.getTime()).toBe(12 * 3600 * 1000);

    delete process.env.EMERGENCY_REQUEST_DEFAULT_EXPIRY_HOURS;
  });

  // 4. Active request remains active before expiration
  it("4. active request remains Pending before expiration timestamp", async () => {
    const emergencyReq = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "General Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour in future
      status: "Pending"
    });

    const isExpired = await checkAndExpireRequest(emergencyReq);
    expect(isExpired).toBe(false);
    expect(emergencyReq.status).toBe("Pending");
  });

  // 5. Expired request becomes EXPIRED
  it("5. automatically transitions active request to Expired when now >= expiresAt", async () => {
    const pastExpiresAt = new Date(Date.now() - 60 * 1000); // 1 minute in the past
    const emergencyReq = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "General Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: pastExpiresAt,
      status: "Pending"
    });

    const isExpired = await checkAndExpireRequest(emergencyReq);
    expect(isExpired).toBe(true);
    expect(emergencyReq.status).toBe("Expired");

    const inDb = await EmergencyRequest.findById(emergencyReq._id);
    expect(inDb?.status).toBe("Expired");
  });

  // 6. Expired request cannot receive new donor responses
  it("6. rejects donor acceptance and decline on expired request with 409 Conflict", async () => {
    const pastExpiresAt = new Date(Date.now() - 60 * 1000);
    const emergencyReq = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "General Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: pastExpiresAt,
      status: "Pending"
    });

    // Donor attempts to accept
    const acceptRes = await request(app)
      .put(`/api/emergency/${emergencyReq._id}/accept`)
      .set("Authorization", `Bearer ${donorToken}`)
      .send();

    expect(acceptRes.status).toBe(409);
    expect(acceptRes.body.message).toBe("This emergency request has expired.");

    // Donor attempts to decline
    const declineRes = await request(app)
      .post(`/api/emergency/${emergencyReq._id}/decline`)
      .set("Authorization", `Bearer ${donorToken}`)
      .send({ reason: "Busy" });

    expect(declineRes.status).toBe(409);
    expect(declineRes.body.message).toBe("This emergency request has expired.");
  });

  // 7. Expired request cannot receive new donor matching / sweep transitions
  it("7. expireOverdueRequests sweeps overdue requests and updates status", async () => {
    const pastExpiresAt = new Date(Date.now() - 60 * 1000);
    const req1 = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "Hospital 1",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: pastExpiresAt,
      status: "Pending"
    });

    const req2 = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "Hospital 2",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: new Date(Date.now() + 3600 * 1000),
      status: "Approved"
    });

    const sweptCount = await expireOverdueRequests();
    expect(sweptCount).toBe(1);

    const updatedReq1 = await EmergencyRequest.findById(req1._id);
    const updatedReq2 = await EmergencyRequest.findById(req2._id);
    expect(updatedReq1?.status).toBe("Expired");
    expect(updatedReq2?.status).toBe("Approved");
  });

  // 8. Fulfilled request does not become expired afterward
  it("8. completed (fulfilled) request never transitions to expired even if expiresAt is in past", async () => {
    const pastExpiresAt = new Date(Date.now() - 60 * 1000);
    const completedReq = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "City Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: pastExpiresAt,
      status: "Completed"
    });

    const isExpired = await checkAndExpireRequest(completedReq);
    expect(isExpired).toBe(false);
    expect(completedReq.status).toBe("Completed");

    const inDb = await EmergencyRequest.findById(completedReq._id);
    expect(inDb?.status).toBe("Completed");
  });

  // 9. Cancelled request does not become expired afterward
  it("9. cancelled request never transitions to expired even if expiresAt is in past", async () => {
    const pastExpiresAt = new Date(Date.now() - 60 * 1000);
    const cancelledReq = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "City Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: pastExpiresAt,
      status: "Cancelled"
    });

    const isExpired = await checkAndExpireRequest(cancelledReq);
    expect(isExpired).toBe(false);
    expect(cancelledReq.status).toBe("Cancelled");

    const inDb = await EmergencyRequest.findById(cancelledReq._id);
    expect(inDb?.status).toBe("Cancelled");
  });

  // 10. Existing donor responses remain after expiration
  it("10. preserves existing donor responses (acceptedBy, declinedBy) after expiration", async () => {
    const futureExpiresAt = new Date(Date.now() + 3600 * 1000);
    const emergencyReq = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "General Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: futureExpiresAt,
      status: "Pending"
    });

    // Donor accepts while active
    const acceptRes = await request(app)
      .put(`/api/emergency/${emergencyReq._id}/accept`)
      .set("Authorization", `Bearer ${donorToken}`)
      .send();
    expect(acceptRes.status).toBe(200);

    // Simulate expiration
    emergencyReq.expiresAt = new Date(Date.now() - 1000);
    await emergencyReq.save();

    await checkAndExpireRequest(emergencyReq);
    expect(emergencyReq.status).toBe("Expired");

    const inDb = await EmergencyRequest.findById(emergencyReq._id);
    expect(inDb?.acceptedBy).toHaveLength(1);
    expect(inDb?.acceptedBy?.[0]?.toString()).toBe(donorId.toString());
  });

  // 11. Requester sees correct expiration state in tracking
  it("11. returns lifecycleStatus 'Request Expired' and expiresAt in tracking stats", async () => {
    const pastExpiresAt = new Date(Date.now() - 60 * 1000);
    const emergencyReq = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "General Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: pastExpiresAt,
      status: "Pending"
    });

    const trackingRes = await request(app)
      .get(`/api/emergency/${emergencyReq._id}/tracking`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(trackingRes.status).toBe(200);
    expect(trackingRes.body.data.status).toBe("Expired");
    expect(trackingRes.body.data.lifecycleStatus).toBe("Request Expired");
    expect(trackingRes.body.data.expiresAt).toBeDefined();
  });

  // 12. Donor response status endpoint reflects expiration
  it("12. returns lifecycleStatus 'Request Expired' on donor-status endpoint", async () => {
    const pastExpiresAt = new Date(Date.now() - 60 * 1000);
    const emergencyReq = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "General Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: pastExpiresAt,
      status: "Pending"
    });

    const donorStatusRes = await request(app)
      .get(`/api/emergency/${emergencyReq._id}/donor-status`)
      .set("Authorization", `Bearer ${donorToken}`);

    expect(donorStatusRes.status).toBe(200);
    expect(donorStatusRes.body.data.requestStatus).toBe("Expired");
    expect(donorStatusRes.body.data.lifecycleStatus).toBe("Request Expired");
  });

  // 13. Admin sees expired status in request list
  it("13. admin retrieves expired status and getAllRequests triggers overdue sweep", async () => {
    const pastExpiresAt = new Date(Date.now() - 60 * 1000);
    await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "General Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: pastExpiresAt,
      status: "Pending"
    });

    const listRes = await request(app)
      .get("/api/emergency")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    const match = listRes.body.data.find((r: any) => r.hospital === "General Hospital");
    expect(match).toBeDefined();
    expect(match.status).toBe("Expired");
  });

  // 14. Server restart does not lose expiration information
  it("14. persists expiresAt in MongoDB across queries and reloads", async () => {
    const testDate = new Date(Date.now() + 18 * 3600 * 1000);
    const created = await EmergencyRequest.create({
      requestBy: requesterId,
      bloodGroup: "O+",
      hospital: "Persistence Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      expiresAt: testDate,
      status: "Pending"
    });

    const fetched = await EmergencyRequest.findById(created._id);
    expect(fetched?.expiresAt?.getTime()).toBe(testDate.getTime());
  });

  // 15 & 17. Old records without expiresAt are handled safely
  it("15 & 17. safely handles older records lacking expiresAt without crashing", async () => {
    // Insert older record bypassing Mongoose required validation if any
    const oldRecord = await EmergencyRequest.collection.insertOne({
      requestBy: new mongoose.Types.ObjectId(requesterId),
      bloodGroup: "O+",
      hospital: "Old Era Hospital",
      state: "Karnataka",
      district: "Bangalore",
      address: "123 Main Road",
      contactNumber: "9876543210",
      status: "Pending",
      createdAt: new Date(Date.now() - 48 * 3600 * 1000) // 48h ago
    });

    const found = await EmergencyRequest.findById(oldRecord.insertedId);
    expect(found?.expiresAt).toBeUndefined();

    // Accessing should backfill and detect expiration
    const isExpired = await checkAndExpireRequest(found);
    expect(isExpired).toBe(true);
    expect(found?.status).toBe("Expired");
    expect(found?.expiresAt).toBeDefined();
  });
});
