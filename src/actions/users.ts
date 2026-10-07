"use server";

import bcrypt from "bcryptjs";
import { AuditAction, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, requireUser } from "@/lib/auth";
import { createTotpSecret, verifyTotp } from "@/lib/totp";

const ADMIN_ROLES = [Role.ADMIN];
const validRoles = new Set(Object.values(Role));
function usersRedirect(kind: "success" | "error", message: string): never { redirect(`/admin/users?${kind}=${encodeURIComponent(message)}`); }

export async function createUser(formData: FormData) {
  const actor = await requireUser(ADMIN_ROLES);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "REPORTER") as Role;
  if (name.length < 2 || !email.includes("@") || password.length < 12 || !validRoles.has(role)) usersRedirect("error", "Enter a valid name, email, role and a password of at least 12 characters.");
  try {
    const user = await prisma.user.create({ data: { name, email, role, password: await bcrypt.hash(password, 12) } });
    await prisma.auditEvent.create({ data: { action: AuditAction.USER_CREATED, actorId: actor.id, details: `Created ${user.email} as ${role}` } });
  } catch { usersRedirect("error", "That email address is already in use."); }
  revalidatePath("/admin/users");
  usersRedirect("success", "User created successfully.");
}

export async function updateUser(formData: FormData) {
  const actor = await requireUser(ADMIN_ROLES);
  const id = String(formData.get("id") || "");
  const role = String(formData.get("role") || "") as Role;
  const isActive = formData.get("isActive") === "on";
  if (!validRoles.has(role)) usersRedirect("error", "Invalid role.");
  if (id === actor.id && (!isActive || role !== Role.ADMIN)) usersRedirect("error", "You cannot remove your own administrator access.");
  const user = await prisma.user.update({ where: { id }, data: { role, isActive } });
  await prisma.auditEvent.create({ data: { action: AuditAction.USER_UPDATED, actorId: actor.id, details: `Updated ${user.email}: ${role}, active=${isActive}` } });
  revalidatePath("/admin/users");
  usersRedirect("success", "User access updated.");
}

export async function resetUserPassword(formData: FormData) {
  const actor = await requireUser(ADMIN_ROLES);
  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");
  if (password.length < 12) usersRedirect("error", "Passwords must contain at least 12 characters.");
  const user = await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(password, 12), passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null } });
  await prisma.auditEvent.create({ data: { action: AuditAction.PASSWORD_CHANGED, actorId: actor.id, details: `Reset password for ${user.email}` } });
  usersRedirect("success", "Password reset successfully.");
}

export async function beginTwoFactor() {
  const actor = await requireUser();
  const secret = createTotpSecret();
  await prisma.user.update({ where: { id: actor.id }, data: { twoFactorSecret: encryptSecret(secret), twoFactorEnabled: false } });
  redirect(`/admin/security?secret=${secret}`);
}

export async function enableTwoFactor(formData: FormData) {
  const actor = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.id } });
  const token = String(formData.get("token") || "");
  if (!user.twoFactorSecret || !verifyTotp(decryptSecret(user.twoFactorSecret), token)) redirect("/admin/security?error=Invalid+authenticator+code");
  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { twoFactorEnabled: true } }),
    prisma.auditEvent.create({ data: { action: AuditAction.TWO_FACTOR_ENABLED, actorId: actor.id } }),
  ]);
  redirect("/admin/security?success=Two-factor+authentication+enabled");
}

export async function disableTwoFactor(formData: FormData) {
  const actor = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.id } });
  const token = String(formData.get("token") || "");
  if (!user.twoFactorSecret || !verifyTotp(decryptSecret(user.twoFactorSecret), token)) redirect("/admin/security?error=Invalid+authenticator+code");
  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } }),
    prisma.auditEvent.create({ data: { action: AuditAction.TWO_FACTOR_DISABLED, actorId: actor.id } }),
  ]);
  redirect("/admin/security?success=Two-factor+authentication+disabled");
}

export async function changeOwnPassword(formData: FormData) {
  const actor = await requireUser();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  if (newPassword.length < 12) redirect("/admin/security?error=New+password+must+contain+at+least+12+characters");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.id } });
  const valid = user.password.startsWith("$2") ? await bcrypt.compare(currentPassword, user.password) : currentPassword === user.password;
  if (!valid) redirect("/admin/security?error=Current+password+is+incorrect");
  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { password: await bcrypt.hash(newPassword, 12), passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null } }),
    prisma.auditEvent.create({ data: { action: AuditAction.PASSWORD_CHANGED, actorId: actor.id, details: "User changed own password" } }),
  ]);
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
  redirect("/login?success=Password+changed.+Please+sign+in+again");
}
