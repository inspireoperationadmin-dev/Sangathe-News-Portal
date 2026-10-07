import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type R2Configuration = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

let client: S3Client | undefined;

function configuration(): R2Configuration {
  const values = {
    accountId: process.env.R2_ACCOUNT_ID?.trim(),
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim(),
    bucket: process.env.R2_BUCKET_NAME?.trim(),
    publicUrl: process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, ""),
  };
  const missing = Object.entries(values).filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) throw new Error(`Cloudflare R2 is not configured. Missing: ${missing.join(", ")}.`);
  try {
    new URL(values.publicUrl!);
  } catch {
    throw new Error("R2_PUBLIC_URL must be a valid HTTPS URL for the public bucket or custom domain.");
  }
  if (!values.publicUrl!.startsWith("https://")) throw new Error("R2_PUBLIC_URL must use HTTPS.");
  return values as R2Configuration;
}

function r2Client(config: R2Configuration) {
  client ||= new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  return client;
}

export function r2Status() {
  const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"] as const;
  return { configured: required.every((key) => Boolean(process.env[key]?.trim())), publicUrl: process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "") || null };
}

export async function uploadToR2(file: File, options: { folder: "articles" | "gallery" | "library"; extension: string }) {
  const config = configuration();
  const now = new Date();
  const key = `${options.folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}${options.extension}`;
  await r2Client(config).send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
    ContentLength: file.size,
    CacheControl: "public, max-age=31536000, immutable",
    ContentDisposition: "inline",
  }));
  return { key, url: `${config.publicUrl}/${key}` };
}

export async function deleteFromR2(key: string | null | undefined) {
  if (!key) return;
  const config = configuration();
  await r2Client(config).send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

export async function deleteManyFromR2(keys: Array<string | null | undefined>) {
  await Promise.allSettled(keys.filter((key): key is string => Boolean(key)).map((key) => deleteFromR2(key)));
}
