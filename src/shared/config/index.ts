/**
 * Application Configuration
 *
 * Centralized configuration management.
 * Throws at module evaluation time if critical env vars are missing.
 */

// --- Critical env-var enforcement (runs once at import time) ---

const _jwtSecret = process.env.JWT_SECRET;

if (!_jwtSecret) {
  throw new Error(
    "[config] JWT_SECRET environment variable is required but not set. " +
      "Refusing to start with no signing secret."
  );
}

if (_jwtSecret === "change-me-in-production") {
  throw new Error(
    "[config] JWT_SECRET is still set to the default placeholder value " +
      "'change-me-in-production'. Generate a secure secret and set it in your environment."
  );
}

const _databaseUrl = process.env.DATABASE_URL;

if (!_databaseUrl) {
  throw new Error(
    "[config] DATABASE_URL environment variable is required but not set. " +
      "Refusing to start without a database connection string."
  );
}

// --- Validate Cloudinary configuration ---
// Cloudinary is required for vendor/admin file uploads

const _cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const _cloudinaryUploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();
const _cloudinaryApiKey = process.env.CLOUDINARY_API_KEY?.trim();
const _cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

if (!_cloudinaryCloudName) {
  throw new Error(
    "[config] CLOUDINARY_CLOUD_NAME environment variable is required for file uploads. " +
      "Get it from https://cloudinary.com and set it in your .env file."
  );
}

// At least one auth method is needed: either API key+secret or upload preset
const hasApiAuth = _cloudinaryApiKey && _cloudinaryApiSecret;
const hasUploadPreset = _cloudinaryUploadPreset;

if (!hasApiAuth && !hasUploadPreset) {
  throw new Error(
    "[config] Cloudinary authentication is not configured. " +
      "Either set (CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET) or CLOUDINARY_UPLOAD_PRESET in your .env file."
  );
}

// --- Configuration object ---

export const config = {
  google: {
    apiKey: process.env.GOOGLE_API_KEY ?? "",
    cloudCredentials: process.env.GOOGLE_CLOUD_CREDENTIALS ?? "",
  },
  app: {
    name: "FoodStreet Guide",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    environment: process.env.NODE_ENV ?? "development",
  },

  map: {
    token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
    defaultCenter: {
      latitude: 21.0285,
      longitude: 105.8542, // Hanoi
    },
    defaultZoom: 15,
  },

  auth: {
    jwtSecret: _jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "30d",
  },

  storage: {
    endpoint: process.env.STORAGE_ENDPOINT ?? "",
    accessKey: process.env.STORAGE_ACCESS_KEY ?? "",
    secretKey: process.env.STORAGE_SECRET_KEY ?? "",
    bucket: process.env.STORAGE_BUCKET ?? "",
    region: process.env.STORAGE_REGION ?? "us-east-1",
  },

  cloudinary: {
    cloudName: _cloudinaryCloudName,
    uploadPreset: _cloudinaryUploadPreset ?? "",
    apiKey: _cloudinaryApiKey ?? "",
    apiSecret: _cloudinaryApiSecret ?? "",
  },
} as const;
