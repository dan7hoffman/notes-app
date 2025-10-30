import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Note } from './note.model';

/*
This repository handles the direct interaction with localStorage
for storing and retrieving notes.
*/

@Injectable({
  providedIn: 'root'
})
export class NotesRepository {

// Key used for storing notes in localStorage
  private storageKey = 'notes';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Retrieve all notes from localStorage
  getAll(): Note[] {
    // Check if the code is running in a browser environment
    if (isPlatformBrowser(this.platformId)) {
        // Get the notes data from localStorage
      const data = localStorage.getItem(this.storageKey);
      // Parse and return the notes, or return an empty array if no data exists
      return data ? JSON.parse(data) : [];
    }
    return [];
  }
  // Save all notes to localStorage
  saveAll(notes: Note[]): void {
    if (isPlatformBrowser(this.platformId)) {
        // Convert the notes array to a JSON string and store it in localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(notes));
    }
  }
}

