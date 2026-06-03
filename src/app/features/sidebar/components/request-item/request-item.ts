import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-request-item',
  imports: [CommonModule],
  templateUrl: './request-item.html',
  styleUrl: './request-item.scss',
})
export class RequestItem {
  method = input.required<string>();
  name = input.required<string>();

  onClick = output<void>();

  getMethodClass(): string {
    return `method-${this.method().toLowerCase()}`;
  }

  handleClick() {
    this.onClick.emit();
  }
}
