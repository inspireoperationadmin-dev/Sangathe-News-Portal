"use server";

import { AuditAction, MediaType, Role, type MediaAsset } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromR2, uploadToR2 } from "@/lib/r2";

const DESK = [Role.ADMIN, Role.EDITOR, Role.SUB_EDITOR];
const TYPES: Record<string, { extension: string; type: MediaType; max: number }> = {
  "image/jpeg": { extension: ".jpg", type: MediaType.IMAGE, max: 8 * 1024 * 1024 },
  "image/png": { extension: ".png", type: MediaType.IMAGE, max: 8 * 1024 * 1024 },
  "image/webp": { extension: ".webp", type: MediaType.IMAGE, max: 8 * 1024 * 1024 },
  "image/gif": { extension: ".gif", type: MediaType.IMAGE, max: 8 * 1024 * 1024 },
  "video/mp4": { extension: ".mp4", type: MediaType.VIDEO, max: 40 * 1024 * 1024 },
  "audio/mpeg": { extension: ".mp3", type: MediaType.AUDIO, max: 20 * 1024 * 1024 },
  "audio/wav": { extension: ".wav", type: MediaType.AUDIO, max: 20 * 1024 * 1024 },
};
function text(form: FormData, name: string) { const value = form.get(name); return typeof value === "string" ? value.trim() : ""; }
function finish(kind: "success" | "error", message: string): never { redirect(`/admin/media?${kind}=${encodeURIComponent(message)}`); }

export async function uploadMedia(formData: FormData) {
  const actor = await requireUser(DESK);
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) finish("error", "Choose a media file.");
  const config = TYPES[file.type];
  if (!config) finish("error", "Upload JPG, PNG, WebP, GIF, MP4, MP3 or WAV files.");
  if (file.size > config.max) finish("error", config.type === MediaType.VIDEO ? "Video files must be 40 MB or smaller." : "This file is too large.");
  let stored: Awaited<ReturnType<typeof uploadToR2>>;
  try {
    stored = await uploadToR2(file, { folder: "library", extension: config.extension });
  } catch (error) {
    console.error("Cloudflare R2 upload failed", error);
    finish("error", error instanceof Error ? error.message : "The R2 upload failed. Try again.");
  }
  let asset: MediaAsset;
  try {
    asset = await prisma.$transaction(async (tx) => {
      const created = await tx.mediaAsset.create({ data: { url: stored.url, storageKey: stored.key, storageProvider: "R2", type: config.type, title: text(formData, "title") || file.name, caption: text(formData, "caption") || null, altText: text(formData, "altText") || null, mimeType: file.type, fileSize: file.size, uploadedById: actor.id } });
      await tx.auditEvent.create({ data: { action: AuditAction.MEDIA_CHANGED, actorId: actor.id, details: `Uploaded ${created.type.toLowerCase()} to Cloudflare R2: ${created.title || created.url}` } });
      return created;
    });
  } catch (error) {
    await deleteFromR2(stored.key).catch(() => undefined);
    throw error;
  }
  revalidatePath("/admin/media");
  finish("success", "Media uploaded.");
}

export async function deleteMedia(formData: FormData) {
  const actor = await requireUser([Role.ADMIN, Role.EDITOR]);
  const id = text(formData, "id");
  const asset = await prisma.mediaAsset.findUnique({ where: { id }, include: { _count: { select: { articles: true } } } });
  if (!asset) finish("error", "Media item not found.");
  if (asset._count.articles) finish("error", "Remove this media item from its articles before deleting it.");
  if (asset.storageProvider === "R2" && asset.storageKey) {
    try {
      await deleteFromR2(asset.storageKey);
    } catch (error) {
      console.error("Cloudflare R2 deletion failed", error);
      finish("error", "The file could not be removed from Cloudflare R2. Nothing was deleted.");
    }
  }
  await prisma.$transaction([prisma.mediaAsset.delete({ where: { id } }), prisma.auditEvent.create({ data: { action: AuditAction.MEDIA_CHANGED, actorId: actor.id, details: `Deleted media ${asset.title || asset.url}` } })]);
  revalidatePath("/admin/media");
  finish("success", "Media record deleted.");
}
