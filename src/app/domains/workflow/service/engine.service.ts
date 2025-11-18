/**
 * Workflow Engine Service
 *
 * Core execution engine for workflow instances
 * Handles launching workflows, executing transitions, and managing state
 */

import { Injectable } from '@angular/core';
import {
  WorkflowInstance,
  WorkflowTemplate,
  WorkflowActionRequest,
  WorkflowActionResult,
  WorkflowStatus,
  TransitionHistory,
  InstanceSearchCriteria
} from '../workflow.model';
import { TemplateRepository } from '../data/template.repository';
import { InstanceRepository } from '../data/instance.repository';
import { InstanceStateService } from './instanceState.service';
import { TemplateStateService } from './templateState.service';
import { validateActionRequest } from '../workflow.validation';
import { WORKFLOW_DEFAULTS, ERROR_CODES } from '../workflow.constants';

@Injectable({
  providedIn: 'root'
})
export class EngineService {
  constructor(
    private templateRepository: TemplateRepository,
    private instanceRepository: InstanceRepository,
    private instanceState: InstanceStateService,
    private templateState: TemplateStateService
  ) {}

  // ============================================================================
  // LAUNCH WORKFLOW
  // ============================================================================

  /**
   * Launch a new workflow instance from a template
   */
  launchWorkflow(
    templateId: number,
    initialData: Record<string, any> = {},
    initiatedBy?: string
  ): { instance: WorkflowInstance | null; error?: string } {
    // Get template
    const template = this.templateRepository.getById(templateId);
    if (!template) {
      return { instance: null, error: 'Template not found' };
    }

    if (template.deleted) {
      return { instance: null, error: 'Cannot launch workflow from deleted template' };
    }

    if (!template.steps || template.steps.length === 0) {
      return { instance: null, error: 'Template has no steps defined' };
    }

    // Get initial step
    const initialStep = template.steps.find(s => s.id === template.initialStepId) || template.steps[0];

    // Create instance
    const instance: Omit<WorkflowInstance, 'id'> = {
      templateId: template.id,
      templateName: template.name,
      currentStepId: initialStep.id,
      currentStepName: initialStep.name,
      status: WorkflowStatus.DRAFT,
      data: { ...initialData },
      history: [],
      initiatedBy,
      currentAssignees: [...initialStep.allowedRoles],
      createdAt: new Date(),
      lastModifiedAt: new Date(),
      deleted: false
    };

    // Save instance
    const savedInstance = this.instanceRepository.create(instance);

    // Increment template usage count
    this.templateRepository.incrementUsageCount(templateId);
    this.templateState.updateTemplate(templateId, { usageCount: template.usageCount + 1 });

    // Update state
    this.instanceState.addInstance(savedInstance);

    return { instance: savedInstance };
  }

  // ============================================================================
  // EXECUTE TRANSITIONS
  // ============================================================================

  /**
   * Execute a transition on a workflow instance
   */
  executeTransition(request: WorkflowActionRequest): WorkflowActionResult {
    // Get instance
    const instance = this.instanceRepository.getById(request.instanceId);
    if (!instance) {
      return {
        success: false,
        instanceId: request.instanceId,
        newStepId: '',
        newStatus: WorkflowStatus.DRAFT,
        message: 'Instance not found',
        errors: [ERROR_CODES.INSTANCE_NOT_FOUND]
      };
    }

    // Get template
    const template = this.templateRepository.getById(instance.templateId);
    if (!template) {
      return {
        success: false,
        instanceId: request.instanceId,
        newStepId: instance.currentStepId,
        newStatus: instance.status,
        message: 'Template not found',
        errors: [ERROR_CODES.TEMPLATE_NOT_FOUND]
      };
    }

    // Validate action
    const validation = validateActionRequest(request, instance, template);
    if (!validation.isValid) {
      return {
        success: false,
        instanceId: request.instanceId,
        newStepId: instance.currentStepId,
        newStatus: instance.status,
        message: validation.errors[0]?.message || 'Validation failed',
        errors: validation.errors.map(e => e.code)
      };
    }

    // Get current step
    const currentStep = template.steps.find(s => s.id === instance.currentStepId);
    if (!currentStep) {
      return {
        success: false,
        instanceId: request.instanceId,
        newStepId: instance.currentStepId,
        newStatus: instance.status,
        message: 'Current step not found in template',
        errors: ['STEP_NOT_FOUND']
      };
    }

    // Get transition
    const transition = currentStep.transitions.find(t => t.id === request.transitionId);
    if (!transition) {
      return {
        success: false,
        instanceId: request.instanceId,
        newStepId: instance.currentStepId,
        newStatus: instance.status,
        message: 'Transition not found',
        errors: [ERROR_CODES.TRANSITION_NOT_FOUND]
      };
    }

    // Get target step (if not terminal)
    let targetStep = null;
    if (transition.targetStepId) {
      targetStep = template.steps.find(s => s.id === transition.targetStepId);
      if (!targetStep) {
        return {
          success: false,
          instanceId: request.instanceId,
          newStepId: instance.currentStepId,
          newStatus: instance.status,
          message: 'Target step not found',
          errors: [ERROR_CODES.INVALID_TRANSITION_TARGET]
        };
      }
    }

    // Create history entry
    const historyEntry: TransitionHistory = {
      id: `history-${Date.now()}`,
      fromStepId: currentStep.id,
      toStepId: transition.targetStepId,
      action: transition.action,
      performedBy: request.performedBy,
      comment: request.comment,
      timestamp: new Date(),
      fromStepName: currentStep.name,
      toStepName: targetStep?.name || 'Terminal'
    };

    // Determine new status
    let newStatus = instance.status;
    if (instance.status === WorkflowStatus.DRAFT) {
      newStatus = WorkflowStatus.IN_PROGRESS;
    }

    // Check if transitioning to terminal state
    if (!transition.targetStepId || (targetStep && targetStep.isTerminal)) {
      // Determine terminal status based on action
      if (transition.action === 'reject') {
        newStatus = WorkflowStatus.REJECTED;
      } else if (transition.action === 'cancel') {
        newStatus = WorkflowStatus.CANCELLED;
      } else {
        newStatus = WorkflowStatus.COMPLETED;
      }
    }

    // Update instance
    const updates: Partial<WorkflowInstance> = {
      currentStepId: transition.targetStepId || instance.currentStepId,
      currentStepName: targetStep?.name || instance.currentStepName,
      status: newStatus,
      data: request.updateData ? { ...instance.data, ...request.updateData } : instance.data,
      history: [...instance.history, historyEntry],
      currentAssignees: targetStep ? [...targetStep.allowedRoles] : [],
      lastModifiedAt: new Date()
    };

    // Set completedAt if workflow is complete
    if (newStatus === WorkflowStatus.COMPLETED || newStatus === WorkflowStatus.REJECTED) {
      updates.completedAt = new Date();
    }

    // Save to repository
    const updatedInstance = this.instanceRepository.update(instance.id, updates);
    if (!updatedInstance) {
      return {
        success: false,
        instanceId: request.instanceId,
        newStepId: instance.currentStepId,
        newStatus: instance.status,
        message: 'Failed to update instance',
        errors: ['UPDATE_FAILED']
      };
    }

    // Update state
    this.instanceState.updateInstance(instance.id, updates);

    return {
      success: true,
      instanceId: request.instanceId,
      newStepId: transition.targetStepId || instance.currentStepId,
      newStatus,
      message: `Transition executed successfully: ${transition.label}`
    };
  }

  /**
   * Submit a draft workflow (move from draft to in-progress)
   */
  submitWorkflow(
    instanceId: number,
    performedBy?: string,
    comment?: string
  ): WorkflowActionResult {
    const instance = this.instanceRepository.getById(instanceId);
    if (!instance) {
      return {
        success: false,
        instanceId,
        newStepId: '',
        newStatus: WorkflowStatus.DRAFT,
        message: 'Instance not found',
        errors: [ERROR_CODES.INSTANCE_NOT_FOUND]
      };
    }

    if (instance.status !== WorkflowStatus.DRAFT) {
      return {
        success: false,
        instanceId,
        newStepId: instance.currentStepId,
        newStatus: instance.status,
        message: 'Only draft workflows can be submitted',
        errors: [ERROR_CODES.TRANSITION_INVALID_STATE]
      };
    }

    // Find a submit transition or first available transition
    const template = this.templateRepository.getById(instance.templateId);
    if (!template) {
      return {
        success: false,
        instanceId,
        newStepId: instance.currentStepId,
        newStatus: instance.status,
        message: 'Template not found',
        errors: [ERROR_CODES.TEMPLATE_NOT_FOUND]
      };
    }

    const currentStep = template.steps.find(s => s.id === instance.currentStepId);
    if (!currentStep || currentStep.transitions.length === 0) {
      return {
        success: false,
        instanceId,
        newStepId: instance.currentStepId,
        newStatus: instance.status,
        message: 'No transitions available from current step',
        errors: [ERROR_CODES.TRANSITION_NOT_FOUND]
      };
    }

    // Find submit transition or use first one
    const transition = currentStep.transitions.find(t => t.action === 'submit') || currentStep.transitions[0];

    return this.executeTransition({
      instanceId,
      transitionId: transition.id,
      performedBy,
      comment
    });
  }

  /**
   * Cancel a workflow
   */
  cancelWorkflow(
    instanceId: number,
    performedBy?: string,
    comment?: string
  ): WorkflowActionResult {
    const instance = this.instanceRepository.getById(instanceId);
    if (!instance) {
      return {
        success: false,
        instanceId,
        newStepId: '',
        newStatus: WorkflowStatus.DRAFT,
        message: 'Instance not found',
        errors: [ERROR_CODES.INSTANCE_NOT_FOUND]
      };
    }

    if (instance.status === WorkflowStatus.COMPLETED || instance.status === WorkflowStatus.REJECTED || instance.status === WorkflowStatus.CANCELLED) {
      return {
        success: false,
        instanceId,
        newStepId: instance.currentStepId,
        newStatus: instance.status,
        message: 'Cannot cancel completed/rejected/cancelled workflows',
        errors: [ERROR_CODES.INSTANCE_ALREADY_COMPLETED]
      };
    }

    // Create cancel history entry
    const historyEntry: TransitionHistory = {
      id: `history-${Date.now()}`,
      fromStepId: instance.currentStepId,
      toStepId: null,
      action: 'cancel',
      performedBy,
      comment: comment || 'Workflow cancelled',
      timestamp: new Date(),
      fromStepName: instance.currentStepName,
      toStepName: 'Cancelled'
    };

    const updates: Partial<WorkflowInstance> = {
      status: WorkflowStatus.CANCELLED,
      history: [...instance.history, historyEntry],
      lastModifiedAt: new Date(),
      completedAt: new Date()
    };

    const updated = this.instanceRepository.update(instanceId, updates);
    if (!updated) {
      return {
        success: false,
        instanceId,
        newStepId: instance.currentStepId,
        newStatus: instance.status,
        message: 'Failed to cancel workflow',
        errors: ['UPDATE_FAILED']
      };
    }

    this.instanceState.updateInstance(instanceId, updates);

    return {
      success: true,
      instanceId,
      newStepId: instance.currentStepId,
      newStatus: WorkflowStatus.CANCELLED,
      message: 'Workflow cancelled successfully'
    };
  }

  // ============================================================================
  // INSTANCE MANAGEMENT
  // ============================================================================

  /**
   * Update workflow data (without changing state)
   */
  updateWorkflowData(
    instanceId: number,
    data: Record<string, any>
  ): { success: boolean; error?: string } {
    const instance = this.instanceRepository.getById(instanceId);
    if (!instance) {
      return { success: false, error: 'Instance not found' };
    }

    const updated = this.instanceRepository.update(instanceId, {
      data: { ...instance.data, ...data }
    });

    if (!updated) {
      return { success: false, error: 'Failed to update data' };
    }

    this.instanceState.updateInstance(instanceId, { data: updated.data });
    return { success: true };
  }

  /**
   * Delete workflow instance
   */
  deleteInstance(instanceId: number): boolean {
    const success = this.instanceRepository.delete(instanceId);
    if (success) {
      this.instanceState.updateInstance(instanceId, { deleted: true });
    }
    return success;
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Search instances
   */
  searchInstances(criteria: InstanceSearchCriteria): WorkflowInstance[] {
    let results = this.instanceRepository.getActive();

    // Status filter
    if (criteria.status && criteria.status.length > 0) {
      results = this.instanceRepository.getByStatuses(criteria.status);
    }

    // Template filter
    if (criteria.templateId) {
      results = results.filter(i => i.templateId === criteria.templateId);
    }

    // Initiator filter
    if (criteria.initiatedBy) {
      results = results.filter(i => i.initiatedBy === criteria.initiatedBy);
    }

    // Assignee filter
    if (criteria.currentAssignee) {
      results = results.filter(i => i.currentAssignees.includes(criteria.currentAssignee!));
    }

    // Date filters
    if (criteria.createdAfter) {
      results = results.filter(i => i.createdAt.getTime() > criteria.createdAfter!.getTime());
    }
    if (criteria.createdBefore) {
      results = results.filter(i => i.createdAt.getTime() < criteria.createdBefore!.getTime());
    }

    // Category filter (via template)
    if (criteria.category) {
      const templateIds = this.templateRepository
        .getByCategory(criteria.category)
        .map(t => t.id);
      results = results.filter(i => templateIds.includes(i.templateId));
    }

    // Sort
    if (criteria.sortBy) {
      results = this.sortInstances(results, criteria.sortBy, criteria.sortOrder || 'desc');
    }

    return results;
  }

  /**
   * Get instance with template
   */
  getInstanceWithTemplate(instanceId: number): { instance: WorkflowInstance; template: WorkflowTemplate } | null {
    const instance = this.instanceRepository.getById(instanceId);
    if (!instance) return null;

    const template = this.templateRepository.getById(instance.templateId);
    if (!template) return null;

    return { instance, template };
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Sort instances
   */
  private sortInstances(
    instances: WorkflowInstance[],
    sortBy: 'createdAt' | 'lastModifiedAt' | 'status',
    sortOrder: 'asc' | 'desc'
  ): WorkflowInstance[] {
    const sorted = [...instances].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'lastModifiedAt':
          comparison = a.lastModifiedAt.getTime() - b.lastModifiedAt.getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }
}
