import { Component, signal, computed } from '@angular/core';
import { TaskService } from '../../service/task.service';
import { TaskStateService } from '../../service/taskState.service';
import { CommonModule } from '@angular/common';
import { TaskStatus } from '../../task.model';
import { formatAbsoluteDateTime } from '../../../../shared/utils/date-formatter.util';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
})
export class TaskListComponent {
  TaskStatus = TaskStatus;
  constructor(
    private taskService: TaskService,
    private taskState: TaskStateService
  ) {}

  ngOnInit(): void {
    this.taskService.getTasks();
  }

  // Filter signal - writable
  private statusFilterSignal = signal<string>('');

  // Getter/setter for template binding
  get statusFilter(): string {
    return this.statusFilterSignal();
  }

  set statusFilter(value: string) {
    this.statusFilterSignal.set(value);
  }

  // Filtered tasks - computed based on statusFilter signal
  tasks = computed(() => {
    const allTasks = this.taskState.tasks();
    const filter = this.statusFilterSignal();

    if (!filter) return allTasks;

    return allTasks.filter((task) => task.status === filter);
  });

  getChanges(changes: Record<string, { oldValue: any; newValue: any }>) {
    return Object.entries(changes).map(([key, change]) => ({
      key,
      oldValue: change.oldValue,
      newValue: change.newValue,
    }));
  }

  getMostRecentChange(history: any[] | undefined): string {
    if (!history || history.length === 0) return 'No changes yet';

    const latestEntry = history[history.length - 1];
    const changes = this.getChanges(latestEntry.changes);

    // Format as "field: oldValue → newValue"
    return changes
      .map(
        (c) =>
          `${c.key}: "${this.formatValue(c.oldValue)}" → "${this.formatValue(
            c.newValue
          )}"`
      )
      .join(', ');
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return formatAbsoluteDateTime(date);
  }

  formatValue(value: any): string {
    if (value instanceof Date) {
      return formatAbsoluteDateTime(value);
    }
    if (Array.isArray(value)) {
      return value.length === 0 ? 'None' : value.join(', ');
    }
    if (value === null || value === undefined) {
      return 'None';
    }
    return String(value);
  }

  editTask(taskId: number) {
    this.taskState.setSelectedTaskId(taskId);
  }

  deleteTask(taskId: number) {
    this.taskService.delete(taskId);
  }

  softDeleteTask(taskId: number) {
    this.taskService.softDelete(taskId);
  }

  undoSoftDeleteTask(taskId: number) {
    this.taskService.update(taskId, { deleted: false, deletionAt: undefined });
  }

  startTask(taskId: number) {
    this.taskService.update(taskId, { status: TaskStatus.InProgress });
  }

  completeTask(taskId: number) {
    this.taskService.update(taskId, { status: TaskStatus.Completed });
  }

  pauseTask(taskId: number) {
    this.taskService.update(taskId, { status: TaskStatus.Pending });
  }

  resumeTask(taskId: number) {
    this.taskService.update(taskId, { status: TaskStatus.InProgress });
  }

  revertTaskChanges(taskId: number, historyIndex: number) {
    this.taskService.revertToHistory(taskId, historyIndex);
  }
}
