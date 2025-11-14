/**
 * Deep equality comparison utility.
 * Correctly handles primitives, Date objects, and arrays.
 * Replaces unreliable JSON.stringify comparisons.
 */

/**
 * Performs a deep equality check between two values.
 * Handles the following types correctly:
 * - Primitives (string, number, boolean, null, undefined)
 * - Date objects (compares timestamps)
 * - Arrays (compares elements recursively)
 * - Plain objects (compares properties recursively)
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are deeply equal, false otherwise
 */
export function deepEquals(a: any, b: any): boolean {
  // Handle identical references (including NaN)
  if (Object.is(a, b)) {
    return true;
  }

  // Handle null and undefined
  if (a == null || b == null) {
    return a === b;
  }

  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => deepEquals(item, b[index]));
  }

  // Handle plain objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    return keysA.every(
      (key) => keysB.includes(key) && deepEquals(a[key], b[key])
    );
  }

  // For all other types (primitives)
  return a === b;
}

/**
 * Checks if a value has changed by comparing with a new value.
 * Wrapper around deepEquals for better semantic clarity.
 *
 * @param oldValue - The original value
 * @param newValue - The new value
 * @returns true if the values are different, false if they are equal
 */
export function hasChanged(oldValue: any, newValue: any): boolean {
  return !deepEquals(oldValue, newValue);
}
