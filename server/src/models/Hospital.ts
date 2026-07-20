import { Schema, model } from "mongoose";
import { IHospital } from "../types/hospital.js";

const HospitalSchema = new Schema<IHospital>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Hospital = model<IHospital>("Hospital", HospitalSchema);
export default Hospital;
