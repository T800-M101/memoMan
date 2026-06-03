import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
} from '@angular/forms';
import { signal } from '@angular/core';
import { inject } from '@angular/core';

@Component({
  selector: 'app-request-tabs',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './request-tabs.html',
  styleUrls: ['./request-tabs.scss'],
})
export class RequestTabs implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);

  private readonly STORAGE_KEY = 'memoman_request_config';
  private autoSaveInterval: any;
  private copyTimeout: any;

  isJsonCopying = signal<boolean>(false);

  activeTab = signal<string>('params');
  isCopying = signal<boolean>(false);

  // ==================== REACTIVE FORM ====================

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
      jsonContent: [
        `{\n  "name": "John Doe",\n  "email": "john@example.com",\n  "role": "admin"\n}`,
      ],
    }),
  });

  // ==================== GETTERS ====================

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

  get authType(): string {
    return this.auth.get('type')?.value;
  }

  get bodyType(): string {
    return this.body.get('type')?.value;
  }

  // ==================== LIFECYCLE ====================

  ngOnInit() {
    this.loadFromLocalStorage();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    if (this.copyTimeout) clearTimeout(this.copyTimeout);
  }

  // ==================== FORM ARRAY HELPERS ====================

  private createParamRow(key = '', value = '', description = ''): FormGroup {
    return this.fb.group({ key: [key], value: [value], description: [description] });
  }

  addParamRow() {
    this.params.push(this.createParamRow());
    this.saveToLocalStorage();
  }

  removeParamRow(index: number) {
    this.params.removeAt(index);
    this.saveToLocalStorage();
  }

  private createHeaderRow(key = '', value = '', description = ''): FormGroup {
    return this.fb.group({ key: [key], value: [value], description: [description] });
  }

  addHeaderRow() {
    this.headers.push(this.createHeaderRow());
    this.saveToLocalStorage();
  }

  removeHeaderRow(index: number) {
    this.headers.removeAt(index);
    this.saveToLocalStorage();
  }

  // ==================== UI ====================

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  // ==================== PERSISTENCE ====================

  private saveToLocalStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.form.value));
  }

  private loadFromLocalStorage() {
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (saved) {
      const config = JSON.parse(saved);

      // Rebuild params FormArray
      if (config.params?.length) {
        config.params.forEach((p: any) =>
          this.params.push(this.createParamRow(p.key, p.value, p.description)),
        );
      } else {
        this.setDefaultParams();
      }

      // Rebuild headers FormArray
      if (config.headers?.length) {
        config.headers.forEach((h: any) =>
          this.headers.push(this.createHeaderRow(h.key, h.value, h.description)),
        );
      } else {
        this.setDefaultHeaders();
      }

      // Patch scalar groups
      if (config.auth) this.auth.patchValue(config.auth);
      if (config.body) this.body.patchValue(config.body);
    } else {
      this.setDefaultParams();
      this.setDefaultHeaders();
    }
  }

  private setDefaultParams() {
    this.params.push(this.createParamRow('page', '1', 'Pagination page number'));
    this.params.push(this.createParamRow('limit', '10', 'Items per page'));
  }

  private setDefaultHeaders() {
    this.headers.push(
      this.createHeaderRow('Content-Type', 'application/json', 'Content type header'),
    );
    this.headers.push(
      this.createHeaderRow('Accept', 'application/json', 'Accepted response format'),
    );
  }

  private setupAutoSave() {
    this.autoSaveInterval = setInterval(() => this.saveToLocalStorage(), 30000);
  }

  // ==================== cURL ====================

  generateCurlCommand(): string {
    const method = 'GET';
    const url = 'https://api.example.com/users';
    const { params, headers, auth, body } = this.form.value;

    const validParams = params.filter((p: any) => p.key?.trim());
    let curl = validParams.length
      ? `curl -X ${method} '${url}?${validParams.map((p: any) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')}'`
      : `curl -X ${method} '${url}'`;

    headers
      .filter((h: any) => h.key?.trim())
      .forEach((h: any) => {
        curl += ` \\\n  -H '${h.key}: ${h.value}'`;
      });

    if (auth.type === 'bearer' && auth.bearerToken) {
      curl += ` \\\n  -H 'Authorization: Bearer ${auth.bearerToken}'`;
    } else if (auth.type === 'basic' && auth.basicUsername) {
      curl += ` \\\n  -u '${auth.basicUsername}:${auth.basicPassword}'`;
    }

    if (body.type === 'json' && body.jsonContent) {
      curl += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${body.jsonContent.replace(/'/g, "'\\''")}'`;
    }

    return curl;
  }

  async copyCurlToClipboard() {
    try {
      await navigator.clipboard.writeText(this.generateCurlCommand());
      this.isCopying.set(true);
      this.copyTimeout = setTimeout(() => this.isCopying.set(false), 2000);
    } catch (err) {
      console.error('Clipboard API not available:', err);
    }
  }

  formatJson() {
  const raw = this.body.get('jsonContent')?.value;
  try {
    const parsed = JSON.parse(raw);
    const pretty = JSON.stringify(parsed, null, 2);
    this.body.get('jsonContent')?.setValue(pretty);
  } catch {
    // JSON inválido — el botón ya está disabled pero por si acaso
  }
}

isValidJson(): boolean {
  try {
    JSON.parse(this.body.get('jsonContent')?.value ?? '');
    return true;
  } catch {
    return false;
  }
}

  // ==================== JSON EDITOR ====================

  jsonContent = signal<string>('');

  jsonLineCount(): number {
    const content = this.body.get('jsonContent')?.value ?? '';
    return content ? content.split('\n').length : 0;
  }

  jsonCharCount(): number {
    const content = this.body.get('jsonContent')?.value ?? '';
    return content.length;
  }

  clearJson() {
    this.body.get('jsonContent')?.setValue('');
  }

  // Copy JSON to clipboard with feedback
  async copyJsonToClipboard(): Promise<void> {
    const content = this.jsonContent();
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      this.isJsonCopying.set(true);

      setTimeout(() => {
        this.isJsonCopying.set(false);
      }, 2000);

      console.log('JSON copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}
