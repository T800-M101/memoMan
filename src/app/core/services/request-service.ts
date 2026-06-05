import { Injectable, signal } from '@angular/core';
import { RequestConfig } from '../interfaces/request-config.interface';

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private readonly STORAGE_KEY = 'memoman_request_config';

  private sendCounter = signal<number>(0);

  resetTrigger = signal(0);

  isUrlInvalid(): boolean {
    const url = this.requestConfig().url?.trim();

    if (!url) {
      return true;
    }

    try {
      new URL(url);

      return false;
    } catch {
      return true;
    }
  }

  private requestConfig = signal<RequestConfig>({
    method: 'GET',
    url: '',

    params: [],

    headers: [],

    auth: {
      type: 'bearer',
      bearerToken: '',
      basicUsername: '',
      basicPassword: '',
    },

    body: {
      type: 'json',
      jsonContent: '',
    },
  });

  constructor() {
    this.loadFromLocalStorage();
  }

  // ====================
  // PUBLIC API
  // ====================

  config() {
    return this.requestConfig();
  }

  sendRequested() {
    return this.sendCounter();
  }

  triggerSend() {
    this.sendCounter.update((count) => count + 1);
  }

  updateMethod(method: string) {
    this.patchConfig({
      method,
    });
  }

  updateUrl(url: string) {
    this.patchConfig({
      url,
    });
  }

  updateTabsConfig(data: Partial<RequestConfig>) {
    this.patchConfig(data);
  }

  // ====================
  // INTERNAL
  // ====================

  private patchConfig(partial: Partial<RequestConfig>) {
    this.requestConfig.update((current) => {
      const updated = {
        ...current,
        ...partial,
      };

      this.saveToLocalStorage(updated);

      return updated;
    });
  }

  private saveToLocalStorage(config: RequestConfig) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  private loadFromLocalStorage() {
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (!saved) return;

    try {
      this.requestConfig.set(JSON.parse(saved));
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  resetRequest() {
    this.requestConfig.set({
      method: 'GET',
      url: '',
      params: [],
      headers: [],
      auth: {
        type: 'bearer',
        bearerToken: '',
        basicUsername: '',
        basicPassword: '',
      },
      body: {
        type: 'json',
        jsonContent: '',
      },
    });

    // notify listeners
    this.resetTrigger.update((v) => v + 1);
  }
}
