"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function subscribeNewsletter(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const trap = String(formData.get("company") || "");
  if (trap) redirect("/?newsletter=ok");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) redirect("/?newsletter=invalid");
  await prisma.newsletterSubscriber.upsert({ where: { email }, update: { isActive: true, unsubscribedAt: null }, create: { email } });
  revalidatePath("/admin/subscribers");
  redirect("/?newsletter=ok");
}

export async function toggleNewsletterSubscriber(formData: FormData) {
  await requireUser([Role.ADMIN]);
  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  await prisma.newsletterSubscriber.update({ where: { id }, data: { isActive: active, unsubscribedAt: active ? null : new Date() } });
  revalidatePath("/admin/subscribers");
}
