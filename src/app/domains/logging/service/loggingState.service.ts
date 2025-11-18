import { Injectable, signal, computed } from "@angular/core";
import { Log } from "../logging.model";

@Injectable({
    providedIn: 'root',
})
export class LogStateService {
    // Single source of truth
    private _logs = signal<Log[]>([]);

    // Computed signal: logs sorted newest first
    readonly logs = computed(() => {
        // [...this._logs()] creates a new array before sorting that array so we don't sort the original
        return [...this._logs()].sort((a, b) =>
            b.timeStamp.getTime() - a.timeStamp.getTime()
        );
    });

    // Setter
    setLogs(logs:Log[]):void{
        this._logs.set(logs);
    }

    /**
     * Remove a specific log by ID
     * @param id - The ID of the log to remove
     */
    removeLog(id: number): void {
        this._logs.update(logs => logs.filter(log => log.id !== id));
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this._logs.set([]);
    }
}