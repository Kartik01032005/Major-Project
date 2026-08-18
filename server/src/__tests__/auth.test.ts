import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";

// ─── Test Data ──────────────────────────────────────────────────────────────
const testUser = {
  name: "Test User",
  email: "testuser@bloodlink.dev",
  password: "Test@1234",
  phone: "9876543210",
  role: "user",
  location: {
    state: "Karnataka",
    district: "Mysore",
  },
};

const testAdmin = {
  name: "Admin Contact",
  email: "admin@bloodlink.dev",
  password: "Admin@1234",
  phone: "9876543211",
  role: "admin",
  organizationName: "Test Blood Bank",
  location: {
    state: "Karnataka",
    district: "Bangalore",
  },
};

// ─── Setup / Teardown ────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

// ─── Registration Tests ─────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  afterAll(async () => {
    // Clean up for other tests that re-create users
    await User.deleteMany({});
  });

  it("should register a new user successfully", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/registration successful/i);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.role).toBe("user");
  });

  it("should register an admin with organization name", async () => {
    const res = await request(app).post("/api/auth/register").send(testAdmin);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("admin");
    expect(res.body.data.name).toContain("Test Blood Bank");
  });

  it("should reject duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email already exists/i);
  });

  it("should reject missing required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "incomplete@bloodlink.dev",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject invalid email format", async () => {
    const res = await request(app).post("/api/auth/register").send({
      ...testUser,
      email: "not-an-email",
      phone: "1111111111",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject short passwords", async () => {
    const res = await request(app).post("/api/auth/register").send({
      ...testUser,
      email: "short@bloodlink.dev",
      phone: "2222222222",
      password: "abc",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Login Tests ────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    // Create a user for login tests
    await request(app).post("/api/auth/register").send(testUser);
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  it("should login with valid credentials and return token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it("should reject invalid password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: "WrongPassword123",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("should reject non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@bloodlink.dev",
      password: "SomePassword123",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject empty body", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Get Me (Authenticated) ────────────────────────────────────────────────
describe("GET /api/auth/me", () => {
  let token: string;

  beforeAll(async () => {
    await request(app).post("/api/auth/register").send(testUser);
    const loginRes = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    token = loginRes.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  it("should return user profile with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it("should reject request without token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject request with invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid_token_123");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
