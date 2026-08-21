import { Request, Response } from "express";
import { jest } from "@jest/globals";
import { validateUploadedInventoryFile } from "../middleware/uploadSecurity.js";

function responseMock() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
}

function requestWithFile(originalname: string, content: Buffer): Request {
  return {
    file: {
      originalname,
      buffer: content,
    },
  } as unknown as Request;
}

describe("inventory upload security", () => {
  it("rejects unsafe file names", () => {
    const response = responseMock();
    const next = jest.fn();

    validateUploadedInventoryFile(
      requestWithFile("../inventory.csv", Buffer.from("bloodGroup,units")),
      response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: "Inventory file name contains unsafe characters.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects files whose content does not match the extension", () => {
    const response = responseMock();
    const next = jest.fn();

    validateUploadedInventoryFile(
      requestWithFile("inventory.pdf", Buffer.from("not a pdf")),
      response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: "Inventory file content does not match its extension.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows a safe CSV upload", () => {
    const response = responseMock();
    const next = jest.fn();

    validateUploadedInventoryFile(
      requestWithFile("inventory-2026.csv", Buffer.from("bloodGroup,units")),
      response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
  });
});
