/**
 * DTOs for Audio Guides (POI Translations & Audio)
 */

export interface AudioGuideRequestDTO {
  poiId: string;
  language: string;
  audioScript?: string;
}

export interface AudioGuideResponseDTO {
  id: string;
  poiId: string;
  language: string;
  name?: string;
  description?: string;
  audioScript?: string;
  audioUrl?: string;
  isActive: boolean;
}

export interface GenerateTTSRequestDTO {
  text: string;
  language: string;
  voice?: string;
}

export interface POIAudioUploadDTO {
  translationId: string;
  audioUrl: string;
}
