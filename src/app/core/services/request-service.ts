import { computed, Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RequestService {
 // centralized state
  method = signal<string>('GET');
  url = signal<string>('');

  // Signal to trigger execution
  private _triggerSend = signal<number>(0);

  // Function to update
  updateUrl(url: string) { this.url.set(url); }
  
  updateMethod(method: string) { this.method.set(method); }

  // Sending trigger
  triggerSend() { this._triggerSend.update(n => n + 1); }

  // We expose the signal so that the tabs can hear it.
  sendRequested = this._triggerSend.asReadonly();

  isUrlInvalid = computed(() => {
    const value = this.url();
    return !value || !value.startsWith('http');
  });


}
