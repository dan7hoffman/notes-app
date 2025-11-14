import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Task } from '../task.model';
import { dateReviver } from '../../../shared/utils/json-serialization.util';

@Injectable({ providedIn: 'root' })
export class TaskRepository {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private readonly storageKey = 'tasks';

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getAll(): Task[] {
    if (!this.isBrowser) return [];
    const raw = localStorage.getItem(this.storageKey) || '[]';
    return JSON.parse(raw, dateReviver);
  }

  saveAll(tasks: Task[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(tasks || []));
  }
}