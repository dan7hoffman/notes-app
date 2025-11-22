import { Injectable, signal, computed } from '@angular/core';
import { Operation } from '../logging.model';

/**
 * Service for managing correlation IDs to trace operations across log entries.
 * Enables tracking related logs that are part of the same user action or workflow.
 *
 * @example
 * ```typescript
 * // Start an operation
 * const correlationId = correlationService.startOperation('createTask');
 *
 * // Logs created while operation is active will include this correlationId
 * loggingService.logInfo('Validating task', { context: 'TaskService' });
 * loggingService.logInfo('Task saved', { context: 'TaskService' });
 *
 * // End the operation (records duration)
 * const duration = correlationService.endOperation(correlationId);
 * ```
 */
@Injectable({
    providedIn: 'root',
})
export class CorrelationService {
    private readonly _activeOperations = signal<Map<string, Operation>>(new Map());
    private readonly _operationStack = signal<string[]>([]);

    /**
     * Current active correlation ID (top of stack)
     * Returns undefined if no operation is active
     */
    readonly currentCorrelationId = computed(() => {
        const stack = this._operationStack();
        return stack.length > 0 ? stack[stack.length - 1] : undefined;
    });

    /**
     * Number of active operations
     */
    readonly activeOperationCount = computed(() => this._activeOperations().size);

    /**
     * Start a new operation and push it onto the correlation stack
     * @param name - Name of the operation (e.g., 'createTask', 'updateAccount')
     * @param metadata - Optional metadata to attach to the operation
     * @returns The generated correlation ID
     */
    startOperation(name: string, metadata?: Record<string, unknown>): string {
        const correlationId = this.generateCorrelationId();
        const operation: Operation = {
            correlationId,
            name,
            startTime: performance.now(),
            metadata,
        };

        this._activeOperations.update(ops => {
            const newOps = new Map(ops);
            newOps.set(correlationId, operation);
            return newOps;
        });

        this._operationStack.update(stack => [...stack, correlationId]);

        return correlationId;
    }

    /**
     * End an operation and remove it from tracking
     * @param correlationId - The correlation ID to end
     * @returns Duration in milliseconds, or undefined if operation not found
     */
    endOperation(correlationId: string): number | undefined {
        const operation = this._activeOperations().get(correlationId);
        if (!operation) {
            console.warn(`[CorrelationService] Operation ${correlationId} not found`);
            return undefined;
        }

        const duration = performance.now() - operation.startTime;

        this._activeOperations.update(ops => {
            const newOps = new Map(ops);
            newOps.delete(correlationId);
            return newOps;
        });

        this._operationStack.update(stack =>
            stack.filter(id => id !== correlationId)
        );

        return duration;
    }

    /**
     * Get the current correlation ID without modifying state
     * @returns Current correlation ID or undefined
     */
    getCurrentCorrelationId(): string | undefined {
        return this.currentCorrelationId();
    }

    /**
     * Get operation details by correlation ID
     * @param correlationId - The correlation ID to look up
     * @returns Operation details or undefined
     */
    getOperation(correlationId: string): Operation | undefined {
        return this._activeOperations().get(correlationId);
    }

    /**
     * Check if an operation is currently active
     * @param correlationId - The correlation ID to check
     * @returns true if operation is active
     */
    isOperationActive(correlationId: string): boolean {
        return this._activeOperations().has(correlationId);
    }

    /**
     * Get elapsed time for an active operation
     * @param correlationId - The correlation ID to check
     * @returns Elapsed milliseconds or undefined if not found
     */
    getElapsedTime(correlationId: string): number | undefined {
        const operation = this._activeOperations().get(correlationId);
        if (!operation) {
            return undefined;
        }
        return performance.now() - operation.startTime;
    }

    /**
     * Clear all active operations
     * Useful for cleanup on navigation or error recovery
     */
    clearAll(): void {
        this._activeOperations.set(new Map());
        this._operationStack.set([]);
    }

    /**
     * Generate a unique correlation ID
     */
    private generateCorrelationId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 9);
        return `corr_${timestamp}_${random}`;
    }

    /**
     * Create a child operation linked to a parent
     * Useful for nested operations that should be traceable
     * @param name - Name of the child operation
     * @param parentCorrelationId - Parent correlation ID
     * @returns The child correlation ID
     */
    startChildOperation(name: string, parentCorrelationId: string): string {
        const correlationId = this.startOperation(name, {
            parentCorrelationId,
        });
        return correlationId;
    }
}
