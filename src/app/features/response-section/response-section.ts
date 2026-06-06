import { Component, inject, input, signal } from '@angular/core';
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
  tabId = input.required<string>();

  private requestService = inject(RequestService);

  response = this.requestService.response;
  isLoading = this.requestService.isLoading;
  error = this.requestService.requestError;

  isCopied = signal(false);

  async copyToClipboard() {
    const body = this.response()?.body;
    if (!body) return;

    const textToCopy = JSON.stringify(body, null, 2);

    navigator.clipboard.writeText(textToCopy).then(() => {
      this.isCopied.set(true);

      setTimeout(() => this.isCopied.set(false), 2000);
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
    });
  }
}
