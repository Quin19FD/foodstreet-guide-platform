/**
 * Service Interfaces for Application Layer
 *
 * These interfaces define the contracts for infrastructure implementations.
 */

import type { POI } from "@/domain/entities/poi";
import type { User } from "@/domain/entities/user";
import type { AudioGuideResponseDTO } from "../dtos/audio-guide.dto";
import type { TourResponseDTO } from "../dtos/tour.dto";
import type { TranslationResponseDTO } from "../dtos/translation.dto";

// Authentication Services
export interface IAuthService {
  login(email: string, password: string): Promise<{ user: User; token: string }>;
  register(data: { email: string; password: string; name: string }): Promise<User>;
  verifyToken(token: string): Promise<User>;
}

export interface IHashService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  generate(payload: Record<string, unknown>): Promise<string>;
  verify(token: string): Promise<Record<string, unknown>>;
}

// POI Services
export interface IPOIService {
  findById(id: string): Promise<POI | null>;
  findByDistrict(districtId: string): Promise<POI[]>;
  findNearby(location: { latitude: number; longitude: number }, radius: number): Promise<POI[]>;
  create(data: Omit<POI, "id" | "createdAt" | "updatedAt">): Promise<POI>;
  update(id: string, data: Partial<POI>): Promise<POI>;
  delete(id: string): Promise<void>;
}

// Location Services
export interface ILocationService {
  calculateDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<number>;
  geocode(address: string): Promise<{ latitude: number; longitude: number }>;
  reverseGeocode(latitude: number, longitude: number): Promise<string>;
}

// Tour Services
export interface ITourService {
  findAll(): Promise<TourResponseDTO[]>;
  create(data: {
    name: string;
    description: string;
    durationMinutes: number;
    poiIds: string[];
  }): Promise<TourResponseDTO>;
  reorderStops(tourId: string, poiIds: string[]): Promise<TourResponseDTO>;
}

// Media Services
export interface IMediaService {
  uploadPOIImage(file: File, poiId: string): Promise<string>;
  deleteMedia(url: string): Promise<void>;
}

// Audio Guide Services
export interface IAudioGuideService {
  findByPOI(poiId: string): Promise<AudioGuideResponseDTO[]>;
  saveScript(data: {
    poiId: string;
    language: string;
    scriptText: string;
  }): Promise<AudioGuideResponseDTO>;
}

// Translation Services
export interface ITranslationService {
  findByEntity(
    entityType: "POI" | "AUDIO_GUIDE" | "TOUR",
    entityId: string
  ): Promise<TranslationResponseDTO[]>;
  upsert(data: {
    entityType: "POI" | "AUDIO_GUIDE" | "TOUR";
    entityId: string;
    language: string;
    field: string;
    value: string;
  }): Promise<TranslationResponseDTO>;
}

// Storage Services
export interface IStorageService {
  upload(file: File, path: string): Promise<string>;
  delete(url: string): Promise<void>;
  getSignedUrl(url: string, expiry?: number): Promise<string>;
}

// Notification Services
export interface INotificationService {
  send(userId: string, message: string, data?: Record<string, unknown>): Promise<void>;
  sendToMultiple(userIds: string[], message: string): Promise<void>;
}

// TTS Services
export interface ITTSService {
  generateSpeech(text: string, language: string): Promise<string>;
  getCachedUrl(text: string, language: string): Promise<string | null>;
}
