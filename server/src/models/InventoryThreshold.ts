import { Schema, model } from "mongoose";
import { IInventoryThreshold } from "../types/inventoryUpload.js";

const InventoryThresholdSchema = new Schema<IInventoryThreshold>(
  {
    bloodBankId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    highlyAvailable: { type: Number, required: true, default: 200 },
    veryHigh: { type: Number, required: true, default: 150 },
    high: { type: Number, required: true, default: 100 },
    good: { type: Number, required: true, default: 70 },
    available: { type: Number, required: true, default: 50 },
    moderate: { type: Number, required: true, default: 30 },
    low: { type: Number, required: true, default: 15 },
    veryLow: { type: Number, required: true, default: 10 },
    critical: { type: Number, required: true, default: 5 },
    almostEmpty: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const InventoryThreshold = model<IInventoryThreshold>("InventoryThreshold", InventoryThresholdSchema);
export default InventoryThreshold;
