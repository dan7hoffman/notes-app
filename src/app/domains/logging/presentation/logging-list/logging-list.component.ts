import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LoggingService } from "../../service/logging.service";

@Component({
    selector: 'app-logging-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './logging-list.component.html',
    styleUrls: ['./logging-list.component.scss'],
})
export class LoggingListComponent {
    // Access logs directly from the service signal
    logs = this.loggingService.logs;

    constructor(
        private loggingService: LoggingService,
    ){}
}