import { Component } from '@angular/core';
import { Topbar } from '../topbar/topbar';
import { Sidebar } from '../sidebar/sidebar';
import { RequestBar } from '../request-bar/request-bar';
import { RequestTabs } from '../request-tabs/request-tabs';
import { ResponseSection } from '../response-section/response-section';

@Component({
  selector: 'app-workspace',
  imports: [RequestBar, RequestTabs, ResponseSection],
  templateUrl: './workspace.html',
  styleUrl: './workspace.scss',
})
export class Workspace {}
