/**
 * DTOs for Location & Geolocation
 */

export interface LocationUpdateRequestDTO {
  latitude: number;
  longitude: number;
  districtId?: string;
}

export interface NearestPOIResponseDTO {
  poiId: string;
  distanceMeters: number;
  name: string;
  category?: string;
}

export interface GeoLocationDTO {
  latitude: number;
  longitude: number;
}

export interface BoundsDTO {
  northeast: GeoLocationDTO;
  southwest: GeoLocationDTO;
}
