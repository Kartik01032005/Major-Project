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
    expect(res.body.data.role).toBe("USER");
    expect(res.body.data.approvalStatus).toBe("APPROVED");
  });

  it("should register an admin with organization name", async () => {
    const res = await request(app).post("/api/auth/register").send(testAdmin);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("BLOOD_BANK");
    expect(res.body.data.approvalStatus).toBe("APPROVED");
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
      role: "USER",
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
      role: "USER",
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
        role: "USER",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);

    // Verify old password no longer works
    const oldLoginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
        role: "USER",
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

// ─── Section 1: Role-Based Authentication & Authorization Tests ───────────────
describe("Section 1: Role-Based Authentication & Institutional Approvals", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  const hospitalPayload = {
    name: "Dr. A. Sharma",
    organizationName: "City Care Super Specialty Hospital",
    email: "admin@citycare.org",
    phone: "9812345678",
    password: "Password@123",
    role: "HOSPITAL",
    address: "123 Medical Enclave, MG Road",
    registrationNumber: "HOSP-KA-2026-901",
    location: { state: "Karnataka", district: "Bangalore" },
  };

  const bloodBankPayload = {
    name: "Dr. B. Verma",
    organizationName: "Metro Red Blood Center",
    email: "contact@metroblood.org",
    phone: "9823456789",
    password: "Password@123",
    role: "BLOOD_BANK",
    address: "45 Health Avenue",
    registrationNumber: "BB-KA-2026-554",
    location: { state: "Karnataka", district: "Bangalore" },
  };

  it("1. should register a hospital account directly with APPROVED status and institutional fields", async () => {
    const res = await request(app).post("/api/auth/register").send(hospitalPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("HOSPITAL");
    expect(res.body.data.approvalStatus).toBe("APPROVED");
    expect(res.body.data.organizationName).toBe("City Care Super Specialty Hospital");
    expect(res.body.data.address).toBe("123 Medical Enclave, MG Road");
    expect(res.body.data.registrationNumber).toBe("HOSP-KA-2026-901");
    expect(res.body.data.bloodGroup).toBeUndefined();
  });

  it("2. should register a blood-bank account directly with APPROVED status", async () => {
    const res = await request(app).post("/api/auth/register").send(bloodBankPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("BLOOD_BANK");
    expect(res.body.data.approvalStatus).toBe("APPROVED");
    expect(res.body.data.organizationName).toBe("Metro Red Blood Center");
  });

  it("3. should allow registered hospital account to login immediately without waiting for admin approval", async () => {
    await request(app).post("/api/auth/register").send(hospitalPayload);

    const loginRes = await request(app).post("/api/auth/login").send({
      email: hospitalPayload.email,
      password: hospitalPayload.password,
      role: "HOSPITAL",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.role).toBe("HOSPITAL");
    expect(loginRes.body.data.user.approvalStatus).toBe("APPROVED");
    expect(loginRes.body.data.token).toBeDefined();
  });

  it("4. should prevent regular users from elevating to admin role", async () => {
    const regularPayload = {
      name: "Sneaky User",
      email: "sneaky@bloodlink.dev",
      password: "Password@123",
      phone: "9800000002",
      role: "admin", // attempting to get admin without organization
      location: { state: "Karnataka", district: "Mysore" },
    };

    // Fails because organizationName is required for institutional roles
    const res = await request(app).post("/api/auth/register").send(regularPayload);
    expect(res.status).toBe(400);
  });

  it("5. should allow registered blood bank direct access to protected inventory endpoints", async () => {
    // Register blood bank directly
    await request(app).post("/api/auth/register").send(bloodBankPayload);

    const loginRes = await request(app).post("/api/auth/login").send({
      email: bloodBankPayload.email,
      password: bloodBankPayload.password,
      role: "BLOOD_BANK",
    });
    const token = loginRes.body.data.token;
    expect(loginRes.body.data.user.approvalStatus).toBe("APPROVED");

    // Access protected inventory API directly
    const invRes = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${token}`);

    expect(invRes.status).toBe(200);
    expect(invRes.body.success).toBe(true);
  });

  it("6. should block ordinary users from accessing protected institutional inventory endpoints", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const loginRes = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
      role: "USER",
    });
    const token = loginRes.body.data.token;

    const invRes = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${token}`);

    expect(invRes.status).toBe(403);
    expect(invRes.body.success).toBe(false);
    expect(invRes.body.message).toMatch(/insufficient permissions/i);
  });

  it("7. should preserve existing approved blood banks without approvalStatus in database (backward compatibility)", async () => {
    // Create legacy blood bank account directly in database without approvalStatus
    const legacyAdmin = await User.create({
      name: "Legacy Blood Bank",
      email: "legacy@bloodbank.org",
      password: "Password@123",
      phone: "9800000099",
      role: "admin", // legacy role
      organizationName: "Legacy Blood Center",
      location: { state: "Karnataka", district: "Bangalore", latitude: 12.97, longitude: 77.59 },
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "legacy@bloodbank.org",
      password: "Password@123",
      role: "BLOOD_BANK",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.approvalStatus).toBe("APPROVED");

    // Legacy blood bank can access inventory without error
    const invRes = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${loginRes.body.data.token}`);

    expect(invRes.status).toBe(200);
    expect(invRes.body.success).toBe(true);
  });

  it("8. should allow authorized administrator to view pending institutions and approve/reject them", async () => {
    // Setup approved administrator
    await User.create({
      name: "System Admin",
      email: "sysadmin@bloodlink.org",
      password: "Password@123",
      phone: "9800000100",
      role: "BLOOD_BANK",
      approvalStatus: "APPROVED",
      location: { state: "Karnataka", district: "Bangalore" },
    });

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "sysadmin@bloodlink.org",
      password: "Password@123",
      role: "BLOOD_BANK",
    });
    const adminToken = adminLogin.body.data.token;

    // Create an institution with PENDING_APPROVAL for testing approval management endpoints
    const pendingHosp = await User.create({
      name: hospitalPayload.name,
      email: hospitalPayload.email,
      password: hospitalPayload.password,
      phone: hospitalPayload.phone,
      role: hospitalPayload.role,
      approvalStatus: "PENDING_APPROVAL",
      organizationName: hospitalPayload.organizationName,
      address: hospitalPayload.address,
      registrationNumber: hospitalPayload.registrationNumber,
      location: hospitalPayload.location,
    });
    const hospId = pendingHosp._id;

    // Admin views pending institutions
    const pendingRes = await request(app)
      .get("/api/auth/institutions/pending")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.success).toBe(true);
    expect(pendingRes.body.count).toBeGreaterThanOrEqual(1);

    // Admin approves the hospital
    const approveRes = await request(app)
      .patch(`/api/auth/institutions/${hospId}/approval`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "APPROVED" });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.approvalStatus).toBe("APPROVED");

    // Hospital logs in and is now approved
    const hospLogin = await request(app).post("/api/auth/login").send({
      email: hospitalPayload.email,
      password: hospitalPayload.password,
      role: "HOSPITAL",
    });
    expect(hospLogin.body.data.user.approvalStatus).toBe("APPROVED");
  });

  it("9. should block rejected institution with appropriate status and reason", async () => {
    // Setup approved administrator
    await User.create({
      name: "System Admin",
      email: "sysadmin2@bloodlink.org",
      password: "Password@123",
      phone: "9800000101",
      role: "BLOOD_BANK",
      approvalStatus: "APPROVED",
      location: { state: "Karnataka", district: "Bangalore" },
    });

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "sysadmin2@bloodlink.org",
      password: "Password@123",
      role: "BLOOD_BANK",
    });
    const adminToken = adminLogin.body.data.token;

    // Register blood bank
    const bbReg = await request(app).post("/api/auth/register").send(bloodBankPayload);
    const bbId = bbReg.body.data._id;

    // Admin rejects blood bank with reason
    const rejectRes = await request(app)
      .patch(`/api/auth/institutions/${bbId}/approval`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "REJECTED", rejectionReason: "Invalid license credentials provided" });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.approvalStatus).toBe("REJECTED");
    expect(rejectRes.body.data.rejectionReason).toBe("Invalid license credentials provided");

    // Rejected institution logs in: shows REJECTED status
    const bbLogin = await request(app).post("/api/auth/login").send({
      email: bloodBankPayload.email,
      password: bloodBankPayload.password,
      role: "BLOOD_BANK",
    });
    expect(bbLogin.body.data.user.approvalStatus).toBe("REJECTED");
    expect(bbLogin.body.data.user.rejectionReason).toBe("Invalid license credentials provided");

    // Access to protected API returns 403 REJECTED
    const invRes = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${bbLogin.body.data.token}`);

    expect(invRes.status).toBe(403);
    expect(invRes.body.approvalStatus).toBe("REJECTED");
  });

  describe("Login Role Mismatch & Secure Verification", () => {
    const userCredentials = {
      name: "Rahul Test Donor",
      email: "rahul.donor@bloodlink.dev",
      password: "Password@123",
      phone: "9876543299",
      role: "USER" as const,
      bloodGroup: "O+" as const,
      location: { state: "Karnataka", district: "Mysore" },
    };

    const bloodBankCredentials = {
      name: "Kartik Admin",
      email: "kartik.bb@bloodlink.dev",
      password: "Password@123",
      phone: "9876543298",
      role: "BLOOD_BANK" as const,
      organizationName: "Kartik Blood Center",
      location: { state: "Karnataka", district: "Mysore" },
    };

    const hospitalCredentials = {
      name: "Dr. Sharma",
      email: "sharma.hosp@bloodlink.dev",
      password: "Password@123",
      phone: "9876543297",
      role: "HOSPITAL" as const,
      organizationName: "City Care Hospital",
      address: "100 Hospital Way",
      registrationNumber: "HSP-REG-9911",
      location: { state: "Karnataka", district: "Mysore" },
    };

    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(userCredentials);
      await request(app).post("/api/auth/register").send(bloodBankCredentials);
      await request(app).post("/api/auth/register").send(hospitalCredentials);
    });

    it("1. should succeed login when credentials and requested role match (USER)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: userCredentials.email,
        password: userCredentials.password,
        role: "USER",
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe("USER");
    });

    it("2. should reject login with 403 Forbidden when USER attempts to login as BLOOD_BANK", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: userCredentials.email,
        password: userCredentials.password,
        role: "BLOOD_BANK",
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("This account is not registered for the selected role. Please select the correct role.");
      expect(res.body.data).toBeUndefined();
    });

    it("3. should reject login with 403 Forbidden when USER attempts to login as HOSPITAL", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: userCredentials.email,
        password: userCredentials.password,
        role: "HOSPITAL",
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("This account is not registered for the selected role. Please select the correct role.");
      expect(res.body.data).toBeUndefined();
    });

    it("4. should reject login with 403 Forbidden when BLOOD_BANK attempts to login as USER", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: bloodBankCredentials.email,
        password: bloodBankCredentials.password,
        role: "USER",
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("This account is not registered for the selected role. Please select the correct role.");
      expect(res.body.data).toBeUndefined();
    });

    it("5. should reject login with 403 Forbidden when HOSPITAL attempts to login as BLOOD_BANK", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: hospitalCredentials.email,
        password: hospitalCredentials.password,
        role: "BLOOD_BANK",
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("This account is not registered for the selected role. Please select the correct role.");
      expect(res.body.data).toBeUndefined();
    });

    it("6. should reject login with 401 Unauthorized when password is wrong even if role matches", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: userCredentials.email,
        password: "IncorrectPassword!",
        role: "USER",
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it("7. should not issue access token on role mismatch", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: bloodBankCredentials.email,
        password: bloodBankCredentials.password,
        role: "USER",
      });
      expect(res.status).toBe(403);
      expect(res.body.data?.token).toBeUndefined();
    });

    it("8. should fail securely with 403 when stored role in database is missing or corrupted", async () => {
      const bcrypt = (await import("bcryptjs")).default;
      const hashed = await bcrypt.hash("Password@123", 10);
      await User.collection.insertOne({
        name: "Corrupted Account",
        email: "corrupt.user@bloodlink.dev",
        password: hashed,
        phone: "9876543201",
        role: "corrupted_role" as any,
        isAvailableDonor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "corrupt.user@bloodlink.dev",
        password: "Password@123",
        role: "USER",
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or missing role configuration/i);
      expect(res.body.data).toBeUndefined();
    });

    it("9. should preserve legacy role values ('admin' and 'user') and allow login only with matching canonical role", async () => {
      const bcrypt = (await import("bcryptjs")).default;
      const hashed = await bcrypt.hash("Password@123", 10);

      // Legacy user with role: 'user'
      await User.collection.insertOne({
        name: "Legacy Jhon User",
        email: "jhon.legacy@bloodlink.dev",
        password: hashed,
        phone: "9876543202",
        role: "user" as any,
        approvalStatus: "APPROVED",
        isAvailableDonor: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Legacy user logs in with USER -> succeeds
      const legacyLoginSuccess = await request(app).post("/api/auth/login").send({
        email: "jhon.legacy@bloodlink.dev",
        password: "Password@123",
        role: "USER",
      });
      expect(legacyLoginSuccess.status).toBe(200);
      expect(legacyLoginSuccess.body.data.token).toBeDefined();

      // Legacy user attempts to login as BLOOD_BANK -> rejected
      const legacyLoginMismatch = await request(app).post("/api/auth/login").send({
        email: "jhon.legacy@bloodlink.dev",
        password: "Password@123",
        role: "BLOOD_BANK",
      });
      expect(legacyLoginMismatch.status).toBe(403);
      expect(legacyLoginMismatch.body.success).toBe(false);
    });
  });
});

