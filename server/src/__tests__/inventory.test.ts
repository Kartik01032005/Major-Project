import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import BloodInventory from "../models/BloodInventory.js";

// ─── Test Data ──────────────────────────────────────────────────────────────
const adminData = {
  name: "Inventory Admin",
  email: "inventoryadmin@bloodlink.dev",
  password: "Admin@1234",
  phone: "7777777771",
  role: "admin",
  organizationName: "Inventory Blood Bank",
  location: { state: "Karnataka", district: "Bangalore" },
};

const userData = {
  name: "Inventory User",
  email: "inventoryuser@bloodlink.dev",
  password: "User@1234",
  phone: "7777777772",
  role: "user",
  location: { state: "Karnataka", district: "Mysore" },
};

let adminToken: string;
let userToken: string;

// ─── Setup / Teardown ────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  // Register and login admin
  await request(app).post("/api/auth/register").send(adminData);
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: adminData.email,
    password: adminData.password,
  });
  adminToken = adminLogin.body.data.token;

  // Register and login regular user
  await request(app).post("/api/auth/register").send(userData);
  const userLogin = await request(app).post("/api/auth/login").send({
    email: userData.email,
    password: userData.password,
  });
  userToken = userLogin.body.data.token;
});

afterAll(async () => {
  await BloodInventory.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
});

// ─── Get Inventory ──────────────────────────────────────────────────────────
describe("GET /api/inventory", () => {
  it("admin should get inventory (with auto-created 8 blood groups)", async () => {
    const res = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(8); // All 8 blood groups
  });

  it("regular user should be denied access (403)", async () => {
    const res = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("unauthenticated request should be denied (401)", async () => {
    const res = await request(app).get("/api/inventory");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── Update Inventory ───────────────────────────────────────────────────────
describe("PUT /api/inventory/:id", () => {
  let inventoryItemId: string;

  beforeAll(async () => {
    // Get inventory to find an item ID
    const res = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${adminToken}`);
    inventoryItemId = res.body.data[0]._id;
  });

  it("admin should update inventory units", async () => {
    const res = await request(app)
      .put(`/api/inventory/${inventoryItemId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ units: 50 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.units).toBe(50);
  });

  it("should reject negative units", async () => {
    const res = await request(app)
      .put(`/api/inventory/${inventoryItemId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ units: -5 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject non-numeric units", async () => {
    const res = await request(app)
      .put(`/api/inventory/${inventoryItemId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ units: "abc" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("regular user should be denied inventory update (403)", async () => {
    const res = await request(app)
      .put(`/api/inventory/${inventoryItemId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ units: 10 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ─── Adjust Inventory ───────────────────────────────────────────────────────
describe("POST /api/inventory/:id/adjust", () => {
  let inventoryItemId: string;

  beforeAll(async () => {
    const res = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${adminToken}`);
    inventoryItemId = res.body.data[0]._id;

    // Set to a known value first
    await request(app)
      .put(`/api/inventory/${inventoryItemId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ units: 100 });
  });

  it("should add units with positive delta", async () => {
    const res = await request(app)
      .post(`/api/inventory/${inventoryItemId}/adjust`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ delta: 25 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.units).toBe(125);
  });

  it("should remove units with negative delta", async () => {
    const res = await request(app)
      .post(`/api/inventory/${inventoryItemId}/adjust`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ delta: -25 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.units).toBe(100);
  });

  it("should not go below zero", async () => {
    const res = await request(app)
      .post(`/api/inventory/${inventoryItemId}/adjust`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ delta: -9999 });

    expect(res.status).toBe(200);
    expect(res.body.data.units).toBe(0);
  });

  it("should reject invalid delta", async () => {
    const res = await request(app)
      .post(`/api/inventory/${inventoryItemId}/adjust`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ delta: "not-a-number" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
