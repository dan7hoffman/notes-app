import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskStatus, TaskPriority, TaskTags } from '../../task.model';
import { TaskService } from '../../service/task.service';
import { TaskStateService } from '../../service/taskState.service';

@Component({
  selector: 'app-task-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-add.component.html',
  styleUrls: ['./task-add.component.scss'],
})
export class TaskAddComponent {
  constructor(
    private taskService: TaskService,
    public taskState: TaskStateService
  ) {
    // React to changes in selectedTaskId signal
    effect(() => {
      const taskId = this.taskState.selectedTaskId();
      if (taskId !== null) {
        this.patchForm(taskId);
      }
    });
  }

  // Form fields for new task and their default values
  newTitle = '';
  newContent = '';
  newStatus: TaskStatus = TaskStatus.Pending;
  newPriority: TaskPriority = TaskPriority.Medium;
  newTags: TaskTags[] = [];

  // Expose enums to template
  taskStatuses = Object.values(TaskStatus);
  taskPriorities = Object.values(TaskPriority);
  taskTags = Object.values(TaskTags);

  // Patch form with existing task data
  patchForm(taskId: number): void {
    const task = this.taskState.tasks().find((t) => t.id === taskId);
    if (task) {
      this.newTitle = task.title;
      this.newContent = task.content;
      this.newStatus = task.status;
      this.newPriority = task.priority;
      this.newTags = task.tags || [];
      console.log('Form patched with task:', taskId);
    }
  }

  // Submit handler - decides whether to add or update
  submitTask() {
    const editingId = this.taskState.selectedTaskId();
    if (editingId !== null) {
      this.updateTask();
    } else {
      this.addTask();
    }
  }

  addTask() {
    if (!this.newTitle.trim()) return;

    this.taskService.add({
      title: this.newTitle,
      content: this.newContent,
      status: this.newStatus,
      priority: this.newPriority,
      tags: this.newTags,
    });
    console.log('Task added:', this.newTitle);
    this.clearForm();
  }

  updateTask(): void {
    const editingId = this.taskState.selectedTaskId();
    if (editingId !== null) {
      this.taskService.update(editingId, {
        title: this.newTitle,
        content: this.newContent,
        status: this.newStatus,
        priority: this.newPriority,
        tags: this.newTags,
      });
      console.log('Task updated:', editingId);
      this.taskState.setSelectedTaskId(null);
      this.clearForm();
    }
  }

  cancelEdit(): void {
    this.taskState.setSelectedTaskId(null);
    this.clearForm();
  }

  clearForm() {
    this.newTitle = '';
    this.newContent = '';
    this.newStatus = TaskStatus.Pending;
    this.newPriority = TaskPriority.Medium;
    this.newTags = [];
    console.log('Form cleared');
  }

  // Toggle tag selection
  toggleTag(tag: TaskTags): void {
    const index = this.newTags.indexOf(tag);
    if (index > -1) {
      this.newTags.splice(index, 1);
    } else {
      this.newTags.push(tag);
    }
  }

  // Check if a tag is selected
  isTagSelected(tag: TaskTags): boolean {
    return this.newTags.includes(tag);
  }
}
