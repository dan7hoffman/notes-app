/**
 * Template Service
 *
 * Business logic for workflow template management including
 * create, clone, search, filter, and validation
 */

import { Injectable } from '@angular/core';
import {
  WorkflowTemplate,
  WorkflowStepDefinition,
  TransitionDefinition,
  CreateTemplateRequest,
  CloneTemplateRequest,
  TemplateSearchCriteria,
  ValidationResult,
  TransitionAction
} from '../workflow.model';
import { TemplateRepository } from '../data/template.repository';
import { TemplateStateService } from './templateState.service';
import { validateTemplate } from '../workflow.validation';
import { WORKFLOW_DEFAULTS } from '../workflow.constants';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  constructor(
    private repository: TemplateRepository,
    private state: TemplateStateService
  ) {}

  // ============================================================================
  // TEMPLATE CRUD
  // ============================================================================

  /**
   * Create new template
   */
  createTemplate(request: CreateTemplateRequest): { template: WorkflowTemplate | null; validation: ValidationResult } {
    // Generate step IDs and build complete template
    const steps = this.generateStepIds(request.steps);
    const initialStepId = steps.length > 0 ? steps[0].id : '';

    const template: Omit<WorkflowTemplate, 'id'> = {
      name: request.name.trim(),
      description: request.description.trim(),
      category: request.category,
      subcategory: request.subcategory,
      tags: request.tags || WORKFLOW_DEFAULTS.TEMPLATE.TAGS,
      parentTemplateId: null,
      version: WORKFLOW_DEFAULTS.TEMPLATE.VERSION,
      applicableTo: request.applicableTo || [...WORKFLOW_DEFAULTS.TEMPLATE.APPLICABLE_TO],
      departmentRestrictions: undefined,
      amountThresholds: undefined,
      whenToUse: request.whenToUse || '',
      steps,
      initialStepId,
      isPublic: request.isPublic ?? WORKFLOW_DEFAULTS.TEMPLATE.IS_PUBLIC,
      usageCount: WORKFLOW_DEFAULTS.TEMPLATE.USAGE_COUNT,
      author: request.author,
      relatedTemplates: WORKFLOW_DEFAULTS.TEMPLATE.RELATED_TEMPLATES,
      supersedes: undefined,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
      deleted: WORKFLOW_DEFAULTS.TEMPLATE.DELETED
    };

    // Validate template
    const validation = validateTemplate(template as WorkflowTemplate);
    if (!validation.isValid) {
      return { template: null, validation };
    }

    // Save to repository
    const savedTemplate = this.repository.create(template);

    // Update state
    this.state.addTemplate(savedTemplate);

    return { template: savedTemplate, validation };
  }

  /**
   * Clone existing template
   */
  cloneTemplate(request: CloneTemplateRequest): { template: WorkflowTemplate | null; validation: ValidationResult; error?: string } {
    // Get source template
    const source = this.repository.getById(request.sourceTemplateId);
    if (!source) {
      return {
        template: null,
        validation: { isValid: false, errors: [{ field: 'sourceTemplateId', message: 'Source template not found', code: 'NOT_FOUND' }] },
        error: 'Source template not found'
      };
    }

    // Build cloned template
    let clonedTemplate: Omit<WorkflowTemplate, 'id'> = {
      ...source,
      name: request.newName.trim(),
      description: request.newDescription?.trim() || source.description,
      parentTemplateId: source.id,
      version: source.version + 1,
      usageCount: 0,
      relatedTemplates: [source.id],
      createdAt: new Date(),
      lastModifiedAt: new Date()
    };

    // Apply modifications if provided
    if (request.modifications) {
      const { addSteps, removeStepIds, updateSteps, updateTags, updateCategory } = request.modifications;

      // Update steps
      let steps = [...clonedTemplate.steps];

      // Remove steps
      if (removeStepIds && removeStepIds.length > 0) {
        const removeSet = new Set(removeStepIds);
        steps = steps.filter(s => !removeSet.has(s.id));
      }

      // Update steps
      if (updateSteps && updateSteps.length > 0) {
        steps = steps.map(step => {
          const update = updateSteps.find(u => u.id === step.id);
          return update ? { ...step, ...update } : step;
        });
      }

      // Add steps
      if (addSteps && addSteps.length > 0) {
        const newSteps = this.generateStepIds(addSteps);
        steps.push(...newSteps);
      }

      clonedTemplate.steps = steps;

      // Update tags
      if (updateTags) {
        clonedTemplate.tags = updateTags;
      }

      // Update category
      if (updateCategory) {
        clonedTemplate.category = updateCategory;
      }
    }

    // Validate cloned template
    const validation = validateTemplate(clonedTemplate as WorkflowTemplate);
    if (!validation.isValid) {
      return { template: null, validation };
    }

    // Save to repository
    const savedTemplate = this.repository.create(clonedTemplate);

    // Update state
    this.state.addTemplate(savedTemplate);

    return { template: savedTemplate, validation };
  }

  /**
   * Update template
   */
  updateTemplate(id: number, updates: Partial<WorkflowTemplate>): { template: WorkflowTemplate | null; validation: ValidationResult; error?: string } {
    const existing = this.repository.getById(id);
    if (!existing) {
      return {
        template: null,
        validation: { isValid: false, errors: [{ field: 'id', message: 'Template not found', code: 'NOT_FOUND' }] },
        error: 'Template not found'
      };
    }

    const updated = { ...existing, ...updates };

    // Validate
    const validation = validateTemplate(updated);
    if (!validation.isValid) {
      return { template: null, validation };
    }

    // Save
    const savedTemplate = this.repository.update(id, updates);
    if (!savedTemplate) {
      return {
        template: null,
        validation: { isValid: false, errors: [{ field: 'id', message: 'Failed to update template', code: 'UPDATE_FAILED' }] },
        error: 'Failed to update template'
      };
    }

    // Update state
    this.state.updateTemplate(id, updates);

    return { template: savedTemplate, validation };
  }

  /**
   * Delete template (soft delete)
   */
  deleteTemplate(id: number): boolean {
    const success = this.repository.delete(id);
    if (success) {
      this.state.updateTemplate(id, { deleted: true });
    }
    return success;
  }

  /**
   * Restore deleted template
   */
  restoreTemplate(id: number): boolean {
    const success = this.repository.restore(id);
    if (success) {
      this.state.updateTemplate(id, { deleted: false });
    }
    return success;
  }

  // ============================================================================
  // SEARCH & FILTER
  // ============================================================================

  /**
   * Search and filter templates
   */
  searchTemplates(criteria: TemplateSearchCriteria): WorkflowTemplate[] {
    let results = this.repository.getActive();

    // Text search
    if (criteria.query && criteria.query.trim().length > 0) {
      results = this.repository.search(criteria.query.trim());
    }

    // Category filter
    if (criteria.category) {
      results = results.filter(t => t.category === criteria.category);
    }

    // Subcategory filter
    if (criteria.subcategory) {
      results = results.filter(t => t.subcategory === criteria.subcategory);
    }

    // Tags filter (contains any)
    if (criteria.tags && criteria.tags.length > 0) {
      const tagSet = new Set(criteria.tags);
      results = results.filter(t => t.tags.some(tag => tagSet.has(tag)));
    }

    // Applicable to filter
    if (criteria.applicableTo && criteria.applicableTo.length > 0) {
      const applicableSet = new Set(criteria.applicableTo);
      results = results.filter(t =>
        t.applicableTo.some(a => applicableSet.has(a))
      );
    }

    // Amount filters
    if (criteria.minAmount !== undefined) {
      results = results.filter(t =>
        !t.amountThresholds ||
        !t.amountThresholds.max ||
        t.amountThresholds.max >= criteria.minAmount!
      );
    }
    if (criteria.maxAmount !== undefined) {
      results = results.filter(t =>
        !t.amountThresholds ||
        !t.amountThresholds.min ||
        t.amountThresholds.min <= criteria.maxAmount!
      );
    }

    // Department restrictions
    if (criteria.departmentRestrictions && criteria.departmentRestrictions.length > 0) {
      const deptSet = new Set(criteria.departmentRestrictions);
      results = results.filter(t =>
        !t.departmentRestrictions ||
        t.departmentRestrictions.length === 0 ||
        t.departmentRestrictions.some(d => deptSet.has(d))
      );
    }

    // Public filter
    if (criteria.isPublic !== undefined) {
      results = results.filter(t => t.isPublic === criteria.isPublic);
    }

    // Sort
    if (criteria.sortBy) {
      results = this.sortTemplates(results, criteria.sortBy, criteria.sortOrder || 'asc');
    }

    return results;
  }

  /**
   * Get recommended templates based on context
   */
  getRecommendedTemplates(context: {
    category?: string;
    tags?: string[];
    applicableTo?: string;
    amount?: number;
  }): WorkflowTemplate[] {
    const criteria: TemplateSearchCriteria = {
      category: context.category,
      tags: context.tags,
      applicableTo: context.applicableTo ? [context.applicableTo] : undefined,
      sortBy: 'usageCount',
      sortOrder: 'desc'
    };

    return this.searchTemplates(criteria).slice(0, 5);
  }

  // ============================================================================
  // TEMPLATE FAMILY
  // ============================================================================

  /**
   * Get template variants (siblings from same parent)
   */
  getTemplateVariants(templateId: number): WorkflowTemplate[] {
    const template = this.repository.getById(templateId);
    if (!template || !template.parentTemplateId) {
      return [];
    }

    return this.repository.getByParent(template.parentTemplateId)
      .filter(t => t.id !== templateId);
  }

  /**
   * Get template descendants (all clones)
   */
  getTemplateDescendants(templateId: number): WorkflowTemplate[] {
    return this.repository.getFamilyTree(templateId)
      .filter(t => t.id !== templateId);
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Generate step IDs for steps without IDs
   */
  private generateStepIds(steps: Omit<WorkflowStepDefinition, 'id'>[]): WorkflowStepDefinition[] {
    return steps.map((step, index) => {
      const stepId = `step-${Date.now()}-${index}`;
      const transitions = this.generateTransitionIds(step.transitions || [], stepId);

      return {
        ...WORKFLOW_DEFAULTS.STEP,
        ...step,
        id: stepId,
        transitions,
        order: index
      };
    });
  }

  /**
   * Generate transition IDs for transitions without IDs
   */
  private generateTransitionIds(
    transitions: Omit<TransitionDefinition, 'id'>[],
    stepId: string
  ): TransitionDefinition[] {
    return transitions.map((transition, index) => ({
      ...WORKFLOW_DEFAULTS.TRANSITION,
      ...transition,
      id: `${stepId}-transition-${index}`,
      action: transition.action || TransitionAction.APPROVE
    }));
  }

  /**
   * Sort templates
   */
  private sortTemplates(
    templates: WorkflowTemplate[],
    sortBy: 'name' | 'usageCount' | 'createdAt' | 'lastModifiedAt',
    sortOrder: 'asc' | 'desc'
  ): WorkflowTemplate[] {
    const sorted = [...templates].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'usageCount':
          comparison = a.usageCount - b.usageCount;
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'lastModifiedAt':
          comparison = a.lastModifiedAt.getTime() - b.lastModifiedAt.getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Validate template
   */
  validateTemplate(template: Partial<WorkflowTemplate>): ValidationResult {
    return validateTemplate(template);
  }
}
