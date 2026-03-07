export type ServiceName =
  | "auth"
  | "poi"
  | "tour"
  | "media"
  | "audio-guide"
  | "translation"
  | "location";

export interface AuthSession {
  userId: string;
  username: string;
  role: "admin";
  accessToken: string;
}

export interface POISummary {
  id: string;
  districtId: string;
  name: string;
  type: "FOOD_STALL" | "SUPPORTING_FACILITY";
  description: string;
  latitude: number;
  longitude: number;
  displayRadius: number;
  imageUrl?: string;
}

export interface TourSummary {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  poiIds: string[];
}

export interface AudioGuideSummary {
  id: string;
  poiId: string;
  language: string;
  scriptText: string;
  audioUrl?: string;
}

export interface TranslationItem {
  id: string;
  entityType: "POI" | "AUDIO_GUIDE" | "TOUR";
  entityId: string;
  language: string;
  field: string;
  value: string;
}

export interface LocationRequest {
  latitude: number;
  longitude: number;
  districtId?: string;
}

export interface ServiceEndpoint {
  service: ServiceName;
  method: "GET" | "POST";
  path: string;
  description: string;
}

export const SYSTEM_ENDPOINTS: ServiceEndpoint[] = [
  { service: "auth", method: "POST", path: "/login", description: "Admin login" },
  { service: "auth", method: "POST", path: "/logout", description: "Admin logout" },
  { service: "poi", method: "GET", path: "/districts/:districtId/pois", description: "List POI by district" },
  { service: "poi", method: "GET", path: "/pois", description: "Search and filter POI" },
  { service: "tour", method: "GET", path: "/tours", description: "List food tours" },
  { service: "tour", method: "POST", path: "/tours", description: "Create tour" },
  { service: "media", method: "POST", path: "/upload", description: "Upload media asset" },
  { service: "audio-guide", method: "GET", path: "/poi/:poiId", description: "Get audio guide by POI" },
  { service: "audio-guide", method: "POST", path: "/tts/generate", description: "Generate TTS audio" },
  { service: "translation", method: "GET", path: "/translations", description: "Get translations" },
  { service: "translation", method: "POST", path: "/translations", description: "Upsert translation" },
  { service: "location", method: "POST", path: "/nearest-poi", description: "Resolve nearest POI" },
];
