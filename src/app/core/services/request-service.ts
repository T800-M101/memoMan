import { computed, inject, Injectable, signal } from '@angular/core';
import { RequestConfig } from '../interfaces/request-config.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import {
  BackendResponse,
  ProxyRequest,
  ProxyResponse,
} from '../interfaces/backend.response.interface';
import { TabData } from '../interfaces/tab-data.interface';



@Injectable({
  providedIn: 'root',
})
export class RequestService {
  tabs = signal<TabData[]>([]);
  activeTabId = signal<string>('');
  activeTab = computed(() => this.tabs().find(t => t.id === this.activeTabId()));

  private readonly STORAGE_KEY = 'memoman_request_config';
  private http = inject(HttpClient);

  private proxyUrl = 'http://localhost:3000/proxy';

  private sendCounter = signal<number>(0);
  resetTrigger = signal(0);

  response = signal<BackendResponse | null>(null);
  isLoading = signal(false);
  requestError = signal<string | null>(null);

   constructor() {
    this.loadFromLocalStorage();
    if (this.tabs().length === 0) this.addTab();
  }


  isUrlInvalid(): boolean {
    let url = this.requestConfig().url?.trim();

    if (!url) {
      return true;
    }

    // Auto-add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
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



  // ====================
  // PUBLIC API
  // ====================

  config() {
    return this.requestConfig();
  }

  sendRequest(request: ProxyRequest): Observable<ProxyResponse> {
    const params = new HttpParams().set('url', request.url);

    return this.http.post<ProxyResponse>(
      this.proxyUrl,
      {
        method: request.method,
        headers: request.headers,
        body: request.body,
      },
      { params },
    );
  }

  triggerSend() {
    this.sendCounter.update((count) => count + 1);
    this.executeRequest();
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

  async executeRequest() {
    const backendUrl = 'http://localhost:3000/proxy';
    const target = this.requestConfig().url;
    console.log('Haciendo fetch a:', `${backendUrl}?url=${encodeURIComponent(target)}`);

    const config = this.requestConfig();

    if (this.isUrlInvalid()) {
      this.requestError.set('URL inválida');
      return;
    }

    this.isLoading.set(true);

    const payload: ProxyRequest = {
      url: config.url,
      method: config.method,
      headers: this.formatHeaders(config.headers),
      body:
        config.method !== 'GET' && config.body?.jsonContent
          ? JSON.parse(config.body.jsonContent)
          : null,
    };

    try {
      const result = await lastValueFrom(this.sendRequest(payload));

      if (typeof result.body === 'string') {
        result.body = JSON.parse(result.body);
      }

      this.response.set(result);
    } catch (err) {
      this.requestError.set('Error al conectar con el proxy');
    } finally {
      this.isLoading.set(false);
    }
  }

  private buildBackendRequest(config: RequestConfig) {
    return {
      method: config.method,
      headers: this.formatHeaders(config.headers),
      body:
        config.method !== 'GET' && config.body?.jsonContent
          ? JSON.parse(config.body.jsonContent)
          : null,
    };
  }

  private formatHeaders(headers: any[]) {
    const h: Record<string, string> = {};
    headers.forEach((header) => {
      if (header.key && header.value) h[header.key] = header.value;
    });
    return h;
  }

  addTab() {
    const newTab: TabData = {
      id: Date.now().toString(),
      name: 'New request',
      url: '',
      method: 'GET',
      params: [{ key: '', value: '', description: '' }],
      headers: [{ key: '', value: '', description: '' }],
      auth: { type: 'none' },
      body: { type: 'none', jsonContent: '{}' },
      response: null,
      isLoading: false,
      requestError: null
    };
    this.tabs.update(t => [...t, newTab]);
    this.activeTabId.set(newTab.id);
  }

  removeTab(id: string) {
    this.tabs.update(t => t.filter(tab => tab.id !== id));
    // Si borramos la activa, seleccionar la última disponible
    if (this.activeTabId() === id && this.tabs().length > 0) {
      this.activeTabId.set(this.tabs()[this.tabs().length - 1].id);
    }
  }

  updateTabData(id: string, partialData: Partial<TabData>) {
    this.tabs.update(tabs => tabs.map(t => t.id === id ? { ...t, ...partialData } : t));
  }
}
