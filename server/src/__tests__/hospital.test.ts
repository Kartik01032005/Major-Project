import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import Hospital from "../models/Hospital.js";
import User from "../models/User.js";

const adminData = {
  name: "Hospital Admin",
  email: "hospitaladmin@bloodlink.dev",
  password: "Admin@1234",
  phone: "8888888801",
  role: "admin",
  organizationName: "Hospital Test Blood Bank",
  location: { state: "Karnataka", district: "Mysore" },
};

const userData = {
  name: "Hospital User",
  email: "hospitaluser@bloodlink.dev",
  password: "User@1234",
  phone: "8888888802",
  role: "user",
  location: { state: "Karnataka", district: "Mysore" },
};

const hospitalPayload = {
  name: "City Care Hospital",
  address: "12 MG Road",
  state: "Karnataka",
  district: "Mysore",
  phone: "9999999901",
  latitude: 12.305,
  longitude: 76.655,
};

let adminToken: string;
let userToken: string;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);

  await request(app).post("/api/auth/register").send(adminData);
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: adminData.email,
    password: adminData.password,
  });
  adminToken = adminLogin.body.data.token;

  await request(app).post("/api/auth/register").send(userData);
  const userLogin = await request(app).post("/api/auth/login").send({
    email: userData.email,
    password: userData.password,
  });
  userToken = userLogin.body.data.token;
});

afterAll(async () => {
  await Hospital.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe("Hospital management API", () => {
  it("allows an admin to create, list, update, and delete a hospital", async () => {
    const createResponse = await request(app)
      .post("/api/hospitals")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(hospitalPayload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.name).toBe(hospitalPayload.name);

    const hospitalId = createResponse.body.data._id;
    const listResponse = await request(app)
      .get("/api/hospitals")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const updateResponse = await request(app)
      .put(`/api/hospitals/${hospitalId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...hospitalPayload, name: "Updated Care Hospital" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.name).toBe("Updated Care Hospital");

    const deleteResponse = await request(app)
      .delete(`/api/hospitals/${hospitalId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data._id).toBe(hospitalId);
  });

  it("denies hospital management to regular users", async () => {
    const response = await request(app)
      .post("/api/hospitals")
      .set("Authorization", `Bearer ${userToken}`)
      .send(hospitalPayload);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("rejects hospitals with missing required fields", async () => {
    const response = await request(app)
      .post("/api/hospitals")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: hospitalPayload.name });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
