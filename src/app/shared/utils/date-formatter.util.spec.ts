import {
  parseISODate,
  formatAbsoluteDate,
  formatAbsoluteDateTime,
  toISOString,
  parseDateInputAsLocal,
  formatRelativeTime
} from './date-formatter.util';

describe('Date Formatter Utilities', () => {

  describe('parseISODate', () => {
    it('should return same Date object if already a Date', () => {
      const date = new Date('2025-01-15T18:30:00.000Z');
      const result = parseISODate(date);
      expect(result).toBe(date);
    });

    it('should parse ISO string to Date', () => {
      const result = parseISODate('2025-01-15T18:30:00.000Z');
      expect(result instanceof Date).toBe(true);
      expect(result.toISOString()).toBe('2025-01-15T18:30:00.000Z');
    });

    it('should parse timestamp number to Date', () => {
      const timestamp = new Date('2025-01-15T18:30:00.000Z').getTime();
      const result = parseISODate(timestamp);
      expect(result instanceof Date).toBe(true);
    });
  });

  describe('formatAbsoluteDate', () => {
    it('should format date as DD MMM YYYY', () => {
      const date = new Date('2025-01-15T18:30:00.000Z');
      const result = formatAbsoluteDate(date);
      // Note: Exact output depends on timezone, but format should be consistent
      expect(result).toMatch(/\d{2} \w{3} \d{4}/);
    });
  });

  describe('formatAbsoluteDateTime', () => {
    it('should format date with time', () => {
      const date = new Date('2025-01-15T18:30:00.000Z');
      const result = formatAbsoluteDateTime(date);
      // Should include date and time
      expect(result).toMatch(/\d{2} \w{3} \d{4}/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('toISOString', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date('2025-01-15T18:30:00.000Z');
      const result = toISOString(date);
      expect(result).toBe('2025-01-15T18:30:00.000Z');
    });
  });

  describe('parseDateInputAsLocal', () => {
    it('should parse YYYY-MM-DD as local midnight', () => {
      const result = parseDateInputAsLocal('2025-11-16');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(10); // 0-indexed
      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('formatRelativeTime', () => {

    it('should show "Just now" for times within 60 seconds', () => {
      const now = new Date();
      const result = formatRelativeTime(now);
      expect(result).toBe('Just now');
    });

    it('should show "Just now" for 30 seconds ago', () => {
      const date = new Date(Date.now() - 30 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toBe('Just now');
    });

    it('should show "1 minute ago" for 60-119 seconds ago', () => {
      const date = new Date(Date.now() - 90 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toBe('1 minute ago');
    });

    it('should show "X minutes ago" for times within an hour', () => {
      const date = new Date(Date.now() - 15 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toBe('15 minutes ago');
    });

    it('should show "1 hour ago" for 60-119 minutes ago', () => {
      const date = new Date(Date.now() - 90 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toBe('1 hour ago');
    });

    it('should show "X hours ago" for times within a day', () => {
      const date = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toBe('5 hours ago');
    });

    it('should show "1 day ago" for 24-47 hours ago', () => {
      const date = new Date(Date.now() - 36 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toBe('1 day ago');
    });

    it('should show "X days ago" for times within a week', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toBe('3 days ago');
    });

    it('should fall back to absolute format for times older than 7 days', () => {
      const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);
      // Should be absolute format (DD MMM YYYY, HH:MM)
      expect(result).toMatch(/\d{2} \w{3} \d{4}/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should handle edge case at exactly 60 seconds', () => {
      const date = new Date(Date.now() - 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toBe('1 minute ago');
    });

    it('should handle edge case at exactly 60 minutes', () => {
      const date = new Date(Date.now() - 60 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toBe('1 hour ago');
    });

    it('should handle edge case at exactly 24 hours', () => {
      const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);
      expect(result).toBe('1 day ago');
    });
  });
});
