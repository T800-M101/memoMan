import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RequestService } from '../../core/services/request-service';

@Component({
  selector: 'app-request-bar',
  imports: [],
  templateUrl: './request-bar.html',
  styleUrl: './request-bar.scss',
})
export class RequestBar  {

requestService = inject(RequestService);
isTouched = false;

requestForm: FormGroup;
  isUrlFocused = signal<boolean>(false);
  private defaultUrl = 'https://api.example.com/users';

  constructor(private fb: FormBuilder) {
    this.requestForm = this.fb.group({
      method: ['GET'],
      url: ['']
    });
  }


  onInputFocus() {
    this.isUrlFocused.set(true);
    const currentUrl = this.requestForm.get('url')?.value;
    if (!currentUrl) {
      this.requestForm.patchValue({ url: this.defaultUrl });
    }
  }

  onInputBlur() {
    this.isUrlFocused.set(false);
    this.isTouched = true;
    this.isUrlFocused.set(false);
    const currentUrl = this.requestForm.get('url')?.value;
    if (currentUrl === this.defaultUrl) {
      this.requestForm.patchValue({ url: '' });
    }
  }

  sendRequest() {
    if (this.requestForm.valid) {
      this.requestService.triggerSend();
    }
  }

  get method() {
    return this.requestForm.get('method');
  }

  get url() {
    return this.requestForm.get('url');
  }

  onUrlChange(newUrl: string) {
    this.requestService.updateUrl(newUrl);
  }
}
