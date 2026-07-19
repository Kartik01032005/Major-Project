import { Document, Types } from "mongoose";

export interface IBloodInventory extends Document {
  bloodBankId: Types.ObjectId;
  bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  units: number;
  createdAt: Date;
  updatedAt: Date;
}
