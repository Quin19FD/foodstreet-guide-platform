export interface DistrictRequestDTO {
  name: string;
  slug: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface DistrictResponseDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
}
