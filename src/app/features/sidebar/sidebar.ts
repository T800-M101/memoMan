import { Component, signal } from '@angular/core';
import { CollectionItem } from './components/collection-item/collection-item';
import { ApiCollection, ApiRequest } from '../../shared/interfaces/api-request.interface';



@Component({
  selector: 'app-sidebar',
  imports: [CollectionItem],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
 collections = signal<ApiCollection[]>([
  {
    id: '1',
    title: 'Users',
    icon: 'folder',
    requests: <ApiRequest[]>[
      { method: 'GET', name: 'Get All Users' },
      { method: 'POST', name: 'Create User' },
      { method: 'PUT', name: 'Update User' },
      { method: 'DELETE', name: 'Delete User' },
    ],
    isExpanded: true
  },
  {
    id: '2',
    title: 'Products',
    icon: 'folder',
    requests: <ApiRequest[]>[
      { method: 'GET', name: 'Get All Products' },
      { method: 'POST', name: 'Create Product' },
    ],
    isExpanded: false
  },
]);

  handleNewRequest() {
    console.log('New request clicked');
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
