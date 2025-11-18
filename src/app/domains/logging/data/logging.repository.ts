import { isPlatformBrowser } from "@angular/common";
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { LOGGING_STORAGE_KEY } from "../logging.constants";
import { Log } from "../logging.model";
import { dateReviver } from "../../../shared/utils/json-serialization.util";

@Injectable({providedIn:'root'})
export class LoggingRepository {
    constructor(@Inject(PLATFORM_ID) private platformId: Object){}
    private readonly storageKey = LOGGING_STORAGE_KEY;
    private get isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }
    getAll(): Log[]{
        if (!this.isBrowser) return [];
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw){
                return[];
            }
            // Use dateReviver to convert stored ISO STRINGS back into an actual DATE OBJECT
            const logs = JSON.parse(raw, dateReviver);
            if (!Array.isArray(logs)){
                return[];
            }
            return logs;
        } catch (error){
            console.error('[LoggingRepository] Failed to load logs from localStorage:', error);
            return [];
        }
    }
    saveAll(logs:Log[]):boolean{
        if (!this.isBrowser) return false;
        try {
        const logsCopy = logs.map(log => ({...log}));
        const serialized = JSON.stringify(logsCopy);
        localStorage.setItem(this.storageKey,serialized);
        return true;
        } catch (error){
            console.error('[LoggingRepository] Failed to save logs to localStorage:', error);
            return false;
        }
    }

    /**
     * Delete a specific log by ID
     * @param id - The ID of the log to delete
     * @returns true if successful, false otherwise
     */
    delete(id: number): boolean {
        const logs = this.getAll();
        const filtered = logs.filter(log => log.id !== id);

        // If nothing was filtered, log doesn't exist
        if (filtered.length === logs.length) {
            console.warn(`[LoggingRepository] Log with id ${id} not found`);
            return false;
        }

        return this.saveAll(filtered);
    }

    /**
     * Clear all logs from storage
     * @returns true if successful, false otherwise
     */
    clear(): boolean {
        if (!this.isBrowser) return false;

        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('[LoggingRepository] Failed to clear logs from localStorage:', error);
            return false;
        }
    }
}
