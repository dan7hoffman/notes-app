import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Note } from './note.model';
import { isPlatformBrowser } from '@angular/common';

/**
 * Minimal repository for persisting notes to localStorage.
 * This is intentionally small: it directly reads/writes JSON.
 */
@Injectable({ providedIn: 'root' })
export class NotesRepository {
  
  //This constructor checks if the code is running in a browser environment to avoid errors during server-side rendering.
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private readonly storageKey = 'notes';
  
  //This method checks if the current platform is a browser.
  private get isBrowser(): boolean {
  return isPlatformBrowser(this.platformId);
  }

  /**
   * Return all notes from localStorage. If missing, returns an empty array.
   */
  getAll(): Note[] {
    if (!this.isBrowser) return [];
    const raw = localStorage.getItem(this.storageKey) || '[]';
    return JSON.parse(raw) as Note[];
  }

  /**
   * Save all notes to localStorage.
   */
  saveAll(notes: Note[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(notes || []));
  }
}

