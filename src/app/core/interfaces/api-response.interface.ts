export interface ApiResponse {
  status: number;
  statusText: string;
  time: number;
  size: string;
  body: any;
  headers?: Record<string, string>;
}
