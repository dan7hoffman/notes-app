import { Injectable } from "@angular/core";
import { LoggingRepository } from "../data/logging.repository";
import { Log, LogLevel } from "../logging.model";
import { LogStateService } from "./loggingState.service";
import { UserContextService } from "./user-context.service";
import { CorrelationService } from "./correlation.service";
import { AlertingService } from "./alerting.service";
import { MAX_LOG_RETENTION } from "../logging.constants";

/**
 * Data required to create a new log entry.
 * Enterprise fields (userId, sessionId, correlationId, duration) are auto-populated.
 */
export type NewLogData = Omit<Log, 'id' | 'timeStamp' | 'userId' | 'sessionId' | 'correlationId'> & {
    /** Override auto-populated correlation ID */
    correlationId?: string;
    /** Duration in ms (for completed operations) */
    duration?: number;
};

@Injectable({
    providedIn: 'root',
})


export class LoggingService {
    constructor(
        private repo: LoggingRepository,
        private logState: LogStateService,
        private userContext: UserContextService,
        private correlation: CorrelationService,
        private alerting: AlertingService,
    ){
        // Initialize signal state from repository on service creation
        this.loadLogs();
    }

    /**
     * Get the UserContextService for setting user/session info
     */
    get userContextService(): UserContextService {
        return this.userContext;
    }

    /**
     * Get the CorrelationService for operation tracking
     */
    get correlationService(): CorrelationService {
        return this.correlation;
    }

    /**
     * Get the AlertingService for rule management
     */
    get alertingService(): AlertingService {
        return this.alerting;
    }

    // Load logs from repository and sync with signal state
    private loadLogs(): void {
        const logs = this.repo.getAll();
        this.logState.setLogs(logs);
    }

    // Refresh logs from repository (useful if external changes occur)
    refresh(): void {
        this.loadLogs();
    }

    // Get logs as readonly signal for reactive access
    get logs() {
        return this.logState.logs;
    }

    //When new LOG is ADDED it adds to the local storage AND the signal
    add(data:NewLogData): Log {
        const now = new Date();

        // Generate unique incremental ID
        const existingLogs = this.repo.getAll();
        const maxId = existingLogs.length > 0
            ? Math.max(...existingLogs.map(l => l.id))
            : 0;
        const id = maxId + 1;

        // Get user context for attribution
        const userCtx = this.userContext.getContext();

        // Get correlation ID (from data override or current operation)
        const correlationId = data.correlationId || this.correlation.getCurrentCorrelationId();

        const newLog: Log = {
            id,
            level: data.level,
            message: data.message,
            context: data.context,
            data: data.data,
            timeStamp: now,
            // Enterprise fields
            userId: userCtx.userId,
            sessionId: userCtx.sessionId,
            correlationId,
            duration: data.duration,
        };

        // Evaluate alert rules
        this.alerting.evaluate(newLog);

        // Order matters - add new log
        let logs = [...existingLogs, newLog];

        // Enforce max retention - remove oldest logs if over limit
        if (logs.length > MAX_LOG_RETENTION) {
            // Sort by timestamp ascending (oldest first), then take only the newest
            logs = logs
                .sort((a, b) => a.timeStamp.getTime() - b.timeStamp.getTime())
                .slice(logs.length - MAX_LOG_RETENTION);
        }

        // Persist first
        const saved = this.repo.saveAll(logs);
        // Then update signal
        this.logState.setLogs(logs);
        if (!saved) {
            console.warn('[LoggingService] Log added to memory but failed to persist to storage');
        }
        return newLog;
    }

    /**
     * Convenience method: Log an informational message
     * @param message - The log message
     * @param options - Optional context and data
     * @returns The created log entry
     */
    logInfo(message: string, options?: { context?: string; data?: any }): Log {
        return this.add({
            level: LogLevel.Information,
            message,
            context: options?.context,
            data: options?.data
        });
    }

    /**
     * Convenience method: Log a warning message
     * @param message - The log message
     * @param options - Optional context and data
     * @returns The created log entry
     */
    logWarn(message: string, options?: { context?: string; data?: any }): Log {
        return this.add({
            level: LogLevel.Warning,
            message,
            context: options?.context,
            data: options?.data
        });
    }

    /**
     * Convenience method: Log an error message
     * @param message - The log message
     * @param options - Optional context and data
     * @returns The created log entry
     */
    logError(message: string, options?: { context?: string; data?: any }): Log {
        return this.add({
            level: LogLevel.Error,
            message,
            context: options?.context,
            data: options?.data
        });
    }

    /**
     * Delete a specific log by ID
     * @param id - The ID of the log to delete
     * @returns true if successful, false otherwise
     */
    delete(id: number): boolean {
        const success = this.repo.delete(id);
        if (success) {
            this.logState.removeLog(id);
        }
        return success;
    }

    /**
     * Clear all logs
     * @returns true if successful, false otherwise
     */
    clear(): boolean {
        const success = this.repo.clear();
        if (success) {
            this.logState.clearLogs();
        }
        return success;
    }

    /**
     * Start a tracked operation with automatic correlation
     * @param name - Operation name (e.g., 'createTask', 'updateAccount')
     * @param metadata - Optional metadata for the operation
     * @returns Correlation ID for the operation
     *
     * @example
     * ```typescript
     * const correlationId = loggingService.startOperation('createTask');
     * // ... do work, logs will include this correlationId
     * const duration = loggingService.endOperation(correlationId, 'Task created successfully');
     * ```
     */
    startOperation(name: string, metadata?: Record<string, unknown>): string {
        const correlationId = this.correlation.startOperation(name, metadata);
        this.logInfo(`Operation started: ${name}`, {
            context: 'OperationTracker',
            data: { correlationId, ...metadata }
        });
        return correlationId;
    }

    /**
     * End a tracked operation and log the result
     * @param correlationId - The correlation ID from startOperation
     * @param message - Success message to log
     * @param options - Optional additional log options
     * @returns Duration in milliseconds
     */
    endOperation(
        correlationId: string,
        message?: string,
        options?: { context?: string; data?: any }
    ): number | undefined {
        const duration = this.correlation.endOperation(correlationId);
        if (duration !== undefined && message) {
            this.logInfo(message, {
                context: options?.context || 'OperationTracker',
                data: {
                    correlationId,
                    durationMs: Math.round(duration),
                    ...options?.data
                }
            });
        }
        return duration;
    }

    /**
     * End a tracked operation with an error
     * @param correlationId - The correlation ID from startOperation
     * @param message - Error message to log
     * @param options - Optional additional log options
     * @returns Duration in milliseconds
     */
    endOperationWithError(
        correlationId: string,
        message: string,
        options?: { context?: string; data?: any }
    ): number | undefined {
        const duration = this.correlation.endOperation(correlationId);
        this.logError(message, {
            context: options?.context || 'OperationTracker',
            data: {
                correlationId,
                durationMs: duration !== undefined ? Math.round(duration) : undefined,
                ...options?.data
            }
        });
        return duration;
    }

    /**
     * Get logs by correlation ID
     * @param correlationId - The correlation ID to filter by
     * @returns Array of logs with matching correlation ID
     */
    getLogsByCorrelation(correlationId: string): Log[] {
        return this.logs().filter(log => log.correlationId === correlationId);
    }

    /**
     * Get logs by user ID
     * @param userId - The user ID to filter by
     * @returns Array of logs from that user
     */
    getLogsByUser(userId: string): Log[] {
        return this.logs().filter(log => log.userId === userId);
    }

    /**
     * Get logs by session ID
     * @param sessionId - The session ID to filter by
     * @returns Array of logs from that session
     */
    getLogsBySession(sessionId: string): Log[] {
        return this.logs().filter(log => log.sessionId === sessionId);
    }
}