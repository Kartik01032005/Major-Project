import { Schema, model } from "mongoose";
import { IBloodInventory } from "../types/bloodInventory.js";

const BloodInventorySchema = new Schema<IBloodInventory>(
  {
    bloodBankId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    units: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Each blood bank has exactly one record per blood group
BloodInventorySchema.index({ bloodBankId: 1, bloodGroup: 1 }, { unique: true });

export const BloodInventory = model<IBloodInventory>("BloodInventory", BloodInventorySchema);
export default BloodInventory;
