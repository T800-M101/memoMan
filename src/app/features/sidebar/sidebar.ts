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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Importing file:', file.name);
      }
    };
    input.click();
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
