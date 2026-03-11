/**
 * DTOs for Search & Search History
 */

export interface SearchHistoryDTO {
  id: string;
  userId: string;
  keyword: string;
  createdAt: Date;
}

export interface SearchHistoryRequestDTO {
  keyword: string;
}

export interface SearchResultsDTO {
  pois: Array<{
    id: string;
    name: string;
    category?: string;
    districtId: string;
  }>;
  districts: Array<{
    id: string;
    name: string;
  }>;
}
