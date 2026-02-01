/**
 * DTOs (Data Transfer Objects) for POI
 */

export interface POIRequestDTO {
  districtId: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  audioScript?: string;
  priceMin: number;
  priceMax: number;
}

export interface POIResponseDTO {
  id: string;
  districtId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  imageUrl?: string;
  audioUrl?: string;
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  isOpen: boolean;
  distance?: number;
}

export interface NearbyPOIsRequestDTO {
  latitude: number;
  longitude: number;
  radius?: number;
  districtId?: string;
}
