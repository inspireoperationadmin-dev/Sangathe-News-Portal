import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type PushMessage = { title: string; body: string; url: string; tag?: string };

export async function sendPushNotification(message: PushMessage) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:news@sangathe.com";
  if (!publicKey || !privateKey) return { sent: 0, failed: 0, configured: false };
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const subscriptions = await prisma.pushSubscription.findMany({ where: { isActive: true } });
  let sent = 0; let failed = 0;
  await Promise.all(subscriptions.map(async subscription => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(message));
      sent += 1;
    } catch (error) {
      failed += 1;
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) await prisma.pushSubscription.update({ where: { id: subscription.id }, data: { isActive: false } });
    }
  }));
  return { sent, failed, configured: true };
}
