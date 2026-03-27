/**
 * Application Configuration
 *
 * Centralized configuration management.
 */

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
    jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
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
