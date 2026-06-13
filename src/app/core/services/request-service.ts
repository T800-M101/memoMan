import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, lastValueFrom, Observable, of } from 'rxjs';

import { ApiCollection } from '../interfaces/api-collection.interface';
import { ApiRequest, HttpMethod } from '../interfaces/api-request.interface';
import { BackendResponse } from '../interfaces/backend.response.interface';
import { ProxyRequest } from '../interfaces/proxy-request.interface';
import { ProxyResponse } from '../interfaces/proxy-response.interface';
import { TabData } from '../interfaces/tab-data.interface';

// ============================================================================
// REQUEST SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  // ==========================================================================
  // DEPENDENCIES & PROPERTIES
  // ==========================================================================

  constructor(private http: HttpClient) {}

  private readonly SERVER_URL = 'http://localhost:3001';
  private proxyUrl = 'http://localhost:3001/proxy';

  // ==========================================================================
  // PRIVATE SIGNALS
  // ==========================================================================

  private sendCounter = signal<number>(0);

  // ==========================================================================
  // PUBLIC SIGNALS - Collections
  // ==========================================================================

  collections = signal<ApiCollection[]>([]);

  // ==========================================================================
  // PUBLIC SIGNALS - Tabs
  // ==========================================================================

  tabs = signal<TabData[]>([]);
  activeTabId = signal<string | null>(null);

  // ==========================================================================
  // PUBLIC SIGNALS - Request State
  // ==========================================================================

  requestError = signal<string | null>(null);
  response = signal<BackendResponse | null>(null);
  isLoading = signal(false);

  // ==========================================================================
  // PRIVATE UTILITIES
  // ==========================================================================

  /**
   * Checks if the URL points to a local development server
   */
  private isLocalUrl(url: string): boolean {
    return url.includes('localhost') || url.includes('127.0.0.1');
  }

  /**
   * Formats an array of headers into a key-value record object
   */
  private formatHeaders(headers: any[]): Record<string, string> {
    const h: Record<string, string> = {};
    headers.forEach((header) => {
      if (header.key && header.value) h[header.key] = header.value;
    });
    return h;
  }

  // ==========================================================================
  // PROXY REQUEST METHODS
  // ==========================================================================

  /**
   * Sends an HTTP request through the backend proxy
   */
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

  /**
   * Executes a request directly without going through the proxy (for local URLs)
   */
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

  /**
   * Main request executor that handles both local and remote URLs
   */
  async executeRequest(data?: ApiRequest | TabData) {
    if (!data || !data.url) {
      this.requestError.set('Invalid URL or missing request data');
      return;
    }

    this.isLoading.set(true);
    this.requestError.set(null);

    const isLocal = this.isLocalUrl(data.url);

    const payload: ProxyRequest = {
      url: data.url,
      method: (data as any).method || 'GET',
      headers: this.formatHeaders((data as any).headers || []),
      body:
        (data as any).method !== 'GET' && (data as any).body?.jsonContent
          ? JSON.parse((data as any).body.jsonContent)
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

  /**
   * Triggers the send counter and executes the current request
   */
  triggerSend() {
    this.sendCounter.update((count) => count + 1);
    this.executeRequest();
  }

  // ==========================================================================
  // CURL PARSING
  // ==========================================================================

  /**
   * Parses a cURL command string into a request object
   */
  parseCurl(curl: string): Observable<any> {
    return this.http.post('http://localhost:3001/parse-curl', { curl });
  }

  // ==========================================================================
  // COLLECTION MANAGEMENT
  // ==========================================================================

  /**
   * Adds a new collection to the list
   */
  addCollection(collection: ApiCollection) {
    this.collections.update((cols) => [...cols, collection]);
    this.syncToServer();
  }

  /**
   * Adds a request to a specific collection
   */
  addRequestToCollection(collectionId: string, request: ApiRequest) {
    this.collections.update((cols) =>
      cols.map((c) =>
        c.collectionId === collectionId ? { ...c, requests: [...c.requests, request] } : c,
      ),
    );
    this.syncToServer();
  }

  /**
   * Updates an existing request in its collection
   */
  updateRequest(requestId: string, updatedRequest: ApiRequest) {
    this.collections.update((cols) =>
      cols.map((c) => ({
        ...c,
        requests: c.requests.map((r) => (r.requestId === requestId ? updatedRequest : r)),
      })),
    );
    this.syncToServer();
  }

  /**
   * Deletes a request from its collection
   */
  deleteRequest(requestId: string) {
    this.collections.update((cols) =>
      cols.map((c) => ({ ...c, requests: c.requests.filter((r) => r.requestId !== requestId) })),
    );
    this.syncToServer();
  }

  /**
   * Finds a request by its ID across all collections
   */
  findRequestById(requestId: string) {
    return this.collections()
      .flatMap((c) => c.requests)
      .find((r) => r.requestId === requestId);
  }

  /**
   * Synchronizes collections data with the backend server
   */
  private syncToServer() {
    const data = this.collections();

    this.http
      .post(`${this.SERVER_URL}/api/collections/sync`, data)
      .pipe(
        catchError((err) => {
          console.error('Error synchronizing with the server:', err);
          return of(null);
        }),
      )
      .subscribe();
  }

  // ==========================================================================
  // TAB MANAGEMENT
  // ==========================================================================

  /**
   * Creates and adds a new tab to the workspace
   */
  addTab(tab?: Partial<TabData>) {
    const newTab: TabData = {
      tabId: tab?.tabId || crypto.randomUUID(),
      name: tab?.name || 'New Request',
      url: tab?.url || '',
      method: tab?.method || 'GET',
      params: tab?.params || [],
      headers: tab?.headers || [],
      auth: tab?.auth || { type: 'none' },
      body: tab?.body || { type: 'none', jsonContent: '{}' },
      response: tab?.response || null,
      isLoading: tab?.isLoading ?? false,
      requestError: tab?.requestError || null,
      requestId: tab?.requestId || null,
    };

    this.tabs.update((t) => [...t, newTab]);
    this.activeTabId.set(newTab.tabId);
  }

  /**
   * Removes a tab by its ID
   */
  removeTab(id: string) {
    this.tabs.update((t) => t.filter((x) => x.tabId !== id));
  }

  /**
   * Sets the currently active tab
   */
  setActiveTab(id: string) {
    this.activeTabId.set(id);
  }

  /**
   * Updates partial data of a specific tab
   */
  updateTabData(tabId: string, data: Partial<TabData>) {
    this.tabs.update((tabs) => tabs.map((t) => (t.tabId === tabId ? { ...t, ...data } : t)));
  }

  // ==========================================================================
  // REQUEST PERSISTENCE
  // ==========================================================================

  /**
   * Saves or updates a request from a tab to a collection
   */
  saveOrUpdateRequest(tabId: string, name: string, collectionId: string) {
    const tab = this.tabs().find((t) => t.tabId === tabId);
    if (!tab) return;

    // 1. Safe method casting
    const method = (tab.method as HttpMethod) || 'GET';

    // 2. Transform headers: from Array to Record<string, string>
    const formattedHeaders: Record<string, string> = Array.isArray(tab.headers)
      ? tab.headers.reduce(
          (acc, h: any) => {
            if (h.key) acc[h.key] = h.value;
            return acc;
          },
          {} as Record<string, string>,
        )
      : tab.headers || {};

    // 3. Transform params: from Array to Record<string, string>
    const formattedParams: Record<string, string> = Array.isArray(tab.params)
      ? tab.params.reduce(
          (acc, p: any) => {
            if (p.key) acc[p.key] = p.value;
            return acc;
          },
          {} as Record<string, string>,
        )
      : tab.params || {};

    // 4. Build the request object complying with ApiRequest interface
    const requestToSave: ApiRequest = {
      requestId: tab.requestId || crypto.randomUUID(),
      name: name,
      url: tab.url || '',
      method: method,
      params: formattedParams,
      headers: formattedHeaders,
      auth: tab.auth || { type: 'none' },
      body: tab.body || { type: 'none', jsonContent: '{}' },
      response: tab.response || null,
    };

    // 5. Persistence logic
    if (tab.requestId) {
      this.updateRequest(tab.requestId, requestToSave);
    } else {
      this.addRequestToCollection(collectionId, requestToSave);
      this.updateTabData(tabId, { requestId: requestToSave.requestId });
    }
  }
}
