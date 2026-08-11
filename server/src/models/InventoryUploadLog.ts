import { Schema, model } from "mongoose";
import { IInventoryUploadLog } from "../types/inventoryUpload.js";

const UploadErrorSchema = new Schema({
  row: { type: Number },
  donorId: { type: String },
  reason: { type: String, required: true }
}, { _id: false });

const UploadSummarySchema = new Schema({
  totalParsed: { type: Number, required: true, default: 0 },
  validRecords: { type: Number, required: true, default: 0 },
  invalidRecords: { type: Number, required: true, default: 0 },
  unitsAdded: { type: Number, required: true, default: 0 },
  unitsByGroup: { type: Map, of: Number, default: {} },
  errors: [UploadErrorSchema]
}, { _id: false, suppressReservedKeysWarning: true });

const InventoryUploadLogSchema = new Schema<IInventoryUploadLog>(
  {
    bloodBankId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true, enum: ["xlsx", "xls", "csv", "pdf"] },
    fileHash: { type: String, required: true },
    mode: { type: String, required: true, enum: ["merge", "replace"], default: "merge" },
    summary: { type: UploadSummarySchema, required: true }
  },
  { timestamps: true }
);

InventoryUploadLogSchema.index({ bloodBankId: 1, createdAt: -1 });

export const InventoryUploadLog = model<IInventoryUploadLog>("InventoryUploadLog", InventoryUploadLogSchema);
export default InventoryUploadLog;
