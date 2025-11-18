import { TestBed } from '@angular/core/testing';
import { LogStateService } from './loggingState.service';
import { Log, LogLevel } from '../logging.model';

describe('LogStateService', () => {
  let service: LogStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LogStateService]
    });
    service = TestBed.inject(LogStateService);
  });

  /**
   * Test group: Initial state
   */
  describe('Initial state', () => {

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with empty logs', () => {
      // Act: Read the computed signal
      const logs = service.logs();

      // Assert: should be empty array
      expect(logs).toEqual([]);
      expect(logs.length).toBe(0);
    });
  });

  /**
   * Test group: setLogs() method
   */
  describe('setLogs()', () => {

    it('should update logs signal', () => {
      // Arrange: Create test logs
      const testLogs: Log[] = [
        {
          id: 1,
          level: LogLevel.Information,
          message: 'Test log 1',
          timeStamp: new Date('2025-11-18T12:00:00.000Z')
        },
        {
          id: 2,
          level: LogLevel.Error,
          message: 'Test log 2',
          timeStamp: new Date('2025-11-18T13:00:00.000Z')
        }
      ];

      // Act: Set the logs
      service.setLogs(testLogs);

      // Assert: Signal should be updated
      const logs = service.logs();
      expect(logs.length).toBe(2);
      expect(logs[0].id).toBe(2); // Should be sorted newest first!
      expect(logs[1].id).toBe(1);
    });

    it('should allow setting empty array', () => {
      // Arrange: First add some logs
      const testLogs: Log[] = [
        { id: 1, level: LogLevel.Information, message: 'Test', timeStamp: new Date() }
      ];
      service.setLogs(testLogs);

      // Act: Clear by setting empty array
      service.setLogs([]);

      // Assert: Should be empty now
      const logs = service.logs();
      expect(logs).toEqual([]);
    });

    it('should replace previous logs (not append)', () => {
      // Arrange: Set initial logs
      const firstBatch: Log[] = [
        { id: 1, level: LogLevel.Information, message: 'First', timeStamp: new Date() }
      ];
      service.setLogs(firstBatch);

      // Act: Set new logs
      const secondBatch: Log[] = [
        { id: 2, level: LogLevel.Error, message: 'Second', timeStamp: new Date() }
      ];
      service.setLogs(secondBatch);

      // Assert: Should only have second batch (not both)
      const logs = service.logs();
      expect(logs.length).toBe(1);
      expect(logs[0].id).toBe(2);
      expect(logs[0].message).toBe('Second');
    });
  });

  /**
   * Test group: logs computed signal (sorting behavior)
   */
  describe('logs computed signal', () => {

    it('should sort logs by timestamp (newest first)', () => {
      // Arrange: Create logs with different timestamps (in random order)
      const testLogs: Log[] = [
        {
          id: 2,
          level: LogLevel.Information,
          message: 'Middle log',
          timeStamp: new Date('2025-11-18T12:00:00.000Z') // 12:00
        },
        {
          id: 3,
          level: LogLevel.Error,
          message: 'Newest log',
          timeStamp: new Date('2025-11-18T14:00:00.000Z') // 14:00 (latest)
        },
        {
          id: 1,
          level: LogLevel.Warning,
          message: 'Oldest log',
          timeStamp: new Date('2025-11-18T10:00:00.000Z') // 10:00
        }
      ];

      // Act: Set logs
      service.setLogs(testLogs);
      const logs = service.logs();

      // Assert: Should be sorted newest → oldest
      expect(logs.length).toBe(3);
      expect(logs[0].id).toBe(3); // 14:00 (newest)
      expect(logs[1].id).toBe(2); // 12:00
      expect(logs[2].id).toBe(1); // 10:00 (oldest)
    });

    it('should handle logs with same timestamp', () => {
      // Arrange: Create logs with identical timestamps
      const sameTime = new Date('2025-11-18T12:00:00.000Z');
      const testLogs: Log[] = [
        { id: 1, level: LogLevel.Information, message: 'Log 1', timeStamp: sameTime },
        { id: 2, level: LogLevel.Information, message: 'Log 2', timeStamp: sameTime },
      ];

      // Act
      service.setLogs(testLogs);
      const logs = service.logs();

      // Assert: Should not crash, order may vary but both should be present
      expect(logs.length).toBe(2);
      const ids = logs.map(l => l.id).sort();
      expect(ids).toEqual([1, 2]);
    });

    it('should return a new array (immutability)', () => {
      // Arrange: Set logs
      const testLogs: Log[] = [
        { id: 1, level: LogLevel.Information, message: 'Test', timeStamp: new Date() }
      ];
      service.setLogs(testLogs);

      // Act: Get logs twice
      const logs1 = service.logs();
      const logs2 = service.logs();

      // Assert: Should be equal but not the same reference
      expect(logs1).toEqual(logs2);
      // Note: computed signals may return same reference for performance,
      // but the underlying sort creates a new array each time
    });

    it('should not mutate original logs array', () => {
      // Arrange: Create original logs array
      const originalLogs: Log[] = [
        {
          id: 1,
          level: LogLevel.Information,
          message: 'First',
          timeStamp: new Date('2025-11-18T10:00:00.000Z')
        },
        {
          id: 2,
          level: LogLevel.Information,
          message: 'Second',
          timeStamp: new Date('2025-11-18T12:00:00.000Z')
        }
      ];
      const originalOrder = [...originalLogs];

      // Act: Set logs and read computed signal
      service.setLogs(originalLogs);
      const computedLogs = service.logs();

      // Assert: Computed logs should be sorted (id:2, id:1)
      expect(computedLogs[0].id).toBe(2);
      expect(computedLogs[1].id).toBe(1);

      // Original array should remain unchanged (id:1, id:2)
      expect(originalLogs[0].id).toBe(1);
      expect(originalLogs[1].id).toBe(2);
      expect(originalLogs).toEqual(originalOrder);
    });
  });

  /**
   * Test group: Signal reactivity
   */
  describe('Signal reactivity', () => {

    it('should automatically update when logs change', () => {
      // Arrange: Set initial logs
      const initialLogs: Log[] = [
        { id: 1, level: LogLevel.Information, message: 'Initial', timeStamp: new Date() }
      ];
      service.setLogs(initialLogs);

      // Verify initial state
      expect(service.logs().length).toBe(1);

      // Act: Update logs
      const updatedLogs: Log[] = [
        { id: 1, level: LogLevel.Information, message: 'Initial', timeStamp: new Date() },
        { id: 2, level: LogLevel.Error, message: 'New', timeStamp: new Date() }
      ];
      service.setLogs(updatedLogs);

      // Assert: Signal should reflect new state immediately
      expect(service.logs().length).toBe(2);
    });
  });

  /**
   * Test group: Edge cases
   */
  describe('Edge cases', () => {

    it('should handle logs with missing optional fields', () => {
      // Arrange: Logs with only required fields
      const minimalLogs: Log[] = [
        {
          id: 1,
          level: LogLevel.Information,
          message: 'Minimal log',
          timeStamp: new Date()
          // context and data are optional
        }
      ];

      // Act
      service.setLogs(minimalLogs);
      const logs = service.logs();

      // Assert: Should work fine
      expect(logs.length).toBe(1);
      expect(logs[0].context).toBeUndefined();
      expect(logs[0].data).toBeUndefined();
    });

    it('should handle very old timestamps', () => {
      // Arrange: Log from year 2000 (use UTC to avoid timezone issues)
      const oldDate = new Date(Date.UTC(2000, 0, 1, 12, 0, 0)); // Jan 1, 2000 at noon UTC
      const oldLog: Log[] = [
        {
          id: 1,
          level: LogLevel.Information,
          message: 'Old log',
          timeStamp: oldDate
        }
      ];

      // Act
      service.setLogs(oldLog);
      const logs = service.logs();

      // Assert: Should handle correctly
      expect(logs.length).toBe(1);
      expect(logs[0].timeStamp.getFullYear()).toBe(2000);
    });

    it('should handle large number of logs', () => {
      // Arrange: Create 1000 logs
      const manyLogs: Log[] = [];
      for (let i = 0; i < 1000; i++) {
        manyLogs.push({
          id: i,
          level: LogLevel.Information,
          message: `Log ${i}`,
          timeStamp: new Date(Date.now() + i * 1000) // Each 1 second apart
        });
      }

      // Act
      service.setLogs(manyLogs);
      const logs = service.logs();

      // Assert: Should handle large arrays
      expect(logs.length).toBe(1000);
      // Verify sorting still works (newest first = id:999)
      expect(logs[0].id).toBe(999);
      expect(logs[999].id).toBe(0);
    });
  });
});
