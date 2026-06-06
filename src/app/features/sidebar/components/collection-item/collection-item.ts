import { Component, computed, input, signal } from '@angular/core';
import { RequestItem } from '../request-item/request-item';
import { ApiRequest } from '../../../../shared/interfaces/api-request.interface';

@Component({
  selector: 'app-collection-item',
  imports: [RequestItem],
  templateUrl: './collection-item.html',
  styleUrl: './collection-item.scss',
})
export class CollectionItem {
  title = input<string>('');
  icon = input<string>('');
  requests = input<ApiRequest[]>([]);
  isExpanded = signal(true);

  toggleExpand() {
    this.isExpanded.update((val) => !val);
  }

  handleRequestClick(request: ApiRequest) {
    console.log('Request clicked:', request);
  }
}
