import { Component, OnInit, signal, computed } from '@angular/core';
import { NotesService } from '../service/notes.service';
import { Note } from '../note.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotesStateService } from '../service/notesState.service';
import { formatAbsoluteDate, formatAbsoluteDateTime } from '../../../shared/utils/date-formatter.util';

@Component({
  selector: 'app-notes',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class NotesComponent implements OnInit {

    constructor(
    private notesService: NotesService,
    private notesState: NotesStateService
  ) {}

  // Use signals from state service - automatically reactive!
  notes = this.notesState.notes;
  noteCount = this.notesState.noteCount;
  activeNotes = this.notesState.activeNotes;
  activeNoteCount = this.notesState.activeNoteCount;
  deletedNotes = this.notesState.deletedNotes;
  deletedNoteCount = this.notesState.deletedNoteCount;

  // Form fields
  newTitle = '';
  newContent = '';

  // Track if we are editing an existing note
  editingNote: Note | null = null;

  // Filter state as a signal instead of BehaviorSubject
  private filterSignal = signal<'ALL' | 'ACTIVE'>('ALL');
  currentFilter: 'ALL' | 'ACTIVE' = 'ALL';

    // Search term as a signal
  searchTerm = signal('');

// Computed property for filtered notes based on current filter and search term
  filteredNotes = computed(() => {
  const filter = this.filterSignal();
  const search = this.searchTerm().toLowerCase();
  let notes = filter === 'ALL' ? this.notes() : this.activeNotes();
  
  if (search) {
    notes = notes.filter(n =>
      n.title.toLowerCase().includes(search) ||
      n.content.toLowerCase().includes(search)
    );
  }
  
  return notes;
});

  // Expose date formatting utils to template
  formatDate = formatAbsoluteDate;
  formatDateTime = formatAbsoluteDateTime;

  setFilter(filter: 'ALL' | 'ACTIVE'): void {
    this.currentFilter = filter;
    this.filterSignal.set(filter);  // Signal update instead of .next()
  }

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
