
export interface RequestParam {
  key: string;
  value: string;
  description: string;
}

export interface RequestHeader {
  key: string;
  value: string;
  description: string;
}

export interface RequestAuth {
  type: 'bearer' | 'basic' | 'none';
  bearerToken: string;
  basicUsername: string;
  basicPassword: string;
}

export interface RequestBody {
  type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded';
  jsonContent: string;
  formData: RequestParam[];
  urlEncoded: RequestParam[];
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  params: RequestParam[];
  headers: RequestHeader[];
  auth: RequestAuth;
  body: RequestBody;
}

export const defaultRequestConfig: RequestConfig = {
  method: 'GET',
  url: '',
  params: [
    { key: 'page', value: '1', description: 'Pagination page number' },
    { key: 'limit', value: '10', description: 'Items per page' }
  ],
  headers: [
    { key: 'Content-Type', value: 'application/json', description: 'Content type header' },
    { key: 'Accept', value: 'application/json', description: 'Accepted response format' }
  ],
  auth: {
    type: 'bearer',
    bearerToken: '',
    basicUsername: '',
    basicPassword: ''
  },
  body: {
    type: 'json',
    jsonContent: `{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}`,
    formData: [],
    urlEncoded: []
  }
};
