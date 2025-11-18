import { CommonModule } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LoggingService } from "../../service/logging.service";
import { formatAbsoluteDateTime } from "../../../../shared/utils/date-formatter.util";
import { LogLevel } from "../../logging.model";

@Component({
    selector: 'app-logging-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './logging-list.component.html',
    styleUrls: ['./logging-list.component.scss'],
})
export class LoggingListComponent {
    // Access logs directly from the service signal
    logs = this.loggingService.logs;

    // Search state (component-loca)
    searchText = signal ('');
    selectedLevel = signal<'all' | LogLevel>('all');
    onLevelChange(level: string) {
    this.selectedLevel.set(level as LogLevel | 'all');
    }

    // Computed filter logs
    filteredLogs = computed(()=>{
        const logs = this.logs();
        const search = this.searchText().toLowerCase();
        const level = this.selectedLevel();

        return logs.filter(log=>{
            //Filter by level
            if(level != 'all' && log.level !== level) return false;

            //Filter by search
            const searchable = [
            log.message,
            log.context ?? '',
            JSON.stringify(log.data ?? '')
            ].join(' ').toLowerCase();

            if (!searchable.includes(search)) return false;

            return true;
        });
    });

    // Expose formatter for template use
    formatAbsoluteDateTime = formatAbsoluteDateTime;

    // Map log levels to Material Icon names
    logLevelIcons: Record<LogLevel, string> = {
        [LogLevel.Information]: 'info',
        [LogLevel.Warning]: 'warning',
        [LogLevel.Error]: 'error',
    };

    // Track expansion state per log ID
    expandedLogs = new Set<number>();

    toggleExpand(logId: number): void {
        if (this.expandedLogs.has(logId)) {
            this.expandedLogs.delete(logId);
        } else {
            this.expandedLogs.add(logId);
        }
    }

    isExpanded(logId: number): boolean {
        return this.expandedLogs.has(logId);
    }

    constructor(
        private loggingService: LoggingService,
    ){}
}