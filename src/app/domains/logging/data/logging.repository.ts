import { isPlatformBrowser } from "@angular/common";
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { LOGGING_STORAGE_KEY } from "../logging.constants";
import { SystemLogging } from "../logging.model";
import { dateReviver } from "../../../shared/utils/json-serialization.util";

@Injectable({providedIn:'root'})
export class LoggingRepository {
    constructor(@Inject(PLATFORM_ID) private platformId: Object){}
    private readonly storageKey = LOGGING_STORAGE_KEY;
    private get isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }
    getAll(): SystemLogging[]{
        if (!this.isBrowser) return [];
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw){
                return[];
            }
            const systemLogging = JSON.parse(raw, dateReviver);
            if (!Array.isArray(systemLogging)){
                return[];
            }
            return systemLogging;
        } catch (error){
            return [];
        }
    }
    saveAll(systemLogging:SystemLogging[]):boolean{
        if (!this.isBrowser) return false;
        try {
        const systemLoggingCopy = systemLogging.map(systemLog => ({...systemLog}));
        const serialized = JSON.stringify(systemLoggingCopy);
        localStorage.setItem(this.storageKey,serialized);
        return true;
        } catch (error){
            return false;
        }
    }
}
