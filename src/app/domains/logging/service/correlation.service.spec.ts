import { TestBed } from '@angular/core/testing';
import { CorrelationService } from './correlation.service';

describe('CorrelationService', () => {
  let service: CorrelationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CorrelationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have no active operations', () => {
      expect(service.activeOperationCount()).toBe(0);
    });

    it('should have no current correlation ID', () => {
      expect(service.getCurrentCorrelationId()).toBeUndefined();
    });
  });

  describe('startOperation', () => {
    it('should return a correlation ID', () => {
      const correlationId = service.startOperation('testOp');
      expect(correlationId).toBeTruthy();
      expect(correlationId.startsWith('corr_')).toBeTrue();
    });

    it('should increment active operation count', () => {
      service.startOperation('testOp');
      expect(service.activeOperationCount()).toBe(1);

      service.startOperation('testOp2');
      expect(service.activeOperationCount()).toBe(2);
    });

    it('should set current correlation ID to newest', () => {
      const id1 = service.startOperation('op1');
      expect(service.getCurrentCorrelationId()).toBe(id1);

      const id2 = service.startOperation('op2');
      expect(service.getCurrentCorrelationId()).toBe(id2);
    });

    it('should store operation metadata', () => {
      const correlationId = service.startOperation('testOp', { key: 'value' });
      const operation = service.getOperation(correlationId);
      expect(operation?.metadata).toEqual({ key: 'value' });
    });
  });

  describe('endOperation', () => {
    it('should return duration in milliseconds', () => {
      const correlationId = service.startOperation('testOp');
      const duration = service.endOperation(correlationId);
      expect(duration).toBeDefined();
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should decrement active operation count', () => {
      const id1 = service.startOperation('op1');
      const id2 = service.startOperation('op2');
      expect(service.activeOperationCount()).toBe(2);

      service.endOperation(id1);
      expect(service.activeOperationCount()).toBe(1);

      service.endOperation(id2);
      expect(service.activeOperationCount()).toBe(0);
    });

    it('should return undefined for unknown correlation ID', () => {
      const duration = service.endOperation('unknown-id');
      expect(duration).toBeUndefined();
    });

    it('should update current correlation ID after ending', () => {
      const id1 = service.startOperation('op1');
      const id2 = service.startOperation('op2');

      // Current is id2 (top of stack)
      expect(service.getCurrentCorrelationId()).toBe(id2);

      // End id2, current becomes id1
      service.endOperation(id2);
      expect(service.getCurrentCorrelationId()).toBe(id1);

      // End id1, no current
      service.endOperation(id1);
      expect(service.getCurrentCorrelationId()).toBeUndefined();
    });
  });

  describe('isOperationActive', () => {
    it('should return true for active operations', () => {
      const correlationId = service.startOperation('testOp');
      expect(service.isOperationActive(correlationId)).toBeTrue();
    });

    it('should return false after operation ends', () => {
      const correlationId = service.startOperation('testOp');
      service.endOperation(correlationId);
      expect(service.isOperationActive(correlationId)).toBeFalse();
    });

    it('should return false for unknown IDs', () => {
      expect(service.isOperationActive('unknown')).toBeFalse();
    });
  });

  describe('getElapsedTime', () => {
    it('should return elapsed time for active operation', async () => {
      const correlationId = service.startOperation('testOp');

      // Wait a small amount
      await new Promise(resolve => setTimeout(resolve, 10));

      const elapsed = service.getElapsedTime(correlationId);
      expect(elapsed).toBeDefined();
      expect(elapsed).toBeGreaterThanOrEqual(10);
    });

    it('should return undefined for unknown operation', () => {
      expect(service.getElapsedTime('unknown')).toBeUndefined();
    });
  });

  describe('clearAll', () => {
    it('should remove all active operations', () => {
      service.startOperation('op1');
      service.startOperation('op2');
      service.startOperation('op3');

      service.clearAll();

      expect(service.activeOperationCount()).toBe(0);
      expect(service.getCurrentCorrelationId()).toBeUndefined();
    });
  });

  describe('startChildOperation', () => {
    it('should create operation with parent reference', () => {
      const parentId = service.startOperation('parent');
      const childId = service.startChildOperation('child', parentId);

      const childOp = service.getOperation(childId);
      expect(childOp?.metadata?.parentCorrelationId).toBe(parentId);
    });
  });

  describe('nested operations (stack behavior)', () => {
    it('should maintain LIFO stack for current correlation ID', () => {
      const id1 = service.startOperation('op1');
      const id2 = service.startOperation('op2');
      const id3 = service.startOperation('op3');

      expect(service.getCurrentCorrelationId()).toBe(id3);

      service.endOperation(id3);
      expect(service.getCurrentCorrelationId()).toBe(id2);

      service.endOperation(id2);
      expect(service.getCurrentCorrelationId()).toBe(id1);

      service.endOperation(id1);
      expect(service.getCurrentCorrelationId()).toBeUndefined();
    });
  });
});
