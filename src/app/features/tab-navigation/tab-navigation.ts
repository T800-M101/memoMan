import { Component, inject } from '@angular/core';
import { RequestService } from '../../core/services/request-service';

@Component({
  selector: 'app-tab-navigation',
  imports: [],
  templateUrl: './tab-navigation.html',
  styleUrl: './tab-navigation.scss',
})
export class TabNavigation {
  requestService = inject(RequestService);

  tabs = this.requestService.tabs;
  activeTabId = this.requestService.activeTabId;

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

  saveRequest(id: any, event: Event): void {

  }
}
