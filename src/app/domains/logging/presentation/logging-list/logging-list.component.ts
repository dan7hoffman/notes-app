import { CommonModule } from "@angular/common";
import { Component, computed, effect, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LoggingService } from "../../service/logging.service";
import { formatAbsoluteDateTime } from "../../../../shared/utils/date-formatter.util";
import { LogLevel } from "../../logging.model";
import { DEFAULT_PAGE_SIZE } from "../../logging.constants";

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

    // Search state (component-local)
    private searchInput = signal(''); // Raw input from user
    searchText = signal(''); // Debounced search text
    selectedLevel = signal<'all' | LogLevel>('all');
    private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    onSearchChange(text: string): void {
        this.searchInput.set(text);

        // Clear existing timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        // Set new timer for debounced update
        this.searchDebounceTimer = setTimeout(() => {
            this.searchText.set(text);
            // Reset to first page when search changes
            this.currentPage.set(0);
        }, 300); // 300ms debounce
    }

    onLevelChange(level: string): void {
        this.selectedLevel.set(level as LogLevel | 'all');
        // Reset to first page when filter changes
        this.currentPage.set(0);
    }

    // Pagination state
    pageSize = signal(DEFAULT_PAGE_SIZE);
    currentPage = signal(0);

    // Computed filtered logs
    filteredLogs = computed(() => {
        const logs = this.logs();
        const search = this.searchText().toLowerCase();
        const level = this.selectedLevel();

        return logs.filter(log => {
            // Filter by level
            if (level !== 'all' && log.level !== level) return false;

            // Filter by search
            const searchable = [
                log.message,
                log.context ?? '',
                JSON.stringify(log.data ?? '')
            ].join(' ').toLowerCase();

            if (!searchable.includes(search)) return false;

            return true;
        });
    });

    // Computed paginated logs
    paginatedLogs = computed(() => {
        const filtered = this.filteredLogs();
        const page = this.currentPage();
        const size = this.pageSize();

        const startIndex = page * size;
        const endIndex = startIndex + size;

        return filtered.slice(startIndex, endIndex);
    });

    // Computed pagination metadata
    totalPages = computed(() => {
        const filtered = this.filteredLogs();
        const size = this.pageSize();
        return Math.ceil(filtered.length / size);
    });

    canGoPrevious = computed(() => this.currentPage() > 0);
    canGoNext = computed(() => this.currentPage() < this.totalPages() - 1);

    // Pagination navigation methods
    goToPage(page: number): void {
        const total = this.totalPages();
        if (page >= 0 && page < total) {
            this.currentPage.set(page);
        }
    }

    nextPage(): void {
        if (this.canGoNext()) {
            this.currentPage.update(page => page + 1);
        }
    }

    previousPage(): void {
        if (this.canGoPrevious()) {
            this.currentPage.update(page => page - 1);
        }
    }

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

    /**
     * Delete a specific log
     */
    deleteLog(id: number): void {
        if (confirm('Are you sure you want to delete this log?')) {
            this.loggingService.delete(id);
            // Also remove from expanded set if it was expanded
            this.expandedLogs.delete(id);
        }
    }

    /**
     * Clear all logs
     */
    clearAllLogs(): void {
        if (confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
            this.loggingService.clear();
            // Clear expanded set as well
            this.expandedLogs.clear();
        }
    }

    constructor(
        private loggingService: LoggingService,
    ){}
}