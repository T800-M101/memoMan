export interface RequestConfig {
  method: string;
  url: string;

  params: {
    key: string;
    value: string;
    description: string;
  }[];

  headers: {
    key: string;
    value: string;
    description: string;
  }[];

  auth: {
    type: string;
    bearerToken: string;
    basicUsername: string;
    basicPassword: string;
  };

  body: {
    type: string;
    jsonContent: string;
  };
}
