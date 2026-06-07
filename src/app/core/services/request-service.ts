import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { RequestConfig } from '../interfaces/request-config.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import {
  BackendResponse,
  ProxyRequest,
  ProxyResponse,
} from '../interfaces/backend.response.interface';
import { TabData } from '../interfaces/tab-data.interface';
import {
  ApiCollection,
  ApiRequest,
  HttpMethod,
} from '../../shared/interfaces/api-request.interface';

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  collections = signal<ApiCollection[]>([]);
  tabs = signal<TabData[]>([]);
  activeTabId = signal<string>('');
  activeTab = computed(() => this.tabs().find((t) => t.id === this.activeTabId()));

  private readonly STORAGE_KEY = 'memoman_request_config';
  private http = inject(HttpClient);

  private proxyUrl = 'http://localhost:3001/proxy';

  private sendCounter = signal<number>(0);
  resetTrigger = signal(0);

  response = signal<BackendResponse | null>(null);
  isLoading = signal(false);
  requestError = signal<string | null>(null);

constructor() {
  this.initCollections();

  const savedTabs = localStorage.getItem('memoman_tabs');
  if (savedTabs) {
    try {
      this.tabs.set(JSON.parse(savedTabs));
    } catch (e) {
      this.tabs.set([]);
    }
  }

  if (this.tabs().length > 0) {
    const savedActiveId = localStorage.getItem('memoman_active_tab_id');
    const lastTabId = this.tabs()[this.tabs().length - 1].id;

    const targetId = this.tabs().find(t => t.id === savedActiveId)
                     ? savedActiveId!
                     : lastTabId;

    this.activeTabId.set(targetId);
  } else {
    this.addTab();
  }

  effect(() => {
    localStorage.setItem('memoman_tabs', JSON.stringify(this.tabs()));
  });

  effect(() => {
    localStorage.setItem('memoman_active_tab_id', this.activeTabId());
  });
}

  private readonly SERVER_URL = 'http://localhost:3001';

  async initCollections() {
    try {
      const remoteData = await lastValueFrom(
        this.http.get<ApiCollection[]>(`${this.SERVER_URL}/api/collections`),
      );
      this.collections.set(remoteData);
      localStorage.setItem('memoman_collections', JSON.stringify(remoteData));
    } catch (e) {
      console.error('Error loading from server', e);
      const local = localStorage.getItem('memoman_collections');
      if (local) this.collections.set(JSON.parse(local));
    }
  }

  saveCollections(collections: ApiCollection[]) {
    this.collections.set(collections);
    localStorage.setItem('memoman_collections', JSON.stringify(collections));

    this.http.post(`${this.SERVER_URL}/api/collections`, collections).subscribe();
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
    requestId: '',
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

    const activeId = this.activeTabId();
    if (activeId) {
      this.updateTabData(activeId, { method });
    }
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
      requestId: '',
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
    const config = this.requestConfig();

    if (this.isUrlInvalid()) {
      this.requestError.set('Invalid URL');
      return;
    }

    this.isLoading.set(true);
    this.requestError.set(null);

    const isLocal = this.isLocalUrl(config.url);

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
      const result = isLocal
        ? await this.executeDirectRequest(payload)
        : await lastValueFrom(this.sendRequest(payload));

      if (typeof result.body === 'string') {
        try {
          result.body = JSON.parse(result.body);
        } catch {}
      }

      this.response.set(result);
    } catch (err: any) {
      this.requestError.set('Connection error');
    } finally {
      this.isLoading.set(false);
    }
  }

  private isLocalUrl(url: string): boolean {
    return url.includes('localhost') || url.includes('127.0.0.1');
  }

  private async executeDirectRequest(payload: ProxyRequest): Promise<BackendResponse> {
    const start = Date.now();

    const res = await lastValueFrom(
      this.http.request<any>(payload.method, payload.url, {
        headers: payload.headers,
        body: payload.body ?? undefined,
        observe: 'response',
        responseType: 'json',
      }),
    );

    const duration = Date.now() - start;

    return {
      status: res.status,
      statusText: res.statusText ?? '',
      headers: Object.fromEntries(res.headers.keys().map((k) => [k, res.headers.get(k) ?? ''])),
      duration: `${duration}ms`,
      body: res.body,
      timestamp: new Date().toISOString(),
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
      id: crypto.randomUUID(),
      name: 'New request',
      url: '',
      method: 'GET',
      params: [{ key: '', value: '', description: '' }],
      headers: [{ key: '', value: '', description: '' }],
      auth: { type: 'none' },
      body: { type: 'none', jsonContent: '{}' },
      response: null,
      isLoading: false,
      requestError: null,
    };
    this.tabs.update((t) => [...t, newTab]);
    this.activeTabId.set(newTab.id);
  }

  removeTab(id: string) {
    this.tabs.update((t) => t.filter((tab) => tab.id !== id));
    // If we delete the active tab, select the last available one
    if (this.activeTabId() === id && this.tabs().length > 0) {
      this.activeTabId.set(this.tabs()[this.tabs().length - 1].id);
    }
  }

  updateTabData(id: string, partialData: Partial<TabData>) {
    this.tabs.update((tabs) => tabs.map((t) => (t.id === id ? { ...t, ...partialData } : t)));
  }

  saveRequestToCollection(tabId: string, name: string, collectionId: string) {
    console.log('TABID', tabId)
    const currentTab = this.tabs().find((t) => t.id === tabId);
    console.log('CURRENT TAB', currentTab)
    if (!currentTab) return;

    const newRequest: ApiRequest = {
      requestId: currentTab.id,
      method: (currentTab.method.toUpperCase() as HttpMethod) || 'GET',
      name: name,
      url: currentTab.url ?? '',
      params: this.mapKeyValueToRecord(currentTab.params),
      headers: this.mapKeyValueToRecord(currentTab.headers),
      body: currentTab.body?.jsonContent ? JSON.parse(currentTab.body.jsonContent) : null,
      auth: {
        type: currentTab.auth?.type || 'none',
        token: currentTab.auth?.bearerToken,
      },
      response: currentTab.response,
    };

    this.collections.update((cols) => {
      return cols.map((c) =>
        c.collectionId === collectionId ? { ...c, requests: [...c.requests, newRequest] } : c,
      );
    });

    this.updateTabName(tabId, name);
    this.saveCollections(this.collections());
  }

  // Helper to convert the table format [ {key: '...', value: '...'} ] to { key: value }
  private mapKeyValueToRecord(items: any[]): Record<string, string> {
    if (!Array.isArray(items)) return {};
    return items.reduce(
      (acc, item) => {
        if (item.key) acc[item.key] = item.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  updateTabName(tabId: string, newName: string) {
    this.tabs.update((tabs) =>
      tabs.map((tab) => (tab.id === tabId ? { ...tab, name: newName } : tab)),
    );
  }

  createNewCollection(title: string, id: string = crypto.randomUUID()) {
    const newCollection: ApiCollection = {
      collectionId: id,
      title,
      icon: 'folder',
      requests: [],
      isExpanded: true,
    };

    this.collections.update((cols) => [...cols, newCollection]);

  this.saveCollections(this.collections());
    return id;
  }

  parseCurl(curl: string): Observable<any> {
    return this.http.post('http://localhost:3001/parse-curl', { curl });
  }

  setActiveTab(id: string) {
    const tab = this.tabs().find((t) => t.id === id);
    if (!tab) return;

    this.activeTabId.set(id);

    this.requestConfig.set({
      requestId: id,
      method: tab.method as any,
      url: tab.url ?? '',
      params: tab.params,
      headers: tab.headers,
      auth: tab.auth as any,
      body: tab.body as any,
    });
  }

openRequestFromCollection(req: ApiRequest) {
  const existingTab = this.tabs().find(t => t.id === req.requestId);

  if (existingTab) {
    this.setActiveTab(existingTab.id);
    return;
  }


  const newTab: TabData = {
    id: req.requestId,
    name: req.name,
    url: req.url || null,
    method: req.method || 'GET',
    params: Array.isArray(req.params) ? req.params : [],
    headers: Array.isArray(req.headers) ? req.headers : [],
    auth: req.auth || { type: 'none' },
    body: {
      type: req.body?.type ?? 'none',
      jsonContent: req.body?.jsonContent ?? '{}'
    },
    response: null,
    isLoading: false,
    requestError: null,
  };

  this.tabs.update(t => [...t, newTab]);
  this.setActiveTab(newTab.id);
}
}
