import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesStateService } from '../../domains/notes/service/notesState.service';
import { RouterLink } from "@angular/router";
import { TaskStateService } from '../../domains/task/service/taskState.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // Access note count signal from state service - automatically reactive!
  noteCount = this.notesState.noteCount;
  taskCount = this.taskState.taskCount;

  constructor(private notesState: NotesStateService, private taskState: TaskStateService) {}
}