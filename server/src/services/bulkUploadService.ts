import crypto from "crypto";
import { createRequire } from "module";
import * as xlsx from "xlsx";
import { IUploadError, IUploadSummary } from "../types/inventoryUpload.js";

const nodeRequire = createRequire(import.meta.url);
const pdfParse = nodeRequire("pdf-parse");

const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export interface ParsedRecord {
  row: number;
  donorId?: string;
  bloodGroup: typeof VALID_BLOOD_GROUPS[number];
  units: number;
  status?: string;
}

export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

export function normalizeBloodGroup(val: unknown): typeof VALID_BLOOD_GROUPS[number] | null {
  if (!val) return null;
  const str = String(val).trim().toUpperCase();

  if (["A+", "A POSITIVE", "A POS", "A +"].includes(str)) return "A+";
  if (["A-", "A NEGATIVE", "A NEG", "A -"].includes(str)) return "A-";
  if (["B+", "B POSITIVE", "B POS", "B +"].includes(str)) return "B+";
  if (["B-", "B NEGATIVE", "B NEG", "B -"].includes(str)) return "B-";
  if (["AB+", "AB POSITIVE", "AB POS", "AB +"].includes(str)) return "AB+";
  if (["AB-", "AB NEGATIVE", "AB NEG", "AB -"].includes(str)) return "AB-";
  if (["O+", "O POSITIVE", "O POS", "O +"].includes(str)) return "O+";
  if (["O-", "O NEGATIVE", "O NEG", "O -"].includes(str)) return "O-";

  return null;
}

export function findColumnIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => {
    const cleanHeader = h.toLowerCase().replace(/[^a-z0-9]/g, "");
    return aliases.some((alias) => {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
      return cleanHeader === cleanAlias || cleanHeader.includes(cleanAlias);
    });
  });
}

const BG_ALIASES = ["blood group", "bloodgroup", "blood type", "bloodtype", "group", "bg", "blood", "type"];
const UNITS_ALIASES = ["units", "unit", "quantity", "qty", "stock", "count", "volume"];
const DONOR_ALIASES = ["donor id", "donorid", "donor", "record id", "recordid", "id", "donor_id"];
const STATUS_ALIASES = ["status", "donor status", "unit status", "state"];

export async function parseUploadBuffer(
  buffer: Buffer,
  fileType: "xlsx" | "xls" | "csv" | "pdf"
): Promise<{
  validRecords: ParsedRecord[];
  summary: IUploadSummary;
}> {
  const errors: IUploadError[] = [];
  const validRecords: ParsedRecord[] = [];
  const seenDonorIds = new Set<string>();
  const unitsByGroup: Record<string, number> = {
    "A+": 0, "A-": 0, "B+": 0, "B-": 0,
    "AB+": 0, "AB-": 0, "O+": 0, "O-": 0
  };

  let totalParsedRows = 0;

  if (fileType === "pdf") {
    // Parse PDF text
    try {
      const pdfData = await pdfParse(buffer);
      const lines = pdfData.text
        .split(/\r?\n/)
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);

      lines.forEach((line: string, index: number) => {
        totalParsedRows++;
        const rowNum = index + 1;

        // Skip headers or title lines
        if (/donor|blood|group|units|status/i.test(line) && index === 0) return;

        // Try extracting blood group and units from PDF line
        const bgMatch = line.match(/\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-|A POSITIVE|A NEGATIVE|B POSITIVE|B NEGATIVE|AB POSITIVE|AB NEGATIVE|O POSITIVE|O NEGATIVE)\b/i);
        if (!bgMatch) {
          errors.push({ row: rowNum, reason: `Could not identify valid blood group in line: "${line}"` });
          return;
        }

        const bg = normalizeBloodGroup(bgMatch[0]);
        if (!bg) {
          errors.push({ row: rowNum, reason: `Invalid blood group value: "${bgMatch[0]}"` });
          return;
        }

        // Search for numbers in line for units
        const numbers = line.match(/\b\d+\b/g);
        let units = 1;
        if (numbers && numbers.length > 0) {
          // Filter out donor IDs (usually longer numbers) or pick last number as units
          const validUnits = numbers.map((n: string) => Number(n)).find((num: number) => num > 0 && num <= 500);
          if (validUnits) units = validUnits;
        }

        // Donor ID extraction attempt
        const donorMatch = line.match(/\b(D-\d+|DONOR-\d+|ID-\d+|\d{4,8})\b/i);
        const donorId = donorMatch ? donorMatch[0] : undefined;

        if (donorId && seenDonorIds.has(donorId)) {
          errors.push({ row: rowNum, donorId, reason: `Duplicate donor record "${donorId}" ignored.` });
          return;
        }
        if (donorId) seenDonorIds.add(donorId);

        validRecords.push({ row: rowNum, donorId, bloodGroup: bg, units });
        unitsByGroup[bg] += units;
      });
    } catch (err: any) {
      errors.push({ reason: `Failed to parse PDF file: ${err.message || err}` });
    }
  } else {
    // Parse XLSX / XLS / CSV using xlsx module
    try {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("No sheet found in spreadsheet");

      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json<Array<unknown>>(sheet, { header: 1 }) as Array<Array<unknown>>;

      if (!rows || rows.length < 2) {
        errors.push({ reason: "File appears empty or missing table header and data rows." });
      } else {
        const headerRow = (rows[0] || []).map((cell: unknown) => String(cell || ""));
        const bgCol = findColumnIndex(headerRow, BG_ALIASES);
        const unitsCol = findColumnIndex(headerRow, UNITS_ALIASES);
        const donorCol = findColumnIndex(headerRow, DONOR_ALIASES);
        const statusCol = findColumnIndex(headerRow, STATUS_ALIASES);

        if (bgCol === -1) {
          errors.push({ reason: `Missing 'Blood Group' column in header: [${headerRow.join(", ")}]` });
        } else {
          for (let i = 1; i < rows.length; i++) {
            const rowData = rows[i];
            if (!rowData || rowData.length === 0 || rowData.every((cell: unknown) => cell === undefined || cell === null || String(cell).trim() === "")) {
              continue; // skip blank rows
            }

            totalParsedRows++;
            const rowNum = i + 1;

            const statusVal = statusCol !== -1 ? String(rowData[statusCol] || "").trim().toLowerCase() : "";
            if (["rejected", "discarded", "expired", "unusable", "invalid"].includes(statusVal)) {
              errors.push({ row: rowNum, reason: `Record status '${statusVal}' is unapproved. Skipped.` });
              continue;
            }

            const rawBg = rowData[bgCol];
            const bg = normalizeBloodGroup(rawBg);
            if (!bg) {
              errors.push({ row: rowNum, reason: `Invalid or missing blood group value: '${rawBg}'` });
              continue;
            }

            let units = 1;
            if (unitsCol !== -1 && rowData[unitsCol] !== undefined && rowData[unitsCol] !== null) {
              const parsedUnits = parseInt(String(rowData[unitsCol]), 10);
              if (!isNaN(parsedUnits) && parsedUnits >= 0) {
                units = parsedUnits;
              } else {
                errors.push({ row: rowNum, reason: `Invalid unit quantity '${rowData[unitsCol]}'. Defaulted to 1 unit.` });
              }
            }

            const donorId = donorCol !== -1 && rowData[donorCol] ? String(rowData[donorCol]).trim() : undefined;
            if (donorId && seenDonorIds.has(donorId)) {
              errors.push({ row: rowNum, donorId, reason: `Duplicate donor record '${donorId}' skipped.` });
              continue;
            }
            if (donorId) seenDonorIds.add(donorId);

            validRecords.push({ row: rowNum, donorId, bloodGroup: bg, units });
            unitsByGroup[bg] += units;
          }
        }
      }
    } catch (err: any) {
      errors.push({ reason: `Failed to parse tabular file: ${err.message || err}` });
    }
  }

  const validCount = validRecords.length;
  const invalidCount = errors.length;
  const totalUnits = Object.values(unitsByGroup).reduce((acc, val) => acc + val, 0);

  return {
    validRecords,
    summary: {
      totalParsed: totalParsedRows,
      validRecords: validCount,
      invalidRecords: invalidCount,
      unitsAdded: totalUnits,
      unitsByGroup,
      errors,
    },
  };
}
