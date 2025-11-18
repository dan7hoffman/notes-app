import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { WorkflowInitService } from './domains/workflow/service/workflowInit.service';
import { TemplateStateService } from './domains/workflow/service/templateState.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private workflowInit: WorkflowInitService,
    private templateState: TemplateStateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only initialize workflow engine in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.workflowInit.initializeSampleTemplates();
      // Reload state after initialization (use setTimeout to ensure initialization completes)
      setTimeout(() => this.templateState.reload(), 0);
    }
  }
}
