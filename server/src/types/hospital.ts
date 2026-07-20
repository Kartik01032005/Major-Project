import { Document } from "mongoose";

export interface IHospital extends Document {
  name: string;
  address: string;
  state: string;
  district: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}
