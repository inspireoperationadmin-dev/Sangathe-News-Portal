"use server";

import { ArticleStatus, AuditAction, Locale, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LIVE_STATUSES = [ArticleStatus.PUBLISHED, ArticleStatus.UPDATED, ArticleStatus.CORRECTED];
const MANAGERS = [Role.ADMIN, Role.EDITOR];

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function finish(kind: "success" | "error", message: string): never {
  redirect(`/admin/homepage?${kind}=${encodeURIComponent(message)}`);
}

export async function saveHomepage(formData: FormData) {
  const actor = await requireUser(MANAGERS);
  const leadId = text(formData, "leadArticleId");
  const featuredIds = Array.from({ length: 6 }, (_, index) => text(formData, `featured-${index + 1}`)).filter(Boolean);
  const selectedIds = [leadId, ...featuredIds].filter(Boolean);
  if (new Set(selectedIds).size !== selectedIds.length) finish("error", "Choose each homepage story only once.");
  const validArticles = await prisma.article.findMany({ where: { id: { in: selectedIds }, locale: Locale.ta, status: { in: LIVE_STATUSES } }, select: { id: true } });
  if (validArticles.length !== selectedIds.length) finish("error", "Homepage stories must be published Tamil articles.");

  const categories = await prisma.category.findMany({ where: { locale: Locale.ta }, select: { id: true } });
  const categorySettings = categories.map(category => ({
    id: category.id,
    visible: formData.get(`category-visible-${category.id}`) === "on",
    order: Number.parseInt(text(formData, `category-order-${category.id}`), 10),
  }));

  await prisma.$transaction(async tx => {
    await tx.article.updateMany({ where: { locale: Locale.ta, OR: [{ isHomepageLead: true }, { homepageOrder: { not: null } }] }, data: { isHomepageLead: false, homepageOrder: null } });
    if (leadId) await tx.article.update({ where: { id: leadId }, data: { isHomepageLead: true } });
    for (const [index, id] of featuredIds.entries()) await tx.article.update({ where: { id }, data: { homepageOrder: index + 1 } });
    for (const setting of categorySettings) await tx.category.update({ where: { id: setting.id }, data: { showOnHomepage: setting.visible, homepageOrder: setting.visible && Number.isFinite(setting.order) ? setting.order : null } });
    await tx.auditEvent.create({ data: { action: AuditAction.HOMEPAGE_CHANGED, actorId: actor.id, details: `Updated homepage: ${leadId ? "lead selected" : "automatic lead"}, ${featuredIds.length} featured stories` } });
  });
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  finish("success", "Homepage layout published.");
}
