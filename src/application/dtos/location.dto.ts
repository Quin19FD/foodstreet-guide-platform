export interface LocationUpdateRequestDTO {
  latitude: number;
  longitude: number;
  districtId?: string;
}

export interface NearestPOIResponseDTO {
  poiId: string;
  distanceMeters: number;
}
