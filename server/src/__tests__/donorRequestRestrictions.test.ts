import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import DonorCertificate from "../models/DonorCertificate.js";
import Notification from "../models/Notification.js";

describe("BloodLink — Donor Request Restrictions Test Suite (Task 6)", () => {
  let requesterToken: string;
  let requesterId: string;
  let activeRequestId: string;

  let donorNoCertToken: string;
  let donorNoCertId: string;

  let donorPendingToken: string;
  let donorPendingId: string;

  let donorNeedsClarifToken: string;
  let donorNeedsClarifId: string;

  let donorRejectedToken: string;
  let donorRejectedId: string;

  let donorExpiredToken: string;
  let donorExpiredId: string;

  let donorRevokedToken: string;
  let donorRevokedId: string;

  let donorApprovedToken: string;
  let donorApprovedId: string;

  const validCertificateFile = {
    filename: "medical_cert_sample.pdf",
    originalName: "medical_cert_sample.pdf",
    mimeType: "application/pdf",
    size: 2048,
    path: "test/medical_cert_sample.pdf",
  };

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI!);

    // Clear test records
    await EmergencyRequest.deleteMany({});
    await DonorCertificate.deleteMany({});
    await Notification.deleteMany({});
    await User.deleteMany({ email: /.*@task6-test\.bloodlink\.dev/ });

    let phoneSeq = 9876500000;
    // Helper to register and login a donor
    const createDonor = async (prefix: string, bloodGroup = "O+") => {
      phoneSeq += 1;
      const phone = phoneSeq.toString();
      const email = `${prefix}@task6-test.bloodlink.dev`;
      await request(app).post("/api/auth/register").send({
        name: `Donor ${prefix}`,
        email,
        password: "TestPassword@123",
        phone,
        role: "user",
        bloodGroup,
        location: { state: "Karnataka", district: "Mysore" },
      });

      const loginRes = await request(app).post("/api/auth/login").send({
        email,
        password: "TestPassword@123",
        role: "USER",
      });

      return {
        token: loginRes.body?.data?.token,
        id: loginRes.body?.data?.user?._id,
      };
    };

    // 1. Requester
    const reqAcc = await createDonor("requester", "O+");
    requesterToken = reqAcc.token;
    requesterId = reqAcc.id;

    // 2. Donor without certificate
    const noCert = await createDonor("nocert");
    donorNoCertToken = noCert.token;
    donorNoCertId = noCert.id;

    // 3. Donor with PENDING certificate
    const pendingDonor = await createDonor("pending");
    donorPendingToken = pendingDonor.token;
    donorPendingId = pendingDonor.id;
    await DonorCertificate.create({
      userId: donorPendingId,
      issuingHospital: "Apollo BGS Mysore",
      issueDate: new Date("2026-01-01"),
      status: "PENDING",
      file: validCertificateFile,
      submittedAt: new Date(),
    });

    // 4. Donor with NEEDS_INFORMATION / NEEDS_CLARIFICATION
    const clarifDonor = await createDonor("needsclarif");
    donorNeedsClarifToken = clarifDonor.token;
    donorNeedsClarifId = clarifDonor.id;
    await DonorCertificate.create({
      userId: donorNeedsClarifId,
      issuingHospital: "Columbia Asia Mysore",
      issueDate: new Date("2026-01-01"),
      status: "NEEDS_INFORMATION",
      feedbackMessage: "Please re-upload a clearer scan of institutional seal.",
      file: validCertificateFile,
      submittedAt: new Date(),
    });

    // 5. Donor with REJECTED certificate
    const rejectedDonor = await createDonor("rejected");
    donorRejectedToken = rejectedDonor.token;
    donorRejectedId = rejectedDonor.id;
    await DonorCertificate.create({
      userId: donorRejectedId,
      issuingHospital: "Unknown Clinic",
      issueDate: new Date("2026-01-01"),
      status: "REJECTED",
      rejectionReason: "Unverifiable issuer and missing registration seal.",
      file: validCertificateFile,
      submittedAt: new Date(),
    });

    // 6. Donor with EXPIRED certificate
    const expiredDonor = await createDonor("expired");
    donorExpiredToken = expiredDonor.token;
    donorExpiredId = expiredDonor.id;
    await DonorCertificate.create({
      userId: donorExpiredId,
      issuingHospital: "Apollo BGS Mysore",
      issueDate: new Date("2020-01-01"),
      expiryDate: new Date("2021-01-01"), // In past
      status: "APPROVED", // Even if approved, past expiry makes it expired
      file: validCertificateFile,
      submittedAt: new Date("2020-01-01"),
    });

    // 7. Donor with REVOKED certificate
    const revokedDonor = await createDonor("revoked");
    donorRevokedToken = revokedDonor.token;
    donorRevokedId = revokedDonor.id;
    await DonorCertificate.create({
      userId: donorRevokedId,
      issuingHospital: "Apollo BGS Mysore",
      issueDate: new Date("2026-01-01"),
      status: "REVOKED",
      file: validCertificateFile,
      submittedAt: new Date(),
    });

    // 8. Donor with APPROVED certificate
    const approvedDonor = await createDonor("approved");
    donorApprovedToken = approvedDonor.token;
    donorApprovedId = approvedDonor.id;
    await DonorCertificate.create({
      userId: donorApprovedId,
      issuingHospital: "Apollo BGS Mysore",
      issueDate: new Date("2026-01-01"),
      status: "APPROVED",
      file: validCertificateFile,
      submittedAt: new Date(),
    });
  });

  afterAll(async () => {
    await EmergencyRequest.deleteMany({});
    await DonorCertificate.deleteMany({});
    await Notification.deleteMany({});
    await User.deleteMany({ email: /.*@task6-test\.bloodlink\.dev/ });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await EmergencyRequest.deleteMany({});
    // Create an active O+ request from requester
    const createRes = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        bloodGroup: "O+",
        hospitalName: "Apollo BGS Hospital Mysore",
        state: "Karnataka",
        district: "Mysore",
        address: "Kuvempunagar",
        contactNumber: "9876543210",
        unitsRequired: 2,
      });
    activeRequestId = createRes.body.data._id;
  });

  describe("1. Certificate Eligibility API (`GET /api/certificates/eligibility`)", () => {
    it("reports NOT_SUBMITTED with guidance for user without certificate", async () => {
      const res = await request(app)
        .get("/api/certificates/eligibility")
        .set("Authorization", `Bearer ${donorNoCertToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isEligible).toBe(false);
      expect(res.body.data.status).toBe("NOT_SUBMITTED");
      expect(res.body.data.reason).toMatch(/verified medical certificate is required/i);
    });

    it("reports PENDING with review progress message", async () => {
      const res = await request(app)
        .get("/api/certificates/eligibility")
        .set("Authorization", `Bearer ${donorPendingToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isEligible).toBe(false);
      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.reason).toMatch(/pending demo verification/i);
    });

    it("reports NEEDS_CLARIFICATION with reviewer feedback", async () => {
      const res = await request(app)
        .get("/api/certificates/eligibility")
        .set("Authorization", `Bearer ${donorNeedsClarifToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isEligible).toBe(false);
      expect(res.body.data.status).toBe("NEEDS_CLARIFICATION");
      expect(res.body.data.reason).toMatch(/clearer scan of institutional seal/i);
    });

    it("reports REJECTED with rejection reason", async () => {
      const res = await request(app)
        .get("/api/certificates/eligibility")
        .set("Authorization", `Bearer ${donorRejectedToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isEligible).toBe(false);
      expect(res.body.data.status).toBe("REJECTED");
      expect(res.body.data.reason).toMatch(/Unverifiable issuer/i);
    });

    it("reports EXPIRED when certificate expiry date has elapsed", async () => {
      const res = await request(app)
        .get("/api/certificates/eligibility")
        .set("Authorization", `Bearer ${donorExpiredToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isEligible).toBe(false);
      expect(res.body.data.status).toBe("EXPIRED");
      expect(res.body.data.reason).toMatch(/has expired/i);
    });

    it("reports REVOKED when certificate status is revoked", async () => {
      const res = await request(app)
        .get("/api/certificates/eligibility")
        .set("Authorization", `Bearer ${donorRevokedToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isEligible).toBe(false);
      expect(res.body.data.status).toBe("REVOKED");
      expect(res.body.data.reason).toMatch(/has been revoked/i);
    });

    it("reports APPROVED and isEligible = true for verified certificate", async () => {
      const res = await request(app)
        .get("/api/certificates/eligibility")
        .set("Authorization", `Bearer ${donorApprovedToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isEligible).toBe(true);
      expect(res.body.data.status).toBe("APPROVED");
      expect(res.body.data.reason).toMatch(/Eligible to accept/i);
    });
  });

  describe("2. Backend Restriction Enforcement on `PUT /api/emergency/:id/accept`", () => {
    it("rejects acceptance (403) when user has NOT_SUBMITTED certificate status", async () => {
      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorNoCertToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("CERTIFICATE_VERIFICATION_REQUIRED");
      expect(res.body.certificateStatus).toBe("NOT_SUBMITTED");
      expect(res.body.message).toMatch(/verified medical certificate is required/i);

      // Verify donor was NOT added to acceptedBy
      const inDb = await EmergencyRequest.findById(activeRequestId);
      expect(inDb?.acceptedBy).not.toContainEqual(new mongoose.Types.ObjectId(donorNoCertId));
    });

    it("rejects acceptance (403) when user has PENDING certificate status", async () => {
      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorPendingToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CERTIFICATE_VERIFICATION_REQUIRED");
      expect(res.body.certificateStatus).toBe("PENDING");
      expect(res.body.message).toMatch(/pending demo verification/i);
    });

    it("rejects acceptance (403) when user has NEEDS_CLARIFICATION certificate status", async () => {
      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorNeedsClarifToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CERTIFICATE_VERIFICATION_REQUIRED");
      expect(res.body.certificateStatus).toBe("NEEDS_CLARIFICATION");
      expect(res.body.message).toMatch(/requires clarification/i);
    });

    it("rejects acceptance (403) when user has REJECTED certificate status", async () => {
      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorRejectedToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CERTIFICATE_VERIFICATION_REQUIRED");
      expect(res.body.certificateStatus).toBe("REJECTED");
      expect(res.body.message).toMatch(/was rejected during demo verification/i);
    });

    it("rejects acceptance (403) when user has EXPIRED certificate status", async () => {
      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorExpiredToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CERTIFICATE_VERIFICATION_REQUIRED");
      expect(res.body.certificateStatus).toBe("EXPIRED");
      expect(res.body.message).toMatch(/has expired/i);
    });

    it("rejects acceptance (403) when user has REVOKED certificate status", async () => {
      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorRevokedToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CERTIFICATE_VERIFICATION_REQUIRED");
      expect(res.body.certificateStatus).toBe("REVOKED");
      expect(res.body.message).toMatch(/has been revoked/i);
    });

    it("allows acceptance (200) when user has APPROVED certificate status", async () => {
      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorApprovedToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Request accepted successfully");

      // Verify donor is in acceptedBy
      const inDb = await EmergencyRequest.findById(activeRequestId);
      expect(inDb?.acceptedBy?.map((id) => id.toString())).toContain(donorApprovedId);
    });
  });

  describe("3. Security & Anti-Bypass Protections", () => {
    it("cannot bypass certificate check by injecting client payload flags", async () => {
      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorNoCertToken}`)
        .send({
          isEligible: true,
          status: "APPROVED",
          certificateStatus: "APPROVED",
          bypassVerification: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CERTIFICATE_VERIFICATION_REQUIRED");
    });

    it("cannot bypass certificate check by passing another approved donor's user ID", async () => {
      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorNoCertToken}`)
        .send({
          userId: donorApprovedId,
          _id: donorApprovedId,
          donorId: donorApprovedId,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CERTIFICATE_VERIFICATION_REQUIRED");

      const inDb = await EmergencyRequest.findById(activeRequestId);
      expect(inDb?.acceptedBy?.map((id) => id.toString())).not.toContain(donorApprovedId);
    });

    it("prevents user from accepting their own request", async () => {
      // Seed approved certificate for requester
      await DonorCertificate.create({
        userId: requesterId,
        issuingHospital: "Apollo BGS Mysore",
        issueDate: new Date("2026-01-01"),
        status: "APPROVED",
        file: validCertificateFile,
        submittedAt: new Date(),
      });

      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${requesterToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/cannot accept your own request/i);
    });

    it("prevents duplicate acceptance by the same approved donor (409)", async () => {
      // First acceptance
      await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorApprovedToken}`)
        .send();

      // Second acceptance
      const secondRes = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorApprovedToken}`)
        .send();

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.message).toMatch(/already accepted/i);
    });

    it("prevents acceptance on cancelled or completed requests (409)", async () => {
      // Cancel request
      await request(app)
        .delete(`/api/emergency/${activeRequestId}`)
        .set("Authorization", `Bearer ${requesterToken}`);

      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorApprovedToken}`)
        .send();

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/no longer be accepted/i);
    });

    it("prevents acceptance on expired requests (409)", async () => {
      // Expire request manually
      await EmergencyRequest.findByIdAndUpdate(activeRequestId, {
        status: "Expired",
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .put(`/api/emergency/${activeRequestId}/accept`)
        .set("Authorization", `Bearer ${donorApprovedToken}`)
        .send();

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/has expired/i);
    });
  });

  describe("4. Donor Response Status Metadata (`GET /api/emergency/:id/donor-status`)", () => {
    it("returns certificateEligibility metadata alongside donor response status", async () => {
      const res = await request(app)
        .get(`/api/emergency/${activeRequestId}/donor-status`)
        .set("Authorization", `Bearer ${donorNoCertToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.certificateEligibility).toBeDefined();
      expect(res.body.data.certificateEligibility.isEligible).toBe(false);
      expect(res.body.data.certificateEligibility.status).toBe("NOT_SUBMITTED");
    });
  });
});
