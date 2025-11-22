import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AlertingService } from './alerting.service';
import { Log, LogLevel, AlertRule } from '../logging.model';

describe('AlertingService', () => {
  let service: AlertingService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem', 'removeItem']);
    localStorageSpy.getItem.and.returnValue(null);

    spyOn(localStorage, 'getItem').and.callFake(localStorageSpy.getItem);
    spyOn(localStorage, 'setItem').and.callFake(localStorageSpy.setItem);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(AlertingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have no rules', () => {
      expect(service.rules().length).toBe(0);
    });

    it('should have zero enabled rule count', () => {
      expect(service.enabledRuleCount()).toBe(0);
    });
  });

  describe('addRule', () => {
    it('should add a rule', () => {
      const rule: AlertRule = {
        id: 'test-rule',
        name: 'Test Rule',
        enabled: true,
        condition: { type: 'level_threshold', level: LogLevel.Error },
        action: { type: 'console', message: 'Error detected' }
      };

      service.addRule(rule);
      expect(service.rules().length).toBe(1);
      expect(service.getRule('test-rule')).toEqual(rule);
    });

    it('should persist to localStorage', () => {
      const rule: AlertRule = {
        id: 'test-rule',
        name: 'Test Rule',
        enabled: true,
        condition: { type: 'level_threshold', level: LogLevel.Error },
        action: { type: 'console' }
      };

      service.addRule(rule);
      expect(localStorageSpy.setItem).toHaveBeenCalled();
    });

    it('should update enabled rule count', () => {
      service.addRule({
        id: 'enabled-rule',
        name: 'Enabled',
        enabled: true,
        condition: { type: 'level_threshold' },
        action: { type: 'console' }
      });
      expect(service.enabledRuleCount()).toBe(1);

      service.addRule({
        id: 'disabled-rule',
        name: 'Disabled',
        enabled: false,
        condition: { type: 'level_threshold' },
        action: { type: 'console' }
      });
      expect(service.enabledRuleCount()).toBe(1);
    });
  });

  describe('removeRule', () => {
    it('should remove a rule by ID', () => {
      service.addRule({
        id: 'rule-to-remove',
        name: 'Remove Me',
        enabled: true,
        condition: { type: 'level_threshold' },
        action: { type: 'console' }
      });

      service.removeRule('rule-to-remove');
      expect(service.rules().length).toBe(0);
    });
  });

  describe('toggleRule', () => {
    it('should toggle rule enabled state', () => {
      service.addRule({
        id: 'toggle-rule',
        name: 'Toggle',
        enabled: true,
        condition: { type: 'level_threshold' },
        action: { type: 'console' }
      });

      expect(service.getRule('toggle-rule')?.enabled).toBeTrue();

      service.toggleRule('toggle-rule');
      expect(service.getRule('toggle-rule')?.enabled).toBeFalse();

      service.toggleRule('toggle-rule');
      expect(service.getRule('toggle-rule')?.enabled).toBeTrue();
    });
  });

  describe('updateRule', () => {
    it('should update rule properties', () => {
      service.addRule({
        id: 'update-rule',
        name: 'Original Name',
        enabled: true,
        condition: { type: 'level_threshold' },
        action: { type: 'console' }
      });

      service.updateRule('update-rule', { name: 'Updated Name' });
      expect(service.getRule('update-rule')?.name).toBe('Updated Name');
    });
  });

  describe('evaluate', () => {
    const createLog = (level: LogLevel, message: string = 'Test'): Log => ({
      id: Date.now(),
      level,
      message,
      timeStamp: new Date()
    });

    describe('level_threshold condition', () => {
      beforeEach(() => {
        service.addRule({
          id: 'error-alert',
          name: 'Error Alert',
          enabled: true,
          condition: { type: 'level_threshold', level: LogLevel.Error },
          action: { type: 'console', message: 'Error detected!' }
        });
      });

      it('should trigger on matching level', () => {
        const triggered = service.evaluate(createLog(LogLevel.Error));
        expect(triggered).toContain('error-alert');
      });

      it('should not trigger on lower level', () => {
        const triggered = service.evaluate(createLog(LogLevel.Information));
        expect(triggered).not.toContain('error-alert');
      });

      it('should trigger on warning if threshold is warning', () => {
        service.addRule({
          id: 'warn-alert',
          name: 'Warning Alert',
          enabled: true,
          condition: { type: 'level_threshold', level: LogLevel.Warning },
          action: { type: 'console' }
        });

        const warnTriggered = service.evaluate(createLog(LogLevel.Warning));
        expect(warnTriggered).toContain('warn-alert');

        const errorTriggered = service.evaluate(createLog(LogLevel.Error));
        expect(errorTriggered).toContain('warn-alert'); // Error >= Warning
      });
    });

    describe('pattern_match condition', () => {
      beforeEach(() => {
        service.addRule({
          id: 'pattern-alert',
          name: 'Pattern Alert',
          enabled: true,
          condition: { type: 'pattern_match', pattern: 'critical' },
          action: { type: 'console' }
        });
      });

      it('should trigger on matching message', () => {
        const triggered = service.evaluate(createLog(LogLevel.Information, 'Critical error occurred'));
        expect(triggered).toContain('pattern-alert');
      });

      it('should be case insensitive', () => {
        const triggered = service.evaluate(createLog(LogLevel.Information, 'CRITICAL failure'));
        expect(triggered).toContain('pattern-alert');
      });

      it('should not trigger on non-matching message', () => {
        const triggered = service.evaluate(createLog(LogLevel.Information, 'Normal operation'));
        expect(triggered).not.toContain('pattern-alert');
      });
    });

    describe('disabled rules', () => {
      it('should not evaluate disabled rules', () => {
        service.addRule({
          id: 'disabled-rule',
          name: 'Disabled',
          enabled: false,
          condition: { type: 'level_threshold', level: LogLevel.Error },
          action: { type: 'console' }
        });

        const triggered = service.evaluate(createLog(LogLevel.Error));
        expect(triggered).not.toContain('disabled-rule');
      });
    });

    describe('multiple rules', () => {
      it('should trigger multiple matching rules', () => {
        service.addRule({
          id: 'rule-1',
          name: 'Rule 1',
          enabled: true,
          condition: { type: 'level_threshold', level: LogLevel.Warning },
          action: { type: 'console' }
        });

        service.addRule({
          id: 'rule-2',
          name: 'Rule 2',
          enabled: true,
          condition: { type: 'pattern_match', pattern: 'error' },
          action: { type: 'console' }
        });

        const triggered = service.evaluate(createLog(LogLevel.Error, 'An error occurred'));
        expect(triggered).toContain('rule-1');
        expect(triggered).toContain('rule-2');
      });
    });
  });

  describe('clearRules', () => {
    it('should remove all rules', () => {
      service.addRule({
        id: 'rule-1',
        name: 'Rule 1',
        enabled: true,
        condition: { type: 'level_threshold' },
        action: { type: 'console' }
      });
      service.addRule({
        id: 'rule-2',
        name: 'Rule 2',
        enabled: true,
        condition: { type: 'level_threshold' },
        action: { type: 'console' }
      });

      service.clearRules();
      expect(service.rules().length).toBe(0);
    });
  });
});
