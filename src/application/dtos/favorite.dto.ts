/**
 * DTOs for Favorite POIs
 */

export interface FavoriteRequestDTO {
  poiId: string;
}

export interface FavoriteResponseDTO {
  id: string;
  userId: string;
  poiId: string;
  createdAt: Date;
}

export interface FavoriteWithPOIDTO {
  id: string;
  userId: string;
  poi: {
    id: string;
    name: string;
    category?: string;
    districtId: string;
    imageUrl?: string;
  };
  createdAt: Date;
}
