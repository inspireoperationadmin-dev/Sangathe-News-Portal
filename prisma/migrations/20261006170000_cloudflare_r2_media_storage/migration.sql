ALTER TABLE "articles" ADD COLUMN "featuredImageKey" TEXT;

ALTER TABLE "media_assets"
ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "storageKey" TEXT;

CREATE INDEX "media_assets_storageProvider_createdAt_idx" ON "media_assets"("storageProvider", "createdAt");
