import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';

import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';

import { RequestService } from '../../core/services/request-service';

@Component({
  selector: 'app-request-tabs',
  standalone: true,
  imports: [ReactiveFormsModule, NgTemplateOutlet],
  templateUrl: './request-tabs.html',
  styleUrls: ['./request-tabs.scss'],
})
export class RequestTabs implements OnInit {
  private fb = inject(FormBuilder);

  private requestService = inject(RequestService);

  private destroyRef = inject(DestroyRef);

  activeTab = signal<string>('params');

  isCopying = signal<boolean>(false);

  isJsonCopying = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    params: this.fb.array([]),

    headers: this.fb.array([]),

    auth: this.fb.group({
      type: ['bearer'],
      bearerToken: [''],
      basicUsername: [''],
      basicPassword: [''],
    }),

    body: this.fb.group({
      type: ['json'],
      jsonContent: [''],
    }),
  });

  authType = computed(() => this.auth.get('type')?.value);

  bodyType = computed(() => this.body.get('type')?.value);

  ngOnInit(): void {
    const config = this.requestService.config();

    this.restoreForm(config);

    this.initializeDefaults();

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.requestService.updateTabsConfig({
        params: value.params ?? [],

        headers: value.headers ?? [],

        auth: value.auth,

        body: value.body,
      });
    });
  }

  // ====================
  // GETTERS
  // ====================

  get params(): FormArray {
    return this.form.get('params') as FormArray;
  }

  get headers(): FormArray {
    return this.form.get('headers') as FormArray;
  }

  get auth(): FormGroup {
    return this.form.get('auth') as FormGroup;
  }

  get body(): FormGroup {
    return this.form.get('body') as FormGroup;
  }

  // ====================
  // UI
  // ====================

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  // ====================
  // RESTORE FORM
  // ====================

  private restoreForm(config: any) {
    this.params.clear();
    this.headers.clear();

    config.params?.forEach((p: any) => {
      this.params.push(this.createKeyValueRow(p.key, p.value, p.description));
    });

    config.headers?.forEach((h: any) => {
      this.headers.push(this.createKeyValueRow(h.key, h.value, h.description));
    });

    this.auth.patchValue(config.auth ?? {});

    this.body.patchValue(config.body ?? {});
  }

  // ====================
  // FORM HELPERS
  // ====================

  private createKeyValueRow(key = '', value = '', description = ''): FormGroup {
    return this.fb.group({
      key: [key],
      value: [value],
      description: [description],
    });
  }

  addParamRow() {
    this.params.push(this.createKeyValueRow());
  }

  removeParamRow(index: number) {
    this.params.removeAt(index);
  }

  addHeaderRow() {
    this.headers.push(this.createKeyValueRow());
  }

  removeHeaderRow(index: number) {
    this.headers.removeAt(index);
  }

  // ====================
  // REQUEST EXECUTION
  // ====================

  executeRequest() {
    const config = this.requestService.config();
    const curl = this.generateCurlCommand(config.method, config.url);
  }

  // ====================
  // cURL
  // ====================

  generateCurlCommand(method: string, url: string): string {
    const { params = [], headers = [], auth, body } = this.form.getRawValue();

    // ====================
    // Helpers
    // ====================

    const escapeSingleQuotes = (value: string) => value.replace(/'/g, `'\\''`);

    const safeUrl = url?.trim() || '';

    // ====================
    // Query Params
    // ====================

    const validParams = params.filter((p: any) => p.key?.trim());

    const queryString = validParams.length
      ? validParams
          .map((p: any) => {
            const key = encodeURIComponent(p.key.trim());

            const value = encodeURIComponent(p.value ?? '');

            return `${key}=${value}`;
          })
          .join('&')
      : '';

    const finalUrl = queryString
      ? `${safeUrl}${safeUrl.includes('?') ? '&' : '?'}${queryString}`
      : safeUrl;

    // ====================
    // Base curl
    // ====================

    let curl = `curl -X ${method.toUpperCase()} '${finalUrl}'`;

    // ====================
    // Headers
    // ====================

    const addedHeaders = new Set<string>();

    headers
      .filter((h: any) => h.key?.trim())
      .forEach((h: any) => {
        const key = h.key.trim();

        const value = h.value ?? '';

        const normalizedKey = key.toLowerCase();

        addedHeaders.add(normalizedKey);

        curl += ` \\
  -H '${escapeSingleQuotes(`${key}: ${value}`)}'`;
      });

    // ====================
    // Authorization
    // ====================

    if (auth?.type === 'bearer' && auth.bearerToken?.trim()) {
      curl += ` \\
  -H 'Authorization: Bearer ${escapeSingleQuotes(auth.bearerToken.trim())}'`;
    }

    if (auth?.type === 'basic' && auth.basicUsername) {
      curl += ` \\
  -u '${escapeSingleQuotes(auth.basicUsername)}:${escapeSingleQuotes(auth.basicPassword ?? '')}'`;
    }

    // ====================
    // Body
    // ====================

    const hasJsonBody = body?.type === 'json' && body.jsonContent?.trim();

    if (hasJsonBody) {
      // Add Content-Type only if user didn't already add it
      if (!addedHeaders.has('content-type')) {
        curl += ` \\
  -H 'Content-Type: application/json'`;
      }

      curl += ` \\
  -d '${escapeSingleQuotes(body.jsonContent)}'`;
    }

    return curl;
  }

  async copyCurlToClipboard() {
    if (this.requestService.isUrlInvalid()) {
      console.warn('URL inválida');

      return;
    }

    try {
      const config = this.requestService.config();

      await navigator.clipboard.writeText(this.generateCurlCommand(config.method, config.url));

      this.isCopying.set(true);

      setTimeout(() => {
        this.isCopying.set(false);
      }, 2000);
    } catch (err) {
      console.error('Clipboard API not available:', err);
    }
  }

  // ====================
  // JSON
  // ====================

  formatJson() {
    const raw = this.body.get('jsonContent')?.value;

    try {
      const parsed = JSON.parse(raw);

      this.body.get('jsonContent')?.setValue(JSON.stringify(parsed, null, 2));
    } catch {}
  }

  isValidJson(): boolean {
    const content = this.body.get('jsonContent')?.value?.trim() ?? '';

    if (!content) {
      return true;
    }

    try {
      JSON.parse(content);

      return true;
    } catch {
      return false;
    }
  }

  jsonLineCount(): number {
    const content = this.body.get('jsonContent')?.value ?? '';

    return content ? content.split('\n').length : 0;
  }

  jsonCharCount(): number {
    return this.body.get('jsonContent')?.value?.length ?? 0;
  }

  clearJson() {
    this.body.get('jsonContent')?.setValue('');
  }

  async copyJsonToClipboard() {
    const content = this.body.get('jsonContent')?.value;

    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);

      this.isJsonCopying.set(true);

      setTimeout(() => {
        this.isJsonCopying.set(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

 private initializeDefaults() {
  if (this.headers.length === 0) {
    this.headers.push(
      this.createKeyValueRow(
        'Accept',
        'application/json',
        'Expected response type',
      ),
    );
  }
}

resetRequest() {
  this.requestService.resetRequest();

  this.restoreForm(this.requestService.config());

  this.activeTab.set('params');
}
}
