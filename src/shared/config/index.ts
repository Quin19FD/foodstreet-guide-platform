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
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "30d",
  },

  storage: {
    endpoint: process.env.STORAGE_ENDPOINT ?? "",
    accessKey: process.env.STORAGE_ACCESS_KEY ?? "",
    secretKey: process.env.STORAGE_SECRET_KEY ?? "",
    bucket: process.env.STORAGE_BUCKET ?? "",
    region: process.env.STORAGE_REGION ?? "us-east-1",
  },
} as const;
