import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell.component';
import { NotesComponent } from './domains/notes/presentation/notes.component';
import { TaskComponent } from './domains/task/presentation/task/task.component';
import { LoggingListComponent } from './domains/logging/presentation/logging-list/logging-list.component';
import { BalanceSheetComponent } from './domains/balance-sheet/presentation/balance-sheet/balance-sheet.component';
import { WorkflowComponent } from './domains/workflow/presentation/workflow/workflow.component';
import { TemplateLibraryComponent } from './domains/workflow/presentation/template-library/template-library.component';
import { InstanceTrackerComponent } from './domains/workflow/presentation/instance-tracker/instance-tracker.component';

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
      },
      {
        path: 'workflow',
        component: WorkflowComponent,
        children: [
          {
            path: '',
            redirectTo: 'templates',
            pathMatch: 'full'
          },
          {
            path: 'templates',
            component: TemplateLibraryComponent
          },
          {
            path: 'instances',
            component: InstanceTrackerComponent
          }
        ]
      }
      // You can add more child routes here later
      // e.g., { path: 'settings', component: SettingsComponent }
    ],
  },
];
