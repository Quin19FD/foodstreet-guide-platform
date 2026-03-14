-- CreateTable
CREATE TABLE "tours" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_pois" (
    "id" UUID NOT NULL,
    "tour_id" UUID NOT NULL,
    "poi_id" UUID NOT NULL,
    "stop_order" INTEGER NOT NULL,

    CONSTRAINT "tour_pois_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tour_pois_tour_id_idx" ON "tour_pois"("tour_id");

-- CreateIndex
CREATE INDEX "tour_pois_poi_id_idx" ON "tour_pois"("poi_id");

-- CreateIndex
CREATE UNIQUE INDEX "tour_pois_tour_id_poi_id_key" ON "tour_pois"("tour_id", "poi_id");

-- AddForeignKey
ALTER TABLE "tour_pois" ADD CONSTRAINT "tour_pois_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_pois" ADD CONSTRAINT "tour_pois_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;
