/**
 * Template State Service
 *
 * Signal-based state management for workflow templates
 */

import { Inject, Injectable, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WorkflowTemplate, TemplateStatistics } from '../workflow.model';
import { TemplateRepository } from '../data/template.repository';

@Injectable({
  providedIn: 'root'
})
export class TemplateStateService {
  // Raw state signals
  private templatesSignal = signal<WorkflowTemplate[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private selectedTemplateIdSignal = signal<number | null>(null);

  // Public read-only signals
  readonly templates = this.templatesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly selectedTemplateId = this.selectedTemplateIdSignal.asReadonly();

  // Computed signals
  readonly activeTemplates = computed(() =>
    this.templatesSignal().filter(t => !t.deleted)
  );

  readonly deletedTemplates = computed(() =>
    this.templatesSignal().filter(t => t.deleted)
  );

  readonly selectedTemplate = computed(() => {
    const id = this.selectedTemplateIdSignal();
    if (id === null) return null;
    return this.templatesSignal().find(t => t.id === id) || null;
  });

  readonly templateCount = computed(() => this.activeTemplates().length);

  readonly templatesByCategory = computed(() => {
    const categoryMap = new Map<string, WorkflowTemplate[]>();
    this.activeTemplates().forEach(template => {
      const templates = categoryMap.get(template.category) || [];
      templates.push(template);
      categoryMap.set(template.category, templates);
    });
    return categoryMap;
  });

  readonly categories = computed(() => {
    const categorySet = new Set<string>();
    this.activeTemplates().forEach(t => categorySet.add(t.category));
    return Array.from(categorySet).sort();
  });

  readonly allTags = computed(() => {
    const tagSet = new Set<string>();
    this.activeTemplates().forEach(t =>
      t.tags.forEach(tag => tagSet.add(tag))
    );
    return Array.from(tagSet).sort();
  });

  readonly mostUsedTemplates = computed(() =>
    [...this.activeTemplates()]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
  );

  readonly recentTemplates = computed(() =>
    [...this.activeTemplates()]
      .sort((a, b) => b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime())
      .slice(0, 10)
  );

  constructor(
    private repository: TemplateRepository,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only load templates in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadTemplates();
    }
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Load all templates from repository
   */
  loadTemplates(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const templates = this.repository.getAll();
      this.templatesSignal.set(templates);
    } catch (error) {
      this.errorSignal.set('Failed to load templates');
      console.error('Error loading templates:', error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Reload templates (refresh from storage)
   */
  reload(): void {
    this.loadTemplates();
  }

  /**
   * Add template to state
   */
  addTemplate(template: WorkflowTemplate): void {
    const templates = [...this.templatesSignal()];
    templates.push(template);
    this.templatesSignal.set(templates);
  }

  /**
   * Update template in state
   */
  updateTemplate(id: number, updates: Partial<WorkflowTemplate>): void {
    const templates = this.templatesSignal().map(t =>
      t.id === id ? { ...t, ...updates, id } : t
    );
    this.templatesSignal.set(templates);
  }

  /**
   * Remove template from state
   */
  removeTemplate(id: number): void {
    const templates = this.templatesSignal().filter(t => t.id !== id);
    this.templatesSignal.set(templates);
  }

  /**
   * Select template
   */
  selectTemplate(id: number | null): void {
    this.selectedTemplateIdSignal.set(id);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedTemplateIdSignal.set(null);
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
   * Get template by ID
   */
  getTemplateById(id: number): WorkflowTemplate | undefined {
    return this.templatesSignal().find(t => t.id === id);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return this.activeTemplates().filter(t => t.category === category);
  }

  /**
   * Get templates by tag
   */
  getTemplatesByTag(tag: string): WorkflowTemplate[] {
    return this.activeTemplates().filter(t => t.tags.includes(tag));
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): WorkflowTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.activeTemplates().filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.whenToUse.toLowerCase().includes(lowerQuery)
    );
  }
}
