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
  notes: Note[] = [];
  noteCount$ = this.notesState.noteCount$;
  newTitle = '';
  newContent = '';
  editingNote: Note | null = null;

  constructor(
    private notesService: NotesService,
    private notesState: NotesStateService
  ) {}

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes(): void {
    this.notes = this.notesService.getNotes();
  }

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
    this.loadNotes();
  }

  edit(note: Note): void {
    this.editingNote = note;
    this.newTitle = note.title;
    this.newContent = note.content;
  }

  //This is a hard delete
  hardDelete(id: number): void {
    this.notesService.delete(id);
    this.loadNotes();
  }

  //This is a soft delete via flagging update
  softDelete(id: number): void {
      const note = this.notes.find(n => n.id === id);
      if (!note) return;
      this.notesService.softDelete(note.id);
      this.loadNotes();
  }

  cancelEdit(): void {
    this.editingNote = null;
    this.newTitle = '';
    this.newContent = '';
  }
}
