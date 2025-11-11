import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell.component';
import { NotesComponent } from './domains/notes/presentation/notes.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        component: NotesComponent,
      },
      // You can add more child routes here later
      // e.g., { path: 'settings', component: SettingsComponent }
    ],
  },
];
