export interface AudioGuideRequestDTO {
  poiId: string;
  language: string;
  scriptText: string;
}

export interface AudioGuideResponseDTO {
  id: string;
  poiId: string;
  language: string;
  scriptText: string;
  audioUrl?: string;
}

export interface GenerateTTSRequestDTO {
  text: string;
  language: string;
  voice?: string;
}
