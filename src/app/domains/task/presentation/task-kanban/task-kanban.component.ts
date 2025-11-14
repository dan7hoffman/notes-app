import { Component } from '@angular/core';
import { TaskStateService } from '../../service/taskState.service';
import { TaskService } from '../../service/task.service';
import { Task, TaskStatus } from '../../task.model';
import {
  CdkDropListGroup,
  CdkDropList,
  CdkDragDrop,
  CdkDrag,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { formatAbsoluteDateTime } from '../../../../shared/utils/date-formatter.util';

@Component({
  selector: 'app-task-kanban',
  templateUrl: './task-kanban.component.html',
  styleUrls: ['./task-kanban.component.scss'],
  standalone: true,
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CommonModule],
})
export class TaskKanbanComponent {
  // Map each column to its computed signal
  readonly columnTasks = {
    [TaskStatus.Pending]: this.taskState.pendingTasks,
    [TaskStatus.InProgress]: this.taskState.inProgressTasks,
    [TaskStatus.Completed]: this.taskState.completedTasks,
  };

  statusColumns: TaskStatus[] = [
    TaskStatus.Pending,
    TaskStatus.InProgress,
    TaskStatus.Completed,
  ];

  // Track sort option per column
  sortOption: Record<TaskStatus, string> = {
    [TaskStatus.Pending]: '',
    [TaskStatus.InProgress]: '',
    [TaskStatus.Completed]: '',
  };

  constructor(
    private taskState: TaskStateService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    // Populate tasks initially
    this.taskService.getTasks();
  }

  // Handle sort option change
  onSortChange(status: TaskStatus, event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortOption[status] = target.value;
  }

  // Get tasks for a column with sorting applied
  getTasksByStatus(status: TaskStatus): Task[] {
    const tasks = this.columnTasks[status]();
    const sortBy = this.sortOption[status];

    if (!sortBy) return tasks;

    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'date-desc':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'priority-asc':
          return (
            this.priorityValue(a.priority) - this.priorityValue(b.priority)
          );
        case 'priority-desc':
          return (
            this.priorityValue(b.priority) - this.priorityValue(a.priority)
          );
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  }

  // Map priority to numeric value for sorting
  private priorityValue(priority: string): number {
    const map: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
    };
    return map[priority] || 0;
  }

  trackById(_index: number, task: Task) {
    return task.id;
  }

  // Drag & drop handler
  drop(event: CdkDragDrop<any>, newStatus: TaskStatus) {
    const task = event.item.data;

    // Only update if status changed
    if (task.status !== newStatus) {
      this.taskService.update(task.id, { status: newStatus });
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return formatAbsoluteDateTime(date);
  }
}
