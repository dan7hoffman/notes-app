/**
 * Workflow Instance Repository
 *
 * Framework layer for workflow instance persistence using localStorage
 */

import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WorkflowInstance, WorkflowStatus } from '../workflow.model';
import { WORKFLOW_STORAGE_KEYS } from '../workflow.constants';

@Injectable({
  providedIn: 'root'
})
export class InstanceRepository {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private readonly storageKey = WORKFLOW_STORAGE_KEYS.INSTANCES;
  private readonly nextIdKey = WORKFLOW_STORAGE_KEYS.NEXT_INSTANCE_ID;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Get all instances
   */
  getAll(): WorkflowInstance[] {
    if (!this.isBrowser) return [];

    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }
      const instances = JSON.parse(data);
      return this.deserializeInstances(instances);
    } catch (error) {
      console.error('Error loading instances:', error);
      return [];
    }
  }

  /**
   * Get instance by ID
   */
  getById(id: number): WorkflowInstance | null {
    const instances = this.getAll();
    return instances.find(i => i.id === id) || null;
  }

  /**
   * Get active (non-deleted) instances
   */
  getActive(): WorkflowInstance[] {
    return this.getAll().filter(i => !i.deleted);
  }

  /**
   * Get instances by template ID
   */
  getByTemplateId(templateId: number): WorkflowInstance[] {
    return this.getActive().filter(i => i.templateId === templateId);
  }

  /**
   * Get instances by status
   */
  getByStatus(status: WorkflowStatus): WorkflowInstance[] {
    return this.getActive().filter(i => i.status === status);
  }

  /**
   * Get instances by multiple statuses
   */
  getByStatuses(statuses: WorkflowStatus[]): WorkflowInstance[] {
    const statusSet = new Set(statuses);
    return this.getActive().filter(i => statusSet.has(i.status));
  }

  /**
   * Get instances initiated by user
   */
  getByInitiator(initiatedBy: string): WorkflowInstance[] {
    return this.getActive().filter(i => i.initiatedBy === initiatedBy);
  }

  /**
   * Get instances assigned to user (can take action)
   */
  getAssignedTo(assignee: string): WorkflowInstance[] {
    return this.getActive().filter(i =>
      i.currentAssignees.includes(assignee)
    );
  }

  /**
   * Get in-progress instances
   */
  getInProgress(): WorkflowInstance[] {
    return this.getByStatus(WorkflowStatus.IN_PROGRESS);
  }

  /**
   * Get completed instances
   */
  getCompleted(): WorkflowInstance[] {
    return this.getByStatus(WorkflowStatus.COMPLETED);
  }

  /**
   * Get draft instances
   */
  getDrafts(): WorkflowInstance[] {
    return this.getByStatus(WorkflowStatus.DRAFT);
  }

  /**
   * Get rejected instances
   */
  getRejected(): WorkflowInstance[] {
    return this.getByStatus(WorkflowStatus.REJECTED);
  }

  /**
   * Get instances created after a date
   */
  getCreatedAfter(date: Date): WorkflowInstance[] {
    const timestamp = date.getTime();
    return this.getActive().filter(i => i.createdAt.getTime() > timestamp);
  }

  /**
   * Get instances created before a date
   */
  getCreatedBefore(date: Date): WorkflowInstance[] {
    const timestamp = date.getTime();
    return this.getActive().filter(i => i.createdAt.getTime() < timestamp);
  }

  /**
   * Get instances modified after a date
   */
  getModifiedAfter(date: Date): WorkflowInstance[] {
    const timestamp = date.getTime();
    return this.getActive().filter(i => i.lastModifiedAt.getTime() > timestamp);
  }

  /**
   * Save instance (create or update)
   */
  save(instance: WorkflowInstance): WorkflowInstance {
    const instances = this.getAll();
    const existingIndex = instances.findIndex(i => i.id === instance.id);

    const now = new Date();
    const savedInstance = {
      ...instance,
      lastModifiedAt: now
    };

    // Update completedAt if status changed to completed
    if (savedInstance.status === WorkflowStatus.COMPLETED && !savedInstance.completedAt) {
      savedInstance.completedAt = now;
    }

    if (existingIndex >= 0) {
      // Update existing
      instances[existingIndex] = savedInstance;
    } else {
      // Create new
      savedInstance.createdAt = now;
      instances.push(savedInstance);
    }

    this.saveAll(instances);
    return savedInstance;
  }

  /**
   * Create new instance with generated ID
   */
  create(instance: Omit<WorkflowInstance, 'id'>): WorkflowInstance {
    const id = this.getNextId();
    const newInstance: WorkflowInstance = {
      ...instance,
      id,
      createdAt: new Date(),
      lastModifiedAt: new Date()
    };
    return this.save(newInstance);
  }

  /**
   * Update existing instance
   */
  update(id: number, updates: Partial<WorkflowInstance>): WorkflowInstance | null {
    const instance = this.getById(id);
    if (!instance) {
      return null;
    }

    const updated = {
      ...instance,
      ...updates,
      id, // Ensure ID doesn't change
      createdAt: instance.createdAt, // Preserve creation date
      lastModifiedAt: new Date()
    };

    return this.save(updated);
  }

  /**
   * Delete instance (soft delete)
   */
  delete(id: number): boolean {
    const instance = this.getById(id);
    if (!instance) {
      return false;
    }

    instance.deleted = true;
    instance.lastModifiedAt = new Date();
    this.save(instance);
    return true;
  }

  /**
   * Permanently delete instance
   */
  hardDelete(id: number): boolean {
    const instances = this.getAll();
    const filteredInstances = instances.filter(i => i.id !== id);

    if (instances.length === filteredInstances.length) {
      return false; // Instance not found
    }

    this.saveAll(filteredInstances);
    return true;
  }

  /**
   * Restore deleted instance
   */
  restore(id: number): boolean {
    const instance = this.getById(id);
    if (!instance || !instance.deleted) {
      return false;
    }

    instance.deleted = false;
    instance.lastModifiedAt = new Date();
    this.save(instance);
    return true;
  }

  /**
   * Get recently created instances
   */
  getRecentlyCreated(limit: number = 10): WorkflowInstance[] {
    return this.getActive()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get recently modified instances
   */
  getRecentlyModified(limit: number = 10): WorkflowInstance[] {
    return this.getActive()
      .sort((a, b) => b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Clear all instances (dangerous!)
   */
  clear(): void {
    if (!this.isBrowser) return;

    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.nextIdKey);
  }

  /**
   * Get count of instances
   */
  count(): number {
    return this.getActive().length;
  }

  /**
   * Get count by status
   */
  countByStatus(status: WorkflowStatus): number {
    return this.getByStatus(status).length;
  }

  /**
   * Get count by template
   */
  countByTemplate(templateId: number): number {
    return this.getByTemplateId(templateId).length;
  }

  /**
   * Check if instance exists
   */
  exists(id: number): boolean {
    return this.getById(id) !== null;
  }

  /**
   * Get statistics for a template
   */
  getTemplateStatistics(templateId: number): {
    total: number;
    byStatus: Record<WorkflowStatus, number>;
    completed: number;
    rejected: number;
    inProgress: number;
  } {
    const instances = this.getByTemplateId(templateId);

    const byStatus = {
      [WorkflowStatus.DRAFT]: 0,
      [WorkflowStatus.IN_PROGRESS]: 0,
      [WorkflowStatus.COMPLETED]: 0,
      [WorkflowStatus.REJECTED]: 0,
      [WorkflowStatus.CANCELLED]: 0
    };

    instances.forEach(instance => {
      byStatus[instance.status]++;
    });

    return {
      total: instances.length,
      byStatus,
      completed: byStatus[WorkflowStatus.COMPLETED],
      rejected: byStatus[WorkflowStatus.REJECTED],
      inProgress: byStatus[WorkflowStatus.IN_PROGRESS]
    };
  }

  /**
   * Calculate average completion time for a template (in hours)
   */
  getAverageCompletionTime(templateId: number): number | null {
    const completed = this.getByTemplateId(templateId)
      .filter(i => i.status === WorkflowStatus.COMPLETED && i.completedAt);

    if (completed.length === 0) {
      return null;
    }

    const totalHours = completed.reduce((sum, instance) => {
      const duration = instance.completedAt!.getTime() - instance.createdAt.getTime();
      return sum + (duration / (1000 * 60 * 60)); // Convert to hours
    }, 0);

    return totalHours / completed.length;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Save all instances to localStorage
   */
  private saveAll(instances: WorkflowInstance[]): void {
    if (!this.isBrowser) return;

    try {
      const serialized = this.serializeInstances(instances);
      localStorage.setItem(this.storageKey, JSON.stringify(serialized));
    } catch (error) {
      console.error('Error saving instances:', error);
      throw new Error('Failed to save instances');
    }
  }

  /**
   * Get next available ID
   */
  private getNextId(): number {
    if (!this.isBrowser) return 1;

    const currentId = parseInt(localStorage.getItem(this.nextIdKey) || '1', 10);
    const nextId = currentId + 1;
    localStorage.setItem(this.nextIdKey, nextId.toString());
    return currentId;
  }

  /**
   * Serialize instances for storage (convert Dates to strings)
   */
  private serializeInstances(instances: WorkflowInstance[]): any[] {
    return instances.map(i => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      lastModifiedAt: i.lastModifiedAt.toISOString(),
      completedAt: i.completedAt?.toISOString(),
      history: i.history.map(h => ({
        ...h,
        timestamp: h.timestamp.toISOString()
      }))
    }));
  }

  /**
   * Deserialize instances from storage (convert strings to Dates)
   */
  private deserializeInstances(data: any[]): WorkflowInstance[] {
    return data.map(i => ({
      ...i,
      createdAt: new Date(i.createdAt),
      lastModifiedAt: new Date(i.lastModifiedAt),
      completedAt: i.completedAt ? new Date(i.completedAt) : undefined,
      history: i.history.map((h: any) => ({
        ...h,
        timestamp: new Date(h.timestamp)
      }))
    }));
  }
}
