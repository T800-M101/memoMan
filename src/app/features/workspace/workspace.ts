import { Component, inject, signal } from '@angular/core';
import { RequestBar } from '../request-bar/request-bar';
import { RequestTabs } from '../request-tabs/request-tabs';
import { ResponseSection } from '../response-section/response-section';
import { RequestService } from '../../core/services/request-service';
import { TabNavigation } from '../tab-navigation/tab-navigation';

@Component({
  selector: 'app-workspace',
  imports: [RequestBar, RequestTabs, ResponseSection, TabNavigation],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
})
export class Workspace {

  requestService = inject(RequestService);

  isTabsCollapsed = signal<boolean>(false);

  toggleTabs() {
    this.isTabsCollapsed.update((val) => !val);
  }

  activeTabId = this.requestService.activeTabId;


}
