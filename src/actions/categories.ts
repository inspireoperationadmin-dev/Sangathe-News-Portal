"use server";

import { AuditAction, Locale, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function categorySlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function finish(kind: "success" | "error", message: string): never {
  redirect(`/admin/categories?${kind}=${encodeURIComponent(message)}`);
}

export async function createCategory(formData: FormData) {
  const actor = await requireUser([Role.ADMIN]);
  const name = field(formData, "name");
  const slug = categorySlug(field(formData, "slug"));
  const parentId = field(formData, "parentId") || null;
  if (name.length < 2 || !slug) finish("error", "Enter a category name and a URL slug using English letters.");
  if (parentId) {
    const parent = await prisma.category.findFirst({ where: { id: parentId, locale: Locale.ta, parentId: null } });
    if (!parent) finish("error", "Select a valid top-level parent category.");
  }
  try {
    const max = await prisma.category.aggregate({ where: { locale: Locale.ta, parentId }, _max: { order: true } });
    const category = await prisma.category.create({ data: { name, slug, locale: Locale.ta, parentId, description: field(formData, "description") || null, order: (max._max.order ?? 0) + 1 } });
    await prisma.auditEvent.create({ data: { action: AuditAction.CATEGORY_CHANGED, actorId: actor.id, details: `Created category ${category.name}` } });
  } catch {
    finish("error", "That Tamil category slug is already in use.");
  }
  revalidatePath("/");
  revalidatePath("/admin/categories");
  finish("success", "Category created.");
}

export async function updateCategory(formData: FormData) {
  const actor = await requireUser([Role.ADMIN]);
  const id = field(formData, "id");
  const name = field(formData, "name");
  const slug = categorySlug(field(formData, "slug"));
  const parentId = field(formData, "parentId") || null;
  if (!id || name.length < 2 || !slug || parentId === id) finish("error", "Enter valid category details.");
  const category = await prisma.category.findFirst({ where: { id, locale: Locale.ta }, include: { children: { select: { id: true } } } });
  if (!category) finish("error", "Category not found.");
  if (parentId) {
    const parent = await prisma.category.findFirst({ where: { id: parentId, locale: Locale.ta, parentId: null } });
    if (!parent || category.children.some(child => child.id === parentId)) finish("error", "Select a valid top-level parent category.");
  }
  try {
    await prisma.category.update({ where: { id }, data: { name, slug, parentId, description: field(formData, "description") || null } });
    await prisma.auditEvent.create({ data: { action: AuditAction.CATEGORY_CHANGED, actorId: actor.id, details: `Updated category ${name}` } });
  } catch {
    finish("error", "That Tamil category slug is already in use.");
  }
  revalidatePath("/");
  revalidatePath("/admin/categories");
  revalidatePath(`/category/${slug}`);
  finish("success", "Category updated.");
}

export async function moveCategory(formData: FormData) {
  const actor = await requireUser([Role.ADMIN]);
  const id = field(formData, "id");
  const direction = field(formData, "direction");
  const category = await prisma.category.findFirst({ where: { id, locale: Locale.ta } });
  if (!category || !["up", "down"].includes(direction)) finish("error", "Category could not be reordered.");
  const sibling = await prisma.category.findFirst({
    where: { locale: Locale.ta, parentId: category.parentId, order: direction === "up" ? { lt: category.order } : { gt: category.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (sibling) {
    await prisma.$transaction([
      prisma.category.update({ where: { id: category.id }, data: { order: sibling.order } }),
      prisma.category.update({ where: { id: sibling.id }, data: { order: category.order } }),
      prisma.auditEvent.create({ data: { action: AuditAction.CATEGORY_CHANGED, actorId: actor.id, details: `Reordered category ${category.name}` } }),
    ]);
  }
  revalidatePath("/");
  revalidatePath("/admin/categories");
  finish("success", sibling ? "Category order updated." : "Category is already at the end of this group.");
}

export async function deleteCategory(formData: FormData) {
  const actor = await requireUser([Role.ADMIN]);
  const id = field(formData, "id");
  const category = await prisma.category.findFirst({ where: { id, locale: Locale.ta }, include: { _count: { select: { articles: true, children: true } } } });
  if (!category) finish("error", "Category not found.");
  if (category._count.articles || category._count.children) finish("error", "Move its articles and remove its subcategories before deleting this category.");
  await prisma.$transaction([
    prisma.category.delete({ where: { id } }),
    prisma.auditEvent.create({ data: { action: AuditAction.CATEGORY_CHANGED, actorId: actor.id, details: `Deleted category ${category.name}` } }),
  ]);
  revalidatePath("/");
  revalidatePath("/admin/categories");
  finish("success", "Category deleted.");
}
