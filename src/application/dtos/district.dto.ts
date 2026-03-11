export interface DistrictRequestDTO {
  name: string;
  slug: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  qrCode?: string;
  imageUrl?: string;
}

export interface DistrictResponseDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  qrCode?: string;
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DistrictWithPOIsDTO extends DistrictResponseDTO {
  poiCount: number;
}
