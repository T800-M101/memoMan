import { Component, computed, inject, signal } from '@angular/core';
import { CollectionItem } from './components/collection-item/collection-item';
import { RequestService } from '../../core/services/request-service';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [CollectionItem, FormsModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private requestService = inject(RequestService);
  collections = this.requestService.collections;
  isCreating = signal(false);
  newCollectionName = signal('');
  errorMessage = signal<string | null>(null);
  isImportModalOpen = signal(false);
  curlInput = signal('');
  selectedCollectionId = signal<string>('');
  isCurlInvalid = computed(() => {
    const val = this.curlInput().trim();
    return val.length > 0 && !val.startsWith('curl ');
  });

  toggleCreateMode() {
    this.isCreating.set(!this.isCreating());
  }

  saveNewCollection() {
    if (this.newCollectionName().trim()) {
      this.requestService.createNewCollection(this.newCollectionName());
      this.newCollectionName.set('');
      this.isCreating.set(false);
    }
  }

  handleImport() {
    this.isImportModalOpen.set(true);
  }

  async confirmImport() {
    this.errorMessage.set(null); // Limpiamos errores previos
    const curlValue = this.curlInput().trim();
    console.log('VALUE:', curlValue);

    if (!curlValue || this.isCurlInvalid()) {
      this.errorMessage.set('Please paste a valid cURL command starting with "curl".');
      return;
    }

    if (!this.selectedCollectionId()) {
      this.errorMessage.set('Please select a collection.');
      return;
    }

    try {
      const parsed = await lastValueFrom(this.requestService.parseCurl(curlValue));

      if (!parsed || !parsed.url) {
        this.errorMessage.set('Could not parse the cURL command. Please check the syntax.');
        return;
      }

      // const newTabId = Date.now().toString();

      // this.requestService.tabs.update(t => [...t, {
      //   id: newTabId,
      //   name: 'Imported Request',
      //   url: parsed.url,
      //   method: parsed.method ?? 'GET',
      //   params: [],
      //   headers: parsed.headers ?? [],
      //   auth: { type: 'none' },
      //   body: parsed.body ?? { type: 'none', jsonContent: '{}' },
      //   response: null,
      //   isLoading: false,
      //   requestError: null
      // }]);

      // this.requestService.saveRequestToCollection(newTabId, 'Imported Request', this.selectedCollectionId());

      this.isImportModalOpen.set(false);
      this.curlInput.set('');
      this.selectedCollectionId.set('');
    } catch (e) {
      console.error('Error parsing cURL:', e);
      this.errorMessage.set('Could not parse the cURL command. Please check the syntax.');
    }
  }

  handleSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
  }

  clearCurl(): void {
    this.curlInput.set('');
    this.errorMessage.set(null);
  }
}
