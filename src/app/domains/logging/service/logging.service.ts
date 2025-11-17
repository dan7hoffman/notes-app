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
        const id = Date.now();
        const newLog:Log={
    id,
    level: data.level,
    message: data.message,
    context: data.context,
    data: data.data,
    timeStamp: now,
        };
        const logs = [...this.repo.getAll(),newLog];
        this.repo.saveAll(logs);
        this.logState.setLogs(logs);
        return newLog;
    }
}