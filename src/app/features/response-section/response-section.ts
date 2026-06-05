import { Component, inject } from '@angular/core';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { RequestService } from '../../core/services/request-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-response-section',
  imports: [ NgxJsonViewerModule, CommonModule ],
  templateUrl: './response-section.html',
  styleUrl: './response-section.scss',
})
export class ResponseSection {
  private requestService = inject(RequestService);

  response = this.requestService.response;
  isLoading = this.requestService.isLoading;
  error = this.requestService.requestError;
}
