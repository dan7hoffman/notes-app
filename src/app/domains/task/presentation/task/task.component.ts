import { Component } from '@angular/core';
import { TaskListComponent } from '../task-list/task-list.component';
import { TaskAddComponent } from '../task-add/task-add.component';
import { TaskStateService } from '../../service/taskState.service';
import { TaskKanbanComponent } from '../task-kanban/task-kanban.component';
import { TaskService } from '../../service/task.service';

@Component({
  selector: 'app-tasks',
  imports: [TaskListComponent, TaskAddComponent, TaskKanbanComponent],
  standalone: true,
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
})
export class TaskComponent {
  taskCount = this.taskState.taskCount;
  pendingTaskCount = this.taskState.pendingTaskCount;
  inProgressTaskCount = this.taskState.inProgressTaskCount;
  completedTaskCount = this.taskState.completedTaskCount;
  completionRate = this.taskState.completionRate;
  pendingRate = this.taskState.pendingRate;
  inProgressRate = this.taskState.inProgressRate;
  averageCompletionTime = this.taskState.averageCompletionTime;

  constructor(
    private taskState: TaskStateService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    // Load tasks once at the parent level
    this.taskService.getTasks();
  }
}
