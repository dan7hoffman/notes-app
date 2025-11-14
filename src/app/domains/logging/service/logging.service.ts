import { Injectable } from "@angular/core";
import { LoggingRepository } from "../data/logging.repository";
import { SystemLogging } from "../logging.model";

@Injectable({
    providedIn: 'root',
})
export class LoggingService {
    constructor(
        private repo: LoggingRepository
    ){}
    getSystemLogging(): SystemLogging[]{
        const systemLogging = this.repo.getAll();
        return systemLogging;
    }
}