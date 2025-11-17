/**
 * Workflow Engine Constants
 *
 * Default configurations, storage keys, and common values
 */

import { TemplateCategory, WorkflowStatus, TransitionAction } from './workflow.model';

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const WORKFLOW_STORAGE_KEYS = {
  TEMPLATES: 'workflow_templates',
  INSTANCES: 'workflow_instances',
  CATEGORIES: 'workflow_categories',
  TAGS: 'workflow_tags',
  NEXT_TEMPLATE_ID: 'workflow_next_template_id',
  NEXT_INSTANCE_ID: 'workflow_next_instance_id'
} as const;

// ============================================================================
// DEFAULT CATEGORIES
// ============================================================================

export const DEFAULT_CATEGORIES: TemplateCategory[] = [
  {
    id: 'travel',
    name: 'Travel',
    description: 'Travel requests and approvals',
    icon: '✈️',
    order: 1
  },
  {
    id: 'purchasing',
    name: 'Purchasing',
    description: 'Purchase orders and procurement',
    icon: '💰',
    order: 2
  },
  {
    id: 'hr',
    name: 'Human Resources',
    description: 'HR processes and employee workflows',
    icon: '👥',
    order: 3
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial approvals and budgeting',
    icon: '💳',
    order: 4
  },
  {
    id: 'it',
    name: 'IT & Technology',
    description: 'IT requests and system changes',
    icon: '💻',
    order: 5
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Legal reviews and contract approvals',
    icon: '⚖️',
    order: 6
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Operational processes and procedures',
    icon: '⚙️',
    order: 7
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Custom workflow templates',
    icon: '📋',
    order: 99
  }
];

// ============================================================================
// COMMON TAGS
// ============================================================================

export const COMMON_TAGS = {
  // Employee Type
  INTERNAL: 'internal',
  EXTERNAL: 'external',
  CONTRACTOR: 'contractor',
  VENDOR: 'vendor',

  // Priority
  STANDARD: 'standard',
  RUSH: 'rush',
  URGENT: 'urgent',
  LOW_PRIORITY: 'low-priority',

  // Value
  LOW_VALUE: 'low-value',
  HIGH_VALUE: 'high-value',
  CAPITAL: 'capital',

  // Risk
  LOW_RISK: 'low-risk',
  HIGH_RISK: 'high-risk',
  COMPLIANCE: 'compliance',
  SECURITY: 'security',

  // Geography
  DOMESTIC: 'domestic',
  INTERNATIONAL: 'international',
  REGIONAL: 'regional',

  // Complexity
  SIMPLE: 'simple',
  COMPLEX: 'complex',
  MULTI_STEP: 'multi-step',

  // Frequency
  ONE_TIME: 'one-time',
  RECURRING: 'recurring',
  ANNUAL: 'annual'
} as const;

// ============================================================================
// DEFAULT ROLES
// ============================================================================

export const DEFAULT_ROLES = {
  // Management
  MANAGER: 'manager',
  DIRECTOR: 'director',
  VP: 'vp',
  CEO: 'ceo',
  CFO: 'cfo',
  CTO: 'cto',

  // Finance
  FINANCE: 'finance',
  ACCOUNTING: 'accounting',
  BUDGET_OWNER: 'budget-owner',

  // HR
  HR: 'hr',
  RECRUITER: 'recruiter',
  TALENT: 'talent',

  // Legal & Compliance
  LEGAL: 'legal',
  COMPLIANCE: 'compliance',
  SECURITY: 'security',

  // IT
  IT_ADMIN: 'it-admin',
  DEVELOPER: 'developer',
  DEVOPS: 'devops',

  // Operations
  OPERATIONS: 'operations',
  PROCUREMENT: 'procurement',
  FACILITIES: 'facilities',

  // Generic
  ADMIN: 'admin',
  APPROVER: 'approver',
  REVIEWER: 'reviewer',
  SUBMITTER: 'submitter'
} as const;

// ============================================================================
// WORKFLOW DEFAULTS
// ============================================================================

export const WORKFLOW_DEFAULTS = {
  TEMPLATE: {
    VERSION: 1,
    IS_PUBLIC: true,
    USAGE_COUNT: 0,
    TAGS: [] as string[],
    RELATED_TEMPLATES: [] as number[],
    APPLICABLE_TO: ['internal', 'external'],
    DELETED: false
  },
  INSTANCE: {
    STATUS: WorkflowStatus.DRAFT,
    DATA: {} as Record<string, any>,
    HISTORY: [] as any[],
    CURRENT_ASSIGNEES: [] as string[],
    DELETED: false
  },
  STEP: {
    ALLOWED_ROLES: [] as string[],
    TRANSITIONS: [] as any[],
    IS_TERMINAL: false,
    ORDER: 0
  },
  TRANSITION: {
    REQUIRES_COMMENT: false
  }
} as const;

// ============================================================================
// STATUS LABELS & COLORS
// ============================================================================

export const WORKFLOW_STATUS_CONFIG = {
  [WorkflowStatus.DRAFT]: {
    label: 'Draft',
    color: '#6B7280',
    icon: '📝'
  },
  [WorkflowStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#3B82F6',
    icon: '▶️'
  },
  [WorkflowStatus.COMPLETED]: {
    label: 'Completed',
    color: '#10B981',
    icon: '✅'
  },
  [WorkflowStatus.REJECTED]: {
    label: 'Rejected',
    color: '#EF4444',
    icon: '❌'
  },
  [WorkflowStatus.CANCELLED]: {
    label: 'Cancelled',
    color: '#9CA3AF',
    icon: '🚫'
  }
} as const;

// ============================================================================
// TRANSITION ACTION CONFIG
// ============================================================================

export const TRANSITION_ACTION_CONFIG = {
  [TransitionAction.APPROVE]: {
    label: 'Approve',
    color: '#10B981',
    icon: '✅'
  },
  [TransitionAction.REJECT]: {
    label: 'Reject',
    color: '#EF4444',
    icon: '❌'
  },
  [TransitionAction.RETURN]: {
    label: 'Return',
    color: '#F59E0B',
    icon: '↩️'
  },
  [TransitionAction.CANCEL]: {
    label: 'Cancel',
    color: '#9CA3AF',
    icon: '🚫'
  },
  [TransitionAction.SUBMIT]: {
    label: 'Submit',
    color: '#3B82F6',
    icon: '📤'
  },
  [TransitionAction.CUSTOM]: {
    label: 'Custom',
    color: '#8B5CF6',
    icon: '⚡'
  }
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION_LIMITS = {
  TEMPLATE_NAME_MIN: 3,
  TEMPLATE_NAME_MAX: 100,
  DESCRIPTION_MAX: 500,
  WHEN_TO_USE_MAX: 300,
  STEP_NAME_MIN: 2,
  STEP_NAME_MAX: 50,
  MIN_STEPS: 1,
  MAX_STEPS: 50,
  MAX_TRANSITIONS_PER_STEP: 10,
  MAX_TAGS: 20,
  MAX_ROLES_PER_STEP: 10,
  COMMENT_MAX: 1000
} as const;

// ============================================================================
// SAMPLE TEMPLATES (for initial setup)
// ============================================================================

export const SAMPLE_TEMPLATE_CONFIGS = [
  {
    name: 'Simple Approval',
    description: 'Basic two-step approval workflow',
    category: 'custom',
    whenToUse: 'Use for simple approval processes',
    steps: [
      {
        name: 'Submit',
        allowedRoles: [DEFAULT_ROLES.SUBMITTER],
        isTerminal: false,
        order: 0
      },
      {
        name: 'Manager Approval',
        allowedRoles: [DEFAULT_ROLES.MANAGER, DEFAULT_ROLES.ADMIN],
        isTerminal: false,
        order: 1
      },
      {
        name: 'Approved',
        allowedRoles: [],
        isTerminal: true,
        order: 2
      }
    ]
  },
  {
    name: 'Purchase Order - Standard',
    description: 'Standard purchase order approval for amounts under $10,000',
    category: 'purchasing',
    tags: [COMMON_TAGS.STANDARD, COMMON_TAGS.LOW_VALUE],
    whenToUse: 'Use for standard purchase orders under $10,000',
    amountThresholds: { min: 0, max: 10000 },
    steps: [
      {
        name: 'Submit Request',
        allowedRoles: [DEFAULT_ROLES.SUBMITTER],
        isTerminal: false,
        order: 0
      },
      {
        name: 'Manager Review',
        allowedRoles: [DEFAULT_ROLES.MANAGER],
        isTerminal: false,
        order: 1
      },
      {
        name: 'Finance Approval',
        allowedRoles: [DEFAULT_ROLES.FINANCE],
        isTerminal: false,
        order: 2
      },
      {
        name: 'Approved',
        allowedRoles: [],
        isTerminal: true,
        order: 3
      }
    ]
  },
  {
    name: 'Domestic Travel - Internal',
    description: 'Domestic travel approval for internal employees',
    category: 'travel',
    subcategory: 'domestic',
    tags: [COMMON_TAGS.INTERNAL, COMMON_TAGS.DOMESTIC],
    applicableTo: ['internal'],
    whenToUse: 'Use for internal employee domestic travel requests',
    steps: [
      {
        name: 'Submit Travel Request',
        allowedRoles: [DEFAULT_ROLES.SUBMITTER],
        isTerminal: false,
        order: 0
      },
      {
        name: 'Manager Approval',
        allowedRoles: [DEFAULT_ROLES.MANAGER],
        isTerminal: false,
        order: 1
      },
      {
        name: 'Approved',
        allowedRoles: [],
        isTerminal: true,
        order: 2
      }
    ]
  }
];

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Template Errors
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_INVALID: 'TEMPLATE_INVALID',
  TEMPLATE_NAME_REQUIRED: 'TEMPLATE_NAME_REQUIRED',
  TEMPLATE_STEPS_REQUIRED: 'TEMPLATE_STEPS_REQUIRED',
  TEMPLATE_DUPLICATE_STEP_ID: 'TEMPLATE_DUPLICATE_STEP_ID',

  // Instance Errors
  INSTANCE_NOT_FOUND: 'INSTANCE_NOT_FOUND',
  INSTANCE_INVALID: 'INSTANCE_INVALID',
  INSTANCE_ALREADY_COMPLETED: 'INSTANCE_ALREADY_COMPLETED',

  // Transition Errors
  TRANSITION_NOT_FOUND: 'TRANSITION_NOT_FOUND',
  TRANSITION_UNAUTHORIZED: 'TRANSITION_UNAUTHORIZED',
  TRANSITION_INVALID_STATE: 'TRANSITION_INVALID_STATE',
  TRANSITION_COMMENT_REQUIRED: 'TRANSITION_COMMENT_REQUIRED',

  // Validation Errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_STEP_ORDER: 'INVALID_STEP_ORDER',
  INVALID_TRANSITION_TARGET: 'INVALID_TRANSITION_TARGET',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',

  // General Errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;
