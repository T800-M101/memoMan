export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiRequest {
  method: HttpMethod;
  name: string;
  url?: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
  auth?: {
    type: 'bearer' | 'basic' | 'none';
    token?: string;
  };
  response?: ApiResponse;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  time: number;
  size: string;
  body: any;
  headers?: Record<string, string>;
}

export interface ApiCollection {
  id: string;
  title: string;
  icon: string;
  requests: ApiRequest[];
  isExpanded?: boolean;
}
