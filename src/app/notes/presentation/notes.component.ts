import { Component, OnInit } from '@angular/core';
import { NotesService } from '../service/notes.service';
import { Note } from '../note.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotesStateService } from '../service/notesState.service';
@Component({
  selector: 'app-notes',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {
  // Use observables from state service instead of local array
  notes$ = this.notesState.notes$;
  noteCount$ = this.notesState.noteCount$;
  activeNotes$ = this.notesState.activeNotes$;
  activeNoteCount$ = this.notesState.activeNoteCount$;
  deletedNotes$ = this.notesState.deletedNotes$;
  deletedNoteCount$ = this.notesState.deletedNoteCount$;
  newTitle = '';
  newContent = '';
  editingNote: Note | null = null;

  constructor(
    private notesService: NotesService,
    private notesState: NotesStateService
  ) {}

  ngOnInit(): void {
    // Load notes into state once - no need to reload after each operation
    this.notesService.getNotes();
  }
//Handles both add and update based on editingNote state
//State service automatically updates via notes$ observable
  addOrUpdate(): void {
    if (this.editingNote) {
      this.notesService.update(this.editingNote.id, {
        title: this.newTitle,
        content: this.newContent
      });
      this.editingNote = null;
    } else {
      this.notesService.add({
        title: this.newTitle,
        content: this.newContent,
      });
    }

    this.newTitle = '';
    this.newContent = '';
    // No manual reload needed - state service updates automatically
  }

  edit(note: Note): void {
    this.editingNote = note;
    this.newTitle = note.title;
    this.newContent = note.content;
  }

  //This is a hard delete
  //State service automatically updates via notes$ observable
  hardDelete(id: number): void {
    this.notesService.delete(id);
    // No manual reload needed - state service updates automatically
  }

  //This is a soft delete via flagging update
  //State service automatically updates via notes$ observable
  softDelete(id: number): void {
      this.notesService.softDelete(id);
      // No manual reload needed - state service updates automatically
  }

  cancelEdit(): void {
    this.editingNote = null;
    this.newTitle = '';
    this.newContent = '';
  }
}
