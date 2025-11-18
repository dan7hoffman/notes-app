import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkflowInitService } from './domains/workflow/service/workflowInit.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private workflowInit: WorkflowInitService) {
    // Initialize workflow engine with sample templates
    this.workflowInit.initializeSampleTemplates();
  }
}
