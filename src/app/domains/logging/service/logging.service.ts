import { Injectable } from "@angular/core";
import { LoggingRepository } from "../data/logging.repository";
import { Log, LogLevel } from "../logging.model";
import { LogStateService } from "./loggingState.service";

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
        // Order matters
        const logs = [...existingLogs,newLog];
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