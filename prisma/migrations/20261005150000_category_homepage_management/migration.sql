ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CATEGORY_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'HOMEPAGE_CHANGED';

ALTER TABLE "categories"
ADD COLUMN "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "homepageOrder" INTEGER;

ALTER TABLE "articles"
ADD COLUMN "isDeveloping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isExclusive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isHomepageLead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "homepageOrder" INTEGER;

CREATE INDEX "categories_showOnHomepage_homepageOrder_idx" ON "categories"("showOnHomepage", "homepageOrder");
CREATE INDEX "articles_isHomepageLead_idx" ON "articles"("isHomepageLead");
CREATE INDEX "articles_homepageOrder_idx" ON "articles"("homepageOrder");
