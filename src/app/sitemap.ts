// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // சமீபத்திய 500 செய்திகளை எடுத்தல்
  const [articles,categories] = await Promise.all([prisma.article.findMany({
    where: { status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] } },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 10000,
  }),prisma.category.findMany({where:{locale:"ta"},select:{slug:true,createdAt:true}})]);

  const articleUrls = articles.map((art) => ({
    url: `${siteUrl}/news/${art.slug}`,
    lastModified: art.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "always", priority: 1.0 },
    { url: `${siteUrl}/about-us`, lastModified: new Date(), priority: 0.5 },
    { url: `${siteUrl}/editorial-policy`, lastModified: new Date(), priority: 0.5 },
    { url: `${siteUrl}/corrections-policy`, lastModified: new Date(), priority: 0.5 },
    { url: `${siteUrl}/privacy-policy`, lastModified: new Date(), priority: 0.5 },
    { url: `${siteUrl}/contact-us`, lastModified: new Date(), priority: 0.5 },
    { url: `${siteUrl}/terms-and-conditions`, lastModified: new Date(), priority: 0.4 },
    { url: `${siteUrl}/copyright`, lastModified: new Date(), priority: 0.4 },
    { url: `${siteUrl}/archive`, lastModified: new Date(), priority: 0.7 },
    { url: `${siteUrl}/regions`, lastModified: new Date(), priority: 0.7 },
    { url: `${siteUrl}/video`, lastModified: new Date(), priority: 0.7 },
    { url: `${siteUrl}/photo`, lastModified: new Date(), priority: 0.7 },
    ...categories.map(category=>({url:`${siteUrl}/category/${category.slug}`,lastModified:category.createdAt,changeFrequency:"hourly" as const,priority:0.8})),
    ...articleUrls,
  ];
}
