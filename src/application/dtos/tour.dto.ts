/**
 * DTOs for Tours (guided routes through multiple POIs)
 */

export interface TourRequestDTO {
  name: string;
  description?: string;
  durationMinutes?: number;
  poiIds: string[];
}

export interface TourResponseDTO {
  id: string;
  name: string;
  description?: string;
  durationMinutes?: number;
  poiCount: number;
  stops?: Array<{
    poiId: string;
    sortOrder: number;
  }>;
  createdAt: Date;
}
