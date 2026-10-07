"use server";

import bcrypt from "bcryptjs";
import { AuditAction } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, decryptSecret, destroySession } from "@/lib/auth";
import { verifyTotp } from "@/lib/totp";

const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;

function loginError(message: string): never { redirect(`/login?error=${encodeURIComponent(message)}`); }

export async function loginUser(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const otp = String(formData.get("otp") || "").replace(/\s/g, "");
  if (!email || !password) loginError("Email and password are required.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) loginError("Invalid email or password.");
  if (user.lockedUntil && user.lockedUntil > new Date()) loginError("This account is temporarily locked. Try again in 15 minutes.");

  const isHash = user.password.startsWith("$2");
  const passwordValid = isHash ? await bcrypt.compare(password, user.password) : password === user.password;
  const otpValid = !user.twoFactorEnabled || (!!user.twoFactorSecret && verifyTotp(decryptSecret(user.twoFactorSecret), otp));

  if (!passwordValid || !otpValid) {
    const count = user.failedLoginCount + 1;
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: count >= MAX_FAILURES ? 0 : count, lockedUntil: count >= MAX_FAILURES ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null } }),
      prisma.auditEvent.create({ data: { action: AuditAction.LOGIN_FAILED, actorId: user.id, details: user.twoFactorEnabled && passwordValid ? "Invalid two-factor code" : "Invalid password" } }),
    ]);
    loginError(count >= MAX_FAILURES ? "Too many attempts. The account is locked for 15 minutes." : user.twoFactorEnabled && passwordValid ? "Enter the valid 6-digit authenticator code." : "Invalid email or password.");
  }

  const upgradedPassword = isHash ? undefined : await bcrypt.hash(password, 12);
  const nextPasswordChangedAt = upgradedPassword ? new Date() : user.passwordChangedAt;
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, ...(upgradedPassword ? { password: upgradedPassword, passwordChangedAt: nextPasswordChangedAt } : {}) } }),
    prisma.auditEvent.create({ data: { action: AuditAction.LOGIN_SUCCESS, actorId: user.id } }),
  ]);
  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role }, nextPasswordChangedAt);
  redirect("/admin/articles");
}

export async function logoutUser(): Promise<void> {
  await destroySession();
  redirect("/login");
}
