import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import app from "../app.js";
import User from "../models/User.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import jwt from "jsonwebtoken";

describe("Settings & Account Management API Tests", () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/bloodlink_test";
      await mongoose.connect(uri);
    }

    await User.deleteMany({ email: { $in: ["settings_test@example.com"] } });
    await EmergencyRequest.deleteMany({ "requestBy.email": "settings_test@example.com" });

    const testUser = await User.create({
      name: "Settings Tester",
      email: "settings_test@example.com",
      phone: "9988776655",
      password: "InitialPassword123!",
      bloodGroup: "O+",
      role: "user",
      isAvailableDonor: true,
      location: {
        state: "Karnataka",
        district: "Mysore",
        latitude: 12.2958,
        longitude: 76.6394,
      },
    });

    testUserId = testUser._id.toString();
    const jwtSecret = process.env.JWT_SECRET || "bloodlink_secret_key_2026";
    authToken = jwt.sign({ id: testUserId, role: "user" }, jwtSecret, { expiresIn: "1h" });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ["settings_test@example.com"] } });
    await EmergencyRequest.deleteMany({ "requestBy.email": "settings_test@example.com" });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it("1. GET /api/users/settings returns settings with default values", async () => {
    const res = await request(app)
      .get("/api/users/settings")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.notifications.emergencyAlerts).toBe(true);
    expect(res.body.data.privacy.locationSharing).toBe(true);
  });

  it("2. PUT /api/users/settings updates preferences successfully", async () => {
    const updatePayload = {
      donor: { pauseDonorRequests: true },
      notifications: {
        emergencyAlerts: false, // Attempt to disable critical emergency alerts
        nearbyRequests: false,
        smsNotifications: true,
      },
      privacy: {
        locationSharing: false,
        profileVisibility: "hidden",
        phoneNumberPrivacy: "hidden",
      },
      emergency: {
        alertRadiusKm: 25,
        emergencyContact: {
          name: "Dr. Ananya",
          phone: "9876543210",
          relationship: "Physician",
        },
      },
      security: {
        twoFactorAuth: true,
      },
    };

    const res = await request(app)
      .put("/api/users/settings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.donor.pauseDonorRequests).toBe(true);
    // Critical alert must remain locked true
    expect(res.body.data.notifications.emergencyAlerts).toBe(true);
    expect(res.body.data.notifications.nearbyRequests).toBe(false);
    expect(res.body.data.notifications.smsNotifications).toBe(true);
    expect(res.body.data.privacy.locationSharing).toBe(false);
    expect(res.body.data.privacy.profileVisibility).toBe("hidden");
    expect(res.body.data.emergency.alertRadiusKm).toBe(25);
    expect(res.body.data.emergency.emergencyContact.name).toBe("Dr. Ananya");
    expect(res.body.data.security.twoFactorAuth).toBe(true);
  });

  it("3. PUT /api/users/change-password validates current password correctly", async () => {
    // Attempt with incorrect current password
    const failRes = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        currentPassword: "WrongPassword123!",
        newPassword: "BrandNewPassword2026!",
      });

    expect(failRes.status).toBe(400);
    expect(failRes.body.success).toBe(false);
    expect(failRes.body.message).toMatch(/incorrect current password/i);

    // Attempt with valid current password
    const successRes = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        currentPassword: "InitialPassword123!",
        newPassword: "BrandNewPassword2026!",
      });

    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
    expect(successRes.body.message).toMatch(/password updated successfully/i);

    // Verify user can login with new password
    const updatedUser = await User.findById(testUserId);
    expect(updatedUser).toBeDefined();
    const canLoginWithNew = await updatedUser!.comparePassword("BrandNewPassword2026!");
    expect(canLoginWithNew).toBe(true);
  });

  it("4. GET /api/users/export-data returns comprehensive account data payload", async () => {
    const res = await request(app)
      .get("/api/users/export-data")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.bloodlinkVersion).toBe("1.0.0");
    expect(res.body.data.account.email).toBe("settings_test@example.com");
    expect(res.body.data.settings).toBeDefined();
    expect(res.body.data.donorStatistics).toBeDefined();
    expect(Array.isArray(res.body.data.createdEmergencyRequests)).toBe(true);
  });

  it("5. Protected settings endpoints reject unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/users/settings");
    expect(res.status).toBe(401);
  });
});
