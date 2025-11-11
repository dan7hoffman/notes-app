import { Injectable } from '@angular/core';
import { NotesRepository } from '../data/notes.repository';
import { Note } from '../note.model';
import { NotesStateService } from './notesState.service';
/*
 This service acts as a bridge between the components and the NotesRepository,
 providing a simpler API for managing notes.
*/

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  // Inject the NotesRepository to handle data storage
  constructor(
    private repo: NotesRepository,
    private notesState: NotesStateService
  ) {}

  // Retrieve all notes from repository and update state
  getNotes(): Note[] {
    const notes = this.repo.getAll();
    this.notesState.setNotes(notes);
    return notes;
  }
// Add a new note to the repository
  add(data: {title: string, content: string}): Note {
    const newNote: Note = {
      id: Date.now(),
      title: data.title,
      content: data.content,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    };
    // Get the current notes, add the new note, and save the updated list
    const notes = this.repo.getAll().map(n => ({ ...n })); // shallow copy
    notes.push(newNote);
    // Save the updated list of notes to localStorage
    this.repo.saveAll(notes);
    this.notesState.setNotes(notes);
    return newNote;
  }
// Update an existing note in the repository
  update(id: number, updates: {title?: string, content?: string}): void {
  const notes = this.repo.getAll().map(n => ({ ...n })); // shallow copy
  const target = notes.find(n => n.id === id);
  if (!target) return;
  Object.assign(target, updates, { lastModifiedAt: new Date() }); // merge updates
  this.repo.saveAll(notes);
  this.notesState.setNotes(notes);
  }


  // Soft delete a note by marking it as deleted
  softDelete(id: number): void {
  const notes = this.repo.getAll().map(n => ({ ...n })); // shallow copy
  const target = notes.find(n => n.id === id);
  if (!target) return;
  target.deleted = true;
  target.deletionAt = new Date();
  target.lastModifiedAt = new Date();
  this.repo.saveAll(notes);
  this.notesState.setNotes(notes);
}
// Delete a note from the repository by its ID
// Hard delete
  delete(id: number): void {
    // Filter out the note with the specified ID and save the updated list
    const notes = this.repo.getAll().filter(n => n.id !== id);
    this.repo.saveAll(notes);
    this.notesState.setNotes(notes);
  }
}
