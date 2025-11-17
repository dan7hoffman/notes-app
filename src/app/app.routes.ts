import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell.component';
import { NotesComponent } from './domains/notes/presentation/notes.component';
import { TaskComponent } from './domains/task/presentation/task/task.component';
import { LoggingListComponent } from './domains/logging/presentation/logging-list/logging-list.component';
import { BalanceSheetComponent } from './domains/balance-sheet/presentation/balance-sheet/balance-sheet.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: 'notes',
        component: NotesComponent,
      },
      {
        path: 'tasks',
        component: TaskComponent,
      },
      {
        path: 'logging',
        component: LoggingListComponent
      },
      {
        path: 'balance-sheet',
        component: BalanceSheetComponent
      }
      // You can add more child routes here later
      // e.g., { path: 'settings', component: SettingsComponent }
    ],
  },
];
