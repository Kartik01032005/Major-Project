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

// ─── Cancel Emergency Request ───────────────────────────────────────────────
describe("DELETE /api/emergency/:id", () => {
  afterEach(async () => {
    await EmergencyRequest.deleteMany({});
  });

  const createRequest = async () => {
    const createRes = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${userToken}`)
      .send(emergencyPayload);
    return createRes.body.data._id as string;
  };

  it("owner should cancel their own pending request and persist the status", async () => {
    const requestId = await createRequest();
    const res = await request(app)
      .delete(`/api/emergency/${requestId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("Cancelled");
    await expect(EmergencyRequest.findById(requestId).select("status")).resolves.toMatchObject({
      status: "Cancelled",
    });
  });

  it("should reject cancellation without authentication", async () => {
    const requestId = await createRequest();
    const res = await request(app).delete(`/api/emergency/${requestId}`);

    expect(res.status).toBe(401);
  });

  it("should prevent a different user from cancelling the request", async () => {
    const requestId = await createRequest();
    const res = await request(app)
      .delete(`/api/emergency/${requestId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });

  it("should return not found for a nonexistent request", async () => {
    const requestId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/emergency/${requestId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  it("should reject an invalid request ID", async () => {
    const res = await request(app)
      .delete("/api/emergency/not-an-id")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(400);
  });

  it.each(["Approved", "Rejected", "Completed", "Cancelled"] as const)(
    "should reject cancellation after the request is %s",
    async (status) => {
    const requestId = await createRequest();
    await EmergencyRequest.findByIdAndUpdate(requestId, { status });

    const res = await request(app)
      .delete(`/api/emergency/${requestId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Only pending requests can be cancelled");
    }
  );
});

// ─── Accept Emergency Request (Intent to Donate) ────────────────────────────
describe("PUT /api/emergency/:id/accept", () => {
  let donorToken: string;
  let donorUser: InstanceType<typeof User>;
  let mismatchDonorToken: string;
  let requestId: string;

  beforeAll(async () => {
    // Register a valid matching donor (role: user, bloodGroup: O+)
    const donorRes = await request(app).post("/api/auth/register").send({
      name: "Matching Donor User",
      email: "donor.matching@bloodlink.dev",
      password: "Test@1234",
      phone: "8888888883",
      role: "user",
      bloodGroup: "O+",
      location: { state: "Karnataka", district: "Mysore" },
    });
    const donorLogin = await request(app).post("/api/auth/login").send({
      email: "donor.matching@bloodlink.dev",
      password: "Test@1234",
    });
    donorToken = donorLogin.body.data.token;
    donorUser = await User.findOne({ email: "donor.matching@bloodlink.dev" }) as InstanceType<typeof User>;

    // Register a mismatching blood group donor (bloodGroup: A+)
    await request(app).post("/api/auth/register").send({
      name: "Mismatch Donor User",
      email: "donor.mismatch@bloodlink.dev",
      password: "Test@1234",
      phone: "8888888884",
      role: "user",
      bloodGroup: "A+",
      location: { state: "Karnataka", district: "Mysore" },
    });
    const mismatchLogin = await request(app).post("/api/auth/login").send({
      email: "donor.mismatch@bloodlink.dev",
      password: "Test@1234",
    });
    mismatchDonorToken = mismatchLogin.body.data.token;
  });

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

  it("donor should accept an emergency request successfully", async () => {
    const res = await request(app)
      .put(`/api/emergency/${requestId}/accept`)
      .set("Authorization", `Bearer ${donorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Request accepted successfully");
    expect(res.body.data.acceptedBy).toEqual(
      expect.arrayContaining([donorUser._id.toString()])
    );
  });

  it("should prevent duplicate acceptance by the same donor", async () => {
    // First acceptance
    await request(app)
      .put(`/api/emergency/${requestId}/accept`)
      .set("Authorization", `Bearer ${donorToken}`);

    // Second acceptance attempt
    const res = await request(app)
      .put(`/api/emergency/${requestId}/accept`)
      .set("Authorization", `Bearer ${donorToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("You have already accepted this request");
  });

  it("should reject request acceptance without authentication", async () => {
    const res = await request(app).put(`/api/emergency/${requestId}/accept`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("owner should NOT be able to accept their own request", async () => {
    const res = await request(app)
      .put(`/api/emergency/${requestId}/accept`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("You cannot accept your own request");
  });

  it("admin should NOT be able to accept donor requests", async () => {
    const res = await request(app)
      .put(`/api/emergency/${requestId}/accept`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Only donors can accept requests");
  });

  it("should reject acceptance if donor blood group does not match request", async () => {
    const res = await request(app)
      .put(`/api/emergency/${requestId}/accept`)
      .set("Authorization", `Bearer ${mismatchDonorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Blood group does not match this request");
  });

  it("should reject acceptance if request is not found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/emergency/${fakeId}/accept`)
      .set("Authorization", `Bearer ${donorToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

