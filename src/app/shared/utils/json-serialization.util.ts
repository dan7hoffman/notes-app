/**
 * JSON serialization utilities for handling Date objects in localStorage.
 *
 * Problem:
 * - JSON.stringify() converts Date objects to ISO strings
 * - JSON.parse() doesn't convert them back to Date objects
 * - This causes dates to become strings after save/load cycles
 *
 * Solution:
 * - Use a custom reviver function with JSON.parse() to detect ISO date strings
 * - Automatically convert them back to Date objects
 */

/**
 * Custom JSON reviver that converts ISO date strings back to Date objects.
 * Use this with JSON.parse() when loading data from localStorage.
 *
 * @param _key - Property key (unused, but required by JSON.parse signature)
 * @param value - The value being parsed
 * @returns Date object if value is an ISO date string, otherwise the original value
 *
 * @example
 * const json = '{"createdAt":"2025-11-13T15:43:02.515Z"}';
 * const obj = JSON.parse(json, dateReviver);
 * console.log(obj.createdAt instanceof Date); // true
 */
export function dateReviver(_key: string, value: any): any {
  if (typeof value === 'string') {
    // Match ISO 8601 date format (with or without milliseconds and timezone)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (isoDatePattern.test(value)) {
      return new Date(value);
    }
  }
  return value;
}
