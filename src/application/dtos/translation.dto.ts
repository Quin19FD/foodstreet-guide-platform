/**
 * DTOs for POI Translations (Multi-language support)
 */

export interface TranslationRequestDTO {
  poiId: string;
  language: string;
  name?: string;
  description?: string;
  audioScript?: string;
}

export interface TranslationResponseDTO {
  id: string;
  poiId: string;
  language: string;
  name?: string;
  description?: string;
  audioScript?: string;
  updatedAt: Date;
}

export interface LanguageDTO {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}
