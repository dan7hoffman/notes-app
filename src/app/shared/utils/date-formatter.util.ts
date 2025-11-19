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

/**
 * Parse date input string (YYYY-MM-DD) as local timezone date.
 * Prevents timezone shift issues when converting date picker values.
 *
 * IMPORTANT: new Date("2025-11-16") creates UTC midnight, which may shift
 * to the previous day in negative UTC offset timezones. This function
 * ensures the date is interpreted as local midnight.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object at local midnight
 *
 * @example
 * parseDateInputAsLocal("2025-11-16") → Date object for Nov 16, 2025 at 00:00 local time
 */
export function parseDateInputAsLocal(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object as relative time for recent dates, absolute for older.
 * Uses "Just now", "2 minutes ago", "3 hours ago" for recent,
 * then falls back to absolute format for dates older than 24 hours.
 *
 * @param date - Date object to format
 * @returns Relative or absolute time string
 *
 * @example
 * formatRelativeTime(new Date()) → "Just now"
 * formatRelativeTime(2 minutes ago) → "2 minutes ago"
 * formatRelativeTime(yesterday) → "14 Nov 2025, 18:30"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    // Fall back to absolute format for older dates
    return formatAbsoluteDateTime(date);
  }
}
