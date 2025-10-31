import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Note } from './note.model';

/**
 * Repository responsible for persisting notes to localStorage.
 * This class is safe to call on the server because it checks
 * the platform before accessing window/localStorage.
 */
@Injectable({ providedIn: 'root' })
export class NotesRepository {
  /** Key used for storing notes in localStorage. */
  private readonly storageKey = 'notes';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /** Convenience getter to determine if code is running in the browser. */
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Return all notes from localStorage.
   * If parsing fails or data is missing, returns an empty array.
   */
  getAll(): Note[] {
    if (!this.isBrowser) {
      return [];
    }

    const raw = localStorage.getItem(this.storageKey);
    if (raw === null) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // corrupted data — reset to safe default
      return [];
    }
  }

  /**
   * Save all notes to localStorage. This is a no-op on the server.
   */
  saveAll(notes: Note[]): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(notes || []));
    } catch (err) {
      // localStorage may throw (quota exceeded, private mode, etc.).
      // Log a warning but don't throw to keep the app resilient.
      // eslint-disable-next-line no-console
      console.warn('NotesRepository: failed to save notes to localStorage', err);
    }
  }
}

