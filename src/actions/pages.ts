"use server";

import { AuditAction, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeArticleHtml, articleText } from "@/lib/article-content";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_PAGES } from "@/lib/site-pages";

export async function saveSitePage(formData: FormData) {
  const actor = await requireUser([Role.ADMIN]);
  const slug = String(formData.get("slug") || "");
  const title = String(formData.get("title") || "").trim();
  const content = sanitizeArticleHtml(String(formData.get("content") || ""));
  if (!SITE_PAGES.some(page => page.slug === slug) || title.length < 2 || !articleText(content)) redirect(`/admin/pages?error=${encodeURIComponent("Enter a page title and content.")}`);
  await prisma.$transaction([
    prisma.sitePage.upsert({ where: { slug }, update: { title, content, isPublished: true, updatedById: actor.id }, create: { slug, title, content, isPublished: true, updatedById: actor.id } }),
    prisma.auditEvent.create({ data: { action: AuditAction.PAGE_CHANGED, actorId: actor.id, details: `Updated public page ${slug}` } }),
  ]);
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");
  redirect(`/admin/pages?success=${encodeURIComponent(`${title} published.`)}`);
}
