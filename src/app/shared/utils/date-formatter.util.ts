/**
 * Shared date formatting utilities.
 *
 * Industry standard approach:
 * - Store dates as ISO 8601 UTC strings in localStorage
 * - Work with Date objects in business logic
 * - Display in user's local timezone
 *
 * Pure functions with no dependencies.
 */

/**
 * Parse ISO string or Date object into a Date instance.
 * Used by repository layer when deserializing from localStorage.
 *
 * @param value - ISO string, timestamp, or Date object
 * @returns Date object (in local timezone)
 *
 * @example
 * parseISODate("2025-01-15T18:30:00.000Z") → Date object
 * parseISODate(new Date()) → same Date object
 */
export function parseISODate(value: string | number | Date): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

/**
 * Format a Date object for display in absolute format: "15 Jan 2025"
 * Automatically converts UTC to user's local timezone.
 *
 * @param date - Date object to format
 * @returns Formatted date string in "DD MMM YYYY" format
 *
 * @example
 * formatAbsoluteDate(new Date("2025-01-15T18:30:00.000Z")) → "15 Jan 2025"
 */
export function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format a Date object with time: "15 Jan 2025, 18:30"
 * Useful for detailed views (e.g., last modified timestamp).
 *
 * @param date - Date object to format
 * @returns Formatted date and time string
 *
 * @example
 * formatAbsoluteDateTime(new Date("2025-01-15T18:30:00.000Z")) → "15 Jan 2025, 18:30"
 */
export function formatAbsoluteDateTime(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Convert Date to ISO 8601 UTC string for storage.
 * Used by repository layer when serializing to localStorage.
 *
 * @param date - Date object to convert
 * @returns ISO 8601 string in UTC
 *
 * @example
 * toISOString(new Date()) → "2025-01-15T18:30:00.000Z"
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}
