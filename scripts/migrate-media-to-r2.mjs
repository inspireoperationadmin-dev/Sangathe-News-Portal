import { readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const names = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"];
const missing = names.filter((name) => !process.env[name]?.trim());
if (missing.length) throw new Error(`Missing R2 configuration: ${missing.join(", ")}`);

const publicUrl = process.env.R2_PUBLIC_URL.trim().replace(/\/$/, "");
const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
const prisma = new PrismaClient();
const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(), secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim() },
});
const contentTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav" };
const migrated = new Map();

async function migrateUrl(url) {
  if (migrated.has(url)) return migrated.get(url);
  const relative = url.replace(/^\/uploads\//, "");
  const source = path.resolve(uploadsRoot, relative);
  if (!source.startsWith(`${uploadsRoot}${path.sep}`)) throw new Error(`Unsafe local media path: ${url}`);
  const extension = path.extname(source).toLowerCase();
  const key = `legacy/${new Date().getUTCFullYear()}/${crypto.randomUUID()}${extension}`;
  const body = await readFile(source);
  await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME.trim(), Key: key, Body: body, ContentType: contentTypes[extension] || "application/octet-stream", CacheControl: "public, max-age=31536000, immutable", ContentDisposition: "inline" }));
  const result = { key, url: `${publicUrl}/${key}` };
  migrated.set(url, result);
  return result;
}

let mediaCount = 0;
let articleCount = 0;
try {
  const [media, articles] = await Promise.all([
    prisma.mediaAsset.findMany({ where: { storageProvider: "LOCAL", url: { startsWith: "/uploads/" } }, select: { id: true, url: true } }),
    prisma.article.findMany({ where: { featuredImage: { startsWith: "/uploads/" } }, select: { id: true, featuredImage: true } }),
  ]);
  for (const asset of media) {
    try {
      const stored = await migrateUrl(asset.url);
      await prisma.mediaAsset.update({ where: { id: asset.id }, data: { url: stored.url, storageKey: stored.key, storageProvider: "R2" } });
      mediaCount += 1;
    } catch (error) {
      console.error(`Skipped media ${asset.id}:`, error instanceof Error ? error.message : error);
    }
  }
  for (const article of articles) {
    if (!article.featuredImage) continue;
    try {
      const stored = await migrateUrl(article.featuredImage);
      await prisma.article.update({ where: { id: article.id }, data: { featuredImage: stored.url, featuredImageKey: stored.key } });
      articleCount += 1;
    } catch (error) {
      console.error(`Skipped article ${article.id}:`, error instanceof Error ? error.message : error);
    }
  }
  console.log(`R2 migration complete. Media records: ${mediaCount}; article images: ${articleCount}; unique files uploaded: ${migrated.size}.`);
} finally {
  await prisma.$disconnect();
}
