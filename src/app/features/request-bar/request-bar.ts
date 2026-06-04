import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RequestService } from '../../core/services/request-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-request-bar',
  imports: [ReactiveFormsModule],
  templateUrl: './request-bar.html',
  styleUrl: './request-bar.scss',
})
export class RequestBar implements OnInit {
  private fb = inject(FormBuilder);

  private destroyRef = inject(DestroyRef);

  requestService = inject(RequestService);
  isTouched = false;
  isUrlFocused = signal<boolean>(false);

  requestForm = this.fb.group({
    method: ['GET'],
    url: [''],
  });

  ngOnInit() {
    this.method?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((method) => {
      if (!method) return;

      this.requestService.updateMethod(method);
    });

    this.url?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((url) => {
      this.requestService.updateUrl(url || '');
    });
  }

  onInputFocus() {
    this.isUrlFocused.set(true);
  }

  onInputBlur() {
    this.isTouched = true;
    this.isUrlFocused.set(false);
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
}
