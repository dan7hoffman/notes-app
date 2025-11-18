/**
 * Workflow Initialization Service
 *
 * Creates sample templates on first load
 */

import { Injectable } from '@angular/core';
import { TemplateService } from './template.service';
import { TemplateRepository } from '../data/template.repository';
import { CreateTemplateRequest } from '../workflow.model';
import { DEFAULT_ROLES, COMMON_TAGS } from '../workflow.constants';

@Injectable({
  providedIn: 'root'
})
export class WorkflowInitService {
  constructor(
    private templateService: TemplateService,
    private templateRepository: TemplateRepository
  ) {}

  /**
   * Initialize workflow engine with sample templates
   */
  initializeSampleTemplates(): void {
    // Check if templates already exist
    const existingTemplates = this.templateRepository.getAll();
    console.log(`Found ${existingTemplates.length} existing templates`);

    if (existingTemplates.length > 0) {
      console.log('Templates already initialized, skipping...');
      return; // Already initialized
    }

    console.log('Initializing workflow engine with sample templates...');

    // Create sample templates
    this.createSimpleApprovalTemplate();
    this.createPurchaseOrderTemplate();
    this.createDomesticTravelTemplate();
    this.createInternationalTravelTemplate();
    this.createDocumentReviewTemplate();

    const finalCount = this.templateRepository.getAll().length;
    console.log(`Sample templates created successfully! Total count: ${finalCount}`);
  }

  /**
   * Simple Approval Template
   */
  private createSimpleApprovalTemplate(): void {
    const request: CreateTemplateRequest = {
      name: 'Simple Approval',
      description: 'Basic two-step approval workflow for general requests',
      category: 'custom',
      tags: [COMMON_TAGS.SIMPLE, COMMON_TAGS.STANDARD],
      applicableTo: ['internal', 'external'],
      whenToUse: 'Use for simple approval processes that require manager sign-off',
      steps: [
        {
          name: 'Submit Request',
          description: 'Submit your request for approval',
          allowedRoles: [DEFAULT_ROLES.SUBMITTER],
          transitions: [{
            id: 'temp',
            action: 'submit',
            targetStepId: null,
            label: 'Submit',
            requiresComment: false
          }],
          order: 0,
          isTerminal: false
        },
        {
          name: 'Manager Approval',
          description: 'Manager reviews and approves/rejects request',
          allowedRoles: [DEFAULT_ROLES.MANAGER, DEFAULT_ROLES.ADMIN],
          transitions: [{
            id: 'temp',
            action: 'approve',
            targetStepId: null,
            label: 'Approve',
            requiresComment: false
          }],
          order: 1,
          isTerminal: false
        },
        {
          name: 'Approved',
          description: 'Request has been approved',
          allowedRoles: [],
          transitions: [],
          order: 2,
          isTerminal: true
        },
        {
          name: 'Rejected',
          description: 'Request has been rejected',
          allowedRoles: [],
          transitions: [],
          order: 3,
          isTerminal: true
        }
      ],
      isPublic: true
    };

    // Create template
    const result = this.templateService.createTemplate(request);
    if (result.template && result.validation.isValid) {
      const template = result.template;

      // Add transitions with proper step IDs
      template.steps[0].transitions = [{
        id: `${template.steps[0].id}-transition-0`,
        action: 'submit',
        targetStepId: template.steps[1].id,
        label: 'Submit for Approval',
        requiresComment: false
      }];

      template.steps[1].transitions = [
        {
          id: `${template.steps[1].id}-transition-0`,
          action: 'approve',
          targetStepId: template.steps[2].id,
          label: 'Approve',
          requiresComment: false
        },
        {
          id: `${template.steps[1].id}-transition-1`,
          action: 'reject',
          targetStepId: template.steps[3].id,
          label: 'Reject',
          requiresComment: true
        }
      ];

      this.templateRepository.save(template);
      console.log('✓ Simple Approval template created');
    } else {
      console.error('✗ Failed to create Simple Approval template:', result.validation.errors);
    }
  }

  /**
   * Purchase Order Template
   */
  private createPurchaseOrderTemplate(): void {
    const request: CreateTemplateRequest = {
      name: 'Purchase Order - Standard',
      description: 'Standard purchase order approval for amounts under $10,000',
      category: 'purchasing',
      tags: [COMMON_TAGS.STANDARD, COMMON_TAGS.LOW_VALUE],
      applicableTo: ['internal'],
      whenToUse: 'Use for standard purchase orders under $10,000',
      steps: [
        {
          name: 'Submit Purchase Request',
          allowedRoles: [DEFAULT_ROLES.SUBMITTER],
          transitions: [{ id: 'temp', action: 'submit', targetStepId: null, label: 'Submit', requiresComment: false }],
          order: 0,
          isTerminal: false
        },
        {
          name: 'Manager Review',
          allowedRoles: [DEFAULT_ROLES.MANAGER],
          transitions: [{ id: 'temp', action: 'approve', targetStepId: null, label: 'Approve', requiresComment: false }],
          order: 1,
          isTerminal: false
        },
        {
          name: 'Finance Approval',
          allowedRoles: [DEFAULT_ROLES.FINANCE, DEFAULT_ROLES.CFO],
          transitions: [{ id: 'temp', action: 'approve', targetStepId: null, label: 'Approve', requiresComment: false }],
          order: 2,
          isTerminal: false
        },
        {
          name: 'Approved',
          allowedRoles: [],
          transitions: [],
          order: 3,
          isTerminal: true
        },
        {
          name: 'Rejected',
          allowedRoles: [],
          transitions: [],
          order: 4,
          isTerminal: true
        }
      ],
      isPublic: true
    };

    const result = this.templateService.createTemplate(request);
    if (result.template && result.validation.isValid) {
      const template = result.template;

      // Add transitions with proper step IDs
      template.steps[0].transitions = [{
        id: `${template.steps[0].id}-transition-0`,
        action: 'submit',
        targetStepId: template.steps[1].id,
        label: 'Submit Request',
        requiresComment: false
      }];

      template.steps[1].transitions = [
        {
          id: `${template.steps[1].id}-transition-0`,
          action: 'approve',
          targetStepId: template.steps[2].id,
          label: 'Approve',
          requiresComment: false
        },
        {
          id: `${template.steps[1].id}-transition-1`,
          action: 'reject',
          targetStepId: template.steps[4].id,
          label: 'Reject',
          requiresComment: true
        }
      ];

      template.steps[2].transitions = [
        {
          id: `${template.steps[2].id}-transition-0`,
          action: 'approve',
          targetStepId: template.steps[3].id,
          label: 'Approve',
          requiresComment: false
        },
        {
          id: `${template.steps[2].id}-transition-1`,
          action: 'reject',
          targetStepId: template.steps[4].id,
          label: 'Reject',
          requiresComment: true
        }
      ];

      this.templateRepository.save(template);
      console.log('✓ Purchase Order template created');
    } else {
      console.error('✗ Failed to create Purchase Order template:', result.validation.errors);
    }
  }

  /**
   * Domestic Travel Template
   */
  private createDomesticTravelTemplate(): void {
    const request: CreateTemplateRequest = {
      name: 'Domestic Travel - Internal',
      description: 'Domestic travel approval for internal employees',
      category: 'travel',
      subcategory: 'domestic',
      tags: [COMMON_TAGS.INTERNAL, COMMON_TAGS.DOMESTIC, COMMON_TAGS.STANDARD],
      applicableTo: ['internal'],
      whenToUse: 'Use for internal employee domestic travel requests',
      steps: [
        {
          name: 'Submit Travel Request',
          allowedRoles: [DEFAULT_ROLES.SUBMITTER],
          transitions: [{ id: 'temp', action: 'submit', targetStepId: null, label: 'Submit', requiresComment: false }],
          order: 0,
          isTerminal: false
        },
        {
          name: 'Manager Approval',
          allowedRoles: [DEFAULT_ROLES.MANAGER],
          transitions: [{ id: 'temp', action: 'approve', targetStepId: null, label: 'Approve', requiresComment: false }],
          order: 1,
          isTerminal: false
        },
        {
          name: 'Approved',
          allowedRoles: [],
          transitions: [],
          order: 2,
          isTerminal: true
        },
        {
          name: 'Rejected',
          allowedRoles: [],
          transitions: [],
          order: 3,
          isTerminal: true
        }
      ],
      isPublic: true
    };

    const result = this.templateService.createTemplate(request);
    if (result.template && result.validation.isValid) {
      const template = result.template;

      template.steps[0].transitions = [{
        id: `${template.steps[0].id}-transition-0`,
        action: 'submit',
        targetStepId: template.steps[1].id,
        label: 'Submit Request',
        requiresComment: false
      }];

      template.steps[1].transitions = [
        {
          id: `${template.steps[1].id}-transition-0`,
          action: 'approve',
          targetStepId: template.steps[2].id,
          label: 'Approve',
          requiresComment: false
        },
        {
          id: `${template.steps[1].id}-transition-1`,
          action: 'reject',
          targetStepId: template.steps[3].id,
          label: 'Reject',
          requiresComment: true
        }
      ];

      this.templateRepository.save(template);
      console.log('✓ Domestic Travel template created');
    } else {
      console.error('✗ Failed to create Domestic Travel template:', result.validation.errors);
    }
  }

  /**
   * International Travel Template
   */
  private createInternationalTravelTemplate(): void {
    const request: CreateTemplateRequest = {
      name: 'International Travel - Internal',
      description: 'International travel approval with compliance review',
      category: 'travel',
      subcategory: 'international',
      tags: [COMMON_TAGS.INTERNAL, COMMON_TAGS.INTERNATIONAL, COMMON_TAGS.COMPLIANCE],
      applicableTo: ['internal'],
      whenToUse: 'Use for internal employee international travel requiring compliance checks',
      steps: [
        {
          name: 'Submit Travel Request',
          allowedRoles: [DEFAULT_ROLES.SUBMITTER],
          transitions: [{ id: 'temp', action: 'submit', targetStepId: null, label: 'Submit', requiresComment: false }],
          order: 0,
          isTerminal: false
        },
        {
          name: 'Manager Approval',
          allowedRoles: [DEFAULT_ROLES.MANAGER],
          transitions: [{ id: 'temp', action: 'approve', targetStepId: null, label: 'Approve', requiresComment: false }],
          order: 1,
          isTerminal: false
        },
        {
          name: 'Compliance Review',
          allowedRoles: [DEFAULT_ROLES.COMPLIANCE, DEFAULT_ROLES.LEGAL],
          transitions: [{ id: 'temp', action: 'approve', targetStepId: null, label: 'Approve', requiresComment: false }],
          order: 2,
          isTerminal: false
        },
        {
          name: 'Finance Approval',
          allowedRoles: [DEFAULT_ROLES.FINANCE],
          transitions: [{ id: 'temp', action: 'approve', targetStepId: null, label: 'Approve', requiresComment: false }],
          order: 3,
          isTerminal: false
        },
        {
          name: 'Approved',
          allowedRoles: [],
          transitions: [],
          order: 4,
          isTerminal: true
        },
        {
          name: 'Rejected',
          allowedRoles: [],
          transitions: [],
          order: 5,
          isTerminal: true
        }
      ],
      isPublic: true
    };

    const result = this.templateService.createTemplate(request);
    if (result.template && result.validation.isValid) {
      const template = result.template;

      template.steps[0].transitions = [{
        id: `${template.steps[0].id}-transition-0`,
        action: 'submit',
        targetStepId: template.steps[1].id,
        label: 'Submit Request',
        requiresComment: false
      }];

      template.steps[1].transitions = [
        {
          id: `${template.steps[1].id}-transition-0`,
          action: 'approve',
          targetStepId: template.steps[2].id,
          label: 'Approve',
          requiresComment: false
        },
        {
          id: `${template.steps[1].id}-transition-1`,
          action: 'reject',
          targetStepId: template.steps[5].id,
          label: 'Reject',
          requiresComment: true
        }
      ];

      template.steps[2].transitions = [
        {
          id: `${template.steps[2].id}-transition-0`,
          action: 'approve',
          targetStepId: template.steps[3].id,
          label: 'Approve',
          requiresComment: false
        },
        {
          id: `${template.steps[2].id}-transition-1`,
          action: 'reject',
          targetStepId: template.steps[5].id,
          label: 'Reject',
          requiresComment: true
        }
      ];

      template.steps[3].transitions = [
        {
          id: `${template.steps[3].id}-transition-0`,
          action: 'approve',
          targetStepId: template.steps[4].id,
          label: 'Approve',
          requiresComment: false
        },
        {
          id: `${template.steps[3].id}-transition-1`,
          action: 'reject',
          targetStepId: template.steps[5].id,
          label: 'Reject',
          requiresComment: true
        }
      ];

      this.templateRepository.save(template);
      console.log('✓ International Travel template created');
    } else {
      console.error('✗ Failed to create International Travel template:', result.validation.errors);
    }
  }

  /**
   * Document Review Template
   */
  private createDocumentReviewTemplate(): void {
    const request: CreateTemplateRequest = {
      name: 'Document Review',
      description: 'Multi-stage document review and approval',
      category: 'operations',
      tags: [COMMON_TAGS.STANDARD, COMMON_TAGS.MULTI_STEP],
      applicableTo: ['internal'],
      whenToUse: 'Use for documents requiring peer review and final approval',
      steps: [
        {
          name: 'Submit Document',
          allowedRoles: [DEFAULT_ROLES.SUBMITTER],
          transitions: [{ id: 'temp', action: 'submit', targetStepId: null, label: 'Submit', requiresComment: false }],
          order: 0,
          isTerminal: false
        },
        {
          name: 'Peer Review',
          allowedRoles: [DEFAULT_ROLES.REVIEWER],
          transitions: [{ id: 'temp', action: 'approve', targetStepId: null, label: 'Approve', requiresComment: false }],
          order: 1,
          isTerminal: false
        },
        {
          name: 'Final Approval',
          allowedRoles: [DEFAULT_ROLES.MANAGER, DEFAULT_ROLES.DIRECTOR],
          transitions: [{ id: 'temp', action: 'approve', targetStepId: null, label: 'Publish', requiresComment: false }],
          order: 2,
          isTerminal: false
        },
        {
          name: 'Published',
          allowedRoles: [],
          transitions: [],
          order: 3,
          isTerminal: true
        },
        {
          name: 'Rejected',
          allowedRoles: [],
          transitions: [],
          order: 4,
          isTerminal: true
        }
      ],
      isPublic: true
    };

    const result = this.templateService.createTemplate(request);
    if (result.template && result.validation.isValid) {
      const template = result.template;

      template.steps[0].transitions = [{
        id: `${template.steps[0].id}-transition-0`,
        action: 'submit',
        targetStepId: template.steps[1].id,
        label: 'Submit for Review',
        requiresComment: false
      }];

      template.steps[1].transitions = [
        {
          id: `${template.steps[1].id}-transition-0`,
          action: 'approve',
          targetStepId: template.steps[2].id,
          label: 'Approve',
          requiresComment: false
        },
        {
          id: `${template.steps[1].id}-transition-1`,
          action: 'return',
          targetStepId: template.steps[0].id, // Return to submit
          label: 'Request Changes',
          requiresComment: true
        },
        {
          id: `${template.steps[1].id}-transition-2`,
          action: 'reject',
          targetStepId: template.steps[4].id,
          label: 'Reject',
          requiresComment: true
        }
      ];

      template.steps[2].transitions = [
        {
          id: `${template.steps[2].id}-transition-0`,
          action: 'approve',
          targetStepId: template.steps[3].id,
          label: 'Publish',
          requiresComment: false
        },
        {
          id: `${template.steps[2].id}-transition-1`,
          action: 'reject',
          targetStepId: template.steps[4].id,
          label: 'Reject',
          requiresComment: true
        }
      ];

      this.templateRepository.save(template);
      console.log('✓ Document Review template created');
    } else {
      console.error('✗ Failed to create Document Review template:', result.validation.errors);
    }
  }
}
