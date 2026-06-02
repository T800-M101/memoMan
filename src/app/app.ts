import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Topbar } from './components/topbar/topbar';
import { Sidebar } from './components/sidebar/sidebar';
import { Workspace } from './components/workspace/workspace';

@Component({
  selector: 'app-root',
  imports: [CommonModule, Topbar, Sidebar, Workspace],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('My API Client');
}
