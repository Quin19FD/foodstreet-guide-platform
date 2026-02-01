/**
 * Service Interfaces for Application Layer
 *
 * These interfaces define the contracts for infrastructure implementations.
 */

import type { Order } from "@/domain/entities/order";
import type { Payment } from "@/domain/entities/payment";
import type { POI } from "@/domain/entities/poi";
import type { User } from "@/domain/entities/user";
import type { PaymentCallbackDTO } from "../dtos/payment.dto";

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

// Order Services
export interface IOrderService {
  create(data: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUser(userId: string): Promise<Order[]>;
  findByPOI(poiId: string): Promise<Order[]>;
  updateStatus(id: string, status: Order["status"]): Promise<Order>;
}

// Payment Services
export interface IPaymentService {
  createPayment(data: {
    orderId: string;
    amount: number;
    provider: Payment["provider"];
    returnUrl: string;
    cancelUrl: string;
  }): Promise<Payment>;
  processCallback(callback: PaymentCallbackDTO): Promise<Payment>;
  getStatus(paymentId: string): Promise<Payment["status"]>;
}

export interface IVietQRService {
  generateQR(amount: number, orderId: string): Promise<string>;
  verifyPayment(transactionId: string): Promise<boolean>;
}

export interface IVNPayService {
  createPaymentUrl(data: {
    amount: number;
    orderId: string;
    returnUrl: string;
  }): Promise<string>;
  verifyCallback(params: Record<string, string>): Promise<boolean>;
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
