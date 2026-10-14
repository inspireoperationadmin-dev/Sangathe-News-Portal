"use server";

import { AuditAction, ArticleStatus, Locale, Role, type Article } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, type SessionUser } from "@/lib/auth";
import { articleText, sanitizeArticleHtml } from "@/lib/article-content";
import { sendPushNotification } from "@/lib/push";
import { parseColomboDateTime } from "@/lib/datetime";
import { deleteFromR2, deleteManyFromR2, uploadToR2 } from "@/lib/r2";
import type { Prisma } from "@prisma/client";

const EDITORS: Role[] = [Role.ADMIN, Role.EDITOR];
const DESK: Role[] = [Role.ADMIN, Role.EDITOR, Role.SUB_EDITOR];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };

async function articleTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(work, {
    maxWait: 10_000,
    timeout: 30_000,
  });
}

export async function getCategories(locale: Locale = Locale.ta) {
  return prisma.category.findMany({ where: { locale }, orderBy: { order: "asc" } });
}

function value(form: FormData, key: string) { const raw = form.get(key); return typeof raw === "string" ? raw.trim() : ""; }
function articleError(message: string): never { throw new Error(message); }
function articleEditError(articleId: string, message: string): never { redirect(`/admin/articles/${articleId}/edit?error=${encodeURIComponent(message)}`); }
function canEdit(user: SessionUser, article: { authorId: string; status: ArticleStatus }) {
  if (user.role === Role.REPORTER) return article.authorId === user.id && (article.status === ArticleStatus.DRAFT || article.status === ArticleStatus.RETURNED);
  if (user.role === Role.SUB_EDITOR) return article.status === ArticleStatus.SUBMITTED_FOR_REVIEW || article.status === ArticleStatus.EDITING;
  return article.status !== ArticleStatus.ARCHIVED;
}
function canUseStatus(user: SessionUser, status: ArticleStatus) {
  if (user.role === Role.REPORTER) return status === ArticleStatus.DRAFT || status === ArticleStatus.SUBMITTED_FOR_REVIEW;
  if (user.role === Role.SUB_EDITOR) return status === ArticleStatus.EDITING || status === ArticleStatus.RETURNED || status === ArticleStatus.SUBMITTED_FOR_APPROVAL;
  return Object.values(ArticleStatus).includes(status);
}
function statusIs(status: ArticleStatus, allowed: ArticleStatus[]) { return allowed.includes(status); }
function canTransition(user: SessionUser, from: ArticleStatus, to: ArticleStatus) {
  if (user.role === Role.REPORTER) return statusIs(from, [ArticleStatus.DRAFT, ArticleStatus.RETURNED]) && statusIs(to, [ArticleStatus.DRAFT, ArticleStatus.SUBMITTED_FOR_REVIEW]);
  if (user.role === Role.SUB_EDITOR) {
    if (from === ArticleStatus.SUBMITTED_FOR_REVIEW) return statusIs(to, [ArticleStatus.EDITING, ArticleStatus.RETURNED]);
    if (from === ArticleStatus.EDITING) return statusIs(to, [ArticleStatus.EDITING, ArticleStatus.RETURNED, ArticleStatus.SUBMITTED_FOR_APPROVAL]);
    return false;
  }
  if (statusIs(from, [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED])) return statusIs(to, [ArticleStatus.UPDATED, ArticleStatus.CORRECTED, ArticleStatus.ARCHIVED]);
  if (from === ArticleStatus.ARCHIVED) return to === ArticleStatus.APPROVED && EDITORS.includes(user.role);
  if (statusIs(from, [ArticleStatus.APPROVED, ArticleStatus.SCHEDULED])) return statusIs(to, [ArticleStatus.APPROVED, ArticleStatus.SCHEDULED, ArticleStatus.PUBLISHED, ArticleStatus.RETURNED]);
  return statusIs(to, [ArticleStatus.RETURNED, ArticleStatus.APPROVED]);
}
type StoredImage = { url: string | null; storageKey: string | null; uploaded: boolean };

async function saveImage(file: File | null, previousUrl: string | null = null, previousKey: string | null = null, folder: "articles" | "gallery" = "articles"): Promise<StoredImage> {
  if (!file || !file.size || file.name === "undefined") return { url: previousUrl, storageKey: previousKey, uploaded: false };
  if (file.size > MAX_IMAGE_SIZE) articleError("Images must be 8 MB or smaller.");
  const extension = IMAGE_TYPES[file.type];
  if (!extension) articleError("Only JPG, PNG, WebP and GIF images are accepted.");
  const stored = await uploadToR2(file, { folder, extension });
  return { url: stored.url, storageKey: stored.key, uploaded: true };
}
function slugFor(title: string) {
  const base = title.toLowerCase().replace(/[^\w\s\u0B80-\u0BFF-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "news"}-${Date.now().toString().slice(-6)}`;
}
function tagSlug(name: string) {
  return name.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
function parseTags(form: FormData) {
  return [...new Set(value(form, "tags").split(",").map(tag => tag.trim()).filter(tag => Boolean(tag) && Boolean(tagSlug(tag))))].slice(0, 20);
}
function relatedIds(form: FormData) {
  return [...new Set(form.getAll("relatedArticleIds").filter((item): item is string => typeof item === "string" && Boolean(item)))].slice(0, 6);
}
async function saveGallery(files: FormDataEntryValue[], userId: string) {
  const saved: { url: string; storageKey: string; storageProvider: string; mimeType: string; fileSize: number; uploadedById: string }[] = [];
  try {
    for (const item of files.slice(0, 12)) {
      if (!(item instanceof File) || !item.size) continue;
      const image = await saveImage(item, null, null, "gallery");
      if (image.url && image.storageKey) saved.push({ url: image.url, storageKey: image.storageKey, storageProvider: "R2", mimeType: item.type, fileSize: item.size, uploadedById: userId });
    }
  } catch (error) {
    await deleteManyFromR2(saved.map((item) => item.storageKey));
    throw error;
  }
  return saved;
}
function parseStatus(form: FormData, fallback: ArticleStatus, scheduledAt: Date | null) {
  const requested = value(form, "status");
  const raw = (requested === "RELEASE"
    ? scheduledAt ? ArticleStatus.SCHEDULED : ArticleStatus.PUBLISHED
    : requested) as ArticleStatus;
  return Object.values(ArticleStatus).includes(raw) ? raw : fallback;
}
function parseDate(form: FormData, key: string) {
  const raw = value(form, key); if (!raw) return null;
  return parseColomboDateTime(raw);
}

export async function createArticle(formData: FormData): Promise<void> {
  const user = await requireUser([Role.REPORTER, Role.EDITOR, Role.ADMIN]);
  const title = value(formData, "title");
  const categoryId = value(formData, "categoryId");
  const content = sanitizeArticleHtml(value(formData, "content"));
  if (!title || !categoryId || !articleText(content)) articleError("Headline, category and article body are required.");
  const category = await prisma.category.findFirst({ where: { id: categoryId, locale: Locale.ta }, select: { id: true } });
  if (!category) articleError("Select a valid Tamil category.");
  const locale = Locale.ta;
  const scheduledAt = parseDate(formData, "scheduledAt");
  const status = parseStatus(formData, ArticleStatus.DRAFT, scheduledAt);
  if (!canUseStatus(user, status)) articleError("You are not allowed to create an article in that status.");
  if (status === ArticleStatus.SCHEDULED && (!scheduledAt || scheduledAt <= new Date())) articleError("Choose a future publication time.");
  const isBreaking = EDITORS.includes(user.role) && formData.get("isBreaking") === "on";
  const isDeveloping = EDITORS.includes(user.role) && formData.get("isDeveloping") === "on";
  const isExclusive = EDITORS.includes(user.role) && formData.get("isExclusive") === "on";
  const featuredImage = await saveImage(formData.get("imageFile") as File | null);
  let gallery: Awaited<ReturnType<typeof saveGallery>> = [];
  try {
    gallery = await saveGallery(formData.getAll("galleryFiles"), user.id);
  } catch (error) {
    if (featuredImage.uploaded) await deleteFromR2(featuredImage.storageKey).catch(() => undefined);
    throw error;
  }
  const tags = parseTags(formData);
  const relations = relatedIds(formData);
  const now = new Date();
  let article: Article;
  try {
    article = await articleTransaction(async (tx) => {
    const created = await tx.article.create({ data: {
      title, slug: slugFor(title), locale, summary: value(formData, "summary") || null, content,
      featuredImage: featuredImage.url, featuredImageKey: featuredImage.storageKey, imageCaption: value(formData, "imageCaption") || null,
      seoTitle: user.role === Role.REPORTER ? title : value(formData, "seoTitle") || title,
      seoDescription: user.role === Role.REPORTER ? value(formData, "summary") || title : value(formData, "seoDescription") || value(formData, "summary") || title,
      editorialNote: value(formData, "editorialNote") || null, correctionNote: value(formData, "correctionNote") || null,
      location: value(formData, "location") || null, people: value(formData, "people") || null,
      videoUrl: value(formData, "videoUrl") || null, audioUrl: value(formData, "audioUrl") || null,
      status, isBreaking, isDeveloping, isExclusive, breakingExpiresAt: parseDate(formData, "breakingExpiresAt"), scheduledAt,
      authorId: user.id, lastEditedById: user.id, categoryId,
      approvedById: status === ArticleStatus.APPROVED || status === ArticleStatus.SCHEDULED || status === ArticleStatus.PUBLISHED ? user.id : null,
      approvedAt: status === ArticleStatus.APPROVED || status === ArticleStatus.SCHEDULED || status === ArticleStatus.PUBLISHED ? now : null,
      publishedById: status === ArticleStatus.PUBLISHED ? user.id : null,
      publishedAt: status === ArticleStatus.PUBLISHED ? now : null,
      tags: { create: tags.map(name => ({ tag: { connectOrCreate: { where: { slug_locale: { slug: tagSlug(name), locale: Locale.ta } }, create: { name, slug: tagSlug(name), locale: Locale.ta } } } })) },
      media: { create: gallery.map((media, order) => ({ order, media: { create: { ...media, type: "IMAGE" } } })) },
    }});
        const validRelations = relations.length
      ? await tx.article.findMany({
          where: {
            id: { in: relations },
            locale: Locale.ta,
            status: {
              in: [
                ArticleStatus.PUBLISHED,
                ArticleStatus.UPDATED,
                ArticleStatus.CORRECTED,
              ],
            },
          },
          select: { id: true },
        })
      : [];

    if (validRelations.length > 0) {
      await tx.articleRelation.createMany({
        data: validRelations.map((related, order) => ({
          articleId: created.id,
          relatedArticleId: related.id,
          order,
        })),
      });
    }

    await tx.articleRevision.create({
      data: {
        articleId: created.id,
        revisionNumber: 1,
        title,
        summary: created.summary,
        content,
        status,
        editorId: user.id,
        changeNote: "Initial version",
      },
    });

    await tx.auditEvent.create({
      data: {
        action: AuditAction.CREATED,
        actorId: user.id,
        articleId: created.id,
        details: `Created as ${status}`,
      },
    });

    return created;
    });
  } catch (error) {
    await deleteManyFromR2([featuredImage.uploaded ? featuredImage.storageKey : null, ...gallery.map((item) => item.storageKey)]);
    throw error;
  }
  revalidatePath("/"); revalidatePath("/admin/articles");
  if (status === ArticleStatus.PUBLISHED && (isBreaking || formData.get("sendNotification") === "on")) await sendPushNotification({ title: article.title, body: article.summary || "New story published", url: `/news/${article.slug}`, tag: `article-${article.id}` });
  redirect(`/admin/articles?success=${encodeURIComponent(`Article “${article.title}” created.`)}`);
}

export async function updateArticle(articleId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const existing = await prisma.article.findUnique({ where: { id: articleId } });
  if (!existing) articleError("Article not found.");
  if (!canEdit(user, existing)) articleError("You may only edit your own draft or returned articles.");
  const title = value(formData, "title"), content = sanitizeArticleHtml(value(formData, "content")), categoryId = value(formData, "categoryId");
  if (!title || !articleText(content) || !categoryId) articleError("Headline, category and article body are required.");
  const category = await prisma.category.findFirst({ where: { id: categoryId, locale: Locale.ta }, select: { id: true } });
  if (!category) articleError("Select a valid Tamil category.");
  const scheduledAt = parseDate(formData, "scheduledAt");
  const status = parseStatus(formData, existing.status, scheduledAt);
  if (!canUseStatus(user, status)) articleError("You are not allowed to use that workflow status.");
  if (!canTransition(user, existing.status, status)) articleError(`The ${existing.status.replaceAll("_", " ").toLowerCase()} article cannot move to ${status.replaceAll("_", " ").toLowerCase()} for your role.`);
  if ((status === ArticleStatus.APPROVED || status === ArticleStatus.SCHEDULED || status === ArticleStatus.PUBLISHED || status === ArticleStatus.UPDATED || status === ArticleStatus.CORRECTED) && !EDITORS.includes(user.role)) articleError("Only a News Editor or Administrator may approve or publish.");
  if (status === ArticleStatus.SCHEDULED && (!scheduledAt || scheduledAt <= new Date())) articleEditError(articleId, "Choose a future publication time.");
  const correctionNote = value(formData, "correctionNote") || null;
  const changeNote = value(formData, "changeNote") || null;
  if (status === ArticleStatus.CORRECTED && !correctionNote) articleEditError(articleId, "Enter an internal correction record before publishing a correction.");
  if (status === ArticleStatus.RETURNED && !changeNote) articleEditError(articleId, "Explain the required changes in the revision or return note.");
  const removeFeaturedImage = formData.get("removeFeaturedImage") === "on";
  const removedMediaIds = [...new Set(formData.getAll("removeMediaIds").filter((item): item is string => typeof item === "string" && Boolean(item)))];
  const featuredImage = await saveImage(formData.get("imageFile") as File | null, removeFeaturedImage ? null : existing.featuredImage, removeFeaturedImage ? null : existing.featuredImageKey);
  let gallery: Awaited<ReturnType<typeof saveGallery>> = [];
  try {
    gallery = await saveGallery(formData.getAll("galleryFiles"), user.id);
  } catch (error) {
    if (featuredImage.uploaded) await deleteFromR2(featuredImage.storageKey).catch(() => undefined);
    throw error;
  }
  const tags = parseTags(formData);
  const relations = user.role === Role.REPORTER ? null : relatedIds(formData).filter(id => id !== articleId);
  const mediaToRemove = removedMediaIds.length ? await prisma.articleMedia.findMany({
    where: { articleId, mediaId: { in: removedMediaIds } },
    select: { mediaId: true, media: { select: { storageKey: true, storageProvider: true, _count: { select: { articles: true } } } } },
  }) : [];
  const orphanedMedia = mediaToRemove.filter(item => item.media._count.articles <= 1);
  const currentMediaCount = await prisma.articleMedia.count({ where: { articleId } });
  const revisionNumber = await prisma.articleRevision.count({ where: { articleId } }) + 1;
  const now = new Date();
  try {
    await articleTransaction(async (tx) => {
    await tx.articleRevision.create({ data: { articleId, revisionNumber, title, summary: value(formData, "summary") || null, content, status, editorId: user.id, changeNote } });
    await tx.article.update({ where: { id: articleId }, data: {
      title, content, categoryId, locale: Locale.ta, summary: value(formData, "summary") || null,
      featuredImage: featuredImage.url, featuredImageKey: featuredImage.storageKey, imageCaption: featuredImage.url ? value(formData, "imageCaption") || null : null,
      seoTitle: user.role === Role.REPORTER ? existing.seoTitle : value(formData, "seoTitle") || title,
      seoDescription: user.role === Role.REPORTER ? existing.seoDescription : value(formData, "seoDescription") || value(formData, "summary") || title,
      editorialNote: value(formData, "editorialNote") || null, correctionNote, status,
      location: value(formData, "location") || null, people: value(formData, "people") || null,
      videoUrl: value(formData, "videoUrl") || null, audioUrl: value(formData, "audioUrl") || null,
      isBreaking: EDITORS.includes(user.role) ? formData.get("isBreaking") === "on" : existing.isBreaking,
      isDeveloping: EDITORS.includes(user.role) ? formData.get("isDeveloping") === "on" : existing.isDeveloping,
      isExclusive: EDITORS.includes(user.role) ? formData.get("isExclusive") === "on" : existing.isExclusive,
      breakingExpiresAt: EDITORS.includes(user.role) ? parseDate(formData, "breakingExpiresAt") : existing.breakingExpiresAt,
      scheduledAt: status === ArticleStatus.SCHEDULED ? scheduledAt : null, lastEditedById: user.id,
      approvedById: status === ArticleStatus.APPROVED || status === ArticleStatus.SCHEDULED || status === ArticleStatus.PUBLISHED ? user.id : existing.approvedById,
      approvedAt: (status === ArticleStatus.APPROVED || status === ArticleStatus.SCHEDULED || status === ArticleStatus.PUBLISHED) && !existing.approvedAt ? now : existing.approvedAt,
      publishedById: status === ArticleStatus.PUBLISHED ? user.id : existing.publishedById,
      publishedAt: status === ArticleStatus.PUBLISHED && !existing.publishedAt ? now : existing.publishedAt,
      tags: { deleteMany: {}, create: tags.map(name => ({ tag: { connectOrCreate: { where: { slug_locale: { slug: tagSlug(name), locale: Locale.ta } }, create: { name, slug: tagSlug(name), locale: Locale.ta } } } })) },
      media: { create: gallery.map((media, index) => ({ order: currentMediaCount + index, media: { create: { ...media, type: "IMAGE" } } })) },
    }});
    if (mediaToRemove.length) {
      await tx.articleMedia.deleteMany({ where: { articleId, mediaId: { in: mediaToRemove.map(item => item.mediaId) } } });
      if (orphanedMedia.length) await tx.mediaAsset.deleteMany({ where: { id: { in: orphanedMedia.map(item => item.mediaId) } } });
    }
    if (relations) {
      await tx.articleRelation.deleteMany({ where: { articleId } });
      const validRelations = await tx.article.findMany({ where: { id: { in: relations }, locale: Locale.ta, status: { in: [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED] } }, select: { id: true } });
      if (validRelations.length) await tx.articleRelation.createMany({ data: validRelations.map((related, order) => ({ articleId, relatedArticleId: related.id, order })) });
    }
    const action = status === ArticleStatus.CORRECTED ? AuditAction.CORRECTED : status === ArticleStatus.UPDATED ? AuditAction.UPDATED : status !== existing.status ? AuditAction.STATUS_CHANGED : AuditAction.EDITED;
    await tx.auditEvent.create({ data: { action, actorId: user.id, articleId, details: status !== existing.status ? `${existing.status} → ${status}${changeNote ? `: ${changeNote}` : ""}` : changeNote || "Content updated" } });
    });
  } catch (error) {
    await deleteManyFromR2([featuredImage.uploaded ? featuredImage.storageKey : null, ...gallery.map((item) => item.storageKey)]);
    throw error;
  }
  if ((featuredImage.uploaded || removeFeaturedImage) && existing.featuredImageKey) await deleteFromR2(existing.featuredImageKey).catch(() => undefined);
  await deleteManyFromR2(orphanedMedia.filter(item => item.media.storageProvider === "R2").map(item => item.media.storageKey));
  revalidatePath("/"); revalidatePath("/admin/articles"); revalidatePath("/admin/media"); revalidatePath(`/news/${existing.slug}`);
  if (status === ArticleStatus.PUBLISHED && existing.status !== ArticleStatus.PUBLISHED && (formData.get("sendNotification") === "on" || existing.isBreaking)) await sendPushNotification({ title, body: value(formData, "summary") || "New story published", url: `/news/${existing.slug}`, tag: `article-${articleId}` });
  redirect(`/admin/articles?success=${encodeURIComponent("Article saved and revision recorded.")}`);
}

export async function updateArticleStatus(articleId: string, newStatus: ArticleStatus, scheduledAt?: string) {
  const user = await requireUser(DESK);
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return { success: false, error: "Article not found." };
  if (!canUseStatus(user, newStatus)) return { success: false, error: "Status change not permitted." };
  if (!canTransition(user, article.status, newStatus)) return { success: false, error: `The article cannot move from ${article.status} to ${newStatus}.` };
  if ((newStatus === ArticleStatus.APPROVED || newStatus === ArticleStatus.SCHEDULED || newStatus === ArticleStatus.PUBLISHED) && !EDITORS.includes(user.role)) return { success: false, error: "Final approval requires a News Editor." };
  const schedule = scheduledAt ? parseColomboDateTime(scheduledAt) : null;
  if (newStatus === ArticleStatus.SCHEDULED && (!schedule || schedule <= new Date())) return { success: false, error: "Choose a future time." };
  const now = new Date();
  const action = newStatus === ArticleStatus.APPROVED ? AuditAction.APPROVED : newStatus === ArticleStatus.SCHEDULED ? AuditAction.SCHEDULED : newStatus === ArticleStatus.PUBLISHED ? AuditAction.PUBLISHED : newStatus === ArticleStatus.ARCHIVED ? AuditAction.ARCHIVED : AuditAction.STATUS_CHANGED;
  await prisma.$transaction([
    prisma.article.update({ where: { id: articleId }, data: { status: newStatus, scheduledAt: schedule, ...(newStatus === ArticleStatus.APPROVED || newStatus === ArticleStatus.SCHEDULED || newStatus === ArticleStatus.PUBLISHED ? { approvedById: user.id, approvedAt: article.approvedAt || now } : {}), ...(newStatus === ArticleStatus.PUBLISHED ? { publishedById: user.id, publishedAt: article.publishedAt || now } : {}) } }),
    prisma.auditEvent.create({ data: { action, actorId: user.id, articleId, details: `${article.status} → ${newStatus}` } }),
  ]);
  revalidatePath("/"); revalidatePath("/admin/articles");
  if (newStatus === ArticleStatus.PUBLISHED && article.isBreaking) await sendPushNotification({ title: article.title, body: article.summary || "Breaking story published", url: `/news/${article.slug}`, tag: `article-${article.id}` });
  return { success: true, data: true };
}

export async function toggleBreakingStatus(articleId: string, currentStatus: boolean) {
  const user = await requireUser(EDITORS);
  const article = await prisma.article.findUnique({ where: { id: articleId }, select: { title: true, summary: true, slug: true, status: true } });
  if (!article) return { success: false, error: "Article not found." };
  await prisma.$transaction([
    prisma.article.update({ where: { id: articleId }, data: { isBreaking: !currentStatus } }),
    prisma.auditEvent.create({ data: { action: AuditAction.BREAKING_CHANGED, actorId: user.id, articleId, details: !currentStatus ? "Breaking enabled" : "Breaking removed" } }),
  ]);
  revalidatePath("/"); revalidatePath("/admin/articles");
  if (!currentStatus && (article.status === ArticleStatus.PUBLISHED || article.status === ArticleStatus.UPDATED || article.status === ArticleStatus.CORRECTED)) await sendPushNotification({ title: article.title, body: article.summary || "Breaking news", url: `/news/${article.slug}`, tag: `breaking-${articleId}` });
  return { success: true, data: true };
}

export async function deleteArticle(articleId: string) {
  const user = await requireUser();
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article || (user.role !== Role.ADMIN && !(user.role === Role.REPORTER && article.authorId === user.id && article.status === ArticleStatus.DRAFT))) return { success: false, error: "Only administrators may delete newsroom content; reporters may delete their own drafts." };
  await prisma.article.delete({ where: { id: articleId } });
  if (article.featuredImageKey) await deleteFromR2(article.featuredImageKey).catch(() => undefined);
  revalidatePath("/admin/articles");
  return { success: true, data: true };
}
