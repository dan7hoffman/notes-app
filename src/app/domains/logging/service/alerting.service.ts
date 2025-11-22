import { Injectable, Inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Log, LogLevel, AlertRule, AlertCondition } from '../logging.model';

const ALERT_RULES_STORAGE_KEY = 'logging_alert_rules';

/**
 * Service for managing alert rules that trigger on log patterns.
 * Evaluates incoming logs against configured rules and executes actions.
 *
 * @example
 * ```typescript
 * // Add a rule to alert on errors
 * alertingService.addRule({
 *   id: 'error-alert',
 *   name: 'Error Alert',
 *   enabled: true,
 *   condition: { type: 'level_threshold', level: LogLevel.Error },
 *   action: { type: 'console', message: 'Error detected!' }
 * });
 *
 * // Evaluate a log against rules
 * alertingService.evaluate(newLog);
 * ```
 */
@Injectable({
    providedIn: 'root',
})
export class AlertingService {
    private readonly _rules = signal<AlertRule[]>([]);
    private readonly _recentLogs = signal<Log[]>([]); // For frequency checks
    private readonly FREQUENCY_WINDOW_DEFAULT = 60000; // 1 minute
    private readonly MAX_RECENT_LOGS = 100;

    /**
     * All alert rules as a readonly signal
     */
    readonly rules = computed(() => this._rules());

    /**
     * Count of enabled rules
     */
    readonly enabledRuleCount = computed(() =>
        this._rules().filter(r => r.enabled).length
    );

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        this.loadRules();
    }

    private get isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    /**
     * Load rules from localStorage
     */
    private loadRules(): void {
        if (!this.isBrowser) return;

        try {
            const raw = localStorage.getItem(ALERT_RULES_STORAGE_KEY);
            if (raw) {
                const rules = JSON.parse(raw);
                if (Array.isArray(rules)) {
                    this._rules.set(rules);
                }
            }
        } catch (error) {
            console.error('[AlertingService] Failed to load rules:', error);
        }
    }

    /**
     * Save rules to localStorage
     */
    private saveRules(): void {
        if (!this.isBrowser) return;

        try {
            localStorage.setItem(ALERT_RULES_STORAGE_KEY, JSON.stringify(this._rules()));
        } catch (error) {
            console.error('[AlertingService] Failed to save rules:', error);
        }
    }

    /**
     * Add a new alert rule
     * @param rule - The rule to add
     */
    addRule(rule: AlertRule): void {
        this._rules.update(rules => [...rules, rule]);
        this.saveRules();
    }

    /**
     * Update an existing rule
     * @param id - Rule ID to update
     * @param updates - Partial rule updates
     */
    updateRule(id: string, updates: Partial<AlertRule>): void {
        this._rules.update(rules =>
            rules.map(r => r.id === id ? { ...r, ...updates } : r)
        );
        this.saveRules();
    }

    /**
     * Remove a rule by ID
     * @param id - Rule ID to remove
     */
    removeRule(id: string): void {
        this._rules.update(rules => rules.filter(r => r.id !== id));
        this.saveRules();
    }

    /**
     * Toggle a rule's enabled state
     * @param id - Rule ID to toggle
     */
    toggleRule(id: string): void {
        this._rules.update(rules =>
            rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
        );
        this.saveRules();
    }

    /**
     * Get a rule by ID
     * @param id - Rule ID
     * @returns The rule or undefined
     */
    getRule(id: string): AlertRule | undefined {
        return this._rules().find(r => r.id === id);
    }

    /**
     * Evaluate a log against all enabled rules
     * @param log - The log to evaluate
     * @returns Array of triggered rule IDs
     */
    evaluate(log: Log): string[] {
        // Update recent logs for frequency checks
        this._recentLogs.update(logs => {
            const updated = [...logs, log];
            // Keep only recent logs within the window
            const cutoff = Date.now() - this.FREQUENCY_WINDOW_DEFAULT;
            return updated
                .filter(l => l.timeStamp.getTime() > cutoff)
                .slice(-this.MAX_RECENT_LOGS);
        });

        const triggered: string[] = [];
        const enabledRules = this._rules().filter(r => r.enabled);

        for (const rule of enabledRules) {
            if (this.checkCondition(rule.condition, log)) {
                this.executeAction(rule);
                triggered.push(rule.id);
            }
        }

        return triggered;
    }

    /**
     * Check if a log matches a condition
     */
    private checkCondition(condition: AlertCondition, log: Log): boolean {
        switch (condition.type) {
            case 'level_threshold':
                return this.checkLevelThreshold(condition, log);
            case 'pattern_match':
                return this.checkPatternMatch(condition, log);
            case 'frequency':
                return this.checkFrequency(condition, log);
            default:
                return false;
        }
    }

    /**
     * Check if log level matches or exceeds threshold
     */
    private checkLevelThreshold(condition: AlertCondition, log: Log): boolean {
        if (!condition.level) return false;

        const levelOrder = {
            [LogLevel.Information]: 0,
            [LogLevel.Warning]: 1,
            [LogLevel.Error]: 2,
        };

        return levelOrder[log.level] >= levelOrder[condition.level];
    }

    /**
     * Check if log message matches pattern
     */
    private checkPatternMatch(condition: AlertCondition, log: Log): boolean {
        if (!condition.pattern) return false;

        try {
            const regex = new RegExp(condition.pattern, 'i');
            return regex.test(log.message) ||
                   (log.context ? regex.test(log.context) : false);
        } catch {
            console.warn(`[AlertingService] Invalid pattern: ${condition.pattern}`);
            return false;
        }
    }

    /**
     * Check if log frequency exceeds threshold
     */
    private checkFrequency(condition: AlertCondition, log: Log): boolean {
        if (!condition.threshold) return false;

        const windowMs = condition.windowMs || this.FREQUENCY_WINDOW_DEFAULT;
        const cutoff = Date.now() - windowMs;

        // Count logs matching the same level within the window
        const matchingLogs = this._recentLogs().filter(l =>
            l.level === log.level && l.timeStamp.getTime() > cutoff
        );

        return matchingLogs.length >= condition.threshold;
    }

    /**
     * Execute an alert action
     */
    private executeAction(rule: AlertRule): void {
        const message = rule.action.message || `Alert triggered: ${rule.name}`;

        switch (rule.action.type) {
            case 'console':
                console.warn(`[ALERT] ${message}`);
                break;
            case 'toast':
                // Toast would be handled by UI layer
                // Emit event or use notification service
                console.warn(`[ALERT-TOAST] ${message}`);
                break;
            case 'callback':
                // Callback would be registered separately
                console.warn(`[ALERT-CALLBACK] ${message}`);
                break;
        }
    }

    /**
     * Clear all rules
     */
    clearRules(): void {
        this._rules.set([]);
        this.saveRules();
    }

    /**
     * Get all rules
     */
    getRules(): AlertRule[] {
        return this._rules();
    }
}
