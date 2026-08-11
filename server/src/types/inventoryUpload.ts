import { Document, Schema } from "mongoose";

export interface IUploadError {
  row?: number;
  donorId?: string;
  reason: string;
}

export interface IUploadSummary {
  totalParsed: number;
  validRecords: number;
  invalidRecords: number;
  unitsAdded: number;
  unitsByGroup: Record<string, number>;
  errors: IUploadError[];
}

export interface IInventoryUploadLog extends Document {
  bloodBankId: Schema.Types.ObjectId;
  fileName: string;
  fileType: "xlsx" | "xls" | "csv" | "pdf";
  fileHash: string;
  mode: "merge" | "replace";
  summary: IUploadSummary;
  createdAt: Date;
}

export interface IInventoryThreshold extends Document {
  bloodBankId: Schema.Types.ObjectId;
  highlyAvailable: number; // Level 1 (e.g. >= 200)
  veryHigh: number;        // Level 2 (e.g. >= 150)
  high: number;            // Level 3 (e.g. >= 100)
  good: number;            // Level 4 (e.g. >= 70)
  available: number;       // Level 5 (e.g. >= 50)
  moderate: number;        // Level 6 (e.g. >= 30)
  low: number;             // Level 7 (e.g. >= 15)
  veryLow: number;         // Level 8 (e.g. >= 10)
  critical: number;        // Level 9 (e.g. >= 5)
  almostEmpty: number;     // Level 10 (e.g. < 5)
  updatedAt: Date;
}
