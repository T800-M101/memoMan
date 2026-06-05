export interface BackendResponse {
  status: number;
  statusText: string;
  headers: any;
  duration: string;
  body: any;
  timestamp: string;
}

export interface ProxyRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: any;
  duration: string;
  body: any;
  timestamp: string;
}
