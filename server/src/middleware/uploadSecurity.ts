import { Request, Response, NextFunction } from "express";
import path from "node:path";

const signatures: Record<string, Buffer[]> = {
  pdf: [Buffer.from("%PDF-")],
  xls: [Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])],
  xlsx: [Buffer.from("PK")],
  csv: [],
};

export function validateUploadedInventoryFile(req: Request, res: Response, next: NextFunction): void {
  const file = req.file;
  if (!file) {
    next();
    return;
  }

  const extension = path.extname(file.originalname).slice(1).toLowerCase();
  if (!["xlsx", "xls", "csv", "pdf"].includes(extension)) {
    res.status(400).json({ success: false, message: "Unsupported inventory file type." });
    return;
  }

  const safeName = path.basename(file.originalname);
  if (safeName !== file.originalname || !/^[\w .()-]+$/.test(safeName)) {
    res.status(400).json({ success: false, message: "Inventory file name contains unsafe characters." });
    return;
  }

  const expectedSignatures = signatures[extension];
  if (expectedSignatures.length > 0 && !expectedSignatures.some((signature) => file.buffer.subarray(0, signature.length).equals(signature))) {
    res.status(400).json({ success: false, message: "Inventory file content does not match its extension." });
    return;
  }

  next();
}

export function handleUploadError(error: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (error instanceof Error && error.name === "MulterError") {
    res.status(400).json({ success: false, message: error.message });
    return;
  }
  if (error instanceof Error && error.message.startsWith("Invalid file type")) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }
  next(error);
}
