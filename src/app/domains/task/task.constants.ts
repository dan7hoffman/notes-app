import { TaskTags } from './task.model';

/**
 * Centralized constants for the Task domain.
 * This file contains all magic strings and configuration values
 * to improve maintainability and reduce risk of typos.
 */

/**
 * LocalStorage key for persisting tasks
 */
export const TASK_STORAGE_KEY = 'tasks';

/**
 * Priority value mappings for sorting operations
 */
export const PRIORITY_VALUES: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

/**
 * Default values for new tasks
 */
export const DEFAULT_TASK_VALUES = {
  DELETED: false,
  TAGS: [] as TaskTags[],
};
