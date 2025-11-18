/**
 * Workflow Template Repository
 *
 * Framework layer for template persistence using localStorage
 */

import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WorkflowTemplate } from '../workflow.model';
import { WORKFLOW_STORAGE_KEYS } from '../workflow.constants';

@Injectable({
  providedIn: 'root'
})
export class TemplateRepository {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private readonly storageKey = WORKFLOW_STORAGE_KEYS.TEMPLATES;
  private readonly nextIdKey = WORKFLOW_STORAGE_KEYS.NEXT_TEMPLATE_ID;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Get all templates
   */
  getAll(): WorkflowTemplate[] {
    if (!this.isBrowser) return [];

    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return [];
      }
      const templates = JSON.parse(data);
      return this.deserializeTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  }

  /**
   * Get template by ID
   */
  getById(id: number): WorkflowTemplate | null {
    const templates = this.getAll();
    return templates.find(t => t.id === id) || null;
  }

  /**
   * Get templates by IDs
   */
  getByIds(ids: number[]): WorkflowTemplate[] {
    const templates = this.getAll();
    const idSet = new Set(ids);
    return templates.filter(t => idSet.has(t.id));
  }

  /**
   * Get active (non-deleted) templates
   */
  getActive(): WorkflowTemplate[] {
    return this.getAll().filter(t => !t.deleted);
  }

  /**
   * Get templates by category
   */
  getByCategory(category: string): WorkflowTemplate[] {
    return this.getActive().filter(t => t.category === category);
  }

  /**
   * Get templates by tags (contains any of the tags)
   */
  getByTags(tags: string[]): WorkflowTemplate[] {
    const tagSet = new Set(tags);
    return this.getActive().filter(t =>
      t.tags.some(tag => tagSet.has(tag))
    );
  }

  /**
   * Search templates by name or description
   */
  search(query: string): WorkflowTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getActive().filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.whenToUse.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Save template (create or update)
   */
  save(template: WorkflowTemplate): WorkflowTemplate {
    const templates = this.getAll();
    const existingIndex = templates.findIndex(t => t.id === template.id);

    const now = new Date();
    const savedTemplate = {
      ...template,
      lastModifiedAt: now
    };

    if (existingIndex >= 0) {
      // Update existing
      templates[existingIndex] = savedTemplate;
    } else {
      // Create new
      savedTemplate.createdAt = now;
      templates.push(savedTemplate);
    }

    this.saveAll(templates);
    return savedTemplate;
  }

  /**
   * Create new template with generated ID
   */
  create(template: Omit<WorkflowTemplate, 'id'>): WorkflowTemplate {
    const id = this.getNextId();
    const newTemplate: WorkflowTemplate = {
      ...template,
      id,
      createdAt: new Date(),
      lastModifiedAt: new Date()
    };
    return this.save(newTemplate);
  }

  /**
   * Update existing template
   */
  update(id: number, updates: Partial<WorkflowTemplate>): WorkflowTemplate | null {
    const template = this.getById(id);
    if (!template) {
      return null;
    }

    const updated = {
      ...template,
      ...updates,
      id, // Ensure ID doesn't change
      createdAt: template.createdAt, // Preserve creation date
      lastModifiedAt: new Date()
    };

    return this.save(updated);
  }

  /**
   * Delete template (soft delete)
   */
  delete(id: number): boolean {
    const template = this.getById(id);
    if (!template) {
      return false;
    }

    template.deleted = true;
    template.lastModifiedAt = new Date();
    this.save(template);
    return true;
  }

  /**
   * Permanently delete template
   */
  hardDelete(id: number): boolean {
    const templates = this.getAll();
    const filteredTemplates = templates.filter(t => t.id !== id);

    if (templates.length === filteredTemplates.length) {
      return false; // Template not found
    }

    this.saveAll(filteredTemplates);
    return true;
  }

  /**
   * Restore deleted template
   */
  restore(id: number): boolean {
    const template = this.getById(id);
    if (!template || !template.deleted) {
      return false;
    }

    template.deleted = false;
    template.lastModifiedAt = new Date();
    this.save(template);
    return true;
  }

  /**
   * Increment template usage count
   */
  incrementUsageCount(id: number): boolean {
    const template = this.getById(id);
    if (!template) {
      return false;
    }

    template.usageCount++;
    template.lastModifiedAt = new Date();
    this.save(template);
    return true;
  }

  /**
   * Get most used templates
   */
  getMostUsed(limit: number = 10): WorkflowTemplate[] {
    return this.getActive()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Get recently created templates
   */
  getRecentlyCreated(limit: number = 10): WorkflowTemplate[] {
    return this.getActive()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get recently modified templates
   */
  getRecentlyModified(limit: number = 10): WorkflowTemplate[] {
    return this.getActive()
      .sort((a, b) => b.lastModifiedAt.getTime() - a.lastModifiedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get templates by parent ID (cloned templates)
   */
  getByParent(parentId: number): WorkflowTemplate[] {
    return this.getActive().filter(t => t.parentTemplateId === parentId);
  }

  /**
   * Get template family tree (parent + all descendants)
   */
  getFamilyTree(templateId: number): WorkflowTemplate[] {
    const template = this.getById(templateId);
    if (!template) {
      return [];
    }

    const family: WorkflowTemplate[] = [template];
    const descendants = this.getDescendants(templateId);
    family.push(...descendants);

    return family;
  }

  /**
   * Get all descendants of a template (recursive)
   */
  private getDescendants(parentId: number): WorkflowTemplate[] {
    const children = this.getByParent(parentId);
    const descendants: WorkflowTemplate[] = [...children];

    for (const child of children) {
      descendants.push(...this.getDescendants(child.id));
    }

    return descendants;
  }

  /**
   * Clear all templates (dangerous!)
   */
  clear(): void {
    if (!this.isBrowser) return;

    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.nextIdKey);
  }

  /**
   * Get count of templates
   */
  count(): number {
    return this.getActive().length;
  }

  /**
   * Check if template exists
   */
  exists(id: number): boolean {
    return this.getById(id) !== null;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Save all templates to localStorage
   */
  private saveAll(templates: WorkflowTemplate[]): void {
    if (!this.isBrowser) return;

    try {
      const serialized = this.serializeTemplates(templates);
      localStorage.setItem(this.storageKey, JSON.stringify(serialized));
    } catch (error) {
      console.error('Error saving templates:', error);
      throw new Error('Failed to save templates');
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
   * Serialize templates for storage (convert Dates to strings)
   */
  private serializeTemplates(templates: WorkflowTemplate[]): any[] {
    return templates.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      lastModifiedAt: t.lastModifiedAt.toISOString()
    }));
  }

  /**
   * Deserialize templates from storage (convert strings to Dates)
   */
  private deserializeTemplates(data: any[]): WorkflowTemplate[] {
    return data.map(t => ({
      ...t,
      createdAt: new Date(t.createdAt),
      lastModifiedAt: new Date(t.lastModifiedAt)
    }));
  }
}
