import { Injectable } from '@angular/core';
import { Task, TaskHistory } from '../task.model';
import { TaskUpdateData } from './task.service';
import { deepEquals } from '../../../shared/utils/object-comparison.util';

/**
 * Service responsible for managing task history.
 * Implements Single Responsibility Principle by isolating
 * all history-related logic from TaskService.
 */
@Injectable({
  providedIn: 'root',
})
export class TaskHistoryService {
  /**
   * Creates a history entry for a new task.
   * Records the initial state of all fields.
   */
  createInitialHistory(task: Partial<Task>): TaskHistory {
    const now = new Date();
    return {
      modifiedAt: now,
      changes: {
        title: { oldValue: null, newValue: task.title! },
        content: { oldValue: null, newValue: task.content! },
        status: { oldValue: null, newValue: task.status! },
        priority: { oldValue: null, newValue: task.priority! },
        tags: { oldValue: null, newValue: task.tags! },
      },
    };
  }

  /**
   * Creates a history entry for task updates.
   * Only records changes for fields that actually changed.
   * Uses proper object comparison instead of JSON.stringify.
   */
  createUpdateHistory(
    currentTask: Task,
    updates: TaskUpdateData
  ): TaskHistory | null {
    const now = new Date();
    const changes: TaskHistory['changes'] = {};

    for (const key of Object.keys(updates) as (keyof TaskUpdateData)[]) {
      // Skip metadata fields
      if (key === 'history' || key === 'lastModifiedAt') continue;

      const newValue = updates[key];
      const oldValue = currentTask[key as keyof Task];

      // Use proper comparison instead of JSON.stringify
      if (newValue !== undefined && !deepEquals(oldValue, newValue)) {
        (changes as any)[key] = {
          oldValue,
          newValue,
        };
      }
    }

    // Only create history entry if there are actual changes
    if (Object.keys(changes).length === 0) {
      return null;
    }

    return {
      modifiedAt: now,
      changes,
    };
  }

  /**
   * Creates a history entry for soft delete operations.
   */
  createDeleteHistory(currentTask: Task): TaskHistory {
    const now = new Date();
    return {
      modifiedAt: now,
      changes: {
        deleted: {
          oldValue: currentTask.deleted ?? false,
          newValue: true,
        },
        deletionAt: {
          oldValue: currentTask.deletionAt ?? undefined,
          newValue: now,
        },
      },
    };
  }

  /**
   * Creates a history entry for revert operations.
   * Records the reversal of changes from a specific history entry.
   */
  createRevertHistory(historyEntry: TaskHistory): TaskHistory {
    const now = new Date();
    return {
      modifiedAt: now,
      changes: Object.fromEntries(
        Object.entries(historyEntry.changes).map(([key, change]) => [
          key,
          { oldValue: change.newValue, newValue: change.oldValue },
        ])
      ),
    };
  }

  /**
   * Applies old values from a history entry to a task.
   * Returns a new task object with the reverted values (immutable).
   */
  applyHistoryRevert(task: Task, historyEntry: TaskHistory): Partial<Task> {
    const updates: Partial<Task> = {};

    for (const [key, change] of Object.entries(historyEntry.changes)) {
      (updates as any)[key] = change.oldValue;
    }

    return updates;
  }

  /**
   * Adds a history entry to a task's history array (immutable).
   * Returns a new history array with the entry appended.
   */
  addHistoryEntry(
    currentHistory: TaskHistory[] | undefined,
    newEntry: TaskHistory
  ): TaskHistory[] {
    const history = currentHistory || [];
    return [...history, newEntry];
  }
}
