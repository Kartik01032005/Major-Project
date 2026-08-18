import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import Notification from "../models/Notification.js";

// ─── Test Data ──────────────────────────────────────────────────────────────
const userData = {
  name: "Emergency Test User",
  email: "emergency@bloodlink.dev",
  password: "Test@1234",
  phone: "8888888881",
  role: "user",
  location: { state: "Karnataka", district: "Mysore" },
};

const adminData = {
  name: "Emergency Admin",
  email: "emergencyadmin@bloodlink.dev",
  password: "Admin@1234",
  phone: "8888888882",
  role: "admin",
  organizationName: "Emergency Blood Bank",
  location: { state: "Karnataka", district: "Bangalore" },
};

const emergencyPayload = {
  bloodGroup: "O+",
  hospital: "City Hospital",
  state: "Karnataka",
  district: "Mysore",
  address: "MG Road, Near Bus Stand",
  contactNumber: "9999999999",
  latitude: 12.305,
  longitude: 76.655,
};

let userToken: string;
let adminToken: string;

// ─── Setup / Teardown ────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  // Register and login user
  await request(app).post("/api/auth/register").send(userData);
  const userLogin = await request(app).post("/api/auth/login").send({
    email: userData.email,
    password: userData.password,
  });
  userToken = userLogin.body.data.token;

  // Register and login admin
  await request(app).post("/api/auth/register").send(adminData);
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: adminData.email,
    password: adminData.password,
  });
  adminToken = adminLogin.body.data.token;
});

afterAll(async () => {
  await EmergencyRequest.deleteMany({});
  await Notification.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
});

// ─── Create Emergency Request ────────────────────────────────────────────────
describe("POST /api/emergency", () => {
  afterEach(async () => {
    await EmergencyRequest.deleteMany({});
    await Notification.deleteMany({});
  });

  it("should create an emergency request (authenticated user)", async () => {
    const res = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${userToken}`)
      .send(emergencyPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bloodGroup).toBe("O+");
    expect(res.body.data.status).toBe("Pending");
    expect(res.body.data.hospital).toBe("City Hospital");
  });

  it("should reject request without authentication", async () => {
    const res = await request(app)
      .post("/api/emergency")
      .send(emergencyPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject request with invalid blood group", async () => {
    const res = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ...emergencyPayload, bloodGroup: "X+" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject request missing required fields", async () => {
    const res = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ bloodGroup: "A+" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Get Emergency Requests ──────────────────────────────────────────────────
describe("GET /api/emergency", () => {
  beforeAll(async () => {
    await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${userToken}`)
      .send(emergencyPayload);
  });

  afterAll(async () => {
    await EmergencyRequest.deleteMany({});
    await Notification.deleteMany({});
  });

  it("should return all emergency requests", async () => {
    const res = await request(app).get("/api/emergency");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Approve / Reject Emergency Requests ─────────────────────────────────────
describe("Emergency request approve/reject", () => {
  let requestId: string;

  beforeEach(async () => {
    const createRes = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${userToken}`)
      .send(emergencyPayload);
    requestId = createRes.body.data._id;
  });

  afterEach(async () => {
    await EmergencyRequest.deleteMany({});
    await Notification.deleteMany({});
  });

  it("admin should approve an emergency request", async () => {
    const res = await request(app)
      .put(`/api/emergency/${requestId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("Approved");
  });

  it("admin should reject an emergency request", async () => {
    const res = await request(app)
      .put(`/api/emergency/${requestId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("Rejected");
  });

  it("non-admin user should NOT be able to approve", async () => {
    const res = await request(app)
      .put(`/api/emergency/${requestId}/approve`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("non-admin user should NOT be able to reject", async () => {
    const res = await request(app)
      .put(`/api/emergency/${requestId}/reject`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ─── Delete Emergency Request ───────────────────────────────────────────────
describe("DELETE /api/emergency/:id", () => {
  it("owner should delete their own request", async () => {
    const createRes = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${userToken}`)
      .send(emergencyPayload);
    const requestId = createRes.body.data._id;

    const res = await request(app)
      .delete(`/api/emergency/${requestId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
