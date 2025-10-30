import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotesComponent } from "./notes/notes.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'notes-app';
}
