"use server";

import { ArticleStatus, AuditAction, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseColomboDateTime } from "@/lib/datetime";
import { executeSchedulerRun } from "@/lib/scheduling";
import { updateArticleStatus } from "@/actions/article";

const EDITORS = [Role.ADMIN, Role.EDITOR];

function scheduleUrl(kind: "success" | "error", message: string) {
  return `/admin/schedule?${kind}=${encodeURIComponent(message)}`;
}

export async function rescheduleArticle(articleId: string, formData: FormData) {
  const user = await requireUser(EDITORS);
  const raw = formData.get("scheduledAt");
  const scheduledAt = typeof raw === "string" ? parseColomboDateTime(raw) : null;
  if (!scheduledAt || scheduledAt <= new Date()) redirect(scheduleUrl("error", "Choose a valid future Sri Lanka date and time."));

  const article = await prisma.article.findUnique({ where: { id: articleId }, select: { status: true, approvedAt: true } });
  if (!article || (article.status !== ArticleStatus.APPROVED && article.status !== ArticleStatus.SCHEDULED)) {
    redirect(scheduleUrl("error", "Only approved or scheduled articles can be scheduled."));
  }

  await prisma.$transaction([
    prisma.article.update({
      where: { id: articleId },
      data: { status: ArticleStatus.SCHEDULED, scheduledAt, approvedById: user.id, approvedAt: article.approvedAt || new Date() },
    }),
    prisma.auditEvent.create({
      data: { action: AuditAction.SCHEDULED, actorId: user.id, articleId, details: `Publication scheduled for ${scheduledAt.toISOString()}` },
    }),
  ]);
  revalidatePath("/admin/articles");
  revalidatePath("/admin/schedule");
  redirect(scheduleUrl("success", "Publication time updated."));
}

export async function cancelScheduledArticle(articleId: string) {
  const user = await requireUser(EDITORS);
  const article = await prisma.article.findUnique({ where: { id: articleId }, select: { status: true } });
  if (!article || article.status !== ArticleStatus.SCHEDULED) redirect(scheduleUrl("error", "This article is no longer scheduled."));
  await prisma.$transaction([
    prisma.article.update({ where: { id: articleId }, data: { status: ArticleStatus.APPROVED, scheduledAt: null } }),
    prisma.auditEvent.create({ data: { action: AuditAction.STATUS_CHANGED, actorId: user.id, articleId, details: "Scheduled publication cancelled; article returned to approved" } }),
  ]);
  revalidatePath("/admin/articles");
  revalidatePath("/admin/schedule");
  redirect(scheduleUrl("success", "Schedule cancelled. The article remains approved."));
}

export async function publishScheduledArticleNow(articleId: string) {
  await requireUser(EDITORS);
  const result = await updateArticleStatus(articleId, ArticleStatus.PUBLISHED);
  if (!result.success) redirect(scheduleUrl("error", result.error || "The article could not be published."));
  revalidatePath("/admin/schedule");
  redirect(scheduleUrl("success", "Article published now."));
}

export async function runScheduledPublisherNow() {
  await requireUser(EDITORS);
  let result: Awaited<ReturnType<typeof executeSchedulerRun>>;
  try {
    result = await executeSchedulerRun("MANUAL");
  } catch {
    redirect(scheduleUrl("error", "The publisher failed. Check the run history for details."));
  }
  revalidatePath("/");
  revalidatePath("/admin/articles");
  revalidatePath("/admin/schedule");
  redirect(scheduleUrl("success", `Publisher completed: ${result.published} article(s) published.`));
}
