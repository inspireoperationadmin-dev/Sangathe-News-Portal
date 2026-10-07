import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;
  if (!body?.endpoint?.startsWith("https://") || !body.keys?.p256dh || !body.keys.auth) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  await prisma.pushSubscription.upsert({ where: { endpoint: body.endpoint }, update: { p256dh: body.keys.p256dh, auth: body.keys.auth, isActive: true, userAgent: request.headers.get("user-agent") }, create: { endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth, userAgent: request.headers.get("user-agent") } });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null) as { endpoint?: string } | null;
  if (body?.endpoint) await prisma.pushSubscription.updateMany({ where: { endpoint: body.endpoint }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
