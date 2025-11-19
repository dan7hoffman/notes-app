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
import { TaskHistoryService } from './taskHistory.service';
import { DEFAULT_TASK_VALUES } from '../task.constants';
import { LoggingService } from '../../logging/service/logging.service';
import { LogLevel } from '../../logging/logging.model';

/**
 * Service that acts as a bridge between components and TaskRepository,
 * providing a simpler API for managing tasks.
 * Delegates all history management to TaskHistoryService.
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
    private taskState: TaskStateService,
    private historyService: TaskHistoryService,
    private loggingService: LoggingService
  ) {}

  // Retrieve all tasks from repository and update state
  getTasks(): Task[] {
    const tasks = this.repo.getAll();
    this.taskState.setTasks(tasks);

    // // Log task load operation
    // this.loggingService.add({
    //   level: LogLevel.Information,
    //   message: 'Tasks loaded from repository',
    //   context: 'TaskService.getTasks',
    //   data: { taskCount: tasks.length }
    // });

    return tasks;
  }

  /**
   * Add a new task to the repository.
   * Creates immutable task object with initial history entry.
   */
  add(data: NewTaskData): Task {
    const now = new Date();
    const id = Date.now();

    // Create initial history using TaskHistoryService
    const initialHistory = this.historyService.createInitialHistory({
      title: data.title,
      content: data.content,
      status: data.status,
      priority: data.priority,
      tags: data.tags,
    });

    // Create new task object (immutable)
    const newTask: Task = {
      id,
      title: data.title,
      content: data.content,
      createdAt: now,
      lastModifiedAt: now,
      status: data.status,
      priority: data.priority,
      tags: data.tags || DEFAULT_TASK_VALUES.TAGS,
      deleted: DEFAULT_TASK_VALUES.DELETED,
      deletionAt: undefined,
      history: [initialHistory],
    };

    // Create new array with new task (immutable)
    const tasks = [...this.repo.getAll(), newTask];
    this.repo.saveAll(tasks);
    this.taskState.setTasks(tasks);

        // Log task CREATE operation
    this.loggingService.logInfo('Tasks created', {
      context: 'TaskService.add',
      data: { newTask }
    });

    return newTask;
  }

  /**
   * Update an existing task in the repository.
   * Uses TaskHistoryService for change detection and history tracking.
   * Ensures immutability by creating new objects/arrays.
   */
  update(id: number, updates: TaskUpdateData): void {
    const currentTasks = this.repo.getAll();
    const targetIndex = currentTasks.findIndex((t) => t.id === id);

    if (targetIndex === -1) {
      // Log error when task not found
      this.loggingService.logError('Attempted to update non-existent task', {
        context: 'TaskService.update',
        data: { taskId: id, updates }
      });
      return;
    }

    const currentTask = currentTasks[targetIndex];
    const now = new Date();

    // Use TaskHistoryService to create history entry
    const historyEntry = this.historyService.createUpdateHistory(
      currentTask,
      updates
    );

    // Create new task object with updates (immutable)
    const updatedTask: Task = {
      ...currentTask,
      ...updates,
      lastModifiedAt: now,
      // Add history entry if there were changes
      history: historyEntry
        ? this.historyService.addHistoryEntry(currentTask.history, historyEntry)
        : currentTask.history,
    };

    // Create new tasks array with updated task (immutable)
    const updatedTasks = [
      ...currentTasks.slice(0, targetIndex),
      updatedTask,
      ...currentTasks.slice(targetIndex + 1),
    ];

    this.repo.saveAll(updatedTasks);
    this.taskState.setTasks(updatedTasks);

    // Log task update operation (only the changes)
    this.loggingService.logInfo('Task updated', {
      context: 'TaskService.update',
      data: { taskId: id, updates }
    });
  }

  /**
   * Soft delete a task by marking it as deleted.
   * Uses TaskHistoryService to create deletion history.
   * Ensures immutability by creating new objects/arrays.
   */
  softDelete(id: number): void {
    const currentTasks = this.repo.getAll();
    const targetIndex = currentTasks.findIndex((t) => t.id === id);

    if (targetIndex === -1) {
      // Log error when task not found
      this.loggingService.logError('Attempted to soft delete non-existent task', {
        context: 'TaskService.softDelete',
        data: { taskId: id }
      });
      return;
    }

    const currentTask = currentTasks[targetIndex];
    const now = new Date();

    // Create deletion history using TaskHistoryService
    const deleteHistory = this.historyService.createDeleteHistory(currentTask);

    // Create new task object with soft delete flags (immutable)
    const deletedTask: Task = {
      ...currentTask,
      deleted: true,
      deletionAt: now,
      lastModifiedAt: now,
      history: this.historyService.addHistoryEntry(
        currentTask.history,
        deleteHistory
      ),
    };

    // Create new tasks array with deleted task (immutable)
    const updatedTasks = [
      ...currentTasks.slice(0, targetIndex),
      deletedTask,
      ...currentTasks.slice(targetIndex + 1),
    ];

    this.repo.saveAll(updatedTasks);
    this.taskState.setTasks(updatedTasks);

    // Log soft delete operation
    this.loggingService.logWarn('Task soft deleted', {
      context: 'TaskService.softDelete',
      data: { taskId: id, taskTitle: currentTask.title }
    });
  }

  /**
   * Permanently delete a task from the repository.
   * Ensures immutability by creating new filtered array.
   */
  delete(id: number): void {
    const currentTasks = this.repo.getAll();
    const taskToDelete = currentTasks.find((t) => t.id === id);

    // Filter creates a new array (immutable)
    const filteredTasks = currentTasks.filter((t) => t.id !== id);
    this.repo.saveAll(filteredTasks);
    this.taskState.setTasks(filteredTasks);

    // Log permanent deletion
    if (taskToDelete) {
      this.loggingService.logWarn('Task permanently deleted', {
        context: 'TaskService.delete',
        data: { taskId: id, taskTitle: taskToDelete.title }
      });
    }
  }

  /**
   * Revert task to a previous state based on history index.
   * Uses TaskHistoryService to apply revert and create revert history.
   * Ensures immutability by creating new objects/arrays.
   */
  revertToHistory(taskId: number, historyIndex: number): void {
    const currentTasks = this.repo.getAll();
    const targetIndex = currentTasks.findIndex((t) => t.id === taskId);

    if (targetIndex === -1) return;

    const currentTask = currentTasks[targetIndex];

    // Validate history index
    if (
      !currentTask.history ||
      historyIndex < 0 ||
      historyIndex >= currentTask.history.length
    ) {
      return;
    }

    const historyEntry = currentTask.history[historyIndex];
    const now = new Date();

    // Use TaskHistoryService to get revert updates
    const revertUpdates = this.historyService.applyHistoryRevert(
      currentTask,
      historyEntry
    );

    // Create revert history entry
    const revertHistory = this.historyService.createRevertHistory(historyEntry);

    // Create new task object with reverted values (immutable)
    const revertedTask: Task = {
      ...currentTask,
      ...revertUpdates,
      lastModifiedAt: now,
      history: this.historyService.addHistoryEntry(
        currentTask.history,
        revertHistory
      ),
    };

    // Create new tasks array with reverted task (immutable)
    const updatedTasks = [
      ...currentTasks.slice(0, targetIndex),
      revertedTask,
      ...currentTasks.slice(targetIndex + 1),
    ];

    this.repo.saveAll(updatedTasks);
    this.taskState.setTasks(updatedTasks);
  }
}
