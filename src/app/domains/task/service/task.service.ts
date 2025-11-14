import { Injectable } from '@angular/core';
import { TaskRepository } from '../data/task.repository';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskHistory,
  TaskTags,
} from '../task.model';
import { TaskStateService } from './taskState.service';

/**
 * Service that acts as a bridge between components and TaskRepository,
 * providing a simpler API for managing tasks.
 */

export type NewTaskData = Omit<Task, 'id' | 'createdAt' | 'lastModifiedAt'>;

export interface TaskUpdateData {
  title?: string;
  content?: string;
  deleted?: boolean;
  deletionAt?: Date;
  lastModifiedAt?: Date;
  status?: TaskStatus;
  priority?: TaskPriority;
  history?: TaskHistory[];
  tags?: TaskTags[];
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  constructor(
    private repo: TaskRepository,
    private taskState: TaskStateService
  ) {}

  // Retrieve all tasks from repository and update state
  getTasks(): Task[] {
    const tasks = this.repo.getAll();
    this.taskState.setTasks(tasks);
    return tasks;
  }

  // Add a new task to the repository
  add(data: NewTaskData): Task {
    const now = new Date();
    const id = Date.now();

    const newTask: Task = {
      id,
      title: data.title,
      content: data.content,
      createdAt: now,
      lastModifiedAt: now,
      status: data.status,
      priority: data.priority,
      tags: data.tags,
      deleted: false,
      deletionAt: undefined,
      history: [
        {
          modifiedAt: now,
          changes: {
            title: { oldValue: null, newValue: data.title },
            content: { oldValue: null, newValue: data.content },
            status: { oldValue: null, newValue: data.status },
            priority: { oldValue: null, newValue: data.priority },
            tags: { oldValue: null, newValue: data.tags },
          },
        },
      ],
    };

    const tasks = [...this.repo.getAll(), newTask];
    this.repo.saveAll(tasks);
    this.taskState.setTasks(tasks);

    return newTask;
  }

  // Update an existing task in the repository
  update(id: number, updates: TaskUpdateData): void {
    const tasks = this.repo.getAll().map((t) => ({ ...t }));
    const target = tasks.find((t) => t.id === id);

    if (!target) return;

    const now = new Date();
    const changes: TaskHistory['changes'] = {};

    for (const key of Object.keys(updates) as (keyof TaskUpdateData)[]) {
      if (key === 'history' || key === 'lastModifiedAt') continue;

      const newValue = updates[key];
      const oldValue = target[key as keyof Task];

      if (newValue !== undefined && this.hasChanged(oldValue, newValue)) {
        // ✅ Strongly typed assignment
        (changes as any)[key] = {
          oldValue,
          newValue,
        };
      }
    }

    if (Object.keys(changes).length > 0) {
      target.history = target.history || [];
      target.history.push({
        modifiedAt: now,
        changes,
      });
    }

    Object.assign(target, updates, { lastModifiedAt: now });
    this.repo.saveAll(tasks);
    this.taskState.setTasks(tasks);
  }

  // Helper
  private hasChanged(a: any, b: any): boolean {
    return JSON.stringify(a) !== JSON.stringify(b);
  }

  // Soft delete a task by marking it as deleted
  softDelete(id: number): void {
    const tasks = this.repo.getAll().map((t) => ({ ...t }));
    const target = tasks.find((t) => t.id === id);

    if (!target) return;

    const now = new Date();

    // Initialize history if not present
    target.history = target.history || [];

    // Record the deletion action in history with old/new values
    target.history.push({
      modifiedAt: now,
      changes: {
        deleted: {
          oldValue: target.deleted ?? false,
          newValue: true,
        },
        deletionAt: {
          oldValue: target.deletionAt ?? undefined,
          newValue: now,
        },
      },
    });

    // Apply soft delete flags
    target.deleted = true;
    target.deletionAt = now;
    target.lastModifiedAt = now;

    // Persist updated list
    this.repo.saveAll(tasks);
    this.taskState.setTasks(tasks);
  }

  // Permanently delete a task from the repository
  delete(id: number): void {
    const tasks = this.repo.getAll().filter((t) => t.id !== id);
    this.repo.saveAll(tasks);
    this.taskState.setTasks(tasks);
  }

  //Revert task to a previous state based on history index
  revertToHistory(taskId: number, historyIndex: number): void {
    const tasks = this.repo.getAll().map((t) => ({ ...t }));
    const target = tasks.find((t) => t.id === taskId);

    if (
      !target ||
      !target.history ||
      historyIndex < 0 ||
      historyIndex >= target.history.length
    ) {
      return;
    }

    const historyEntry = target.history[historyIndex];
    const now = new Date();

    // Apply old values from the selected history entry
    for (const [key, change] of Object.entries(historyEntry.changes)) {
      (target as any)[key] = change.oldValue;
    }

    // Record this revert action as a new history entry
    target.history.push({
      modifiedAt: now,
      changes: Object.fromEntries(
        Object.entries(historyEntry.changes).map(([key, change]) => [
          key,
          { oldValue: change.newValue, newValue: change.oldValue },
        ])
      ),
    });

    target.lastModifiedAt = now;
    this.repo.saveAll(tasks);
    this.taskState.setTasks(tasks);
  }
}
