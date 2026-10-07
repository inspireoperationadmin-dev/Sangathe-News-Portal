ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAGE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NOTIFICATION_SENT';
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

ALTER TABLE "articles"
ADD COLUMN "location" TEXT,
ADD COLUMN "people" TEXT,
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "audioUrl" TEXT;

CREATE TABLE "tags" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "locale" "Locale" NOT NULL DEFAULT 'ta',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "article_tags" (
  "articleId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  CONSTRAINT "article_tags_pkey" PRIMARY KEY ("articleId", "tagId")
);
CREATE TABLE "media_assets" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "type" "MediaType" NOT NULL,
  "title" TEXT,
  "caption" TEXT,
  "altText" TEXT,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "article_media" (
  "articleId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "caption" TEXT,
  CONSTRAINT "article_media_pkey" PRIMARY KEY ("articleId", "mediaId")
);
CREATE TABLE "article_relations" (
  "articleId" TEXT NOT NULL,
  "relatedArticleId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "article_relations_pkey" PRIMARY KEY ("articleId", "relatedArticleId")
);
CREATE TABLE "newsletter_subscribers" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unsubscribedAt" TIMESTAMP(3),
  CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "push_subscriptions" (
  "id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "userAgent" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "site_pages" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "site_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tags_slug_locale_key" ON "tags"("slug", "locale");
CREATE INDEX "tags_name_locale_idx" ON "tags"("name", "locale");
CREATE INDEX "article_tags_tagId_articleId_idx" ON "article_tags"("tagId", "articleId");
CREATE INDEX "media_assets_type_createdAt_idx" ON "media_assets"("type", "createdAt");
CREATE INDEX "article_media_articleId_order_idx" ON "article_media"("articleId", "order");
CREATE INDEX "article_relations_articleId_order_idx" ON "article_relations"("articleId", "order");
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");
CREATE INDEX "newsletter_subscribers_isActive_subscribedAt_idx" ON "newsletter_subscribers"("isActive", "subscribedAt");
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX "push_subscriptions_isActive_createdAt_idx" ON "push_subscriptions"("isActive", "createdAt");
CREATE UNIQUE INDEX "site_pages_slug_key" ON "site_pages"("slug");
CREATE INDEX "site_pages_isPublished_slug_idx" ON "site_pages"("isPublished", "slug");
CREATE INDEX "articles_search_idx" ON "articles" USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("content", '') || ' ' || coalesce("location", '') || ' ' || coalesce("people", '')));

ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "article_media" ADD CONSTRAINT "article_media_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_media" ADD CONSTRAINT "article_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_relations" ADD CONSTRAINT "article_relations_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_relations" ADD CONSTRAINT "article_relations_relatedArticleId_fkey" FOREIGN KEY ("relatedArticleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
