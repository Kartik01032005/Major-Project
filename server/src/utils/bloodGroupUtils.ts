/**
 * Normalizes blood group string by trimming, converting to uppercase, and removing whitespace.
 * e.g. " a+ " -> "A+", "o -" -> "O-"
 */
export const normalizeBloodGroup = (group?: string | null): string => {
  if (!group) return "";
  return group.trim().toUpperCase().replace(/\s+/g, "");
};

/**
 * Medical blood compatibility matrix.
 * Map key: Donor blood group (normalized)
 * Map value: Array of recipient blood groups that this donor can donate red blood cells to.
 *
 * Compatibility reference:
 * - O- : Universal RBC donor (can donate to O-, O+, A-, A+, B-, B+, AB-, AB+)
 * - O+ : Can donate to O+, A+, B+, AB+
 * - A- : Can donate to A-, A+, AB-, AB+
 * - A+ : Can donate to A+, AB+
 * - B- : Can donate to B-, B+, AB-, AB+
 * - B+ : Can donate to B+, AB+
 * - AB-: Can donate to AB-, AB+
 * - AB+: Can donate to AB+
 */
export const DONOR_COMPATIBILITY_MAP: Record<string, string[]> = {
  "O-":  ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+":  ["O+", "A+", "B+", "AB+"],
  "A-":  ["A-", "A+", "AB-", "AB+"],
  "A+":  ["A+", "AB+"],
  "B-":  ["B-", "B+", "AB-", "AB+"],
  "B+":  ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

/**
 * Checks if a donor with `donorGroup` can medically donate to a recipient with `requestGroup`.
 * Performs normalization for casing and whitespace before checking compatibility.
 */
export const isBloodGroupCompatible = (
  donorGroup?: string | null,
  requestGroup?: string | null
): boolean => {
  const normDonor = normalizeBloodGroup(donorGroup);
  const normRequest = normalizeBloodGroup(requestGroup);

  if (!normDonor || !normRequest) {
    return false;
  }

  const compatibleRecipients = DONOR_COMPATIBILITY_MAP[normDonor];
  if (!compatibleRecipients) {
    return false;
  }

  return compatibleRecipients.includes(normRequest);
};

/**
 * Returns array of donor blood groups compatible with a given request blood group.
 */
export const getCompatibleDonorGroups = (requestGroup?: string | null): string[] => {
  const normRequest = normalizeBloodGroup(requestGroup);
  if (!normRequest) return [];
  return Object.keys(DONOR_COMPATIBILITY_MAP).filter((donorGroup) =>
    DONOR_COMPATIBILITY_MAP[donorGroup].includes(normRequest)
  );
};
