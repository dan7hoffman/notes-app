/**
 * Workflow Validation Layer
 *
 * Validates workflow templates, instances, and transitions
 */

import {
  WorkflowTemplate,
  WorkflowStepDefinition,
  TransitionDefinition,
  WorkflowInstance,
  WorkflowActionRequest,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  WorkflowStatus
} from './workflow.model';
import { VALIDATION_LIMITS, ERROR_CODES } from './workflow.constants';

// ============================================================================
// TEMPLATE VALIDATION
// ============================================================================

/**
 * Validate a workflow template
 */
export function validateTemplate(template: Partial<WorkflowTemplate>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Name validation
  if (!template.name || template.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Template name is required',
      code: ERROR_CODES.TEMPLATE_NAME_REQUIRED
    });
  } else if (template.name.length < VALIDATION_LIMITS.TEMPLATE_NAME_MIN) {
    errors.push({
      field: 'name',
      message: `Template name must be at least ${VALIDATION_LIMITS.TEMPLATE_NAME_MIN} characters`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
  } else if (template.name.length > VALIDATION_LIMITS.TEMPLATE_NAME_MAX) {
    errors.push({
      field: 'name',
      message: `Template name must not exceed ${VALIDATION_LIMITS.TEMPLATE_NAME_MAX} characters`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Description validation
  if (template.description && template.description.length > VALIDATION_LIMITS.DESCRIPTION_MAX) {
    errors.push({
      field: 'description',
      message: `Description must not exceed ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Category validation
  if (!template.category || template.category.trim().length === 0) {
    errors.push({
      field: 'category',
      message: 'Category is required',
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Steps validation
  if (!template.steps || template.steps.length === 0) {
    errors.push({
      field: 'steps',
      message: 'At least one step is required',
      code: ERROR_CODES.TEMPLATE_STEPS_REQUIRED
    });
  } else {
    // Validate step count
    if (template.steps.length < VALIDATION_LIMITS.MIN_STEPS) {
      errors.push({
        field: 'steps',
        message: `Template must have at least ${VALIDATION_LIMITS.MIN_STEPS} step`,
        code: ERROR_CODES.VALIDATION_FAILED
      });
    }
    if (template.steps.length > VALIDATION_LIMITS.MAX_STEPS) {
      errors.push({
        field: 'steps',
        message: `Template cannot exceed ${VALIDATION_LIMITS.MAX_STEPS} steps`,
        code: ERROR_CODES.VALIDATION_FAILED
      });
    }

    // Validate each step
    const stepIds = new Set<string>();
    template.steps.forEach((step, index) => {
      const stepErrors = validateStep(step, index);
      errors.push(...stepErrors);

      // Check for duplicate step IDs
      if (stepIds.has(step.id)) {
        errors.push({
          field: `steps[${index}].id`,
          message: `Duplicate step ID: ${step.id}`,
          code: ERROR_CODES.TEMPLATE_DUPLICATE_STEP_ID
        });
      }
      stepIds.add(step.id);
    });

    // Validate transitions reference valid steps
    template.steps.forEach((step, index) => {
      step.transitions.forEach((transition, tIndex) => {
        if (transition.targetStepId !== null && !stepIds.has(transition.targetStepId)) {
          errors.push({
            field: `steps[${index}].transitions[${tIndex}].targetStepId`,
            message: `Transition references non-existent step: ${transition.targetStepId}`,
            code: ERROR_CODES.INVALID_TRANSITION_TARGET
          });
        }
      });
    });

    // Validate initial step
    if (template.initialStepId && !stepIds.has(template.initialStepId)) {
      errors.push({
        field: 'initialStepId',
        message: `Initial step ID references non-existent step: ${template.initialStepId}`,
        code: ERROR_CODES.VALIDATION_FAILED
      });
    }

    // Warn if no terminal steps
    const hasTerminalStep = template.steps.some(step => step.isTerminal);
    if (!hasTerminalStep) {
      warnings.push({
        field: 'steps',
        message: 'No terminal steps defined. Workflow may not be able to complete.',
        code: 'NO_TERMINAL_STEP'
      });
    }

    // Detect circular dependencies (simple check)
    const circularCheck = detectCircularDependencies(template.steps);
    if (!circularCheck.isValid) {
      warnings.push({
        field: 'steps',
        message: 'Potential circular dependency detected in workflow steps',
        code: ERROR_CODES.CIRCULAR_DEPENDENCY
      });
    }
  }

  // Tags validation
  if (template.tags && template.tags.length > VALIDATION_LIMITS.MAX_TAGS) {
    errors.push({
      field: 'tags',
      message: `Cannot exceed ${VALIDATION_LIMITS.MAX_TAGS} tags`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // When to use validation
  if (template.whenToUse && template.whenToUse.length > VALIDATION_LIMITS.WHEN_TO_USE_MAX) {
    errors.push({
      field: 'whenToUse',
      message: `"When to use" must not exceed ${VALIDATION_LIMITS.WHEN_TO_USE_MAX} characters`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Amount thresholds validation
  if (template.amountThresholds) {
    const { min, max } = template.amountThresholds;
    if (min !== undefined && max !== undefined && min > max) {
      errors.push({
        field: 'amountThresholds',
        message: 'Minimum amount cannot exceed maximum amount',
        code: ERROR_CODES.VALIDATION_FAILED
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate a workflow step
 */
function validateStep(step: WorkflowStepDefinition, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // ID validation
  if (!step.id || step.id.trim().length === 0) {
    errors.push({
      field: `steps[${index}].id`,
      message: 'Step ID is required',
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Name validation
  if (!step.name || step.name.trim().length === 0) {
    errors.push({
      field: `steps[${index}].name`,
      message: 'Step name is required',
      code: ERROR_CODES.VALIDATION_FAILED
    });
  } else if (step.name.length < VALIDATION_LIMITS.STEP_NAME_MIN) {
    errors.push({
      field: `steps[${index}].name`,
      message: `Step name must be at least ${VALIDATION_LIMITS.STEP_NAME_MIN} characters`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
  } else if (step.name.length > VALIDATION_LIMITS.STEP_NAME_MAX) {
    errors.push({
      field: `steps[${index}].name`,
      message: `Step name must not exceed ${VALIDATION_LIMITS.STEP_NAME_MAX} characters`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Roles validation (non-terminal steps should have roles)
  if (!step.isTerminal && (!step.allowedRoles || step.allowedRoles.length === 0)) {
    errors.push({
      field: `steps[${index}].allowedRoles`,
      message: 'Non-terminal steps must have at least one allowed role',
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }
  if (step.allowedRoles && step.allowedRoles.length > VALIDATION_LIMITS.MAX_ROLES_PER_STEP) {
    errors.push({
      field: `steps[${index}].allowedRoles`,
      message: `Step cannot exceed ${VALIDATION_LIMITS.MAX_ROLES_PER_STEP} roles`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Transitions validation (non-terminal steps should have transitions)
  if (!step.isTerminal && (!step.transitions || step.transitions.length === 0)) {
    errors.push({
      field: `steps[${index}].transitions`,
      message: 'Non-terminal steps must have at least one transition',
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }
  if (step.transitions && step.transitions.length > VALIDATION_LIMITS.MAX_TRANSITIONS_PER_STEP) {
    errors.push({
      field: `steps[${index}].transitions`,
      message: `Step cannot exceed ${VALIDATION_LIMITS.MAX_TRANSITIONS_PER_STEP} transitions`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Validate each transition
  if (step.transitions) {
    step.transitions.forEach((transition, tIndex) => {
      const transitionErrors = validateTransition(transition, index, tIndex);
      errors.push(...transitionErrors);
    });
  }

  // Order validation
  if (step.order < 0) {
    errors.push({
      field: `steps[${index}].order`,
      message: 'Step order cannot be negative',
      code: ERROR_CODES.INVALID_STEP_ORDER
    });
  }

  return errors;
}

/**
 * Validate a transition definition
 */
function validateTransition(
  transition: TransitionDefinition,
  stepIndex: number,
  transitionIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // ID validation
  if (!transition.id || transition.id.trim().length === 0) {
    errors.push({
      field: `steps[${stepIndex}].transitions[${transitionIndex}].id`,
      message: 'Transition ID is required',
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Action validation
  if (!transition.action || transition.action.trim().length === 0) {
    errors.push({
      field: `steps[${stepIndex}].transitions[${transitionIndex}].action`,
      message: 'Transition action is required',
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Label validation
  if (!transition.label || transition.label.trim().length === 0) {
    errors.push({
      field: `steps[${stepIndex}].transitions[${transitionIndex}].label`,
      message: 'Transition label is required',
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  return errors;
}

/**
 * Detect circular dependencies in workflow steps
 */
function detectCircularDependencies(steps: WorkflowStepDefinition[]): { isValid: boolean } {
  // Build adjacency list
  const graph = new Map<string, string[]>();
  steps.forEach(step => {
    const targets = step.transitions
      .map(t => t.targetStepId)
      .filter((id): id is string => id !== null);
    graph.set(step.id, targets);
  });

  // DFS to detect cycles
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(stepId: string): boolean {
    if (!visited.has(stepId)) {
      visited.add(stepId);
      recStack.add(stepId);

      const neighbors = graph.get(stepId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && hasCycle(neighbor)) {
          return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
    }
    recStack.delete(stepId);
    return false;
  }

  for (const step of steps) {
    if (hasCycle(step.id)) {
      return { isValid: false };
    }
  }

  return { isValid: true };
}

// ============================================================================
// INSTANCE VALIDATION
// ============================================================================

/**
 * Validate a workflow instance
 */
export function validateInstance(instance: Partial<WorkflowInstance>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Template ID validation
  if (!instance.templateId) {
    errors.push({
      field: 'templateId',
      message: 'Template ID is required',
      code: ERROR_CODES.INSTANCE_INVALID
    });
  }

  // Current step ID validation
  if (!instance.currentStepId) {
    errors.push({
      field: 'currentStepId',
      message: 'Current step ID is required',
      code: ERROR_CODES.INSTANCE_INVALID
    });
  }

  // Status validation
  if (!instance.status) {
    errors.push({
      field: 'status',
      message: 'Status is required',
      code: ERROR_CODES.INSTANCE_INVALID
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// ACTION VALIDATION
// ============================================================================

/**
 * Validate a workflow action request
 */
export function validateActionRequest(
  request: WorkflowActionRequest,
  instance: WorkflowInstance,
  template: WorkflowTemplate
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Instance validation
  if (!instance) {
    errors.push({
      field: 'instance',
      message: 'Instance not found',
      code: ERROR_CODES.INSTANCE_NOT_FOUND
    });
    return { isValid: false, errors, warnings };
  }

  // Check if instance is already completed
  if (instance.status === WorkflowStatus.COMPLETED) {
    errors.push({
      field: 'instance.status',
      message: 'Cannot perform actions on completed workflows',
      code: ERROR_CODES.INSTANCE_ALREADY_COMPLETED
    });
  }

  if (instance.status === WorkflowStatus.REJECTED) {
    errors.push({
      field: 'instance.status',
      message: 'Cannot perform actions on rejected workflows',
      code: ERROR_CODES.INSTANCE_ALREADY_COMPLETED
    });
  }

  if (instance.status === WorkflowStatus.CANCELLED) {
    errors.push({
      field: 'instance.status',
      message: 'Cannot perform actions on cancelled workflows',
      code: ERROR_CODES.INSTANCE_ALREADY_COMPLETED
    });
  }

  // Find current step in template
  const currentStep = template.steps.find(s => s.id === instance.currentStepId);
  if (!currentStep) {
    errors.push({
      field: 'currentStepId',
      message: `Current step not found in template: ${instance.currentStepId}`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
    return { isValid: false, errors, warnings };
  }

  // Find transition
  const transition = currentStep.transitions.find(t => t.id === request.transitionId);
  if (!transition) {
    errors.push({
      field: 'transitionId',
      message: `Transition not found: ${request.transitionId}`,
      code: ERROR_CODES.TRANSITION_NOT_FOUND
    });
    return { isValid: false, errors, warnings };
  }

  // Check if comment is required
  if (transition.requiresComment && (!request.comment || request.comment.trim().length === 0)) {
    errors.push({
      field: 'comment',
      message: 'Comment is required for this action',
      code: ERROR_CODES.TRANSITION_COMMENT_REQUIRED
    });
  }

  // Validate comment length
  if (request.comment && request.comment.length > VALIDATION_LIMITS.COMMENT_MAX) {
    errors.push({
      field: 'comment',
      message: `Comment must not exceed ${VALIDATION_LIMITS.COMMENT_MAX} characters`,
      code: ERROR_CODES.VALIDATION_FAILED
    });
  }

  // Role validation (if performedBy is provided)
  if (request.performedBy && currentStep.allowedRoles.length > 0) {
    // Note: We can't validate actual role membership without a user service
    // This is a placeholder for future role validation
    warnings.push({
      field: 'performedBy',
      message: 'Role validation not implemented',
      code: 'ROLE_VALIDATION_SKIPPED'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// UTILITY VALIDATORS
// ============================================================================

/**
 * Check if a template is ready for use (valid and has all required fields)
 */
export function isTemplateReady(template: WorkflowTemplate): boolean {
  const validation = validateTemplate(template);
  return validation.isValid && template.steps.length > 0;
}

/**
 * Check if a step is terminal
 */
export function isTerminalStep(step: WorkflowStepDefinition): boolean {
  return step.isTerminal || step.transitions.length === 0;
}

/**
 * Get validation summary
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    return 'Validation passed';
  }

  const errorCount = result.errors.length;
  const warningCount = result.warnings?.length || 0;

  return `Validation failed: ${errorCount} error(s), ${warningCount} warning(s)`;
}
