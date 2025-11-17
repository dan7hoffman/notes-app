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
        return [...this._logs()].sort((a, b) =>
            b.timeStamp.getTime() - a.timeStamp.getTime()
        );
    });

    // Setter
    setLogs(logs:Log[]):void{
        this._logs.set(logs);
    }
}