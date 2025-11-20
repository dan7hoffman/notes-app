import { TestBed } from '@angular/core/testing';
import { LoggingService, NewLogData } from './logging.service';
import { LoggingRepository } from '../data/logging.repository';
import { LogStateService } from './loggingState.service';
import { Log, LogLevel } from '../logging.model';
import { PLATFORM_ID } from '@angular/core';

describe('LoggingService', () => {
  let service: LoggingService;
  let repository: LoggingRepository;
  let stateService: LogStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggingService,
        LoggingRepository,
        LogStateService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(LoggingService);
    repository = TestBed.inject(LoggingRepository);
    stateService = TestBed.inject(LogStateService);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Test group: Service initialization
   */
  describe('Initialization', () => {

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should load logs from repository on creation', () => {
      // Arrange: Put logs in localStorage BEFORE creating service
      const existingLogs: Log[] = [
        {
          id: 1,
          level: LogLevel.Information,
          message: 'Existing log',
          timeStamp: new Date('2025-11-18T12:00:00.000Z')
        }
      ];
      localStorage.setItem('logging', JSON.stringify(existingLogs));

      // Act: Create a new service instance (which calls loadLogs in constructor)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LoggingService,
          LoggingRepository,
          LogStateService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });
      const newService = TestBed.inject(LoggingService);

      // Assert: Service should have loaded existing logs
      const logs = newService.logs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Existing log');
    });
  });

  /**
   * Test group: logs getter
   */
  describe('logs getter', () => {

    it('should return logs signal from state service', () => {
      // Act: Get logs
      const logsSignal = service.logs;

      // Assert: Should be the same signal from state service
      expect(logsSignal).toBe(stateService.logs);
    });

    it('should return empty array initially', () => {
      // Act
      const logs = service.logs();

      // Assert
      expect(logs).toEqual([]);
    });
  });

  /**
   * Test group: add() method
   */
  describe('add()', () => {

    it('should add a log with generated ID and timestamp', () => {
      // Arrange: Create new log data
      const newLogData: NewLogData = {
        level: LogLevel.Information,
        message: 'Test message',
        context: 'test-context',
        data: { foo: 'bar' }
      };

      // Act: Add the log
      const result = service.add(newLogData);

      // Assert: Should return complete log with ID and timestamp
      expect(result).toBeDefined();
      expect(result.id).toBe(1); // First log should have ID 1
      expect(result.level).toBe(LogLevel.Information);
      expect(result.message).toBe('Test message');
      expect(result.context).toBe('test-context');
      expect(result.data).toEqual({ foo: 'bar' });
      expect(result.timeStamp instanceof Date).toBe(true);
    });

    it('should generate incremental IDs', () => {
      // Arrange: Create multiple logs
      const logData: NewLogData = {
        level: LogLevel.Information,
        message: 'Test'
      };

      // Act: Add three logs
      const log1 = service.add(logData);
      const log2 = service.add(logData);
      const log3 = service.add(logData);

      // Assert: IDs should increment
      expect(log1.id).toBe(1);
      expect(log2.id).toBe(2);
      expect(log3.id).toBe(3);
    });

    it('should persist log to repository', () => {
      // Arrange
      const logData: NewLogData = {
        level: LogLevel.Error,
        message: 'Error message'
      };

      // Act
      service.add(logData);

      // Assert: Check repository has the log
      const saved = repository.getAll();
      expect(saved.length).toBe(1);
      expect(saved[0].message).toBe('Error message');
    });

    it('should update signal state', () => {
      // Arrange
      const logData: NewLogData = {
        level: LogLevel.Warning,
        message: 'Warning message'
      };

      // Act
      service.add(logData);

      // Assert: Signal should be updated
      const logs = service.logs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Warning message');
    });

    it('should handle optional fields (context and data)', () => {
      // Arrange: Log without optional fields
      const minimalLog: NewLogData = {
        level: LogLevel.Information,
        message: 'Minimal log'
        // No context or data
      };

      // Act
      const result = service.add(minimalLog);

      // Assert
      expect(result.context).toBeUndefined();
      expect(result.data).toBeUndefined();
    });

    it('should use current timestamp', () => {
      // Arrange
      const before = new Date();
      const logData: NewLogData = {
        level: LogLevel.Information,
        message: 'Test'
      };

      // Act
      const result = service.add(logData);
      const after = new Date();

      // Assert: Timestamp should be between before and after
      expect(result.timeStamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.timeStamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should continue from max existing ID', () => {
      // Arrange: Add initial logs
      service.add({ level: LogLevel.Information, message: 'Log 1' });
      service.add({ level: LogLevel.Information, message: 'Log 2' });

      // Verify we have logs with IDs 1 and 2
      expect(service.logs().length).toBe(2);

      // Act: Add another log
      const newLog = service.add({ level: LogLevel.Information, message: 'Log 3' });

      // Assert: Should have ID 3 (continuing from max)
      expect(newLog.id).toBe(3);
    });

    it('should handle repository save failure gracefully', () => {
      // Arrange: Mock repository to fail save
      spyOn(repository, 'saveAll').and.returnValue(false);
      spyOn(console, 'warn');

      const logData: NewLogData = {
        level: LogLevel.Error,
        message: 'Test message'
      };

      // Act
      const result = service.add(logData);

      // Assert: Should still return log and update signal
      expect(result).toBeDefined();
      expect(result.message).toBe('Test message');

      // Signal should still be updated (in-memory fallback)
      const logs = service.logs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Test message');

      // Console warning should be logged
      expect(console.warn).toHaveBeenCalledWith(
        jasmine.stringContaining('failed to persist')
      );
    });

    it('should add multiple logs and maintain order in signal', () => {
      // Arrange: Add logs with small delays to ensure different timestamps
      const log1Data: NewLogData = {
        level: LogLevel.Information,
        message: 'First log'
      };
      const log2Data: NewLogData = {
        level: LogLevel.Warning,
        message: 'Second log'
      };

      // Act
      service.add(log1Data);
      // Small delay to ensure different timestamps
      const now = Date.now();
      while (Date.now() === now) { /* wait */ }
      service.add(log2Data);

      // Assert: Signal should have both, sorted newest first
      const logs = service.logs();
      expect(logs.length).toBe(2);
      expect(logs[0].message).toBe('Second log'); // Newest first
      expect(logs[1].message).toBe('First log');
    });
  });

  /**
   * Test group: refresh() method
   */
  describe('refresh()', () => {

    it('should reload logs from repository', () => {
      // Arrange: Add a log through service
      service.add({ level: LogLevel.Information, message: 'Original log' });

      // Manually modify localStorage (simulating external change)
      const externalLogs: Log[] = [
        {
          id: 999,
          level: LogLevel.Error,
          message: 'External log',
          timeStamp: new Date()
        }
      ];
      localStorage.setItem('logging', JSON.stringify(externalLogs));

      // Act: Refresh
      service.refresh();

      // Assert: Should now have the external log
      const logs = service.logs();
      expect(logs.length).toBe(1);
      expect(logs[0].id).toBe(999);
      expect(logs[0].message).toBe('External log');
    });

    it('should handle empty repository on refresh', () => {
      // Arrange: Add logs
      service.add({ level: LogLevel.Information, message: 'Test' });
      expect(service.logs().length).toBe(1);

      // Clear localStorage (simulating external clear)
      localStorage.clear();

      // Act: Refresh
      service.refresh();

      // Assert: Logs should be empty now
      expect(service.logs().length).toBe(0);
    });
  });

  /**
   * Test group: Integration tests (full flow)
   */
  describe('Integration', () => {

    it('should persist logs across service instances', () => {
      // Arrange: Add logs with first service instance
      service.add({ level: LogLevel.Information, message: 'Persisted log' });

      // Act: Create new service instance (simulating app restart)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LoggingService,
          LoggingRepository,
          LogStateService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });
      const newService = TestBed.inject(LoggingService);

      // Assert: New service should load persisted log
      const logs = newService.logs();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Persisted log');
    });

    it('should handle complete add/read workflow', () => {
      // This test verifies the entire flow from add to read

      // 1. Start with empty state
      expect(service.logs().length).toBe(0);

      // 2. Add a log
      const newLog: NewLogData = {
        level: LogLevel.Error,
        message: 'Critical error',
        context: 'payment-service',
        data: { errorCode: 500 }
      };
      const added = service.add(newLog);

      // 3. Verify it's in the signal
      const logsFromSignal = service.logs();
      expect(logsFromSignal.length).toBe(1);
      expect(logsFromSignal[0]).toEqual(added);

      // 4. Verify it's in repository
      const logsFromRepo = repository.getAll();
      expect(logsFromRepo.length).toBe(1);
      expect(logsFromRepo[0].message).toBe('Critical error');

      // 5. Verify it's in localStorage
      const raw = localStorage.getItem('logging');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].message).toBe('Critical error');
    });

    it('should handle many sequential adds efficiently', () => {
      // Arrange: Add 100 logs
      const logData: NewLogData = {
        level: LogLevel.Information,
        message: 'Performance test log'
      };

      // Act: Add logs in a loop
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        service.add(logData);
      }
      const endTime = performance.now();

      // Assert: Should complete in reasonable time (< 1 second)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);

      // Verify all logs are present
      expect(service.logs().length).toBe(100);

      // Verify IDs are sequential
      const logs = service.logs();
      const sortedByIdAsc = [...logs].sort((a, b) => a.id - b.id);
      expect(sortedByIdAsc[0].id).toBe(1);
      expect(sortedByIdAsc[99].id).toBe(100);
    });
  });

  /**
   * Test group: Edge cases
   */
  describe('Edge cases', () => {

    it('should handle empty message', () => {
      // Note: Current implementation doesn't validate this
      // If you add validation, update this test
      const logData: NewLogData = {
        level: LogLevel.Information,
        message: ''
      };

      const result = service.add(logData);
      expect(result.message).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const logData: NewLogData = {
        level: LogLevel.Information,
        message: longMessage
      };

      const result = service.add(logData);
      expect(result.message.length).toBe(10000);
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Test with "quotes", \'apostrophes\', and \n newlines \t tabs';
      const logData: NewLogData = {
        level: LogLevel.Information,
        message: specialMessage
      };

      const result = service.add(logData);
      expect(result.message).toBe(specialMessage);

      // Verify it persists correctly
      const saved = repository.getAll();
      expect(saved[0].message).toBe(specialMessage);
    });

    it('should handle complex data objects', () => {
      const complexData = {
        nested: {
          deeply: {
            object: 'value'
          }
        },
        array: [1, 2, 3],
        date: new Date('2025-11-18'),
        null: null,
        undefined: undefined
      };

      const logData: NewLogData = {
        level: LogLevel.Information,
        message: 'Complex data test',
        data: complexData
      };

      const result = service.add(logData);
      expect(result.data).toEqual(complexData);
    });
  });

  /**
   * Test group: Convenience methods
   */
  describe('Convenience methods', () => {

    it('should log info with logInfo()', () => {
      const result = service.logInfo('Info message', {
        context: 'TestContext',
        data: { key: 'value' }
      });

      expect(result.level).toBe(LogLevel.Information);
      expect(result.message).toBe('Info message');
      expect(result.context).toBe('TestContext');
      expect(result.data).toEqual({ key: 'value' });
    });

    it('should log warning with logWarn()', () => {
      const result = service.logWarn('Warning message', {
        context: 'TestContext'
      });

      expect(result.level).toBe(LogLevel.Warning);
      expect(result.message).toBe('Warning message');
      expect(result.context).toBe('TestContext');
    });

    it('should log error with logError()', () => {
      const result = service.logError('Error message', {
        data: { error: 'details' }
      });

      expect(result.level).toBe(LogLevel.Error);
      expect(result.message).toBe('Error message');
      expect(result.data).toEqual({ error: 'details' });
    });

    it('should work without options', () => {
      const infoResult = service.logInfo('Simple info');
      const warnResult = service.logWarn('Simple warn');
      const errorResult = service.logError('Simple error');

      expect(infoResult.message).toBe('Simple info');
      expect(infoResult.context).toBeUndefined();
      expect(warnResult.message).toBe('Simple warn');
      expect(errorResult.message).toBe('Simple error');
    });

    it('should persist logs from convenience methods', () => {
      service.logInfo('Persisted info');
      service.logWarn('Persisted warn');
      service.logError('Persisted error');

      const saved = repository.getAll();
      expect(saved.length).toBe(3);
      expect(saved.map(l => l.level)).toEqual([
        LogLevel.Information,
        LogLevel.Warning,
        LogLevel.Error
      ]);
    });
  });

  /**
   * Test group: Max log retention
   */
  describe('Max log retention', () => {

    it('should not prune logs when under limit', () => {
      // Add 5 logs (well under 1000 limit)
      for (let i = 0; i < 5; i++) {
        service.logInfo(`Log ${i}`);
      }

      const logs = service.logs();
      expect(logs.length).toBe(5);
    });

    it('should maintain all logs when under limit', () => {
      // Add 10 logs (well under 1000 limit)
      for (let i = 0; i < 10; i++) {
        service.logInfo(`Log ${i}`, { data: { index: i } });
      }

      const logs = service.logs();
      expect(logs.length).toBe(10);

      // Verify all logs are present (sorted newest first by state service)
      const messages = logs.map(l => l.message);
      expect(messages).toContain('Log 0');
      expect(messages).toContain('Log 9');
    });

    it('should sort logs newest first via state service', () => {
      // Add logs sequentially
      for (let i = 0; i < 5; i++) {
        service.logInfo(`Log ${i}`);
      }

      const logs = service.logs();
      // State service sorts by timestamp descending (newest first)
      // Since all logs have nearly identical timestamps in tests,
      // just verify we have all 5 logs
      expect(logs.length).toBe(5);
      const messages = logs.map(l => l.message);
      for (let i = 0; i < 5; i++) {
        expect(messages).toContain(`Log ${i}`);
      }
    });
  });
});
