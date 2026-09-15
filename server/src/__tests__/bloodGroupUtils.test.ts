import {
  normalizeBloodGroup,
  isBloodGroupCompatible,
  getCompatibleDonorGroups,
} from "../utils/bloodGroupUtils.js";

describe("bloodGroupUtils", () => {
  describe("normalizeBloodGroup", () => {
    it("should normalize lowercase, uppercase, and padded whitespace", () => {
      expect(normalizeBloodGroup(" a+ ")).toBe("A+");
      expect(normalizeBloodGroup("o -")).toBe("O-");
      expect(normalizeBloodGroup("ab+")).toBe("AB+");
      expect(normalizeBloodGroup("  b -  ")).toBe("B-");
    });

    it("should return empty string for null, undefined, or empty values", () => {
      expect(normalizeBloodGroup(null)).toBe("");
      expect(normalizeBloodGroup(undefined)).toBe("");
      expect(normalizeBloodGroup("")).toBe("");
    });
  });

  describe("isBloodGroupCompatible", () => {
    it("should correctly identify universal donor O- as compatible with all blood groups", () => {
      const targets = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
      targets.forEach((target) => {
        expect(isBloodGroupCompatible("O-", target)).toBe(true);
        expect(isBloodGroupCompatible(" o- ", ` ${target.toLowerCase()} `)).toBe(true);
      });
    });

    it("should allow O+ donor for A+, B+, AB+, and O+ recipients", () => {
      expect(isBloodGroupCompatible("O+", "A+")).toBe(true);
      expect(isBloodGroupCompatible("O+", "B+")).toBe(true);
      expect(isBloodGroupCompatible("O+", "AB+")).toBe(true);
      expect(isBloodGroupCompatible("O+", "O+")).toBe(true);
    });

    it("should reject O+ donor for O-, A-, B-, AB- recipients", () => {
      expect(isBloodGroupCompatible("O+", "O-")).toBe(false);
      expect(isBloodGroupCompatible("O+", "A-")).toBe(false);
      expect(isBloodGroupCompatible("O+", "B-")).toBe(false);
      expect(isBloodGroupCompatible("O+", "AB-")).toBe(false);
    });

    it("should allow A- donor for A+, A-, AB+, AB- recipients", () => {
      expect(isBloodGroupCompatible("A-", "A+")).toBe(true);
      expect(isBloodGroupCompatible("A-", "A-")).toBe(true);
      expect(isBloodGroupCompatible("A-", "AB+")).toBe(true);
      expect(isBloodGroupCompatible("A-", "AB-")).toBe(true);
    });

    it("should reject incompatible donor/recipient combinations", () => {
      expect(isBloodGroupCompatible("A+", "O+")).toBe(false);
      expect(isBloodGroupCompatible("B+", "A+")).toBe(false);
      expect(isBloodGroupCompatible("AB+", "A+")).toBe(false);
    });
  });

  describe("getCompatibleDonorGroups", () => {
    it("should return all compatible donor groups for a given request group", () => {
      expect(getCompatibleDonorGroups("A+")).toEqual(["O-", "O+", "A-", "A+"]);
      expect(getCompatibleDonorGroups("O-")).toEqual(["O-"]);
      expect(getCompatibleDonorGroups("AB+")).toEqual(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]);
    });
  });
});
