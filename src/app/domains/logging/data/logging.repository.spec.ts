import { TestBed } from '@angular/core/testing';
import { LoggingRepository } from './logging.repository';
import { Log, LogLevel } from '../logging.model';
import { PLATFORM_ID } from '@angular/core';

describe('LoggingRepository', () => {
  let repository: LoggingRepository;
  const storageKey = 'logging';

  /**
   * beforeEach runs before EACH test (it block)
   * This ensures each test starts with a clean slate
   */
  beforeEach(() => {
    // Configure the testing module (like mini Angular app for testing)
    TestBed.configureTestingModule({
      providers: [
        LoggingRepository,
        // Provide browser platform ID so isBrowser returns true
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    // Create an instance of the repository
    repository = TestBed.inject(LoggingRepository);

    // Clear localStorage before each test to avoid test pollution
    localStorage.clear();
  });

  /**
   * afterEach runs after EACH test
   * Clean up to prevent tests from affecting each other
   */
  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Test group: getAll() method
   */
  describe('getAll()', () => {

    it('should return empty array when localStorage is empty', () => {
      // Arrange: localStorage is already empty (from beforeEach)

      // Act: call the method
      const result = repository.getAll();

      // Assert: verify the result
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should return logs when localStorage has valid data', () => {
      // Arrange: Put valid data in localStorage
      const mockLogs: Log[] = [
        {
          id: 1,
          level: LogLevel.Information,
          message: 'Test log 1',
          context: 'test-context',
          data: { foo: 'bar' },
          timeStamp: new Date('2025-11-18T12:00:00.000Z')
        },
        {
          id: 2,
          level: LogLevel.Error,
          message: 'Test log 2',
          timeStamp: new Date('2025-11-18T13:00:00.000Z')
        }
      ];
      localStorage.setItem(storageKey, JSON.stringify(mockLogs));

      // Act
      const result = repository.getAll();

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(1);
      expect(result[0].message).toBe('Test log 1');
      expect(result[1].id).toBe(2);
    });

    it('should parse Date objects correctly using dateReviver', () => {
      // Arrange: Store logs with Date objects as ISO strings
      const mockLogs: Log[] = [
        {
          id: 1,
          level: LogLevel.Information,
          message: 'Test log',
          timeStamp: new Date('2025-11-18T12:00:00.000Z')
        }
      ];
      localStorage.setItem(storageKey, JSON.stringify(mockLogs));

      // Act
      const result = repository.getAll();

      // Assert: timeStamp should be a Date object, not a string
      expect(result[0].timeStamp instanceof Date).toBe(true);
      expect(result[0].timeStamp.getTime()).toBe(new Date('2025-11-18T12:00:00.000Z').getTime());
    });

    it('should return empty array when localStorage contains invalid JSON', () => {
      // Arrange: Put invalid JSON in localStorage
      localStorage.setItem(storageKey, 'this is not valid JSON {]');

      // Act
      const result = repository.getAll();

      // Assert: should handle error gracefully
      expect(result).toEqual([]);
    });

    it('should return empty array when localStorage contains non-array data', () => {
      // Arrange: Put valid JSON but not an array
      localStorage.setItem(storageKey, JSON.stringify({ foo: 'bar' }));

      // Act
      const result = repository.getAll();

      // Assert: should reject non-array data
      expect(result).toEqual([]);
    });

    it('should log error to console when parsing fails', () => {
      // Arrange: Spy on console.error to verify it's called
      spyOn(console, 'error');
      localStorage.setItem(storageKey, 'invalid JSON');

      // Act
      repository.getAll();

      // Assert: console.error should have been called
      expect(console.error).toHaveBeenCalledWith(
        jasmine.stringContaining('[LoggingRepository]'),
        jasmine.anything()
      );
    });
  });

  /**
   * Test group: saveAll() method
   */
  describe('saveAll()', () => {

    it('should save logs to localStorage and return true', () => {
      // Arrange: Create test logs
      const logs: Log[] = [
        {
          id: 1,
          level: LogLevel.Information,
          message: 'Test log',
          timeStamp: new Date('2025-11-18T12:00:00.000Z')
        }
      ];

      // Act
      const result = repository.saveAll(logs);

      // Assert: should return true
      expect(result).toBe(true);

      // Verify data was actually saved
      const saved = localStorage.getItem(storageKey);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].id).toBe(1);
      expect(parsed[0].message).toBe('Test log');
    });

    it('should save empty array successfully', () => {
      // Arrange: empty array
      const logs: Log[] = [];

      // Act
      const result = repository.saveAll(logs);

      // Assert
      expect(result).toBe(true);

      const saved = localStorage.getItem(storageKey);
      expect(saved).toBe('[]');
    });

    it('should create a copy of logs (not mutate original)', () => {
      // Arrange
      const originalLog: Log = {
        id: 1,
        level: LogLevel.Information,
        message: 'Original',
        timeStamp: new Date()
      };
      const logs = [originalLog];

      // Act
      repository.saveAll(logs);

      // Modify the original after saving
      originalLog.message = 'Modified';

      // Assert: saved data should still have "Original"
      const saved = localStorage.getItem(storageKey);
      const parsed = JSON.parse(saved!);
      expect(parsed[0].message).toBe('Original');
    });

    it('should handle localStorage quota exceeded error', () => {
      // Arrange: Mock localStorage.setItem to throw quota error
      spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
      spyOn(console, 'error');

      const logs: Log[] = [
        { id: 1, level: LogLevel.Information, message: 'Test', timeStamp: new Date() }
      ];

      // Act
      const result = repository.saveAll(logs);

      // Assert: should return false and log error
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        jasmine.stringContaining('[LoggingRepository]'),
        jasmine.anything()
      );
    });
  });

  /**
   * Test group: SSR (Server-Side Rendering) compatibility
   */
  describe('SSR compatibility', () => {

    it('should return empty array when not in browser (SSR)', () => {
      // Arrange: Create repository with server platform
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LoggingRepository,
          { provide: PLATFORM_ID, useValue: 'server' } // Simulate SSR
        ]
      });
      const ssrRepository = TestBed.inject(LoggingRepository);

      // Act
      const result = ssrRepository.getAll();

      // Assert: should return empty array, not crash
      expect(result).toEqual([]);
    });

    it('should return false when not in browser (SSR)', () => {
      // Arrange: Create repository with server platform
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LoggingRepository,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      const ssrRepository = TestBed.inject(LoggingRepository);

      const logs: Log[] = [
        { id: 1, level: LogLevel.Information, message: 'Test', timeStamp: new Date() }
      ];

      // Act
      const result = ssrRepository.saveAll(logs);

      // Assert: should return false (can't save in SSR)
      expect(result).toBe(false);
    });
  });
});
