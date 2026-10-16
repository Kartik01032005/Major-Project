import mongoose from "mongoose";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import app from "../app.js";
import User from "../models/User.js";
import DonorCertificate from "../models/DonorCertificate.js";

const testDonor1 = {
  name: "Donor One",
  email: "donor1.cert@bloodlink.dev",
  password: "Password@123",
  phone: "9100000001",
  role: "USER",
  bloodGroup: "O+",
  location: { state: "Karnataka", district: "Mysore" },
};

const testDonor2 = {
  name: "Donor Two",
  email: "donor2.cert@bloodlink.dev",
  password: "Password@123",
  phone: "9100000002",
  role: "USER",
  bloodGroup: "A+",
  location: { state: "Karnataka", district: "Mysore" },
};

let donor1Token: string;
let donor2Token: string;

// Sample valid file buffers
const validPdfBuffer = Buffer.from("%PDF-1.4\n%Demo Certificate Content for BloodLink Testing\n%%EOF");
const validPngBuffer = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from("PNG_SAMPLE_DATA"),
]);
const validJpgBuffer = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.from("JPG_SAMPLE_DATA"),
]);
const fakePdfBuffer = Buffer.from("NOT_A_REAL_PDF_JUST_PLAIN_TEXT");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  await request(app).post("/api/auth/register").send(testDonor1);
  const login1 = await request(app).post("/api/auth/login").send({
    email: testDonor1.email,
    password: testDonor1.password,
    role: "USER",
  });
  donor1Token = login1.body.data.token;

  await request(app).post("/api/auth/register").send(testDonor2);
  const login2 = await request(app).post("/api/auth/login").send({
    email: testDonor2.email,
    password: testDonor2.password,
    role: "USER",
  });
  donor2Token = login2.body.data.token;
});

afterAll(async () => {
  const certs = await DonorCertificate.find({});
  for (const c of certs) {
    if (c.file?.path && fs.existsSync(c.file.path)) {
      try {
        fs.unlinkSync(c.file.path);
      } catch {}
    }
  }
  await DonorCertificate.deleteMany({});
  await User.deleteMany({ email: { $in: [testDonor1.email, testDonor2.email] } });
  await mongoose.connection.close();
});

describe("Donor Certificate Submission API (Task 2)", () => {
  describe("1. Initial Status & Authentication Boundaries", () => {
    it("returns NOT_SUBMITTED when authenticated donor has not uploaded a certificate", async () => {
      const res = await request(app)
        .get("/api/certificates/my-certificate")
        .set("Authorization", `Bearer ${donor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("NOT_SUBMITTED");
    });

    it("rejects unauthenticated requests to get certificate", async () => {
      const res = await request(app).get("/api/certificates/my-certificate");
      expect(res.status).toBe(401);
    });

    it("rejects unauthenticated requests to submit certificate", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .field("issuingHospital", "Apollo BGS Hospital")
        .field("issueDate", "2026-01-15")
        .attach("certificate", validPdfBuffer, "certificate.pdf");

      expect(res.status).toBe(401);
    });
  });

  describe("2. Request Validation & Date Rules", () => {
    it("rejects submission when issuing hospital is missing", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donor1Token}`)
        .field("issueDate", "2026-01-15")
        .attach("certificate", validPdfBuffer, "cert.pdf");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/hospital.*required/i);
    });

    it("rejects submission when issue date is missing", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donor1Token}`)
        .field("issuingHospital", "Apollo BGS Hospital")
        .attach("certificate", validPdfBuffer, "cert.pdf");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/issue date is required/i);
    });

    it("rejects submission when issue date is in the future", async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donor1Token}`)
        .field("issuingHospital", "Apollo BGS Hospital")
        .field("issueDate", futureDate)
        .attach("certificate", validPdfBuffer, "cert.pdf");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/future/i);
    });

    it("rejects submission when expiry date is earlier than or equal to issue date", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donor1Token}`)
        .field("issuingHospital", "Apollo BGS Hospital")
        .field("issueDate", "2026-01-15")
        .field("expiryDate", "2026-01-10")
        .attach("certificate", validPdfBuffer, "cert.pdf");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/after the issue date/i);
    });

    it("rejects submission without a certificate file attached", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donor1Token}`)
        .field("issuingHospital", "Apollo BGS Hospital")
        .field("issueDate", "2026-01-15");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/select a medical certificate/i);
    });
  });

  describe("3. File Format, Magic Bytes & Size Security", () => {
    it("rejects unsupported file formats such as .txt or .exe", async () => {
      const textBuffer = Buffer.from("Hello text file");
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donor1Token}`)
        .field("issuingHospital", "Apollo BGS Hospital")
        .field("issueDate", "2026-01-15")
        .attach("certificate", textBuffer, "certificate.txt");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid file type/i);
    });

    it("rejects spoofed file with .pdf extension but fake text content", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donor1Token}`)
        .field("issuingHospital", "Apollo BGS Hospital")
        .field("issueDate", "2026-01-15")
        .attach("certificate", fakePdfBuffer, "spoofed.pdf");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/does not match/i);
    });

    it("rejects oversized file (> 5MB)", async () => {
      // 5.5 MB fake buffer
      const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0x25);
      // Put PDF header at front so it doesn't fail magic byte check
      largeBuffer.write("%PDF-1.4");

      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donor1Token}`)
        .field("issuingHospital", "Apollo BGS Hospital")
        .field("issueDate", "2026-01-15")
        .attach("certificate", largeBuffer, "large.pdf");

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/5MB limit/i);
    });
  });

  describe("4. Successful Submission & Workflow State", () => {
    let createdCertId: string;

    it("successfully submits a valid PDF certificate and initializes status to PENDING", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donor1Token}`)
        .field("issuingHospital", "Apollo BGS Hospital Mysore")
        .field("issueDate", "2026-01-15")
        .field("expiryDate", "2027-01-15")
        // Attempt to spoof status to VERIFIED in body
        .field("status", "VERIFIED")
        .attach("certificate", validPdfBuffer, "donor_certificate.pdf");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("PENDING"); // Anti-tampering check: must be PENDING
      expect(res.body.data.issuingHospital).toBe("Apollo BGS Hospital Mysore");
      expect(res.body.data.file.originalName).toBe("donor_certificate.pdf");

      createdCertId = res.body.data.id;
    });

    it("retrieves the active submission via getMyCertificate", async () => {
      const res = await request(app)
        .get("/api/certificates/my-certificate")
        .set("Authorization", `Bearer ${donor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.issuingHospital).toBe("Apollo BGS Hospital Mysore");
      expect(res.body.data.id).toBe(createdCertId);
    });

    it("securely streams the uploaded certificate file via my-certificate/file", async () => {
      const res = await request(app)
        .get("/api/certificates/my-certificate/file")
        .set("Authorization", `Bearer ${donor1Token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      expect(res.headers["content-disposition"]).toMatch(/inline/);
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.body.toString()).toContain("%PDF-1.4");
    });

    it("prevents Donor 2 from accessing Donor 1's certificate file by ID (Cross-User Protection)", async () => {
      const res = await request(app)
        .get(`/api/certificates/${createdCertId}/file`)
        .set("Authorization", `Bearer ${donor2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it("confirms Donor 2's own status is still NOT_SUBMITTED (Isolation)", async () => {
      const res = await request(app)
        .get("/api/certificates/my-certificate")
        .set("Authorization", `Bearer ${donor2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("NOT_SUBMITTED");
    });
  });

  describe("5. Safe Replacement & Resubmission", () => {
    it("allows replacing an existing certificate with a new PNG file, resetting status to PENDING", async () => {
      const res = await request(app)
        .post("/api/certificates")
        .set("Authorization", `Bearer ${donor1Token}`)
        .field("issuingHospital", "Columbia Asia Hospital Mysore")
        .field("issueDate", "2026-02-01")
        .attach("certificate", validPngBuffer, "replacement_cert.png");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.issuingHospital).toBe("Columbia Asia Hospital Mysore");
      expect(res.body.data.file.originalName).toBe("replacement_cert.png");

      // Verify file download now returns the PNG content
      const fileRes = await request(app)
        .get("/api/certificates/my-certificate/file")
        .set("Authorization", `Bearer ${donor1Token}`);

      expect(fileRes.status).toBe(200);
      expect(fileRes.headers["content-type"]).toBe("image/png");
    });
  });
});
