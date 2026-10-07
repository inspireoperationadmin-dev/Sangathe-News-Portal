"use server";

import { AuditAction, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

export async function sendNewsAlert(formData: FormData) {
  const actor = await requireUser([Role.ADMIN, Role.EDITOR]);
  const title = String(formData.get("title") || "").trim(); const body = String(formData.get("body") || "").trim(); const url = String(formData.get("url") || "/").trim();
  if (title.length < 3 || body.length < 3 || !url.startsWith("/")) redirect("/admin/notifications?error=Enter+a+title,+message+and+an+internal+link");
  const result = await sendPushNotification({ title, body, url, tag: `news-${Date.now()}` });
  await prisma.auditEvent.create({ data: { action: AuditAction.NOTIFICATION_SENT, actorId: actor.id, details: result.configured ? `Sent ${result.sent}; failed ${result.failed}: ${title}` : `Push is not configured: ${title}` } });
  redirect(`/admin/notifications?${result.configured?"success":"error"}=${encodeURIComponent(result.configured?`Notification sent to ${result.sent} subscribers.`:"Add VAPID keys to the environment before sending notifications.")}`);
}
