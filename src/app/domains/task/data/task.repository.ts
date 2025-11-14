import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Task } from '../task.model';
import { dateReviver } from '../../../shared/utils/json-serialization.util';
import { TASK_STORAGE_KEY } from '../task.constants';

@Injectable({ providedIn: 'root' })
export class TaskRepository {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private readonly storageKey = TASK_STORAGE_KEY;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Retrieves all tasks from localStorage.
   * Implements robust error handling for:
   * - Corrupted JSON data
   * - Storage access failures
   * - Parsing errors
   *
   * @returns Array of tasks, or empty array if retrieval fails
   */
  getAll(): Task[] {
    if (!this.isBrowser) return [];

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }

      const tasks = JSON.parse(raw, dateReviver);

      // Validate that we got an array
      if (!Array.isArray(tasks)) {
        console.error('TaskRepository: Invalid data format in localStorage, expected array');
        return [];
      }

      return tasks;
    } catch (error) {
      console.error('TaskRepository: Failed to retrieve tasks from localStorage', error);
      // Return empty array to prevent app crash
      return [];
    }
  }

  /**
   * Persists all tasks to localStorage.
   * Implements robust error handling for:
   * - Quota exceeded errors
   * - Storage access failures
   * - Serialization errors
   *
   * @param tasks - Array of tasks to persist (will be copied to ensure immutability)
   * @returns boolean indicating success or failure
   */
  saveAll(tasks: Task[]): boolean {
    if (!this.isBrowser) return false;

    try {
      // Create immutable copy before saving
      const tasksCopy = tasks.map(task => ({ ...task }));
      const serialized = JSON.stringify(tasksCopy);
      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'QuotaExceededError') {
          console.error('TaskRepository: Storage quota exceeded. Unable to save tasks.');
        } else {
          console.error('TaskRepository: Storage access denied', error);
        }
      } else {
        console.error('TaskRepository: Failed to save tasks', error);
      }
      return false;
    }
  }
}