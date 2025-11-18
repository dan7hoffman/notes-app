/**
 * Taxonomy Repository
 *
 * Framework layer for managing workflow categories and tags
 */

import { Injectable } from '@angular/core';
import { TemplateCategory, TemplateTag } from '../workflow.model';
import { WORKFLOW_STORAGE_KEYS, DEFAULT_CATEGORIES } from '../workflow.constants';

@Injectable({
  providedIn: 'root'
})
export class TaxonomyRepository {
  private readonly categoriesKey = WORKFLOW_STORAGE_KEYS.CATEGORIES;
  private readonly tagsKey = WORKFLOW_STORAGE_KEYS.TAGS;

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  /**
   * Get all categories
   */
  getAllCategories(): TemplateCategory[] {
    try {
      const data = localStorage.getItem(this.categoriesKey);
      if (!data) {
        // Initialize with defaults
        this.saveAllCategories(DEFAULT_CATEGORIES);
        return [...DEFAULT_CATEGORIES];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      return [...DEFAULT_CATEGORIES];
    }
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): TemplateCategory | null {
    const categories = this.getAllCategories();
    return categories.find(c => c.id === id) || null;
  }

  /**
   * Get top-level categories (no parent)
   */
  getTopLevelCategories(): TemplateCategory[] {
    return this.getAllCategories().filter(c => !c.parentCategoryId);
  }

  /**
   * Get child categories
   */
  getChildCategories(parentId: string): TemplateCategory[] {
    return this.getAllCategories().filter(c => c.parentCategoryId === parentId);
  }

  /**
   * Save category
   */
  saveCategory(category: TemplateCategory): TemplateCategory {
    const categories = this.getAllCategories();
    const existingIndex = categories.findIndex(c => c.id === category.id);

    if (existingIndex >= 0) {
      categories[existingIndex] = category;
    } else {
      categories.push(category);
    }

    this.saveAllCategories(categories);
    return category;
  }

  /**
   * Delete category
   */
  deleteCategory(id: string): boolean {
    const categories = this.getAllCategories();
    const filteredCategories = categories.filter(c => c.id !== id);

    if (categories.length === filteredCategories.length) {
      return false; // Category not found
    }

    this.saveAllCategories(filteredCategories);
    return true;
  }

  /**
   * Reset categories to defaults
   */
  resetCategories(): void {
    this.saveAllCategories(DEFAULT_CATEGORIES);
  }

  /**
   * Save all categories
   */
  private saveAllCategories(categories: TemplateCategory[]): void {
    try {
      localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
      throw new Error('Failed to save categories');
    }
  }

  // ============================================================================
  // TAGS
  // ============================================================================

  /**
   * Get all tags
   */
  getAllTags(): TemplateTag[] {
    try {
      const data = localStorage.getItem(this.tagsKey);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading tags:', error);
      return [];
    }
  }

  /**
   * Get tag by ID
   */
  getTagById(id: string): TemplateTag | null {
    const tags = this.getAllTags();
    return tags.find(t => t.id === id) || null;
  }

  /**
   * Get tags by category
   */
  getTagsByCategory(category: string): TemplateTag[] {
    return this.getAllTags().filter(t => t.category === category);
  }

  /**
   * Get or create tag
   */
  getOrCreateTag(tagName: string, category?: string): TemplateTag {
    const tags = this.getAllTags();
    const existing = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());

    if (existing) {
      return existing;
    }

    // Create new tag
    const newTag: TemplateTag = {
      id: this.generateTagId(tagName),
      name: tagName,
      category,
      usageCount: 0
    };

    tags.push(newTag);
    this.saveAllTags(tags);
    return newTag;
  }

  /**
   * Increment tag usage count
   */
  incrementTagUsage(tagName: string): void {
    const tags = this.getAllTags();
    const tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());

    if (tag) {
      tag.usageCount++;
      this.saveAllTags(tags);
    }
  }

  /**
   * Decrement tag usage count
   */
  decrementTagUsage(tagName: string): void {
    const tags = this.getAllTags();
    const tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());

    if (tag && tag.usageCount > 0) {
      tag.usageCount--;
      this.saveAllTags(tags);
    }
  }

  /**
   * Update tag usage counts based on templates
   */
  syncTagUsageCounts(templateTags: string[][]): void {
    // Count tag occurrences
    const tagCounts = new Map<string, number>();
    templateTags.flat().forEach(tag => {
      const lowerTag = tag.toLowerCase();
      tagCounts.set(lowerTag, (tagCounts.get(lowerTag) || 0) + 1);
    });

    // Update all tags
    const tags = this.getAllTags();
    tags.forEach(tag => {
      tag.usageCount = tagCounts.get(tag.name.toLowerCase()) || 0;
    });

    this.saveAllTags(tags);
  }

  /**
   * Get popular tags
   */
  getPopularTags(limit: number = 20): TemplateTag[] {
    return this.getAllTags()
      .filter(t => t.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Search tags
   */
  searchTags(query: string): TemplateTag[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTags().filter(t =>
      t.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Delete unused tags
   */
  deleteUnusedTags(): number {
    const tags = this.getAllTags();
    const usedTags = tags.filter(t => t.usageCount > 0);
    const deletedCount = tags.length - usedTags.length;

    this.saveAllTags(usedTags);
    return deletedCount;
  }

  /**
   * Clear all tags
   */
  clearTags(): void {
    localStorage.removeItem(this.tagsKey);
  }

  /**
   * Save all tags
   */
  private saveAllTags(tags: TemplateTag[]): void {
    try {
      localStorage.setItem(this.tagsKey, JSON.stringify(tags));
    } catch (error) {
      console.error('Error saving tags:', error);
      throw new Error('Failed to save tags');
    }
  }

  /**
   * Generate tag ID from name
   */
  private generateTagId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
  }
}
