import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /api/health", () => {
  it("should return 200 with success message", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/running/i);
  });
});

describe("GET /api/nonexistent", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nonexistent-route");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
