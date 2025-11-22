export enum LogLevel {
  Information = 'info',
  Warning = 'warn',
  Error = 'error',
}

export interface Log {
    id: number;
    level: LogLevel;
    message: string;
    context?: string;
    data?: unknown;
    timeStamp: Date;
    // Enterprise fields
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    duration?: number; // milliseconds
}

/**
 * Alert rule for monitoring log patterns
 */
export interface AlertRule {
    id: string;
    name: string;
    enabled: boolean;
    condition: AlertCondition;
    action: AlertAction;
}

export interface AlertCondition {
    type: 'level_threshold' | 'pattern_match' | 'frequency';
    level?: LogLevel;
    pattern?: string;
    threshold?: number;
    windowMs?: number; // time window for frequency checks
}

export interface AlertAction {
    type: 'console' | 'toast' | 'callback';
    message?: string;
}

/**
 * User context for attribution
 */
export interface UserContext {
    userId: string;
    sessionId: string;
    metadata?: Record<string, unknown>;
}

/**
 * Operation tracking for correlations
 */
export interface Operation {
    correlationId: string;
    name: string;
    startTime: number;
    metadata?: Record<string, unknown>;
}