import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
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
export class RequestTabs {
  private readonly STORAGE_KEY = 'memoman_request_config';
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

  constructor() {
    this.loadFromLocalStorage();

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.saveToLocalStorage();
    });

    effect(() => {
      if (this.requestService.sendRequested() > 0) {
        this.executeRequest();
      }
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
    const method = this.requestService.method();

    const url = this.requestService.url();

    const curl = this.generateCurlCommand(method, url);

    console.log('Ejecutando con cURL:', curl);
  }

  // ====================
  // LOCAL STORAGE
  // ====================

  private saveToLocalStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.form.getRawValue()));
  }

  private loadFromLocalStorage() {
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (!saved) {
      this.setDefaultParams();
      this.setDefaultHeaders();
      return;
    }

    const config = JSON.parse(saved);

    config.params?.length
      ? config.params.forEach((p: any) =>
          this.params.push(this.createKeyValueRow(p.key, p.value, p.description)),
        )
      : this.setDefaultParams();

    config.headers?.length
      ? config.headers.forEach((h: any) =>
          this.headers.push(this.createKeyValueRow(h.key, h.value, h.description)),
        )
      : this.setDefaultHeaders();

    this.auth.patchValue(config.auth ?? {});

    this.body.patchValue(config.body ?? {});
  }

  private setDefaultParams() {
    this.params.push(this.createKeyValueRow('page', '1', 'Pagination page number'));

    this.params.push(this.createKeyValueRow('limit', '10', 'Items per page'));
  }

  private setDefaultHeaders() {
    this.headers.push(
      this.createKeyValueRow('Content-Type', 'application/json', 'Content type header'),
    );

    this.headers.push(
      this.createKeyValueRow('Accept', 'application/json', 'Accepted response format'),
    );
  }

  // ====================
  // cURL
  // ====================

  generateCurlCommand(method: string, url: string): string {
    const { params = [], headers = [], auth, body } = this.form.getRawValue();

    const validParams = params.filter((p: any) => p.key?.trim());

    let curl = validParams.length
      ? `curl -X ${method} '${url}?${validParams
          .map((p: any) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
          .join('&')}'`
      : `curl -X ${method} '${url}'`;

    headers
      .filter((h: any) => h.key?.trim())
      .forEach((h: any) => {
        curl += ` \\
  -H '${h.key}: ${h.value}'`;
      });

    if (auth.type === 'bearer' && auth.bearerToken) {
      curl += ` \\
  -H 'Authorization: Bearer ${auth.bearerToken}'`;
    }

    if (auth.type === 'basic' && auth.basicUsername) {
      curl += ` \\
  -u '${auth.basicUsername}:${auth.basicPassword}'`;
    }

    if (body.type === 'json' && body.jsonContent) {
      curl += ` \\
  -H 'Content-Type: application/json' \\
  -d '${body.jsonContent.replace(/'/g, "'\\''")}'`;
    }

    return curl;
  }

  async copyCurlToClipboard() {
    if (this.requestService.isUrlInvalid()) {
      console.warn('URL inválida');
      return;
    }

    try {
      await navigator.clipboard.writeText(
        this.generateCurlCommand(this.requestService.method(), this.requestService.url()),
      );

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

    // Vacío = estado neutral, no error
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
}
