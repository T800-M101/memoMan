import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Topbar } from './features/topbar/topbar';
import { Sidebar } from './features/sidebar/sidebar';
import { Workspace } from './features/workspace/workspace';

@Component({
  selector: 'app-root',
  imports: [CommonModule, Topbar, Sidebar, Workspace],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('MemoMan API');
}
