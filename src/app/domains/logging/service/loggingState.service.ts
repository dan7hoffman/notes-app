import { Injectable, signal } from "@angular/core";
import { Log } from "../logging.model";

@Injectable({
    providedIn: 'root',
})
export class LogStateService {
    // Single source of truth
    private _logs = signal<Log[]>([]);
    readonly logs = this._logs.asReadonly();
    // Setter
    setLogs(logs:Log[]):void{
        this._logs.set(logs);
    }
}