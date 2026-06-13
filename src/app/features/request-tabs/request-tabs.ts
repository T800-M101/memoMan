import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
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
  tabId = input.required<string>();
  requestService = inject(RequestService);
  activeTab = signal<string>('params');
  isCopied = signal(false);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  private requestData = computed(() => {
    const tab = this.requestService.tabs().find((t) => t.tabId === this.tabId());
    if (!tab) return null;
    if (tab.requestId) {
      return this.requestService
        .collections()
        .flatMap((c) => c.requests)
        .find((r) => r.requestId === tab.requestId);
    }
    return tab;
  });

  // private syncFormEffect = effect(() => {
  //   const data = this.requestData();
  //   if (data) {
  //     this.restoreForm(data);
  //   }
  // }, { allowSignalWrites: true });

  form: FormGroup = this.fb.group({
    params: this.fb.array([]),
    headers: this.fb.array([]),
    auth: this.fb.group({
      type: ['bearer'],
      bearerToken: [''],
      basicUsername: [''],
      basicPassword: [''],
    }),
    body: this.fb.group({ type: ['json'], jsonContent: [''] }),
  });

  authType = computed(() => this.auth.get('type')?.value);
  bodyType = computed(() => this.body.get('type')?.value);

  ngOnInit(): void {
    this.initializeDefaults();

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      const data = this.requestData();
      if (!data) return;

      if (data.requestId) {
        this.requestService.updateRequest(data.requestId, { ...data, ...val });
      } else {
        this.requestService.updateTabData(this.tabId(), val);
      }
    });
  }

  private initializeDefaults() {
    if (this.headers.length === 0) {
      this.headers.push(
        this.createKeyValueRow('Accept', 'application/json', 'Expected response type'),
      );
    }
  }

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

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  private restoreForm(data: any) {
    if (JSON.stringify(this.form.getRawValue()) === JSON.stringify(data)) return;

    this.params.clear();
    data.params?.forEach((p: any) =>
      this.params.push(this.createKeyValueRow(p.key, p.value, p.description)),
    );

    this.headers.clear();
    data.headers?.forEach((h: any) =>
      this.headers.push(this.createKeyValueRow(h.key, h.value, h.description)),
    );

    this.auth.patchValue(data.auth || {}, { emitEvent: false });
    this.body.patchValue(data.body || {}, { emitEvent: false });
  }

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

  executeRequest() {
    const data = this.requestData();
    if (!data) return;

    const curl = this.generateCurlCommand(data.method || 'GET', data.url || '');

    console.log('cURL generado:', curl);
  }

  generateCurlCommand(method: string, url: string): string {
    const { params, headers, auth, body } = this.form.getRawValue();

    const escapeSingleQuotes = (value: string) => value.replace(/'/g, `'\\''`);

    const safeUrl = url?.trim() || '';

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

    let curl = `curl -X ${method.toUpperCase()} '${finalUrl}'`;

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

    if (auth?.type === 'bearer' && auth.bearerToken?.trim()) {
      curl += ` \\
  -H 'Authorization: Bearer ${escapeSingleQuotes(auth.bearerToken.trim())}'`;
    }

    if (auth?.type === 'basic' && auth.basicUsername) {
      curl += ` \\
  -u '${escapeSingleQuotes(auth.basicUsername)}:${escapeSingleQuotes(auth.basicPassword ?? '')}'`;
    }

    const hasJsonBody = body?.type === 'json' && body.jsonContent?.trim();

    if (hasJsonBody) {
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
    const data = this.requestData();

    if (!data || !data.url || data.url.trim() === '') {
      console.warn('Invalid URL');
      return;
    }

    try {
      const curl = this.generateCurlCommand(data.method || 'GET', data.url);

      await navigator.clipboard.writeText(curl);

      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    } catch (err) {
      console.error('Clipboard API not available:', err);
    }
  }

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

  resetRequest() {
    const data = this.requestData();
    if (!data) return;

    this.restoreForm(data);
    if (!data.requestId) {
      this.requestService.updateTabData(this.tabId(), {
        url: '',
        method: 'GET',
        params: [],
        headers: [],
        body: { type: 'none', jsonContent: '{}' },
      });
    }

    this.activeTab.set('params');
  }

  isFormEmpty(): boolean {
    const formValue = this.form.getRawValue();
    const hasParams = formValue.params.length > 0;
    const hasHeaders = formValue.headers.length > 0;
    const hasBody = !!formValue.body.jsonContent?.trim();

    return !hasParams && !hasHeaders && !hasBody;
  }

  isUrlInvalid(): boolean {
    const data = this.requestData();

    if (!data || !data.url || data.url.trim().length === 0) {
      return true;
    }

    try {
      new URL(data.url);
      return false;
    } catch {
      return true;
    }
  }
}
