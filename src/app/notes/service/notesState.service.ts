import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";
import { Note } from "../note.model";

@Injectable({
  providedIn: 'root'
})
export class NotesStateService {

  //Single source of truth: all notes
  private _notesSubject = new BehaviorSubject<Note[]>([]);
  readonly notes$ = this._notesSubject.asObservable();

  //Derived state: automatically filter active notes (not deleted)
  readonly activeNotes$ = this.notes$.pipe(
    map(notes => notes.filter(n => !n.deleted))
  );

  //Derived state: automatically filter deleted notes
  readonly deletedNotes$ = this.notes$.pipe(
    map(notes => notes.filter(n => n.deleted === true))
  );

  //Derived counts - automatically computed
  readonly noteCount$ = this.notes$.pipe(
    map(notes => notes.length)
  );

  readonly activeNoteCount$ = this.activeNotes$.pipe(
    map(notes => notes.length)
  );

  readonly deletedNoteCount$ = this.deletedNotes$.pipe(
    map(notes => notes.length)
  );

  //Single setter - updates all derived observables automatically
  setNotes(notes: Note[]): void {
    this._notesSubject.next(notes);
  }

  get notes(): Note[] {
    return this._notesSubject.value;
  }

  get activeNotes(): Note[] {
    return this._notesSubject.value.filter(n => !n.deleted);
  }

  get deletedNotes(): Note[] {
    return this._notesSubject.value.filter(n => n.deleted === true);
  }

  get noteCount(): number {
    return this._notesSubject.value.length;
  }
}