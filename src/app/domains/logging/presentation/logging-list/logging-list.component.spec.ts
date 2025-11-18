import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoggingListComponent } from './logging-list.component';
import { LoggingService } from '../../service/logging.service';
import { LogStateService } from '../../service/loggingState.service';
import { LoggingRepository } from '../../data/logging.repository';
import { Log, LogLevel } from '../../logging.model';
import { signal } from '@angular/core';

describe('LoggingListComponent', () => {
    let component: LoggingListComponent;
    let fixture: ComponentFixture<LoggingListComponent>;
    let loggingService: jasmine.SpyObj<LoggingService>;

    const mockLogs: Log[] = [
        {
            id: 1,
            level: LogLevel.Information,
            message: 'Test info message',
            context: 'TestContext',
            data: { test: 'data1' },
            timeStamp: new Date('2024-01-01T10:00:00'),
        },
        {
            id: 2,
            level: LogLevel.Warning,
            message: 'Test warning message',
            context: 'TestContext',
            timeStamp: new Date('2024-01-01T11:00:00'),
        },
        {
            id: 3,
            level: LogLevel.Error,
            message: 'Test error message',
            timeStamp: new Date('2024-01-01T12:00:00'),
        },
    ];

    beforeEach(async () => {
        // Create spy for LoggingService
        const loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['delete', 'clear'], {
            logs: signal(mockLogs),
        });

        await TestBed.configureTestingModule({
            imports: [LoggingListComponent],
            providers: [
                { provide: LoggingService, useValue: loggingServiceSpy },
                LogStateService,
                LoggingRepository,
            ],
        }).compileComponents();

        loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
        fixture = TestBed.createComponent(LoggingListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Filtering', () => {
        it('should filter logs by search text', () => {
            component.onSearchChange('warning');
            fixture.detectChanges();

            const filtered = component.filteredLogs();
            expect(filtered.length).toBe(1);
            expect(filtered[0].message).toContain('warning');
        });

        it('should filter logs by level', () => {
            component.onLevelChange(LogLevel.Error);
            fixture.detectChanges();

            const filtered = component.filteredLogs();
            expect(filtered.length).toBe(1);
            expect(filtered[0].level).toBe(LogLevel.Error);
        });

        it('should filter logs by both search and level', () => {
            component.onSearchChange('Test');
            component.onLevelChange(LogLevel.Information);
            fixture.detectChanges();

            const filtered = component.filteredLogs();
            expect(filtered.length).toBe(1);
            expect(filtered[0].level).toBe(LogLevel.Information);
        });

        it('should return all logs when no filters applied', () => {
            const filtered = component.filteredLogs();
            expect(filtered.length).toBe(mockLogs.length);
        });

        it('should search in message, context, and data', () => {
            component.onSearchChange('data1');
            fixture.detectChanges();

            const filtered = component.filteredLogs();
            expect(filtered.length).toBe(1);
            expect(filtered[0].id).toBe(1);
        });
    });

    describe('Pagination', () => {
        beforeEach(() => {
            // Create more logs to test pagination
            const manyLogs: Log[] = [];
            for (let i = 1; i <= 50; i++) {
                manyLogs.push({
                    id: i,
                    level: LogLevel.Information,
                    message: `Log message ${i}`,
                    timeStamp: new Date(`2024-01-01T${(i % 24).toString().padStart(2, '0')}:00:00`),
                });
            }
            (loggingService.logs as any).set(manyLogs);
            fixture.detectChanges();
        });

        it('should paginate logs with default page size of 20', () => {
            const paginated = component.paginatedLogs();
            expect(paginated.length).toBe(20);
        });

        it('should calculate total pages correctly', () => {
            const totalPages = component.totalPages();
            expect(totalPages).toBe(3); // 50 logs / 20 per page = 3 pages
        });

        it('should navigate to next page', () => {
            expect(component.currentPage()).toBe(0);

            component.nextPage();
            fixture.detectChanges();

            expect(component.currentPage()).toBe(1);
            const paginated = component.paginatedLogs();
            expect(paginated.length).toBe(20);
        });

        it('should navigate to previous page', () => {
            component.goToPage(1);
            fixture.detectChanges();

            component.previousPage();
            fixture.detectChanges();

            expect(component.currentPage()).toBe(0);
        });

        it('should not go to previous page when on first page', () => {
            expect(component.canGoPrevious()).toBe(false);

            component.previousPage();
            fixture.detectChanges();

            expect(component.currentPage()).toBe(0);
        });

        it('should not go to next page when on last page', () => {
            component.goToPage(2); // Last page (0-indexed)
            fixture.detectChanges();

            expect(component.canGoNext()).toBe(false);

            component.nextPage();
            fixture.detectChanges();

            expect(component.currentPage()).toBe(2);
        });

        it('should reset to first page when search changes', () => {
            component.goToPage(1);
            fixture.detectChanges();
            expect(component.currentPage()).toBe(1);

            component.onSearchChange('test');
            fixture.detectChanges();

            expect(component.currentPage()).toBe(0);
        });

        it('should reset to first page when level filter changes', () => {
            component.goToPage(1);
            fixture.detectChanges();
            expect(component.currentPage()).toBe(1);

            component.onLevelChange(LogLevel.Error);
            fixture.detectChanges();

            expect(component.currentPage()).toBe(0);
        });

        it('should show last page with remaining items', () => {
            component.goToPage(2); // Last page
            fixture.detectChanges();

            const paginated = component.paginatedLogs();
            expect(paginated.length).toBe(10); // 50 - (20 * 2) = 10 remaining
        });
    });

    describe('Log Expansion', () => {
        it('should toggle log expansion', () => {
            expect(component.isExpanded(1)).toBe(false);

            component.toggleExpand(1);
            expect(component.isExpanded(1)).toBe(true);

            component.toggleExpand(1);
            expect(component.isExpanded(1)).toBe(false);
        });

        it('should track multiple expanded logs', () => {
            component.toggleExpand(1);
            component.toggleExpand(2);

            expect(component.isExpanded(1)).toBe(true);
            expect(component.isExpanded(2)).toBe(true);
            expect(component.isExpanded(3)).toBe(false);
        });
    });

    describe('Delete Operations', () => {
        it('should delete a specific log when confirmed', () => {
            spyOn(window, 'confirm').and.returnValue(true);
            loggingService.delete.and.returnValue(true);

            component.deleteLog(1);

            expect(window.confirm).toHaveBeenCalledWith(
                'Are you sure you want to delete this log?'
            );
            expect(loggingService.delete).toHaveBeenCalledWith(1);
        });

        it('should not delete log when not confirmed', () => {
            spyOn(window, 'confirm').and.returnValue(false);

            component.deleteLog(1);

            expect(window.confirm).toHaveBeenCalled();
            expect(loggingService.delete).not.toHaveBeenCalled();
        });

        it('should remove log from expanded set when deleted', () => {
            spyOn(window, 'confirm').and.returnValue(true);
            loggingService.delete.and.returnValue(true);

            component.toggleExpand(1);
            expect(component.isExpanded(1)).toBe(true);

            component.deleteLog(1);

            expect(component.isExpanded(1)).toBe(false);
        });

        it('should clear all logs when confirmed', () => {
            spyOn(window, 'confirm').and.returnValue(true);
            loggingService.clear.and.returnValue(true);

            component.clearAllLogs();

            expect(window.confirm).toHaveBeenCalledWith(
                'Are you sure you want to clear all logs? This cannot be undone.'
            );
            expect(loggingService.clear).toHaveBeenCalled();
        });

        it('should not clear logs when not confirmed', () => {
            spyOn(window, 'confirm').and.returnValue(false);

            component.clearAllLogs();

            expect(window.confirm).toHaveBeenCalled();
            expect(loggingService.clear).not.toHaveBeenCalled();
        });

        it('should clear expanded logs set when clearing all logs', () => {
            spyOn(window, 'confirm').and.returnValue(true);
            loggingService.clear.and.returnValue(true);

            component.toggleExpand(1);
            component.toggleExpand(2);

            component.clearAllLogs();

            expect(component.isExpanded(1)).toBe(false);
            expect(component.isExpanded(2)).toBe(false);
        });
    });

    describe('Log Level Icons', () => {
        it('should have correct icon mappings', () => {
            expect(component.logLevelIcons[LogLevel.Information]).toBe('info');
            expect(component.logLevelIcons[LogLevel.Warning]).toBe('warning');
            expect(component.logLevelIcons[LogLevel.Error]).toBe('error');
        });
    });

    describe('Date Formatting', () => {
        it('should expose formatAbsoluteDateTime utility', () => {
            expect(component.formatAbsoluteDateTime).toBeDefined();
            expect(typeof component.formatAbsoluteDateTime).toBe('function');
        });
    });
});
