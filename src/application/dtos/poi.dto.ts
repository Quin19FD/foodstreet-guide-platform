/**
 * DTOs (Data Transfer Objects) for POI
 */

export interface POIRequestDTO {
  districtId: string;
  name: string;
  slug?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  priceMin?: number;
  priceMax?: number;
}

export interface POIResponseDTO {
  id: string;
  districtId: string;
  name: string;
  slug?: string;
  category?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  rating: number;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface POIImageDTO {
  id: string;
  poiId: string;
  imageUrl: string;
  description?: string;
}

export interface POITranslationDTO {
  id: string;
  poiId: string;
  language: string;
  name?: string;
  description?: string;
  audioScript?: string;
}

export interface POIAudioDTO {
  id: string;
  translationId: string;
  audioUrl: string;
  isActive: boolean;
}

export interface MenuItemDTO {
  id: string;
  poiId: string;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface NearbyPOIsRequestDTO {
  latitude: number;
  longitude: number;
  radius?: number;
  districtId?: string;
}

export interface ReviewDTO {
  id: string;
  userId: string;
  poiId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface FavoritePOIDTO {
  id: string;
  userId: string;
  poiId: string;
  createdAt: Date;
}
