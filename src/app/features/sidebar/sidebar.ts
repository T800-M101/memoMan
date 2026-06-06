import { Component, inject, signal } from '@angular/core';
import { CollectionItem } from './components/collection-item/collection-item';
import { RequestService } from '../../core/services/request-service';
import { FormsModule } from '@angular/forms';

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

  isImportModalOpen = signal(false);
  curlInput = signal('');
  selectedCollectionId = signal<string>('');

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

  }

  handleExport() {
    const data = JSON.stringify(this.collections(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'memoman-collections.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  handleSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value;
  }
}
