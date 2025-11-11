import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesStateService } from '../../domains/notes/service/notesState.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Access note count signal from state service - automatically reactive!
  noteCount = this.notesState.noteCount;

  constructor(private notesState: NotesStateService) {}
}