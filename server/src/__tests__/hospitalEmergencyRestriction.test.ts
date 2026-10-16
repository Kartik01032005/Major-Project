import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import Notification from "../models/Notification.js";

const hospitalData = {
  name: "Apex Hospital Demo",
  email: "apex.hospital.restriction@bloodlink.dev",
  password: "Password@123",
  phone: "9100000088",
  role: "HOSPITAL",
  organizationName: "Apex Hospital Demo Org",
  location: { state: "Karnataka", district: "Mysore" },
};

const regularUserData = {
  name: "Citizen Requester",
  email: "citizen.requester.restriction@bloodlink.dev",
  password: "Password@123",
  phone: "9100000089",
  role: "USER",
  location: { state: "Karnataka", district: "Mysore" },
};

const emergencyPayload = {
  bloodGroup: "B+",
  hospital: "Apex Hospital Demo",
  state: "Karnataka",
  district: "Mysore",
  address: "Ring Road, Mysore",
  contactNumber: "9100000089",
  latitude: 12.31,
  longitude: 76.65,
};

let hospitalToken: string;
let userToken: string;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  // Clean any residual test users
  await User.deleteMany({ email: { $in: [hospitalData.email, regularUserData.email] } });

  // Register and login hospital account
  const hospReg = await request(app).post("/api/auth/register").send(hospitalData);
  expect(hospReg.status).toBe(201);

  const hospitalLogin = await request(app).post("/api/auth/login").send({
    email: hospitalData.email,
    password: hospitalData.password,
    role: "HOSPITAL",
  });
  expect(hospitalLogin.status).toBe(200);
  hospitalToken = hospitalLogin.body.data.token;

  // Register and login regular user account
  const userReg = await request(app).post("/api/auth/register").send(regularUserData);
  expect(userReg.status).toBe(201);

  const userLogin = await request(app).post("/api/auth/login").send({
    email: regularUserData.email,
    password: regularUserData.password,
    role: "USER",
  });
  expect(userLogin.status).toBe(200);
  userToken = userLogin.body.data.token;
});

afterAll(async () => {
  await EmergencyRequest.deleteMany({});
  await Notification.deleteMany({});
  await User.deleteMany({ email: { $in: [hospitalData.email, regularUserData.email] } });
  await mongoose.connection.close();
});

describe("Hospital Emergency Request Restrictions", () => {
  afterEach(async () => {
    await EmergencyRequest.deleteMany({});
    await Notification.deleteMany({});
  });

  it("enforces 403 Forbidden when a hospital account attempts to create an emergency request", async () => {
    const res = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${hospitalToken}`)
      .send(emergencyPayload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/hospital accounts are not permitted to create donor emergency requests/i);

    // Confirm no emergency request was created in database
    const count = await EmergencyRequest.countDocuments();
    expect(count).toBe(0);
  });

  it("permits regular user accounts to create emergency requests", async () => {
    const res = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${userToken}`)
      .send(emergencyPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bloodGroup).toBe("B+");
    expect(res.body.data.status).toBe("Pending");
  });

  it("allows hospital accounts to view active emergency requests", async () => {
    // Create a request as regular user
    const createRes = await request(app)
      .post("/api/emergency")
      .set("Authorization", `Bearer ${userToken}`)
      .send(emergencyPayload);

    expect(createRes.status).toBe(201);

    // Hospital can query requests for awareness/management
    const listRes = await request(app)
      .get("/api/emergency")
      .set("Authorization", `Bearer ${hospitalToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
