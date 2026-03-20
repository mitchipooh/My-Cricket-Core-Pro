/**
 * Generates a unique alphanumeric ID with a specific prefix.
 * Format: prefix_randomString (e.g., org_a1b2c3d4)
 */
export const generateId = (prefix: string = 'id'): string => {
    const randomPart = Math.random().toString(36).substr(2, 9);
    const timestampPart = Date.now().toString(36).substr(-4); // Last 4 chars of timestamp for ordering/uniqueness
    return `${prefix}_${randomPart}${timestampPart}`;
};
