/**
 * Centralized constants for the Logging domain.
 * This file contains all magic strings and configuration values
 * to improve maintainability and reduce risk of typos.
 */

/**
 * LocalStorage key for persisting logs
 */
export const LOGGING_STORAGE_KEY = 'logging';

/**
 * Default number of logs to display per page
 */
export const DEFAULT_PAGE_SIZE = 5;

/**
 * Maximum size for log data in bytes (10KB)
 */
export const MAX_LOG_DATA_SIZE = 10_000;

/**
 * Warning threshold for localStorage usage (4MB out of ~5MB quota)
 */
export const STORAGE_QUOTA_WARNING_BYTES = 4_000_000;

/**
 * Maximum number of logs to retain in storage
 * Oldest logs are pruned when this limit is exceeded
 */
export const MAX_LOG_RETENTION = 1000;
