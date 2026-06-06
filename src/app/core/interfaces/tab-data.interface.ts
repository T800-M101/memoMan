export interface TabData {
  id: string;
  name: string;
  url: string | null;
  method: string;
  params: any[];
  headers: any[];
  auth: any;
  body: { type: string, jsonContent: string };
  response: any;
  isLoading: boolean;
  requestError: string | null;
}
