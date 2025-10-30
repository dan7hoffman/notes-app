import { Injectable } from '@angular/core';
import { NotesRepository } from './notes.repository';
import { Note } from './note.model';

/*
 This service acts as a bridge between the components and the NotesRepository,
 providing a simpler API for managing notes.
*/

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  // Inject the NotesRepository to handle data storage
  constructor(private repo: NotesRepository) {}

  // Retrieve all notes from repository
  getNotes(): Note[] {
    return this.repo.getAll();
  }
// Add a new note to the repository
  add(note: Note): void {
    // Get the current notes, add the new note, and save the updated list
    const notes = this.repo.getAll();
    notes.push(note);
    // Save the updated list of notes to localStorage
    this.repo.saveAll(notes);
  }
// Update an existing note in the repository
  update(note: Note): void {
    // Map through existing notes and replace the matching note with the updated one
    const notes = this.repo.getAll().map(n => n.id === note.id ? note : n);
    // Save the updated list of notes to localStorage
    this.repo.saveAll(notes);
  }
// Delete a note from the repository by its ID
  delete(id: number): void {
    // Filter out the note with the specified ID and save the updated list
    const notes = this.repo.getAll().filter(n => n.id !== id);
    this.repo.saveAll(notes);
  }
}
