import "server-only";

import { createHmac, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "sangathe_session";
const MAX_SESSION_AGE = 60 * 60 * 12;

export interface SessionUser { id: string; name: string; email: string; role: Role }

function secret() {
  const value = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) {
    throw new Error("SESSION_SECRET must contain at least 32 characters in production.");
  }
  return value || "sangathe-local-development-secret-change-before-production";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export async function createSession(user: SessionUser, passwordChangedAt: Date) {
  const payload = Buffer.from(JSON.stringify({ ...user, passwordVersion: passwordChangedAt.getTime(), exp: Math.floor(Date.now() / 1000) + MAX_SESSION_AGE })).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_SESSION_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser & { exp: number; passwordVersion: number };
    if (parsed.exp < Date.now() / 1000) return null;
    const user = await prisma.user.findUnique({ where: { id: parsed.id }, select: { id: true, name: true, email: true, role: true, isActive: true, passwordChangedAt: true } });
    return user?.isActive && user.passwordChangedAt.getTime() === parsed.passwordVersion ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
  } catch { return null; }
}

export async function requireUser(roles?: Role[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login?error=Please+sign+in+to+continue");
  if (roles && !roles.includes(user.role)) redirect("/admin/articles?error=You+do+not+have+permission+for+that+action");
  return user;
}

export function encryptSecret(value: string) {
  const key = createHmac("sha256", secret()).update("two-factor").digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(value: string) {
  const [ivText, tagText, dataText] = value.split(".");
  const key = createHmac("sha256", secret()).update("two-factor").digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataText, "base64url")), decipher.final()]).toString("utf8");
}
