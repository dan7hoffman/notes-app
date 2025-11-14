import { CommonModule } from "@angular/common";
import { Component, Injectable } from "@angular/core";
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
    constructor(
        private loggingService: LoggingService,
    ){}
    
    ngOnInit():void{
        this.loggingService.getSystemLogging();
    }

    systemLogging = this.loggingService.getSystemLogging();

}