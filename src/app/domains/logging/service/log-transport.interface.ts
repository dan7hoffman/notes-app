import { Log } from '../logging.model';

/**
 * Interface for pluggable log transport backends.
 * Allows swapping between localStorage, HTTP, or other persistence mechanisms.
 *
 * @example
 * ```typescript
 * // Future HTTP transport implementation
 * class HttpTransport implements LogTransport {
 *   async save(log: Log): Promise<boolean> {
 *     const response = await fetch('/api/logs', {
 *       method: 'POST',
 *       body: JSON.stringify(log)
 *     });
 *     return response.ok;
 *   }
 * }
 * ```
 */
export interface LogTransport {
    /**
     * Get all logs from the transport
     */
    getAll(): Log[];

    /**
     * Save all logs to the transport
     * @param logs - Array of logs to save
     * @returns true if successful
     */
    saveAll(logs: Log[]): boolean;

    /**
     * Delete a specific log
     * @param id - Log ID to delete
     * @returns true if successful
     */
    delete(id: number): boolean;

    /**
     * Clear all logs
     * @returns true if successful
     */
    clear(): boolean;
}

/**
 * Configuration for log transports
 */
export interface LogTransportConfig {
    type: 'localStorage' | 'http' | 'memory';
    endpoint?: string; // For HTTP transport
    batchSize?: number; // For batched HTTP sends
    flushInterval?: number; // Ms between flushes
}
