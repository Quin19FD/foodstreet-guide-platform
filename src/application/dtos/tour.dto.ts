export interface TourRequestDTO {
  name: string;
  description: string;
  durationMinutes: number;
  poiIds: string[];
}

export interface TourResponseDTO {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  stops: Array<{
    poiId: string;
    sortOrder: number;
  }>;
}
