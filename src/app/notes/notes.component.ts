import { Component, OnInit } from '@angular/core';
import { NotesService } from './notes.service';
import { Note } from './note.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notes',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {
  notes: Note[] = [];
  newTitle = '';
  newContent = '';
  editingNote: Note | null = null;

  constructor(private notesService: NotesService) {}

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes(): void {
    this.notes = this.notesService.getNotes();
  }

  addOrUpdate(): void {
    if (this.editingNote) {
      const updatedNote: Note = {
        ...this.editingNote,
        title: this.newTitle,
        content: this.newContent
      };
      this.notesService.update(updatedNote);
      this.editingNote = null;
    } else {
      const newNote: Note = {
        id: Date.now(),
        title: this.newTitle,
        content: this.newContent,
        createdAt: new Date()
      };
      this.notesService.add(newNote);
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

  delete(id: number): void {
    this.notesService.delete(id);
    this.loadNotes();
  }

  cancelEdit(): void {
    this.editingNote = null;
    this.newTitle = '';
    this.newContent = '';
  }
}
