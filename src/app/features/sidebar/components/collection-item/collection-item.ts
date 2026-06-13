import { Component, input, output, signal } from '@angular/core';
import { RequestItem } from '../request-item/request-item';
import { ApiRequest } from '../../../../core/interfaces/api-request.interface';

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

  requestSelected = output<ApiRequest>();

  toggleExpand() {
    this.isExpanded.update((val) => !val);
  }

  handleRequestClick(request: ApiRequest) {
    this.requestSelected.emit(request);
  }
}
