import { ApiRequest } from "./api-request.interface";

export interface ApiCollection {
  collectionId: string;
  title: string;
  icon: string;
  requests: ApiRequest[];
  isExpanded?: boolean;
}
