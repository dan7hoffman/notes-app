import { CommonModule } from '@angular/common';
import { Component, effect, signal } from '@angular/core';
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
    }, { allowSignalWrites: true });
  }

  // Form fields using signals for consistent state paradigm
  newTitle = signal('');
  newContent = signal('');
  newStatus = signal<TaskStatus>(TaskStatus.Pending);
  newPriority = signal<TaskPriority>(TaskPriority.Medium);
  newTags = signal<TaskTags[]>([]);

  // Expose enums to template
  taskStatuses = Object.values(TaskStatus);
  taskPriorities = Object.values(TaskPriority);
  taskTags = Object.values(TaskTags);

  // Patch form with existing task data
  patchForm(taskId: number): void {
    const task = this.taskState.tasks().find((t) => t.id === taskId);
    if (task) {
      this.newTitle.set(task.title);
      this.newContent.set(task.content);
      this.newStatus.set(task.status);
      this.newPriority.set(task.priority);
      this.newTags.set(task.tags || []);
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
    const title = this.newTitle();
    if (!title.trim()) return;

    this.taskService.add({
      title,
      content: this.newContent(),
      status: this.newStatus(),
      priority: this.newPriority(),
      tags: this.newTags(),
    });
    this.clearForm();
  }

  updateTask(): void {
    const editingId = this.taskState.selectedTaskId();
    if (editingId !== null) {
      this.taskService.update(editingId, {
        title: this.newTitle(),
        content: this.newContent(),
        status: this.newStatus(),
        priority: this.newPriority(),
        tags: this.newTags(),
      });
      this.taskState.setSelectedTaskId(null);
      this.clearForm();
    }
  }

  cancelEdit(): void {
    this.taskState.setSelectedTaskId(null);
    this.clearForm();
  }

  clearForm() {
    this.newTitle.set('');
    this.newContent.set('');
    this.newStatus.set(TaskStatus.Pending);
    this.newPriority.set(TaskPriority.Medium);
    this.newTags.set([]);
  }

  /**
   * Toggle tag selection (immutable).
   * Creates new array instead of mutating existing one.
   */
  toggleTag(tag: TaskTags): void {
    const currentTags = this.newTags();
    const index = currentTags.indexOf(tag);

    if (index > -1) {
      // Remove tag - create new array without this tag (immutable)
      this.newTags.set([
        ...currentTags.slice(0, index),
        ...currentTags.slice(index + 1)
      ]);
    } else {
      // Add tag - create new array with this tag (immutable)
      this.newTags.set([...currentTags, tag]);
    }
  }

  // Check if a tag is selected
  isTagSelected(tag: TaskTags): boolean {
    return this.newTags().includes(tag);
  }

  /**
   * Event handlers for form inputs.
   * Used for unidirectional data flow instead of ngModel.
   */
  onTitleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newTitle.set(input.value);
  }

  onContentInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.newContent.set(textarea.value);
  }

  onStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.newStatus.set(select.value as TaskStatus);
  }

  onPriorityChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.newPriority.set(select.value as TaskPriority);
  }
}
