/**
 * Taxonomy Service
 *
 * Business logic for managing workflow categories and tags
 */

import { Injectable } from '@angular/core';
import { TemplateCategory, TemplateTag } from '../workflow.model';
import { TaxonomyRepository } from '../data/taxonomy.repository';
import { TemplateRepository } from '../data/template.repository';

@Injectable({
  providedIn: 'root'
})
export class TaxonomyService {
  constructor(
    private repository: TaxonomyRepository,
    private templateRepository: TemplateRepository
  ) {}

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  /**
   * Get all categories
   */
  getAllCategories(): TemplateCategory[] {
    return this.repository.getAllCategories();
  }

  /**
   * Get category by ID
   */
  getCategory(id: string): TemplateCategory | null {
    return this.repository.getCategoryById(id);
  }

  /**
   * Get top-level categories
   */
  getTopLevelCategories(): TemplateCategory[] {
    return this.repository.getTopLevelCategories();
  }

  /**
   * Get child categories
   */
  getChildCategories(parentId: string): TemplateCategory[] {
    return this.repository.getChildCategories(parentId);
  }

  /**
   * Create or update category
   */
  saveCategory(category: TemplateCategory): TemplateCategory {
    return this.repository.saveCategory(category);
  }

  /**
   * Delete category
   */
  deleteCategory(id: string): boolean {
    return this.repository.deleteCategory(id);
  }

  /**
   * Reset categories to defaults
   */
  resetCategories(): void {
    this.repository.resetCategories();
  }

  // ============================================================================
  // TAGS
  // ============================================================================

  /**
   * Get all tags
   */
  getAllTags(): TemplateTag[] {
    return this.repository.getAllTags();
  }

  /**
   * Get tag by ID
   */
  getTag(id: string): TemplateTag | null {
    return this.repository.getTagById(id);
  }

  /**
   * Get tags by category
   */
  getTagsByCategory(category: string): TemplateTag[] {
    return this.repository.getTagsByCategory(category);
  }

  /**
   * Get or create tag
   */
  getOrCreateTag(tagName: string, category?: string): TemplateTag {
    return this.repository.getOrCreateTag(tagName, category);
  }

  /**
   * Get popular tags
   */
  getPopularTags(limit: number = 20): TemplateTag[] {
    return this.repository.getPopularTags(limit);
  }

  /**
   * Search tags
   */
  searchTags(query: string): TemplateTag[] {
    return this.repository.searchTags(query);
  }

  /**
   * Sync tag usage counts with templates
   */
  syncTagUsage(): void {
    const templates = this.templateRepository.getActive();
    const templateTags = templates.map(t => t.tags);
    this.repository.syncTagUsageCounts(templateTags);
  }

  /**
   * Clean up unused tags
   */
  cleanupUnusedTags(): number {
    return this.repository.deleteUnusedTags();
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get category statistics
   */
  getCategoryStatistics(): Array<{ category: string; count: number }> {
    const templates = this.templateRepository.getActive();
    const categoryMap = new Map<string, number>();

    templates.forEach(template => {
      const count = categoryMap.get(template.category) || 0;
      categoryMap.set(template.category, count + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get tag cloud data
   */
  getTagCloud(): Array<{ tag: string; count: number; weight: number }> {
    const tags = this.repository.getPopularTags(50);
    const maxCount = Math.max(...tags.map(t => t.usageCount), 1);

    return tags.map(tag => ({
      tag: tag.name,
      count: tag.usageCount,
      weight: tag.usageCount / maxCount // Normalized 0-1
    }));
  }
}
