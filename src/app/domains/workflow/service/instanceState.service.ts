/**
 * Instance State Service
 *
 * Signal-based state management for workflow instances
 */

import { Injectable, signal, computed } from '@angular/core';
import { WorkflowInstance, WorkflowStatus } from '../workflow.model';
import { InstanceRepository } from '../data/instance.repository';

@Injectable({
  providedIn: 'root'
})
export class InstanceStateService {
  // Raw state signals
  private instancesSignal = signal<WorkflowInstance[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private selectedInstanceIdSignal = signal<number | null>(null);

  // Public read-only signals
  readonly instances = this.instancesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly selectedInstanceId = this.selectedInstanceIdSignal.asReadonly();

  // Computed signals
  readonly activeInstances = computed(() =>
    this.instancesSignal().filter(i => !i.deleted)
  );

  readonly deletedInstances = computed(() =>
    this.instancesSignal().filter(i => i.deleted)
  );

  readonly selectedInstance = computed(() => {
    const id = this.selectedInstanceIdSignal();
    if (id === null) return null;
    return this.instancesSignal().find(i => i.id === id) || null;
  });

  readonly instanceCount = computed(() => this.activeInstances().length);

  readonly instancesByStatus = computed(() => {
    const statusMap = new Map<WorkflowStatus, WorkflowInstance[]>();
    this.activeInstances().forEach(instance => {
      const instances = statusMap.get(instance.status) || [];
      instances.push(instance);
      statusMap.set(instance.status, instances);
    });
    return statusMap;
  });

  readonly draftInstances = computed(() =>
    this.activeInstances().filter(i => i.status === WorkflowStatus.DRAFT)
  );

  readonly inProgressInstances = computed(() =>
    this.activeInstances().filter(i => i.status === WorkflowStatus.IN_PROGRESS)
  );

  readonly completedInstances = computed(() =>
    this.activeInstances().filter(i => i.status === WorkflowStatus.COMPLETED)
  );

  readonly rejectedInstances = computed(() =>
    this.activeInstances().filter(i => i.status === WorkflowStatus.REJECTED)
  );

  readonly cancelledInstances = computed(() =>
    this.activeInstances().filter(i => i.status === WorkflowStatus.CANCELLED)
  );

  readonly recentInstances = computed(() =>
    [...this.activeInstances()]
      .sort((a, b) => b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime())
      .slice(0, 20)
  );

  readonly statusCounts = computed(() => ({
    draft: this.draftInstances().length,
    inProgress: this.inProgressInstances().length,
    completed: this.completedInstances().length,
    rejected: this.rejectedInstances().length,
    cancelled: this.cancelledInstances().length,
    total: this.activeInstances().length
  }));

  constructor(private repository: InstanceRepository) {
    this.loadInstances();
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Load all instances from repository
   */
  loadInstances(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const instances = this.repository.getAll();
      this.instancesSignal.set(instances);
    } catch (error) {
      this.errorSignal.set('Failed to load instances');
      console.error('Error loading instances:', error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Reload instances (refresh from storage)
   */
  reload(): void {
    this.loadInstances();
  }

  /**
   * Add instance to state
   */
  addInstance(instance: WorkflowInstance): void {
    const instances = [...this.instancesSignal()];
    instances.push(instance);
    this.instancesSignal.set(instances);
  }

  /**
   * Update instance in state
   */
  updateInstance(id: number, updates: Partial<WorkflowInstance>): void {
    const instances = this.instancesSignal().map(i =>
      i.id === id ? { ...i, ...updates, id } : i
    );
    this.instancesSignal.set(instances);
  }

  /**
   * Remove instance from state
   */
  removeInstance(id: number): void {
    const instances = this.instancesSignal().filter(i => i.id !== id);
    this.instancesSignal.set(instances);
  }

  /**
   * Select instance
   */
  selectInstance(id: number | null): void {
    this.selectedInstanceIdSignal.set(id);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedInstanceIdSignal.set(null);
  }

  /**
   * Set error
   */
  setError(error: string | null): void {
    this.errorSignal.set(error);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get instance by ID
   */
  getInstanceById(id: number): WorkflowInstance | undefined {
    return this.instancesSignal().find(i => i.id === id);
  }

  /**
   * Get instances by template ID
   */
  getInstancesByTemplateId(templateId: number): WorkflowInstance[] {
    return this.activeInstances().filter(i => i.templateId === templateId);
  }

  /**
   * Get instances by status
   */
  getInstancesByStatus(status: WorkflowStatus): WorkflowInstance[] {
    return this.activeInstances().filter(i => i.status === status);
  }

  /**
   * Get instances initiated by user
   */
  getInstancesByInitiator(initiatedBy: string): WorkflowInstance[] {
    return this.activeInstances().filter(i => i.initiatedBy === initiatedBy);
  }

  /**
   * Get instances assigned to user
   */
  getInstancesAssignedTo(assignee: string): WorkflowInstance[] {
    return this.activeInstances().filter(i =>
      i.currentAssignees.includes(assignee)
    );
  }

  /**
   * Search instances by template name or data
   */
  searchInstances(query: string): WorkflowInstance[] {
    const lowerQuery = query.toLowerCase();
    return this.activeInstances().filter(i =>
      i.templateName.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(i.data).toLowerCase().includes(lowerQuery)
    );
  }
}
