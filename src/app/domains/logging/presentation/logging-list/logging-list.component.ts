import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LoggingService } from "../../service/logging.service";
import { formatAbsoluteDateTime } from "../../../../shared/utils/date-formatter.util";

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

    // Expose formatter for template use
    formatAbsoluteDateTime = formatAbsoluteDateTime;

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