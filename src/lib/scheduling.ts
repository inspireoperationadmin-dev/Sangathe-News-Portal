import "server-only";
import { ArticleStatus, AuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

const SCHEDULER_LOCK_ID = 7_241_368_450;

export async function publishDueArticles() {
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    // This database lock prevents duplicate publication when cron requests overlap.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${SCHEDULER_LOCK_ID})::text AS lock`;

    const [due, expiredBreaking] = await Promise.all([
      tx.article.findMany({
        where: { status: ArticleStatus.SCHEDULED, scheduledAt: { lte: now } },
        select: { id: true, approvedById: true, title: true, summary: true, slug: true, isBreaking: true },
        orderBy: { scheduledAt: "asc" },
      }),
      tx.article.findMany({
        where: { isBreaking: true, breakingExpiresAt: { lte: now } },
        select: { id: true },
      }),
    ]);

    for (const article of due) {
      await tx.article.update({
        where: { id: article.id },
        data: { status: ArticleStatus.PUBLISHED, scheduledAt: null, publishedAt: now, publishedById: article.approvedById },
      });
      await tx.auditEvent.create({
        data: { action: AuditAction.PUBLISHED, articleId: article.id, details: "Published automatically at the scheduled Sri Lanka time" },
      });
    }

    for (const article of expiredBreaking) {
      await tx.article.update({ where: { id: article.id }, data: { isBreaking: false } });
      await tx.auditEvent.create({
        data: { action: AuditAction.BREAKING_CHANGED, articleId: article.id, details: "Breaking status expired automatically" },
      });
    }

    return { due, expiredBreakingCount: expiredBreaking.length };
  }, { maxWait: 10_000, timeout: 30_000 });

  await Promise.all(result.due.filter((article) => article.isBreaking).map((article) =>
    sendPushNotification({
      title: article.title,
      body: article.summary || "Breaking story published",
      url: `/news/${article.slug}`,
      tag: `article-${article.id}`,
    }),
  ));

  return { published: result.due.length, expiredBreaking: result.expiredBreakingCount };
}

export async function executeSchedulerRun(trigger: "CRON" | "MANUAL") {
  const run = await prisma.schedulerRun.create({ data: { trigger, status: "RUNNING" } });
  try {
    const result = await publishDueArticles();
    await prisma.schedulerRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        publishedCount: result.published,
        expiredBreakingCount: result.expiredBreaking,
        completedAt: new Date(),
      },
    });
    return { runId: run.id, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 2_000) : "Unknown scheduler error";
    await prisma.schedulerRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: message, completedAt: new Date() },
    }).catch(() => undefined);
    throw error;
  }
}
