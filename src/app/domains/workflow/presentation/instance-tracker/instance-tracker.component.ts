/**
 * Instance Tracker Component
 *
 * Monitor and manage active workflow instances
 */

import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InstanceStateService } from '../../service/instanceState.service';
import { EngineService } from '../../service/engine.service';
import { WorkflowInstance, WorkflowStatus } from '../../workflow.model';
import { WORKFLOW_STATUS_CONFIG } from '../../workflow.constants';

@Component({
  selector: 'app-instance-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="instance-tracker">
      <div class="tracker-header">
        <h2>My Workflows</h2>
        <p class="subtitle">Track and manage your active workflows</p>
      </div>

      <!-- Status Summary -->
      <div class="status-summary">
        <div class="summary-card">
          <span class="count">{{ instanceState.inProgressInstances().length }}</span>
          <span class="label">In Progress</span>
        </div>
        <div class="summary-card">
          <span class="count">{{ instanceState.draftInstances().length }}</span>
          <span class="label">Drafts</span>
        </div>
        <div class="summary-card">
          <span class="count">{{ instanceState.completedInstances().length }}</span>
          <span class="label">Completed</span>
        </div>
        <div class="summary-card">
          <span class="count">{{ instanceState.rejectedInstances().length }}</span>
          <span class="label">Rejected</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="filter-tabs">
          <button
            [class.active]="statusFilter() === 'all'"
            (click)="setStatusFilter('all')"
            class="filter-tab"
          >
            All ({{ instanceState.activeInstances().length }})
          </button>
          <button
            [class.active]="statusFilter() === 'in_progress'"
            (click)="setStatusFilter('in_progress')"
            class="filter-tab"
          >
            In Progress ({{ instanceState.inProgressInstances().length }})
          </button>
          <button
            [class.active]="statusFilter() === 'draft'"
            (click)="setStatusFilter('draft')"
            class="filter-tab"
          >
            Drafts ({{ instanceState.draftInstances().length }})
          </button>
          <button
            [class.active]="statusFilter() === 'completed'"
            (click)="setStatusFilter('completed')"
            class="filter-tab"
          >
            Completed ({{ instanceState.completedInstances().length }})
          </button>
        </div>

        <input
          type="text"
          [(ngModel)]="searchQuery"
          placeholder="Search workflows..."
          class="search-input"
        />
      </div>

      <!-- Instances List -->
      <div class="instances-list">
        @if (filteredInstances().length === 0) {
          <div class="empty-state">
            <p>No workflows found</p>
            <small>Try adjusting your filters or launch a new workflow</small>
          </div>
        } @else {
          @for (instance of filteredInstances(); track instance.id) {
            <div class="instance-card" (click)="viewInstance(instance)">
              <div class="instance-header">
                <div>
                  <h3>{{ instance.templateName }}</h3>
                  <span class="instance-id">#{{ instance.id }}</span>
                </div>
                <span [class]="'status-badge status-' + instance.status">
                  {{ getStatusLabel(instance.status) }}
                </span>
              </div>

              <div class="instance-meta">
                <div class="meta-item">
                  <span class="meta-label">Current Step:</span>
                  <span class="meta-value">{{ instance.currentStepName }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Created:</span>
                  <span class="meta-value">{{ formatDate(instance.createdAt) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Last Updated:</span>
                  <span class="meta-value">{{ formatDate(instance.lastModifiedAt) }}</span>
                </div>
              </div>

              @if (instance.history.length > 0) {
                <div class="instance-progress">
                  <span class="progress-label">{{ instance.history.length }} steps completed</span>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="getProgress(instance)"></div>
                  </div>
                </div>
              }

              <div class="instance-actions">
                @if (instance.status === 'in_progress' || instance.status === 'draft') {
                  <button (click)="openInstance($event, instance)" class="btn btn-primary">
                    Take Action
                  </button>
                }
                <button (click)="viewDetails($event, instance)" class="btn btn-secondary">
                  View Details
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .instance-tracker {
      padding: 20px 0;
    }

    .tracker-header {
      margin-bottom: 30px;
    }

    .tracker-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #111827;
    }

    .subtitle {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }

    .status-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .summary-card .count {
      font-size: 32px;
      font-weight: 700;
      color: #3b82f6;
    }

    .summary-card .label {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }

    .filters {
      margin-bottom: 25px;
    }

    .filter-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }

    .filter-tab {
      padding: 8px 16px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #6b7280;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }

    .filter-tab:hover {
      border-color: #d1d5db;
      color: #111827;
    }

    .filter-tab.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }

    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .instances-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .instance-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .instance-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #d1d5db;
    }

    .instance-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 15px;
    }

    .instance-header h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .instance-id {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 500;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: capitalize;
    }

    .status-badge.status-draft {
      background: #f3f4f6;
      color: #6b7280;
    }

    .status-badge.status-in_progress {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-badge.status-completed {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .status-badge.status-cancelled {
      background: #f3f4f6;
      color: #6b7280;
    }

    .instance-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-size: 11px;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .meta-value {
      font-size: 14px;
      color: #111827;
      font-weight: 500;
    }

    .instance-progress {
      margin-bottom: 15px;
    }

    .progress-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 6px;
      display: block;
    }

    .progress-bar {
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #3b82f6;
      transition: width 0.3s;
    }

    .instance-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #9ca3af;
    }

    .empty-state p {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .empty-state small {
      font-size: 14px;
    }
  `]
})
export class InstanceTrackerComponent {
  searchQuery = '';
  private statusFilterSignal = signal<'all' | WorkflowStatus>('all');

  constructor(
    public instanceState: InstanceStateService,
    private engineService: EngineService,
    private router: Router
  ) {}

  statusFilter = this.statusFilterSignal.asReadonly();

  filteredInstances = computed(() => {
    let instances = this.instanceState.activeInstances();

    // Apply status filter
    const filter = this.statusFilterSignal();
    if (filter !== 'all') {
      instances = instances.filter(i => i.status === filter);
    }

    // Apply search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      instances = instances.filter(i =>
        i.templateName.toLowerCase().includes(query) ||
        i.currentStepName.toLowerCase().includes(query) ||
        i.id.toString().includes(query)
      );
    }

    // Sort by last modified (most recent first)
    return [...instances].sort((a, b) =>
      b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime()
    );
  });

  setStatusFilter(status: 'all' | WorkflowStatus): void {
    this.statusFilterSignal.set(status);
  }

  viewInstance(instance: WorkflowInstance): void {
    // Clicking anywhere on card navigates to details
  }

  openInstance(event: Event, instance: WorkflowInstance): void {
    event.stopPropagation();
    // TODO: Open instance action modal or navigate to detail view
    this.router.navigate(['/workflow/instances', instance.id]);
  }

  viewDetails(event: Event, instance: WorkflowInstance): void {
    event.stopPropagation();
    alert(`Instance Details:\n\nID: ${instance.id}\nTemplate: ${instance.templateName}\nStatus: ${instance.status}\nCurrent Step: ${instance.currentStepName}\nHistory: ${instance.history.length} transitions`);
  }

  getStatusLabel(status: WorkflowStatus): string {
    return WORKFLOW_STATUS_CONFIG[status]?.label || status;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  getProgress(instance: WorkflowInstance): number {
    // Estimate progress based on history length
    // This is a simple heuristic - could be improved with actual step tracking
    const totalSteps = 5; // Average workflow steps
    const completed = instance.history.length;
    return Math.min((completed / totalSteps) * 100, 100);
  }
}
