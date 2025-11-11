import { Injectable, signal, computed } from "@angular/core";
import { Note } from "../note.model";

@Injectable({
  providedIn: 'root'
})
export class NotesStateService {

  //Single source of truth: all notes (writable signal - private)
  private _notes = signal<Note[]>([]);

  //Public readonly signal - components read this
  readonly notes = this._notes.asReadonly();

  //Derived state: automatically filter active notes (not deleted)
  readonly activeNotes = computed(() =>
    this._notes().filter(n => !n.deleted)
  );

  //Derived state: automatically filter deleted notes
  readonly deletedNotes = computed(() =>
    this._notes().filter(n => n.deleted === true)
  );

  //Derived counts - automatically computed from signals above
  readonly noteCount = computed(() =>
    this._notes().length
  );

  readonly activeNoteCount = computed(() =>
    this.activeNotes().length
  );

  readonly deletedNoteCount = computed(() =>
    this.deletedNotes().length
  );

  //Single setter - updates all derived signals automatically
  setNotes(notes: Note[]): void {
    this._notes.set(notes);
  }

  //Example: Add a note (using .update() for modifications)
  addNote(note: Note): void {
    this._notes.update(current => [...current, note]);
  }

  //Example: Remove a note by id
  removeNote(id: number): void {
    this._notes.update(current => current.filter(n => n.id !== id));
  }

  // No getters needed! Signals and computed properties provide direct access:
  // - Use this.notes() to get current notes
  // - Use this.activeNotes() to get filtered active notes
  // - Use this.noteCount() to get count
  // All automatically reactive!
}