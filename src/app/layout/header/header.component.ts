import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesStateService } from '../../notes/service/notesState.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Access note count from state service - no localStorage read needed!
  noteCount$ = this.notesState.noteCount$;

  constructor(private notesState: NotesStateService) {}
}