// src/queries/article.ts
import { prisma } from "@/lib/prisma";
import { ArticleStatus, Locale, Prisma } from "@prisma/client";

// 1. பிரேக்கிங் செய்திகளை எடுப்பது
export async function getBreakingNews(locale: Locale = Locale.ta) {
  return await prisma.article.findMany({
    where: {
      locale,
      status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] },
      isBreaking: true,
      OR: [{ breakingExpiresAt: null }, { breakingExpiresAt: { gt: new Date() } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });
}

// 2. முக்கியச் செய்தி (Lead Story) எடுப்பது
export async function getLeadArticle(locale: Locale = Locale.ta) {
  const include = { category: true, author: { select: { name: true } } } as const;
  const curated = await prisma.article.findFirst({
    where: {
      locale,
      status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] },
      isHomepageLead: true,
    },
    orderBy: { updatedAt: "desc" },
    include,
  });
  return curated || prisma.article.findFirst({ where: { locale, status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] } }, orderBy: { publishedAt: "desc" }, include });
}

export async function getHomepageFeaturedArticles(locale: Locale = Locale.ta, excludeId?: string, limit = 6) {
  const live = { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] };
  const curated = await prisma.article.findMany({ where: { locale, status: live, homepageOrder: { not: null }, ...(excludeId ? { id: { not: excludeId } } : {}) }, orderBy: { homepageOrder: "asc" }, take: limit, include: { category: true, author: { select: { name: true } } } });
  if (curated.length >= limit) return curated;
  const fallback = await prisma.article.findMany({ where: { locale, status: live, id: { notIn: [...curated.map(article => article.id), ...(excludeId ? [excludeId] : [])] } }, orderBy: { publishedAt: "desc" }, take: limit - curated.length, include: { category: true, author: { select: { name: true } } } });
  return [...curated, ...fallback];
}

export async function getHomepageCategorySections(locale: Locale = Locale.ta) {
  return prisma.category.findMany({
    where: { locale, showOnHomepage: true },
    orderBy: [{ homepageOrder: "asc" }, { order: "asc" }],
    include: { articles: { where: { status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] } }, orderBy: { publishedAt: "desc" }, take: 4, include: { author: { select: { name: true } } } } },
  });
}

// 3. அண்மைச் செய்திகள் (Latest News)
export async function getLatestArticles(
  locale: Locale = Locale.ta,
  excludeId?: string,
  limit = 6
) {
  return await prisma.article.findMany({
    where: {
      locale,
      status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      category: true,
      author: {
        select: { name: true },
      },
    },
  });
}

// 4. Slug வைத்து ஒற்றைச் செய்தியை முழுமையாக எடுப்பது
export async function getArticleBySlug(slug: string, locale: Locale = Locale.ta) {
  let normalizedSlug = slug;
  try {
    normalizedSlug = decodeURIComponent(slug).normalize("NFC");
  } catch {
    normalizedSlug = slug.normalize("NFC");
  }
  const article = await prisma.article.findUnique({
    where: {
      slug_locale: {
        slug: normalizedSlug,
        locale,
      },
    },
    include: {
      category: true,
      author: {
        select: { id: true, name: true, bio: true },
      },
      tags: { include: { tag: true } },
      media: { orderBy: { order: "asc" }, include: { media: true } },
      relatedFrom: { orderBy: { order: "asc" }, include: { relatedArticle: { include: { category: true, author: { select: { name: true } } } } } },
    },
  });
  return article && (article.status === ArticleStatus.PUBLISHED || article.status === ArticleStatus.UPDATED || article.status === ArticleStatus.CORRECTED) ? article : null;
}

// 5. ஒரு குறிப்பிட்ட பிரிவுக்குரிய (Category) செய்திகளை எடுத்தல்
export async function getArticlesByCategory(
  categorySlug: string,
  locale: Locale = Locale.ta
) {
  return await prisma.category.findUnique({
    where: {
      slug_locale: {
        slug: categorySlug,
        locale,
      },
    },
    include: {
      articles: {
        where: {
          status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] },
        },
        orderBy: { publishedAt: "desc" },
        include: {
          author: {
            select: { name: true },
          },
        },
      },
    },
  });
}

// 6. செய்திகளைத் தேடுதல் (Full-Text Search)
export type ArticleSearchFilters = { query?: string; category?: string; author?: string; tag?: string; location?: string; person?: string; from?: string; to?: string; page?: number; pageSize?: number };
export async function searchArticles(filters: ArticleSearchFilters, locale: Locale = Locale.ta) {
  const trimmed = filters.query?.trim() || "";
  const page = Math.max(1, filters.page || 1); const pageSize = Math.min(30, Math.max(1, filters.pageSize || 12));
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : undefined; const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : undefined;
  const where: Prisma.ArticleWhereInput = {
      locale,
      status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] },
      ...(trimmed ? { OR: [
        { title: { contains: trimmed, mode: Prisma.QueryMode.insensitive } },
        { summary: { contains: trimmed, mode: Prisma.QueryMode.insensitive } },
        { content: { contains: trimmed, mode: Prisma.QueryMode.insensitive } },
        { location: { contains: trimmed, mode: Prisma.QueryMode.insensitive } },
        { people: { contains: trimmed, mode: Prisma.QueryMode.insensitive } },
      ] } : {}),
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.author ? { authorId: filters.author } : {}),
      ...(filters.tag ? { tags: { some: { tag: { slug: filters.tag } } } } : {}),
      ...(filters.location ? { location: { contains: filters.location, mode: Prisma.QueryMode.insensitive } } : {}),
      ...(filters.person ? { people: { contains: filters.person, mode: Prisma.QueryMode.insensitive } } : {}),
      ...(from || to ? { publishedAt: { ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}), ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}) } } : {}),
  };
  const [articles,total] = await Promise.all([prisma.article.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page-1)*pageSize, take: pageSize, include: { category: true, author: { select: { id: true, name: true } }, tags: { include: { tag: true } } } }),prisma.article.count({where})]);
  return { articles, total, page, pages: Math.max(1, Math.ceil(total/pageSize)) };
}

// 7. தொடர்புடைய செய்திகள் (Related Articles)
export async function getRelatedArticles(
  categoryId: string,
  excludeArticleId: string,
  locale: Locale = Locale.ta,
  limit = 3
) {
  return await prisma.article.findMany({
    where: {
      locale,
      categoryId,
      id: { not: excludeArticleId },
      status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      category: true,
      author: { select: { name: true } },
    },
  });
}

// 8. அதிகம் வாசிக்கப்பட்டவை (Most Read / Trending)
export async function getMostReadArticles(
  locale: Locale = Locale.ta,
  limit = 5
) {
  return await prisma.article.findMany({
    where: {
      locale,
      status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] },
    },
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: limit,
    include: {
      category: true,
    },
  });
}

// 9. வாசிப்பு எண்ணிக்கையை ஏற்றுதல் (View Count Increment)
export async function recordArticleView(slug: string, locale: Locale = Locale.ta) {
  try {
    let normalizedSlug = slug;
    try { normalizedSlug = decodeURIComponent(slug).normalize("NFC"); } catch { normalizedSlug = slug.normalize("NFC"); }
    await prisma.article.update({
      where: { slug_locale: { slug: normalizedSlug, locale } },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    // Non-critical background task
  }
}
