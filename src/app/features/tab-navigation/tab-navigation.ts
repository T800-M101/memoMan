import { Component, inject, signal } from '@angular/core';
import { RequestService } from '../../core/services/request-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tab-navigation',
  imports: [FormsModule],
  templateUrl: './tab-navigation.html',
  styleUrl: './tab-navigation.scss',
})
export class TabNavigation {
  requestService = inject(RequestService);
  isSaveModalOpen = signal(false);
  requestName = signal('');
  targetTabId = signal<string | null>(null);
  selectedCollectionId = signal<string>('');
  tabs = this.requestService.tabs;
  activeTabId = this.requestService.activeTabId;
  collections = this.requestService.collections;
  newCollectionTitle = signal('');

  selectTab(id: string) {
    this.requestService.activeTabId.set(id);
  }

  addTab() {
    this.requestService.addTab();
  }

  closeTab(id: string, event: Event) {
    event.stopPropagation();
    this.requestService.removeTab(id);
  }

  saveRequest(id: string, event: Event): void {
    event.stopPropagation();
    this.targetTabId.set(id);
    this.isSaveModalOpen.set(true);
  }

  confirmSave() {
    const tabId = this.targetTabId();
    const name = this.requestName();
    let collectionId = this.selectedCollectionId();

    if (!tabId || !name || !collectionId) return;

    if (collectionId === 'new') {
      const newId = crypto.randomUUID();
      const title = this.newCollectionTitle() || 'Nueva Colección';
      this.requestService.createNewCollection(title, newId);
      collectionId = newId;
    }

    if (collectionId === 'new') {
      const newId = crypto.randomUUID();
      this.requestService.createNewCollection('Nueva Colección', newId);
      collectionId = newId;
    }

    this.requestService.saveRequestToCollection(tabId, name, collectionId);
    this.closeModal();
  }

  closeModal() {
    this.isSaveModalOpen.set(false);
    this.requestName.set('');
  }
}
