/**
 * Application Configuration
 *
 * Centralized configuration management.
 * Throws at module evaluation time if critical env vars are missing.
 */

// --- Inline duration parser (avoids circular import with jwt.ts) ---

function parseDuration(raw: string): number {
  const value = raw.trim();
  const match = value.match(/^(\d+)([smhd])?$/i);
  if (!match) throw new Error(`Invalid duration: ${raw}`);
  const amount = Number(match[1]);
  const unit = (match[2] ?? "s").toLowerCase();
  const mul = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return amount * mul;
}

/**
 * Parse a duration env var. Bare numbers < 60s are treated as DAYS
 * (e.g. "7" → 7 days, not 7 seconds) because that's the most common
 * mistake when setting JWT_EXPIRES_IN.
 */
function parseDurationEnv(raw: string | undefined, fallback: string): number {
  const value = raw?.trim() || fallback;
  try {
    const seconds = parseDuration(value);
    if (seconds < 60) {
      // Bare number like "7" meant "7 days", not "7 seconds"
      const days = Number.parseInt(value, 10);
      if (Number.isFinite(days) && days > 0) return days * 86400;
    }
    return seconds;
  } catch {
    return parseDuration(fallback);
  }
}

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

const isProductionRuntime = process.env.NODE_ENV === "production";

// Production guardrail:
// Vercel has repeatedly served runtime values that behave like bare-second durations
// even when the dashboard env was updated. To stop access tokens expiring after 7 seconds,
// force stable production lifetimes in code.
const _jwtExpiresInSeconds = isProductionRuntime
  ? 7 * 24 * 60 * 60
  : parseDurationEnv(process.env.JWT_EXPIRES_IN, "15m");
const _refreshExpiresInSeconds = isProductionRuntime
  ? 30 * 24 * 60 * 60
  : parseDurationEnv(process.env.REFRESH_TOKEN_EXPIRES_IN, "30d");

// --- Cloudinary configuration ---
// Optional for local development.
// Upload-related features validate at runtime and surface a clear error.

const _cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
const _cloudinaryUploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() ?? "";
const _cloudinaryApiKey = process.env.CLOUDINARY_API_KEY?.trim() ?? "";
const _cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET?.trim() ?? "";

export const cloudinaryConfigStatus = {
  enabled:
    Boolean(_cloudinaryCloudName) &&
    (Boolean(_cloudinaryUploadPreset) ||
      (Boolean(_cloudinaryApiKey) && Boolean(_cloudinaryApiSecret))),
} as const;

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
    jwtExpiresInSeconds: _jwtExpiresInSeconds,
    refreshTokenExpiresInSeconds: _refreshExpiresInSeconds,
    // String accessors (seconds + "s") for any code still using parseDurationToSeconds
    jwtExpiresIn: `${_jwtExpiresInSeconds}s`,
    refreshTokenExpiresIn: `${_refreshExpiresInSeconds}s`,
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
