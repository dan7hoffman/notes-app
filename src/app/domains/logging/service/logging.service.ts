import { Injectable } from "@angular/core";
import { LoggingRepository } from "../data/logging.repository";
import { Log, LogLevel } from "../logging.model";
import { LogStateService } from "./loggingState.service";
import { MAX_LOG_RETENTION } from "../logging.constants";

export type NewLogData = Omit<Log, 'id' | 'timeStamp'>;

@Injectable({
    providedIn: 'root',
})


export class LoggingService {
    constructor(
        private repo: LoggingRepository,
        private logState: LogStateService,
    ){
        // Initialize signal state from repository on service creation
        this.loadLogs();
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

        const newLog:Log={
    id,
    level: data.level,
    message: data.message,
    context: data.context,
    data: data.data,
    timeStamp: now,
        };
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
}