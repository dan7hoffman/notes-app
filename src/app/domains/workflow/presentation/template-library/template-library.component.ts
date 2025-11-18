/**
 * Template Library Component
 *
 * Browse, search, and launch workflow templates
 */

import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TemplateStateService } from '../../service/templateState.service';
import { TemplateService } from '../../service/template.service';
import { TaxonomyService } from '../../service/taxonomy.service';
import { EngineService } from '../../service/engine.service';
import { WorkflowTemplate } from '../../workflow.model';

@Component({
  selector: 'app-template-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="template-library">
      <div class="library-header">
        <h2>Workflow Templates</h2>
        <p class="subtitle">Browse and launch workflow templates</p>
      </div>

      <!-- Search and Filters -->
      <div class="filters">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange()"
          placeholder="Search templates..."
          class="search-input"
        />

        <select [(ngModel)]="selectedCategory" (ngModelChange)="onCategoryChange()" class="category-select">
          <option value="">All Categories</option>
          @for (category of categories(); track category) {
            <option [value]="category">{{ category | titlecase }}</option>
          }
        </select>
      </div>

      <!-- Category Tabs -->
      <div class="category-tabs">
        <button
          [class.active]="viewMode() === 'all'"
          (click)="setViewMode('all')"
          class="tab-button"
        >
          All Templates ({{ filteredTemplates().length }})
        </button>
        <button
          [class.active]="viewMode() === 'popular'"
          (click)="setViewMode('popular')"
          class="tab-button"
        >
          Most Popular
        </button>
        <button
          [class.active]="viewMode() === 'recent'"
          (click)="setViewMode('recent')"
          class="tab-button"
        >
          Recently Updated
        </button>
      </div>

      <!-- Templates Grid -->
      <div class="templates-grid">
        @if (displayTemplates().length === 0) {
          <div class="empty-state">
            <p>No templates found</p>
            <small>Try adjusting your search or filters</small>
          </div>
        } @else {
          @for (template of displayTemplates(); track template.id) {
            <div class="template-card">
              <div class="card-header">
                <h3>{{ template.name }}</h3>
                <span class="category-badge">{{ template.category }}</span>
              </div>

              <p class="description">{{ template.description }}</p>

              @if (template.whenToUse) {
                <div class="when-to-use">
                  <strong>When to use:</strong>
                  <p>{{ template.whenToUse }}</p>
                </div>
              }

              <div class="template-meta">
                <span class="steps-count">{{ template.steps.length }} steps</span>
                <span class="usage-count">Used {{ template.usageCount }} times</span>
              </div>

              @if (template.tags.length > 0) {
                <div class="tags">
                  @for (tag of template.tags.slice(0, 3); track tag) {
                    <span class="tag">{{ tag }}</span>
                  }
                </div>
              }

              <div class="card-actions">
                <button (click)="launchWorkflow(template)" class="btn btn-primary">
                  Launch Workflow
                </button>
                <button (click)="viewTemplate(template)" class="btn btn-secondary">
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
    .template-library {
      padding: 20px 0;
    }

    .library-header {
      margin-bottom: 30px;
    }

    .library-header h2 {
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

    .filters {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
    }

    .search-input,
    .category-select {
      padding: 10px 15px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }

    .search-input {
      flex: 1;
    }

    .category-select {
      min-width: 200px;
    }

    .search-input:focus,
    .category-select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .category-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
      border-bottom: 1px solid #e5e7eb;
    }

    .tab-button {
      padding: 10px 20px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: #6b7280;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-button:hover {
      color: #111827;
    }

    .tab-button.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .template-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
    }

    .template-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #d1d5db;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
    }

    .card-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      flex: 1;
    }

    .category-badge {
      padding: 4px 10px;
      background: #eff6ff;
      color: #3b82f6;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .description {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 15px 0;
    }

    .when-to-use {
      background: #f9fafb;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .when-to-use strong {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .when-to-use p {
      margin: 5px 0 0 0;
      font-size: 13px;
      color: #374151;
    }

    .template-meta {
      display: flex;
      gap: 15px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 13px;
      color: #6b7280;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 15px;
    }

    .tag {
      padding: 4px 8px;
      background: #f3f4f6;
      color: #4b5563;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .card-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      flex: 1;
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
      grid-column: 1 / -1;
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
export class TemplateLibraryComponent {
  searchQuery = '';
  selectedCategory = '';
  private viewModeSignal = signal<'all' | 'popular' | 'recent'>('all');

  constructor(
    public templateState: TemplateStateService,
    private templateService: TemplateService,
    private taxonomyService: TaxonomyService,
    private engineService: EngineService,
    private router: Router
  ) {}

  // Computed signals
  viewMode = this.viewModeSignal.asReadonly();

  categories = this.templateState.categories;

  filteredTemplates = computed(() => {
    let templates = this.templateState.activeTemplates();

    // Apply search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.whenToUse.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      templates = templates.filter(t => t.category === this.selectedCategory);
    }

    return templates;
  });

  displayTemplates = computed(() => {
    const mode = this.viewModeSignal();
    const filtered = this.filteredTemplates();

    switch (mode) {
      case 'popular':
        return [...filtered].sort((a, b) => b.usageCount - a.usageCount).slice(0, 20);
      case 'recent':
        return [...filtered].sort((a, b) => b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime()).slice(0, 20);
      default:
        return filtered;
    }
  });

  // Actions
  setViewMode(mode: 'all' | 'popular' | 'recent'): void {
    this.viewModeSignal.set(mode);
  }

  onSearchChange(): void {
    // Search is reactive through computed signal
  }

  onCategoryChange(): void {
    // Filter is reactive through computed signal
  }

  launchWorkflow(template: WorkflowTemplate): void {
    const result = this.engineService.launchWorkflow(template.id, {});

    if (result.instance) {
      this.router.navigate(['/workflow/instances', result.instance.id]);
    } else {
      alert('Failed to launch workflow: ' + (result.error || 'Unknown error'));
    }
  }

  viewTemplate(template: WorkflowTemplate): void {
    // TODO: Implement template detail view
    console.log('View template:', template);
    alert(`Template Details:\n\n${template.name}\n\n${template.description}\n\nSteps: ${template.steps.length}`);
  }
}
