import { Document } from "mongoose";

export interface ILocation {
  state: string;
  district: string;
  latitude?: number;
  longitude?: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional so we can exclude it when reading data from database
  phone: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  role: "user" | "admin";
  isAvailableDonor: boolean;
  location: ILocation;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (enteredPassword: string) => Promise<boolean>;
}
