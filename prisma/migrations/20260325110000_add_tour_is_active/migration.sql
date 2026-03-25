ALTER TABLE "tours"
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "tours_is_active_idx" ON "tours"("is_active");
