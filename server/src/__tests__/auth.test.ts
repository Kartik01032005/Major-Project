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

// ─── Forgot Password Tests ──────────────────────────────────────────────────
describe("POST /api/auth/forgot-password", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await request(app).post("/api/auth/register").send(testUser);
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  it("should return generic success message when account exists", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/check your inbox/i);
    // Crucial security check: Token or URL must NOT be exposed in response
    expect(res.body.data).toBeUndefined();
  });

  it("should store a SHA-256 hashed token with 30-minute expiry in MongoDB", async () => {
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: testUser.email });

    const user = await User.findOne({ email: testUser.email });
    expect(user).toBeDefined();
    expect(user?.resetPasswordToken).toBeDefined();
    // SHA-256 hash length is 64 hex characters
    expect(user?.resetPasswordToken).toHaveLength(64);
    expect(user?.resetPasswordExpires).toBeDefined();

    // Check expiry is in the future (~30 minutes from now)
    const now = Date.now();
    const expiryTime = user!.resetPasswordExpires!.getTime();
    expect(expiryTime).toBeGreaterThan(now + 25 * 60 * 1000);
    expect(expiryTime).toBeLessThanOrEqual(now + 31 * 60 * 1000);
  });

  it("should return identical generic message for non-existent email (prevent enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nonexistent@bloodlink.dev" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/check your inbox/i);
    expect(res.body.message).not.toMatch(/not found/i);
  });

  it("should reject invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "invalid-email-address" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Reset Password Tests ───────────────────────────────────────────────────
describe("POST /api/auth/reset-password", () => {
  const rawToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  let hashedToken: string;

  beforeAll(async () => {
    const cryptoModule = await import("crypto");
    hashedToken = cryptoModule.createHash("sha256").update(rawToken).digest("hex");
  });

  beforeEach(async () => {
    await User.deleteMany({});
    // Create user with valid reset token
    const user = new User({
      ...testUser,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000),
      resetPasswordTokenHash: hashedToken,
      resetPasswordExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    await user.save();
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  it("should successfully reset password with valid token and allow login with new password", async () => {
    const newPassword = "NewSecretPassword@123";

    const resetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: rawToken,
        password: newPassword,
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);
    expect(resetRes.body.message).toMatch(/reset successfully/i);

    // Verify token was invalidated in MongoDB (one-time use)
    const user = await User.findOne({ email: testUser.email });
    expect(user?.resetPasswordToken).toBeUndefined();
    expect(user?.resetPasswordExpires).toBeUndefined();

    // Verify login with new password works
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: newPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);

    // Verify old password no longer works
    const oldLoginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(oldLoginRes.status).toBe(401);
  });

  it("should reject reused reset token", async () => {
    const newPassword = "NewSecretPassword@123";

    // First use: succeeds
    const firstRes = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: rawToken,
        password: newPassword,
      });
    expect(firstRes.status).toBe(200);

    // Second use: fails because token was invalidated
    const secondRes = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: rawToken,
        password: "AnotherPassword@456",
      });

    expect(secondRes.status).toBe(400);
    expect(secondRes.body.success).toBe(false);
    expect(secondRes.body.message).toMatch(/invalid or has expired/i);
  });

  it("should reject expired token", async () => {
    // Set token expiry in the past
    await User.updateOne(
      { email: testUser.email },
      {
        resetPasswordExpires: new Date(Date.now() - 1000),
        resetPasswordExpiresAt: new Date(Date.now() - 1000),
      }
    );

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: rawToken,
        password: "NewPassword@123",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  it("should reject invalid token string", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: "completely_fake_token",
        password: "NewPassword@123",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  it("should reject passwords shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({
        token: rawToken,
        password: "123",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/at least 6 characters/i);
  });

  it("should reject missing token or password", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

