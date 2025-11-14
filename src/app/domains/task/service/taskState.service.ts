import { Injectable, signal, computed } from '@angular/core';
import { Task } from '../task.model';

/**
 * State management service for tasks using Angular signals.
 * Provides reactive state for task list and editing.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskStateService {
  // Selected task ID for editing (null = not editing)
  selectedTaskId = signal<number | null>(null);

  setSelectedTaskId(id: number | null): void {
    this.selectedTaskId.set(id);
    console.log('Selected Task ID set to:', id);
  }

  // Single source of truth: all tasks (writable signal - private)
  private _tasks = signal<Task[]>([]);

  // Public readonly signal - components read this
  readonly tasks = this._tasks.asReadonly();

  // Derived counts - automatically computed from signals above
  readonly taskCount = computed(() => this._tasks().length);

  readonly pendingTaskCount = computed(
    () => this._tasks().filter((t) => t.status === 'pending').length
  );

  readonly inProgressTaskCount = computed(
    () => this._tasks().filter((t) => t.status === 'in-progress').length
  );

  readonly completedTaskCount = computed(
    () => this._tasks().filter((t) => t.status === 'completed').length
  );

  readonly completionRate = computed(() => {
    const total = this._tasks().length;
    if (total === 0) return '0%';
    const completed = this.completedTaskCount();
    return ((completed / total) * 100).toFixed(1) + '%';
  });

  readonly pendingRate = computed(() => {
    const total = this._tasks().length;
    if (total === 0) return '0%';
    const pending = this.pendingTaskCount();
    return ((pending / total) * 100).toFixed(1) + '%';
  });

  readonly inProgressRate = computed(() => {
    const total = this._tasks().length;
    if (total === 0) return '0%';
    const inProgress = this.inProgressTaskCount();
    return ((inProgress / total) * 100).toFixed(1) + '%';
  });

  // Filtered task lists by status (computed once per change)
  readonly pendingTasks = computed(() =>
    this._tasks().filter((t) => t.status === 'pending')
  );

  readonly inProgressTasks = computed(() =>
    this._tasks().filter((t) => t.status === 'in-progress')
  );

  readonly completedTasks = computed(() =>
    this._tasks().filter((t) => t.status === 'completed')
  );

  // Average completion time in milliseconds
  readonly averageCompletionTimeMs = computed(() => {
    const completedTasks = this._tasks().filter(
      (t) => t.status === 'completed'
    );
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      if (!task.lastModifiedAt) return sum;
      const completionTime =
        task.lastModifiedAt.getTime() - task.createdAt.getTime();
      return sum + completionTime;
    }, 0);

    return totalTime / completedTasks.length;
  });

  // Average completion time formatted as human-readable string
  readonly averageCompletionTime = computed(() => {
    const avgMs = this.averageCompletionTimeMs();
    if (avgMs === 0) return 'N/A';

    const hours = Math.floor(avgMs / (1000 * 60 * 60));
    const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((avgMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  });

  // Single setter - updates all derived signals automatically
  setTasks(tasks: Task[]): void {
    this._tasks.set(tasks);
  }
}
