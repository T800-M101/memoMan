import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RequestService } from '../../core/services/request-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpMethod } from '../../core/interfaces/api-request.interface';

@Component({
  selector: 'app-request-bar',
  imports: [ReactiveFormsModule],
  templateUrl: './request-bar.html',
  styleUrl: './request-bar.scss',
})
export class RequestBar implements OnInit {
  requestService = inject(RequestService);
  isUrlFocused = signal<boolean>(false);
  tabId = input.required<string>();
  private destroyRef = inject(DestroyRef);

  private fb = inject(FormBuilder);
  requestForm = this.fb.group({
    method: ['GET'],
    url: [''],
  });

  private requestData = computed(() => {
    const tab = this.requestService.tabs().find((t) => t.tabId === this.tabId());
    if (!tab || !tab.requestId) return null;

    return this.requestService
      .collections()
      .flatMap((c) => c.requests)
      .find((r) => r.requestId === tab.requestId);
  });

  constructor() {
    effect(() => {
      const data = this.requestData();
      if (data) {
        this.requestForm.patchValue(
          {
            method: data.method,
            url: data.url,
          },
          { emitEvent: false },
        );
      }
    });
  }

  ngOnInit() {
    this.requestForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      const currentData = this.requestData();
      if (currentData) {
        this.requestService.updateRequest(currentData.requestId, {
          ...currentData,
          method: (val.method as HttpMethod) || 'GET',
          url: val.url || '',
        });
      } else {
        this.requestService.updateTabData(this.tabId(), {
          method: (val.method as HttpMethod) || 'GET',
          url: val.url || '',
        });
      }
    });
  }

  onInputFocus() {
    this.isUrlFocused.set(true);
  }

  onInputBlur() {
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
