import { Component, computed, inject, signal } from '@angular/core';
import { CollectionItem } from './components/collection-item/collection-item';
import { RequestService } from '../../core/services/request-service';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { ApiRequest, HttpMethod } from '../../core/interfaces/api-request.interface';

@Component({
  selector: 'app-sidebar',
  imports: [CollectionItem, FormsModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private requestService = inject(RequestService);
  collections = this.requestService.collections;
  isImportModalOpen = signal(false);
  isCreating = signal(false);
  newCollectionName = signal('');
  curlInput = signal('');
  selectedCollectionId = signal<string>('');
  errorMessage = signal<string | null>(null);
  isCurlInvalid = computed(() => {
    const val = this.curlInput().trim();
    return val.length > 0 && !val.startsWith('curl ');
  });

  saveNewCollection() {
    if (this.newCollectionName().trim()) {
      this.requestService.addCollection({
        collectionId: crypto.randomUUID(),
        title: this.newCollectionName(),
        icon: 'folder',
        requests: [],
        isExpanded: true,
      });

      this.newCollectionName.set('');
      this.isCreating.set(false);
    }
  }

  toggleCreateMode() {
    this.isCreating.update((val) => !val);
  }

  handleImport() {
    this.isImportModalOpen.set(true);
  }

  handleSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
  }

  clearCurl(): void {
    this.curlInput.set('');
    this.errorMessage.set(null);
  }

  async confirmImport() {
    this.errorMessage.set(null);
    const curlValue = this.curlInput().trim();

    // 1. Validaciones previas
    if (!curlValue || this.isCurlInvalid()) {
      this.errorMessage.set('Please paste a valid cURL command.');
      return;
    }

    try {
      const parsed = await lastValueFrom(this.requestService.parseCurl(curlValue));

      if (!parsed || !parsed.url) {
        this.errorMessage.set('Could not parse the cURL command.');
        return;
      }

      const newRequest: ApiRequest = {
        requestId: crypto.randomUUID(),
        name: parsed.name || 'Imported Request',
        url: parsed.url,
        method: (parsed.method as HttpMethod) ?? 'GET',
        params: parsed.params ?? [],
        headers: parsed.headers ?? [],
        auth: parsed.auth ?? { type: 'none' },
        body: parsed.body ?? { type: 'none', jsonContent: '{}' },
      };

      const targetCollectionId = this.selectedCollectionId();
      if (targetCollectionId) {
        this.requestService.addRequestToCollection(targetCollectionId, newRequest);
      } else {
        this.requestService.addRequestToCollection('default-inbox-id', newRequest);
      }

      // 5. Crear la tab para visualizarlo (opcional, si quieres que se abra al importar)
      // this.requestService.addTabFromRequest(newRequest);

      this.isImportModalOpen.set(false);
      this.curlInput.set('');
    } catch (e) {
      this.errorMessage.set('Could not parse the cURL command.');
    }
  }
}
