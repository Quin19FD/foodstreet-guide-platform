-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'VENDOR');

-- CreateTable "users"
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),
    "refresh_token_hash" TEXT,
    "refresh_token_expiry" TIMESTAMP(3),
    "reset_password_token_hash" TEXT,
    "reset_password_token_expiry" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable "districts"
CREATE TABLE "districts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "qr_code" VARCHAR(255),
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable "pois"
CREATE TABLE "pois" (
    "id" UUID NOT NULL,
    "district_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255),
    "category" VARCHAR(50),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "price_min" INTEGER,
    "price_max" INTEGER,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pois_pkey" PRIMARY KEY ("id")
);

-- CreateTable "poi_images"
CREATE TABLE "poi_images" (
    "id" UUID NOT NULL,
    "poi_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "poi_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable "menu_items"
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "poi_id" UUID NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "price" INTEGER,
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable "poi_translations"
CREATE TABLE "poi_translations" (
    "id" UUID NOT NULL,
    "poi_id" UUID NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "audio_script" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poi_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable "poi_audios"
CREATE TABLE "poi_audios" (
    "id" UUID NOT NULL,
    "translation_id" UUID NOT NULL,
    "audio_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poi_audios_pkey" PRIMARY KEY ("id")
);

-- CreateTable "page_views"
CREATE TABLE "page_views" (
    "id" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "user_id" UUID,
    "session_id" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable "poi_views"
CREATE TABLE "poi_views" (
    "id" UUID NOT NULL,
    "poi_id" UUID NOT NULL,
    "user_id" UUID,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poi_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable "favorite_pois"
CREATE TABLE "favorite_pois" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "poi_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_pois_pkey" PRIMARY KEY ("id")
);

-- CreateTable "reviews"
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "poi_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable "search_history"
CREATE TABLE "search_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "keyword" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable "user_activity"
CREATE TABLE "user_activity" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "districts_slug_key" ON "districts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "districts_qr_code_key" ON "districts"("qr_code");

-- CreateIndex
CREATE UNIQUE INDEX "pois_district_id_slug_key" ON "pois"("district_id", "slug");

-- CreateIndex
CREATE INDEX "idx_poiviews_poiid" ON "poi_views"("poi_id");

-- CreateIndex
CREATE INDEX "idx_poiviews_createdat" ON "poi_views"("created_at");

-- CreateIndex
CREATE INDEX "idx_pageviews_createdat" ON "page_views"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_pois_user_id_poi_id_key" ON "favorite_pois"("user_id", "poi_id");

-- CreateIndex
CREATE INDEX "idx_reviews_poi" ON "reviews"("poi_id");

-- CreateIndex
CREATE INDEX "idx_search_keyword" ON "search_history"("keyword");

-- CreateIndex
CREATE INDEX "idx_search_createdat" ON "search_history"("created_at");

-- AddForeignKey
ALTER TABLE "pois" ADD CONSTRAINT "pois_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poi_images" ADD CONSTRAINT "poi_images_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poi_translations" ADD CONSTRAINT "poi_translations_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poi_audios" ADD CONSTRAINT "poi_audios_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "poi_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poi_views" ADD CONSTRAINT "poi_views_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poi_views" ADD CONSTRAINT "poi_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_pois" ADD CONSTRAINT "favorite_pois_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_pois" ADD CONSTRAINT "favorite_pois_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
