export interface TranslationRequestDTO {
  entityType: "POI" | "AUDIO_GUIDE" | "TOUR";
  entityId: string;
  language: string;
  field: string;
  value: string;
}

export interface TranslationResponseDTO {
  id: string;
  entityType: "POI" | "AUDIO_GUIDE" | "TOUR";
  entityId: string;
  language: string;
  field: string;
  value: string;
}
