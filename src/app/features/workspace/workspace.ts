import { Component, signal } from '@angular/core';
import { RequestBar } from '../request-bar/request-bar';
import { RequestTabs } from '../request-tabs/request-tabs';
import { ResponseSection } from '../response-section/response-section';

@Component({
  selector: 'app-workspace',
  imports: [RequestBar, RequestTabs, ResponseSection],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
})
export class Workspace {
  isTabsCollapsed = signal<boolean>(false);

  toggleTabs() {
    this.isTabsCollapsed.update((val) => !val);
  }
}
