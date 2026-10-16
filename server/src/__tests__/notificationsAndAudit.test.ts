import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import DonorCertificate from "../models/DonorCertificate.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import { clearNotificationQueue } from "../services/notificationQueue.js";

let mongoServer: MongoMemoryServer;

function generateToken(user: any): string {
  return jwt.sign(
    {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "bloodlink-test-jwt-secret-very-secure",
    { expiresIn: "1h" }
  );
}

let phoneSeq = 8000000000;

describe("BloodLink — Notifications and Audit Logging Test Suite (Task 7)", () => {
  let donorUser: any;
  let donorToken: string;

  let otherDonorUser: any;
  let otherDonorToken: string;

  let hospitalUser: any;
  let hospitalToken: string;

  let bloodBankUser: any;
  let bloodBankToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "bloodlink-test-jwt-secret-very-secure";

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    await DonorCertificate.deleteMany({});
    await EmergencyRequest.deleteMany({});
    clearNotificationQueue();

    // Create Donor
    donorUser = await User.create({
      name: "Rohan Verma",
      email: "rohan@test.com",
      password: "Password123!",
      role: "USER",
      bloodGroup: "O+",
      phone: String(phoneSeq++),
      isAvailableDonor: true,
      location: { district: "Mysore", state: "Karnataka" },
    });
    donorToken = generateToken(donorUser);

    // Create Second Donor
    otherDonorUser = await User.create({
      name: "Pooja Hegde",
      email: "pooja@test.com",
      password: "Password123!",
      role: "USER",
      bloodGroup: "O+",
      phone: String(phoneSeq++),
      isAvailableDonor: true,
      location: { district: "Mysore", state: "Karnataka" },
    });
    otherDonorToken = generateToken(otherDonorUser);

    // Create Registered Hospital
    hospitalUser = await User.create({
      name: "Apollo BGS Mysore Staff",
      organizationName: "Apollo BGS Mysore",
      email: "hospital@apollo.com",
      password: "Password123!",
      role: "HOSPITAL",
      phone: String(phoneSeq++),
      location: { district: "Mysore", state: "Karnataka" },
    });
    hospitalToken = generateToken(hospitalUser);

    // Create Registered Blood Bank
    bloodBankUser = await User.create({
      name: "Mysore City Blood Bank Admin",
      organizationName: "Mysore City Blood Bank",
      email: "bloodbank@mysore.org",
      password: "Password123!",
      role: "BLOOD_BANK",
      phone: String(phoneSeq++),
      location: { district: "Mysore", state: "Karnataka" },
    });
    bloodBankToken = generateToken(bloodBankUser);
  });

  describe("1. Certificate Submission Notifications & Audit Logs", () => {
    it("notifies donor and assigned hospital on submission, and records audit trail", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donorToken}`)
        .field("issuingHospital", "Apollo BGS Mysore")
        .field("issuingHospitalId", hospitalUser._id.toString())
        .field("issueDate", new Date().toISOString())
        .attach(
          "certificate",
          Buffer.from("%PDF-1.4 demo test file content"),
          "medical_cert.pdf"
        );

      expect(res.status).toBe(201);
      const certId = res.body.data.id;

      // 1. Verify Donor received submission notification
      const donorNotifs = await Notification.find({ receiverId: donorUser._id });
      expect(donorNotifs.length).toBeGreaterThanOrEqual(1);
      const donorSubNotif = donorNotifs.find((n) =>
        n.title.includes("Medical Certificate Submitted")
      );
      expect(donorSubNotif).toBeDefined();
      expect(donorSubNotif?.type).toBe("System");
      expect(donorSubNotif?.link).toBe("/dashboard#donor-certificate");
      expect(donorSubNotif?.isRead).toBe(false);

      // 2. Verify Assigned Hospital received review assignment notification
      const hospNotifs = await Notification.find({ receiverId: hospitalUser._id });
      expect(hospNotifs.length).toBeGreaterThanOrEqual(1);
      const hospNotif = hospNotifs.find((n) =>
        n.title.includes("New Certificate Verification Assigned")
      );
      expect(hospNotif).toBeDefined();
      expect(hospNotif?.link).toBe("/dashboard/hospital");

      // 3. Verify Server-Side Audit Log was created
      const auditEntry = await AuditLog.findOne({
        entityId: certId,
        action: "CERTIFICATE_SUBMITTED",
      });
      expect(auditEntry).toBeDefined();
      expect(auditEntry?.performedBy.toString()).toBe(donorUser._id.toString());
      expect(auditEntry?.previousStatus).toBe("NOT_SUBMITTED");
      expect(auditEntry?.newStatus).toBe("PENDING");
      expect(auditEntry?.metadata?.issuingHospital).toBe("Apollo BGS Mysore");
      // Sensitive files or passwords must NOT be in audit log
      expect(auditEntry?.metadata?.file).toBeUndefined();
    });

    it("notifies assigned blood bank when external unregistered hospital is submitted", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donorToken}`)
        .field("issuingHospital", "Rural Clinic Hunsur")
        .field("hospitalDistrict", "Mysore")
        .field("hospitalState", "Karnataka")
        .field("issueDate", new Date().toISOString())
        .attach(
          "certificate",
          Buffer.from("%PDF-1.4 demo test file content"),
          "rural_cert.pdf"
        );

      expect(res.status).toBe(201);

      // Verify assigned Blood Bank received external verification notification
      const bbNotifs = await Notification.find({ receiverId: bloodBankUser._id });
      const bbNotif = bbNotifs.find((n) =>
        n.title.includes("New External Certificate Verification Assigned")
      );
      expect(bbNotif).toBeDefined();
      expect(bbNotif?.link).toBe("/dashboard/admin#verification-queue");
      expect(bbNotif?.message).toContain("Rural Clinic Hunsur");
    });
  });

  describe("2. Review Decision Notifications & Audit Logging", () => {
    it("records audit entry and sends Approval notification to donor on approval", async () => {
      // Create pending certificate for donor
      const cert = await DonorCertificate.create({
        userId: donorUser._id,
        issuingHospital: "Apollo BGS Mysore",
        issuingHospitalId: hospitalUser._id,
        status: "PENDING",
        verificationMethod: "HOSPITAL_DIRECT",
        issueDate: new Date(),
        file: {
          filename: "test.pdf",
          originalName: "test.pdf",
          mimeType: "application/pdf",
          size: 1024,
          path: "/tmp/test.pdf",
        },
      });

      const res = await request(app)
        .put(`/api/certificates/${cert._id}/review`)
        .set("Authorization", `Bearer ${hospitalToken}`)
        .send({
          action: "APPROVE",
          contactNotes: "Hospital record verified against serial #9901",
        });

      expect(res.status).toBe(200);

      // Verify donor received notification
      const donorNotifs = await Notification.find({
        receiverId: donorUser._id,
        type: "Approval",
      });
      expect(donorNotifs.length).toBe(1);
      expect(donorNotifs[0].title).toBe("Medical Certificate Verified");
      expect(donorNotifs[0].link).toBe("/dashboard#donor-certificate");

      // Verify audit log entry
      const audit = await AuditLog.findOne({
        entityId: cert._id,
        action: "CERTIFICATE_APPROVED",
      });
      expect(audit).toBeDefined();
      expect(audit?.performedBy.toString()).toBe(hospitalUser._id.toString());
      expect(audit?.performerRole).toBe("HOSPITAL");
      expect(audit?.previousStatus).toBe("PENDING");
      expect(audit?.newStatus).toBe("APPROVED");
      expect(audit?.metadata?.reviewerInstitution).toBe("Apollo BGS Mysore");
    });

    it("records audit entry and sends Rejection notification to donor on rejection", async () => {
      const cert = await DonorCertificate.create({
        userId: donorUser._id,
        issuingHospital: "Apollo BGS Mysore",
        issuingHospitalId: hospitalUser._id,
        status: "PENDING",
        verificationMethod: "HOSPITAL_DIRECT",
        issueDate: new Date(),
        file: {
          filename: "test.pdf",
          originalName: "test.pdf",
          mimeType: "application/pdf",
          size: 1024,
          path: "/tmp/test.pdf",
        },
      });

      const res = await request(app)
        .put(`/api/certificates/${cert._id}/review`)
        .set("Authorization", `Bearer ${hospitalToken}`)
        .send({
          action: "REJECT",
          reason: "Document lacks doctor signature and seal",
        });

      expect(res.status).toBe(200);

      // Verify donor notification
      const donorNotif = await Notification.findOne({
        receiverId: donorUser._id,
        type: "Rejection",
      });
      expect(donorNotif).toBeDefined();
      expect(donorNotif?.message).toContain("Document lacks doctor signature and seal");

      // Verify audit log entry
      const audit = await AuditLog.findOne({
        entityId: cert._id,
        action: "CERTIFICATE_REJECTED",
      });
      expect(audit).toBeDefined();
      expect(audit?.reason).toBe("Document lacks doctor signature and seal");
    });
  });

  describe("3. Contact Attempt Audit Logging", () => {
    it("records contact attempt in audit trail with outcome and notes", async () => {
      const cert = await DonorCertificate.create({
        userId: donorUser._id,
        issuingHospital: "City General Hospital",
        isUnregisteredHospital: true,
        assignedBloodBankId: bloodBankUser._id,
        assignedBloodBank: "Mysore City Blood Bank",
        status: "PENDING",
        verificationMethod: "BLOOD_BANK_EXTERNAL",
        issueDate: new Date(),
        file: {
          filename: "test.pdf",
          originalName: "test.pdf",
          mimeType: "application/pdf",
          size: 1024,
          path: "/tmp/test.pdf",
        },
      });

      const res = await request(app)
        .post(`/api/certificates/${cert._id}/contact-attempt`)
        .set("Authorization", `Bearer ${bloodBankToken}`)
        .send({
          contactMethod: "Phone Call",
          notes: "Spoke with medical records registry desk",
          outcome: "Verified",
        });

      expect(res.status).toBe(200);

      // Check centralized audit log
      const audit = await AuditLog.findOne({
        entityId: cert._id,
        action: "CONTACT_ATTEMPT_LOGGED",
      });
      expect(audit).toBeDefined();
      expect(audit?.performerRole).toBe("BLOOD_BANK");
      expect(audit?.notes).toContain("Spoke with medical records registry desk");
      expect(audit?.metadata?.outcome).toBe("Verified");
    });
  });

  describe("4. Emergency Request Transitions & Notifications", () => {
    it("notifies matching donors and admins on emergency request creation with audit log", async () => {
      const res = await request(app)
        .post("/api/emergency")
        .set("Authorization", `Bearer ${donorToken}`)
        .send({
          bloodGroup: "O+",
          state: "Karnataka",
          district: "Mysore",
          hospitalName: "Apollo BGS Mysore",
          address: "Kuvempunagar",
          contactNumber: "9876543210",
          unitsRequired: 2,
        });

      expect(res.status).toBe(201);
      const reqId = res.body.data._id;

      // Other donor (O+, available, in Mysore) should receive alert
      const otherNotif = await Notification.findOne({
        receiverId: otherDonorUser._id,
        type: "Emergency",
      });
      expect(otherNotif).toBeDefined();
      expect(otherNotif?.link).toBe("/dashboard/requests");

      // Blood bank / Admin receives notification
      const adminNotif = await Notification.findOne({
        receiverId: bloodBankUser._id,
        type: "Emergency",
      });
      expect(adminNotif).toBeDefined();
      expect(adminNotif?.link).toBe("/dashboard/admin/requests");

      // Creator does not notify self
      const selfNotif = await Notification.findOne({
        receiverId: donorUser._id,
        type: "Emergency",
      });
      expect(selfNotif).toBeNull();

      // Audit log created
      const audit = await AuditLog.findOne({
        entityId: reqId,
        action: "REQUEST_CREATED",
      });
      expect(audit).toBeDefined();
      expect(audit?.metadata?.bloodGroup).toBe("O+");
    });

    it("notifies requester and accepting donor on acceptance with audit entry", async () => {
      // 1. Give otherDonorUser an approved certificate to pass eligibility
      await DonorCertificate.create({
        userId: otherDonorUser._id,
        issuingHospital: "Apollo BGS Mysore",
        status: "APPROVED",
        verificationMethod: "HOSPITAL_DIRECT",
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        file: {
          filename: "test.pdf",
          originalName: "test.pdf",
          mimeType: "application/pdf",
          size: 1024,
          path: "/tmp/test.pdf",
        },
      });

      // 2. Create request by donorUser
      const emergencyReq = await EmergencyRequest.create({
        requestBy: donorUser._id,
        bloodGroup: "O+",
        hospital: "Apollo BGS Mysore",
        district: "Mysore",
        state: "Karnataka",
        address: "Kuvempunagar",
        contactNumber: "9876543210",
        unitsRequired: 1,
        status: "Approved",
        expiresAt: new Date(Date.now() + 3600000),
      });

      // 3. otherDonorUser accepts request
      const res = await request(app)
        .put(`/api/emergency/${emergencyReq._id}/accept`)
        .set("Authorization", `Bearer ${otherDonorToken}`);

      expect(res.status).toBe(200);

      // Requester notified: "A donor can help"
      const reqNotif = await Notification.findOne({
        receiverId: donorUser._id,
        title: "A donor can help",
      });
      expect(reqNotif).toBeDefined();
      expect(reqNotif?.link).toBe("/dashboard/requests");

      // Accepting donor notified: "Request Acceptance Confirmed"
      const donorConfNotif = await Notification.findOne({
        receiverId: otherDonorUser._id,
        title: "Request Acceptance Confirmed",
      });
      expect(donorConfNotif).toBeDefined();
      expect(donorConfNotif?.link).toBe("/dashboard/requests");

      // Audit log created
      const audit = await AuditLog.findOne({
        entityId: emergencyReq._id,
        action: "REQUEST_ACCEPTED",
      });
      expect(audit).toBeDefined();
      expect(audit?.performedBy.toString()).toBe(otherDonorUser._id.toString());
    });
  });

  describe("5. Notification Security, Read/Unread & API Permissions", () => {
    it("returns only notifications belonging to authenticated user", async () => {
      // Create 2 notifications for donor, 1 for other donor
      await Notification.create({
        receiverId: donorUser._id,
        title: "Donor Alert 1",
        message: "Message 1",
        type: "System",
      });
      await Notification.create({
        receiverId: donorUser._id,
        title: "Donor Alert 2",
        message: "Message 2",
        type: "System",
      });
      await Notification.create({
        receiverId: otherDonorUser._id,
        title: "Other Alert",
        message: "Message 3",
        type: "System",
      });

      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${donorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.unreadCount).toBe(2);
      expect(res.body.data.every((n: any) => n.receiverId === donorUser._id.toString())).toBe(true);
    });

    it("prevents user from reading another account's notification (403)", async () => {
      const otherNotif = await Notification.create({
        receiverId: otherDonorUser._id,
        title: "Private Alert",
        message: "Confidential message",
        type: "System",
      });

      const res = await request(app)
        .put(`/api/notifications/read/${otherNotif._id}`)
        .set("Authorization", `Bearer ${donorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Not authorized");
    });

    it("marks single and all notifications as read", async () => {
      const n1 = await Notification.create({
        receiverId: donorUser._id,
        title: "Alert 1",
        message: "Msg 1",
        type: "System",
      });
      const n2 = await Notification.create({
        receiverId: donorUser._id,
        title: "Alert 2",
        message: "Msg 2",
        type: "System",
      });

      // Mark single read
      const res1 = await request(app)
        .put(`/api/notifications/read/${n1._id}`)
        .set("Authorization", `Bearer ${donorToken}`);
      expect(res1.status).toBe(200);
      expect(res1.body.data.isRead).toBe(true);

      // Verify db
      const updatedN1 = await Notification.findById(n1._id);
      expect(updatedN1?.isRead).toBe(true);

      // Mark all read
      const resAll = await request(app)
        .put("/api/notifications/read-all")
        .set("Authorization", `Bearer ${donorToken}`);
      expect(resAll.status).toBe(200);

      const unreadCount = await Notification.countDocuments({
        receiverId: donorUser._id,
        isRead: false,
      });
      expect(unreadCount).toBe(0);
    });

    it("allows owner to delete notification, blocks non-owner (403)", async () => {
      const notif = await Notification.create({
        receiverId: donorUser._id,
        title: "Deletable Alert",
        message: "Msg",
        type: "System",
      });

      // Other donor cannot delete it
      const unauthRes = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set("Authorization", `Bearer ${otherDonorToken}`);
      expect(unauthRes.status).toBe(403);

      // Owner deletes it
      const deleteRes = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set("Authorization", `Bearer ${donorToken}`);
      expect(deleteRes.status).toBe(200);

      const inDb = await Notification.findById(notif._id);
      expect(inDb).toBeNull();
    });
  });

  describe("6. Audit Log API Authorization & Querying", () => {
    it("allows reviewer/admin to query audit logs by entity", async () => {
      const cert = await DonorCertificate.create({
        userId: donorUser._id,
        issuingHospital: "Apollo BGS Mysore",
        status: "PENDING",
        verificationMethod: "HOSPITAL_DIRECT",
        issueDate: new Date(),
        file: {
          filename: "test.pdf",
          originalName: "test.pdf",
          mimeType: "application/pdf",
          size: 1024,
          path: "/tmp/test.pdf",
        },
      });

      await AuditLog.create({
        action: "CERTIFICATE_SUBMITTED",
        entityType: "CERTIFICATE",
        entityId: cert._id,
        performedBy: donorUser._id,
        previousStatus: "NOT_SUBMITTED",
        newStatus: "PENDING",
      });

      const res = await request(app)
        .get(`/api/audit-logs?entityId=${cert._id}`)
        .set("Authorization", `Bearer ${hospitalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].action).toBe("CERTIFICATE_SUBMITTED");
    });

    it("prevents regular user from viewing another account's audit log (403)", async () => {
      const otherCert = await DonorCertificate.create({
        userId: otherDonorUser._id,
        issuingHospital: "Rural Clinic",
        status: "PENDING",
        verificationMethod: "BLOOD_BANK_EXTERNAL",
        issueDate: new Date(),
        file: {
          filename: "test.pdf",
          originalName: "test.pdf",
          mimeType: "application/pdf",
          size: 1024,
          path: "/tmp/test.pdf",
        },
      });

      await AuditLog.create({
        action: "CERTIFICATE_SUBMITTED",
        entityType: "CERTIFICATE",
        entityId: otherCert._id,
        performedBy: otherDonorUser._id,
        previousStatus: "NOT_SUBMITTED",
        newStatus: "PENDING",
      });

      // donorUser attempts to inspect otherDonorUser's certificate audit trail
      const res = await request(app)
        .get(`/api/audit-logs?entityId=${otherCert._id}`)
        .set("Authorization", `Bearer ${donorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Not authorized");
    });
  });
});
