ALTER TABLE "pois"
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "pois_status_is_active_idx"
ON "pois" ("status", "is_active");
