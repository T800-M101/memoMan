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

    const tab = this.tabs().find((t) => t.id === id);
    if (tab) {
      this.requestName.set(tab.name);

      const collection = this.requestService
        .collections()
        .find((c) => c.requests.some((r) => r.requestId === id));
      if (collection) {
        this.selectedCollectionId.set(collection.collectionId);
      }
    }

    this.isSaveModalOpen.set(true);
  }

  confirmSave() {
    const tabId = this.targetTabId();
    const name = this.requestName();
    let collectionId = this.selectedCollectionId();

    if (!tabId || !name || !collectionId) return;

    if (collectionId === 'new') {
      const newId = crypto.randomUUID();
      const title = this.newCollectionTitle() || 'New Collection';

      this.requestService.createNewCollection(title, newId);
      collectionId = newId;
    }

    this.requestService.saveRequestToCollection(tabId, name, collectionId);
    this.closeModal();
  }

  closeModal(): void {
    this.isSaveModalOpen.set(false);
    this.requestName.set('');
  }

  isNew(tabId: string): boolean {
    const tab = this.tabs().find((t) => t.id === tabId);
    if (!tab) return false;

    const isInCollection = this.requestService
      .collections()
      .flatMap((c) => c.requests)
      .some((r) => r.requestId === tab.id);

    return !isInCollection;
  }

  isModified(tabId: string): boolean {
    const tab = this.tabs().find((t) => t.id === tabId);
    return tab ? this.requestService.isTabDirty(tab) : false;
  }
}
