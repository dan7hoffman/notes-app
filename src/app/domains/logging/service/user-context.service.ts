import { Injectable, signal, computed } from '@angular/core';
import { UserContext } from '../logging.model';

/**
 * Service for managing user context for log attribution.
 * Provides user and session identification for audit trails.
 *
 * @example
 * ```typescript
 * // Set user context after authentication
 * userContextService.setUser('user-123', { role: 'admin' });
 *
 * // Get current context for logging
 * const context = userContextService.getContext();
 * ```
 */
@Injectable({
    providedIn: 'root',
})
export class UserContextService {
    private readonly _userId = signal<string>('anonymous');
    private readonly _sessionId = signal<string>(this.generateSessionId());
    private readonly _metadata = signal<Record<string, unknown>>({});

    /**
     * Current user ID as a readonly signal
     */
    readonly userId = computed(() => this._userId());

    /**
     * Current session ID as a readonly signal
     */
    readonly sessionId = computed(() => this._sessionId());

    /**
     * Current user context combining user, session, and metadata
     */
    readonly context = computed<UserContext>(() => ({
        userId: this._userId(),
        sessionId: this._sessionId(),
        metadata: this._metadata(),
    }));

    /**
     * Set the current user ID
     * @param userId - The user identifier (e.g., from auth system)
     * @param metadata - Optional additional user metadata
     */
    setUser(userId: string, metadata?: Record<string, unknown>): void {
        this._userId.set(userId);
        if (metadata) {
            this._metadata.set(metadata);
        }
    }

    /**
     * Clear the current user (e.g., on logout)
     * Resets to anonymous and generates a new session
     */
    clearUser(): void {
        this._userId.set('anonymous');
        this._metadata.set({});
        this._sessionId.set(this.generateSessionId());
    }

    /**
     * Get the current user context snapshot
     * @returns Current user context
     */
    getContext(): UserContext {
        return this.context();
    }

    /**
     * Update user metadata without changing user ID
     * @param metadata - Metadata to merge with existing
     */
    updateMetadata(metadata: Record<string, unknown>): void {
        this._metadata.update(current => ({
            ...current,
            ...metadata,
        }));
    }

    /**
     * Generate a new session ID
     * Called automatically on service creation and user clear
     */
    private generateSessionId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 9);
        return `sess_${timestamp}_${random}`;
    }

    /**
     * Manually refresh the session ID
     * Useful for session rotation or timeout handling
     */
    refreshSession(): void {
        this._sessionId.set(this.generateSessionId());
    }
}
