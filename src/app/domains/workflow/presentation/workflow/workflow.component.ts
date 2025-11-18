/**
 * Workflow Container Component
 *
 * Main entry point for the workflow engine domain
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="workflow-container">
      <header class="workflow-header">
        <h1>Workflow Engine</h1>
        <nav class="workflow-nav">
          <a routerLink="templates" routerLinkActive="active">Templates</a>
          <a routerLink="instances" routerLinkActive="active">My Workflows</a>
        </nav>
      </header>

      <main class="workflow-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .workflow-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .workflow-header {
      margin-bottom: 30px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 15px;
    }

    .workflow-header h1 {
      margin: 0 0 15px 0;
      font-size: 28px;
      font-weight: 600;
      color: #111827;
    }

    .workflow-nav {
      display: flex;
      gap: 20px;
    }

    .workflow-nav a {
      text-decoration: none;
      color: #6b7280;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .workflow-nav a:hover {
      color: #111827;
      background-color: #f3f4f6;
    }

    .workflow-nav a.active {
      color: #3b82f6;
      background-color: #eff6ff;
    }

    .workflow-content {
      min-height: 500px;
    }
  `]
})
export class WorkflowComponent {}
