import { Component, signal } from '@angular/core';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

@Component({
  selector: 'app-response-section',
  imports: [ NgxJsonViewerModule ],
  templateUrl: './response-section.html',
  styleUrl: './response-section.scss',
})
export class ResponseSection {
  response = signal<any>({
    status: 'success',
    data: {
      users: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          createdAt: '2024-01-16T14:20:00Z',
        },
        {
          id: 3,
          name: 'Bob Johnson',
          email: 'bob@example.com',
          createdAt: '2024-01-17T09:45:00Z',
        },
        {
          id: 4,
          name: 'Alice Brown',
          email: 'alice@example.com',
          createdAt: '2024-01-18T11:00:00Z',
        },
        {
          id: 5,
          name: 'Charlie Wilson',
          email: 'charlie@example.com',
          createdAt: '2024-01-19T13:30:00Z',
        },
        {
          id: 6,
          name: 'Diana Martinez',
          email: 'diana@example.com',
          createdAt: '2024-01-20T15:45:00Z',
        },
        {
          id: 7,
          name: 'Ethan Taylor',
          email: 'ethan@example.com',
          createdAt: '2024-01-21T09:15:00Z',
        },
        {
          id: 8,
          name: 'Fiona Garcia',
          email: 'fiona@example.com',
          createdAt: '2024-01-22T12:20:00Z',
        },
        {
          id: 9,
          name: 'George Anderson',
          email: 'george@example.com',
          createdAt: '2024-01-23T14:10:00Z',
        },
      ],
      total: 9,
      page: 1,
      limit: 10,
    },
    message: 'Users retrieved successfully',
  });

}
