/**
 * Core Workflow Engine Models
 *
 * A generic, agnostic workflow engine supporting:
 * - Template hierarchy with cloning
 * - Taxonomy (categories, tags)
 * - Role-based access control
 * - Multi-path transitions
 * - Audit trail
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum WorkflowStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum TransitionAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  RETURN = 'return',
  CANCEL = 'cancel',
  SUBMIT = 'submit',
  CUSTOM = 'custom'
}

// ============================================================================
// TEMPLATE MODELS (The "Cookbook Recipes")
// ============================================================================

/**
 * Workflow Template - Reusable workflow definition
 * This is the blueprint that can be cloned and customized
 */
export interface WorkflowTemplate {
  id: number;
  name: string;                          // "International Travel - External Contractor"
  description: string;

  // Taxonomy & Discovery
  category: string;                      // "travel" | "purchasing" | "hr" | custom
  subcategory?: string;                  // "international" | "domestic" | null
  tags: string[];                        // ["external", "contractor", "high-risk"]

  // Template Lineage
  parentTemplateId: number | null;       // Cloned from? null = original
  version: number;                       // Track iterations

  // Context & Metadata
  applicableTo: string[];                // ["internal", "external", "both"]
  departmentRestrictions?: string[];     // ["engineering", "sales"] or null = all
  amountThresholds?: {
    min?: number;
    max?: number;
  };
  whenToUse: string;                     // "Use for external contractors requiring legal review"

  // Workflow Structure
  steps: WorkflowStepDefinition[];
  initialStepId: string;                 // Which step starts the workflow

  // Sharing & Analytics
  isPublic: boolean;                     // Share with team?
  usageCount: number;                    // How many instances launched
  author?: string;                       // Who created it

  // Template Relationships
  relatedTemplates: number[];            // Link similar variants
  supersedes?: number;                   // "This replaced old template #42"

  // Metadata
  createdAt: Date;
  lastModifiedAt: Date;
  deleted: boolean;
}

/**
 * Workflow Step Definition - Reusable gate configuration
 */
export interface WorkflowStepDefinition {
  id: string;                            // "step-manager-review"
  name: string;                          // "Manager Approval"
  description?: string;
  allowedRoles: string[];                // ["manager", "admin"]
  transitions: TransitionDefinition[];
  order: number;

  // Optional Step Metadata
  estimatedDuration?: number;            // SLA in hours
  requiredFields?: string[];             // Form validation hints
  instructions?: string;                 // What to do at this step
  isTerminal: boolean;                   // Is this an end state?
}

/**
 * Transition Definition - Action that moves workflow between steps
 */
export interface TransitionDefinition {
  id: string;                            // "transition-approve-to-finance"
  action: TransitionAction | string;     // "approve" | "reject" | custom
  targetStepId: string | null;           // null = terminal state
  label: string;                         // Button text: "Send to Finance"
  requiresComment: boolean;              // Must provide reason?
  condition?: string;                    // Future: "if amount > 1000"
}

// ============================================================================
// INSTANCE MODELS (Active Workflow Execution)
// ============================================================================

/**
 * Workflow Instance - Active execution of a workflow template
 */
export interface WorkflowInstance {
  id: number;
  templateId: number;
  templateName: string;                  // Cache for display

  // Current State
  currentStepId: string;
  currentStepName: string;               // Cache for display
  status: WorkflowStatus;

  // Payload (agnostic to workflow engine)
  data: Record<string, any>;             // Form data, metadata, whatever

  // Audit Trail
  history: TransitionHistory[];

  // Ownership & Assignment
  initiatedBy?: string;                  // Who started this
  currentAssignees: string[];            // Who can act now (based on current step roles)

  // Metadata
  createdAt: Date;
  lastModifiedAt: Date;
  completedAt?: Date;
  deleted: boolean;
}

/**
 * Transition History - Audit record of workflow progression
 */
export interface TransitionHistory {
  id: string;
  fromStepId: string | null;             // null if initial state
  toStepId: string | null;               // null if terminal state
  action: TransitionAction | string;
  performedBy?: string;                  // Who took the action
  comment?: string;                      // Optional reason/notes
  timestamp: Date;

  // Snapshot
  fromStepName?: string;
  toStepName?: string;
}

// ============================================================================
// TAXONOMY MODELS
// ============================================================================

/**
 * Template Category - Organizational grouping
 */
export interface TemplateCategory {
  id: string;
  name: string;                          // "Travel"
  description: string;
  icon?: string;                         // Icon identifier
  parentCategoryId?: string;             // For nested categories
  order: number;
}

/**
 * Template Tag - Multi-dimensional labeling
 */
export interface TemplateTag {
  id: string;
  name: string;                          // "high-risk"
  category?: string;                     // Group tags
  usageCount: number;                    // How many templates use this
}

// ============================================================================
// SEARCH & FILTER MODELS
// ============================================================================

/**
 * Template Search Criteria
 */
export interface TemplateSearchCriteria {
  query?: string;                        // Text search
  category?: string;
  subcategory?: string;
  tags?: string[];
  applicableTo?: string[];
  minAmount?: number;
  maxAmount?: number;
  departmentRestrictions?: string[];
  isPublic?: boolean;
  sortBy?: 'name' | 'usageCount' | 'createdAt' | 'lastModifiedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Instance Search Criteria
 */
export interface InstanceSearchCriteria {
  status?: WorkflowStatus[];
  templateId?: number;
  initiatedBy?: string;
  currentAssignee?: string;              // Filter by who can act
  category?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: 'createdAt' | 'lastModifiedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// ACTION MODELS
// ============================================================================

/**
 * Workflow Action Request - Execute a transition
 */
export interface WorkflowActionRequest {
  instanceId: number;
  transitionId: string;
  performedBy?: string;
  comment?: string;
  updateData?: Record<string, any>;      // Update payload during transition
}

/**
 * Workflow Action Result
 */
export interface WorkflowActionResult {
  success: boolean;
  instanceId: number;
  newStepId: string | null;
  newStatus: WorkflowStatus;
  message?: string;
  errors?: string[];
}

// ============================================================================
// TEMPLATE CREATION MODELS
// ============================================================================

/**
 * Create Template Request - Simplified input for new templates
 */
export interface CreateTemplateRequest {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  applicableTo?: string[];
  whenToUse?: string;
  steps: Omit<WorkflowStepDefinition, 'id'>[];  // IDs generated
  isPublic?: boolean;
  author?: string;
}

/**
 * Clone Template Request
 */
export interface CloneTemplateRequest {
  sourceTemplateId: number;
  newName: string;
  newDescription?: string;
  modifications?: {
    addSteps?: Omit<WorkflowStepDefinition, 'id'>[];
    removeStepIds?: string[];
    updateSteps?: Partial<WorkflowStepDefinition>[];
    updateTags?: string[];
    updateCategory?: string;
  };
}

// ============================================================================
// VALIDATION MODELS
// ============================================================================

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Template Statistics
 */
export interface TemplateStatistics {
  templateId: number;
  totalInstances: number;
  completedInstances: number;
  rejectedInstances: number;
  averageCompletionTime?: number;        // In hours
  activeInstances: number;
}

/**
 * Workflow Analytics
 */
export interface WorkflowAnalytics {
  totalTemplates: number;
  totalInstances: number;
  instancesByStatus: Record<WorkflowStatus, number>;
  topTemplates: Array<{ templateId: number; name: string; usageCount: number }>;
  categoryDistribution: Record<string, number>;
}
