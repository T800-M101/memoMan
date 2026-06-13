import { Component, computed, inject, signal } from '@angular/core';
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
  newCollectionTitle = signal('');
  tabs = this.requestService.tabs;
  activeTabId = this.requestService.activeTabId;
  collections = this.requestService.collections;

    isSaveDisabled = computed(() => {
    const hasRequestName = this.requestName()?.trim().length > 0;

    if (this.collections().length > 0) {
      // There are collections: need name and (selected collection or new named collection)
      const hasCollectionSelected = this.selectedCollectionId() !== '';
      const hasNewCollectionName = this.selectedCollectionId() === 'new'
        ? this.newCollectionTitle()?.trim().length > 0
        : true;
      return !hasRequestName || !hasCollectionSelected || !hasNewCollectionName;
    } else {
      // There are no collections: you need the name of the request and the name of the new collection
      const hasNewCollection = this.newCollectionTitle()?.trim().length > 0;
      return !hasRequestName || !hasNewCollection;
    }
  });

  private getTab(id: string) {
    return this.tabs().find((t) => t.tabId === id);
  }

  isNew(tabId: string): boolean {
    const tab = this.getTab(tabId);
    return !!tab && !tab.requestId;
  }

  isModified(tabId: string): boolean {
    const tab = this.getTab(tabId);
    if (!tab || !tab.requestId) return false;

    const savedRequest = this.requestService.findRequestById(tab.requestId);
    if (!savedRequest) return false;

    return tab.name !== savedRequest.name || tab.url !== savedRequest.url;
  }

  confirmSave() {
    const tabId = this.targetTabId();
    const tab = this.getTab(tabId!);
    if (!tab) return;

    let collectionId = this.selectedCollectionId();
    if (collectionId === 'new') {
      collectionId = crypto.randomUUID();
      this.requestService.addCollection({
        collectionId,
        title: this.newCollectionTitle() || 'New Collection',
        icon: 'folder',
        requests: [],
        isExpanded: true,
      });
    }

    this.requestService.saveOrUpdateRequest(tabId!, this.requestName(), collectionId);
    this.closeModal();
  }

  closeModal(): void {
    this.isSaveModalOpen.set(false);
    this.requestName.set('');
  }

  saveRequest(id: string, event: Event): void {
    event.stopPropagation();
    this.targetTabId.set(id);

    const tab = this.tabs().find((t) => t.tabId === id);
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

  selectTab(id: string) {
    this.requestService.activeTabId.set(id);
  }
  closeTab(id: string, event: Event) {
    event.stopPropagation();
    this.requestService.removeTab(id);
  }
  addTab() {
    this.requestService.addTab();
  }
}
