import { Component, DestroyRef, effect, inject, input, OnInit, signal } from '@angular/core';
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
  tabId = input.required<string>();

  private fb = inject(FormBuilder);

  private destroyRef = inject(DestroyRef);

  requestService = inject(RequestService);

  isTouched = false;

  isUrlFocused = signal<boolean>(false);

  requestForm = this.fb.group({
    method: ['GET'],
    url: [''],
  });

  constructor() {
    effect(
      () => {
        const id = this.tabId();
        const tab = this.requestService.tabs().find((t) => t.id === id);

        if (tab) {
          this.requestForm.patchValue(
            {
              method: tab.method,
              url: tab.url || '',
            },
            { emitEvent: false },
          );
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit() {
    this.requestForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      this.requestService.updateTabData(this.tabId(), {
        method: val.method || 'GET',
        url: val.url || '',
      });
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
