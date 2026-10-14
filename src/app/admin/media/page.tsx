import Image from "next/image";
import { MediaType, Role } from "@prisma/client";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Cloud,
  FileText,
  Film,
  ImageIcon,
  Info,
  Library,
  Music,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";

import { deleteMedia, uploadMedia } from "@/actions/media";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2Status } from "@/lib/r2";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { CopyUrlButton } from "@/components/copy-url-button";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

function formatSize(bytes: number | null) {
  if (bytes === null) return "Size unavailable";
  if (bytes === 0) return "0 KB";

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-LK", {
    timeZone: "Asia/Colombo",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const styles = `
  .sng-media {
    position: relative;
    isolation: isolate;
  }

  .sng-media .sng-media-panel {
    min-width: 0;
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 30px -25px rgba(15,23,42,.3);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-media .sng-media-icon {
    display: flex;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 1px solid #dbeafe;
    border-radius: 14px;
    background: linear-gradient(145deg, white, #e8efff);
    color: #2563eb;
    box-shadow:
      3px 3px 8px rgba(148,163,184,.12),
      -2px -2px 6px white;
  }

  .sng-media .sng-media-input {
    display: block;
    width: 100%;
    min-width: 0;
    min-height: 48px;
    margin-top: 8px;
    padding: 12px 14px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: #f8fafc;
    color: #0f172a;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.6;
    outline: none;
    box-shadow:
      inset 2px 2px 5px rgba(148,163,184,.07),
      inset -2px -2px 5px white;
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-media .sng-media-input::placeholder {
    color: #94a3b8;
  }

  .sng-media .sng-media-input:focus {
    background: white;
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }

  .sng-media .sng-media-file {
    display: block;
    width: 100%;
    min-width: 0;
    padding: 12px;
    border: 1px solid #dbeafe;
    border-radius: 12px;
    background: white;
    color: #64748b;
    font-size: 12px;
    cursor: pointer;
  }

  .sng-media .sng-media-file::file-selector-button {
    margin-right: 12px;
    padding: 9px 12px;
    border: 1px solid #bfdbfe;
    border-radius: 9px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .sng-media .sng-media-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 42px;
    min-height: 44px;
    padding: 10px 14px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: linear-gradient(145deg, white, #f8fafc);
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: inset 0 1px 0 white;
    transition: transform .2s ease, box-shadow .2s ease;
  }

  .sng-media .sng-media-button.is-primary {
    border-color: #2563eb;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 6px 16px -10px rgba(37,99,235,.6);
  }

  .sng-media .sng-media-button.is-danger {
    border-color: #fecdd3;
    background: #fff1f2;
    color: #be123c;
  }

  .sng-media .sng-media-button:disabled {
    opacity: .4;
    cursor: not-allowed;
  }

  .sng-media .sng-media-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    background: white;
    box-shadow: 0 7px 20px -20px rgba(15,23,42,.3);
    animation: sng-media-enter .3s ease both;
    transition:
      transform .22s ease,
      border-color .22s ease,
      box-shadow .22s ease;
  }

  .sng-media .sng-media-cover {
    transition: transform .4s ease;
  }

  .sng-media .sng-media-card-footer button {
    border-radius: 10px;
  }

  .sng-media a:focus-visible,
  .sng-media button:focus-visible,
  .sng-media .sng-media-file:focus-visible,
  .sng-media summary:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-media .sng-media-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-media .sng-media-panel:hover {
      border-color: #bfdbfe;
    }

    .sng-media .sng-media-card:hover {
      transform: translateY(-3px);
      border-color: #bfdbfe;
      box-shadow: 0 14px 32px -24px rgba(37,99,235,.35);
    }

    .sng-media .sng-media-card:hover .sng-media-cover {
      transform: scale(1.035);
    }

    .sng-media .sng-media-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -12px rgba(15,23,42,.4);
    }
  }

  @keyframes sng-media-enter {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-media * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  const user = await requireUser([
    Role.ADMIN,
    Role.EDITOR,
    Role.SUB_EDITOR,
  ]);

  const params = await searchParams;
  const storage = r2Status();

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      uploadedBy: { select: { name: true } },
      _count: { select: { articles: true } },
    },
  });

  const canDelete =
    user.role === Role.ADMIN || user.role === Role.EDITOR;

  const stats = [
    {
      label: "Files shown",
      value: assets.length,
      icon: Library,
      tone: "text-blue-600",
    },
    {
      label: "Images shown",
      value: assets.filter((asset) => asset.type === MediaType.IMAGE).length,
      icon: ImageIcon,
      tone: "text-violet-600",
    },
    {
      label: "Videos shown",
      value: assets.filter((asset) => asset.type === MediaType.VIDEO).length,
      icon: Film,
      tone: "text-amber-600",
    },
    {
      label: "Audio files shown",
      value: assets.filter((asset) => asset.type === MediaType.AUDIO).length,
      icon: Music,
      tone: "text-emerald-600",
    },
  ];

  const label = "block min-w-0 text-sm font-semibold text-slate-700";

  return (
    <main className="sng-media mx-auto max-w-7xl space-y-6 px-4 py-7 md:px-6">
      <style>{styles}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Newsroom assets
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Media library
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Upload reusable images, videos and audio for your stories.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
          <Cloud className="h-4 w-4" aria-hidden="true" />
          Cloudflare R2
        </span>
      </header>

      <AdminToast
        key={params.error || params.success || "none"}
        success={params.success}
        error={params.error}
      />

      <section
        aria-label="Media overview"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="sng-media-panel flex items-center gap-4 p-5"
          >
            <span className="sng-media-icon">
              <stat.icon
                className={`h-5 w-5 ${stat.tone}`}
                aria-hidden="true"
              />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stat.value.toLocaleString("en-LK")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {stat.label}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section
        aria-label="Storage configuration"
        className={`flex items-start gap-3 rounded-2xl border p-4 ${
          storage.configured
            ? "border-emerald-200 bg-emerald-50/70"
            : "border-amber-200 bg-amber-50/80"
        }`}
      >
        {storage.configured ? (
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
        ) : (
          <CircleAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden="true"
          />
        )}

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">
            {storage.configured
              ? "R2 configuration present"
              : "Storage configuration required"}
          </h2>
          <p className="mt-1 break-words text-xs leading-6 text-slate-600">
            {storage.configured
              ? `New uploads use ${storage.publicUrl}. Configuration status does not verify storage connectivity.`
              : "Add the five R2 environment variables before uploading media."}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="upload-media-heading"
        className="sng-media-panel"
      >
        <header className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6">
          <span className="sng-media-icon">
            <Upload className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="upload-media-heading"
              className="text-base font-bold text-slate-900"
            >
              Upload media
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Choose a file and add its editorial details.
            </p>
          </div>
        </header>

        <form action={uploadMedia} className="p-5 sm:p-6">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="rounded-2xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50/70 to-white p-5">
              <span className="sng-media-icon mb-4">
                <Upload className="h-5 w-5" aria-hidden="true" />
              </span>

              <label className={label}>
                Select file *
                <input
                  type="file"
                  name="file"
                  required
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,audio/mpeg,audio/wav"
                  className="sng-media-file mt-3"
                />
              </label>

              <p className="mt-3 text-xs leading-6 text-slate-500">
                Images: JPG, PNG, WebP, GIF
                <br />
                Video: MP4 · Audio: MP3, WAV
              </p>
            </div>

            <div className="space-y-5">
              <label className={label}>
                Title
                <input
                  name="title"
                  placeholder="Give this file a clear name…"
                  className="sng-media-input"
                />
              </label>

              <label className={label}>
                Caption
                <input
                  name="caption"
                  placeholder="Description or photo credit…"
                  className="sng-media-input"
                />
              </label>

              <label className={label}>
                Alternative text
                <input
                  name="altText"
                  placeholder="Describe what the image shows…"
                  className="sng-media-input"
                />
                <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
                  Helps readers using screen readers understand images.
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
              <Info
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              Uploads are saved when you submit this form.
            </p>

            <button
              type="submit"
              disabled={!storage.configured}
              className="sng-media-button is-primary"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload to library
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="media-library-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2
              id="media-library-heading"
              className="text-base font-bold text-slate-900"
            >
              Library files
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Latest 200 uploads · Newest first
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {assets.length} files shown
          </span>
        </div>

        {assets.length === 0 ? (
          <div className="sng-media-panel flex flex-col items-center px-5 py-12 text-center">
            <span className="sng-media-icon">
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-slate-800">
              Your media library is empty
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Upload your first image, video or audio file using the form above.
            </p>
          </div>
        ) : (
          <div className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
              const isImage = asset.type === MediaType.IMAGE;
              const isVideo = asset.type === MediaType.VIDEO;
              const displayTitle = asset.title || "Untitled media";
              const inUse = asset._count.articles > 0;

              return (
                <article key={asset.id} className="sng-media-card">
                  <div className="relative overflow-hidden bg-slate-100">
                    {isImage ? (
                      <Image
                        src={asset.url}
                        alt={asset.altText || asset.title || ""}
                        width={640}
                        height={360}
                        className="sng-media-cover aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 to-slate-800">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white">
                          {isVideo ? (
                            <Film className="h-7 w-7" aria-hidden="true" />
                          ) : (
                            <Music className="h-7 w-7" aria-hidden="true" />
                          )}
                        </span>
                        <p className="text-xs font-medium text-slate-300">
                          {isVideo ? "Video asset" : "Audio asset"}
                        </p>
                      </div>
                    )}

                    <span className="absolute left-3 top-3 rounded-lg border border-white/40 bg-white/95 px-2.5 py-1 text-[10px] font-semibold capitalize text-slate-700 shadow-sm backdrop-blur">
                      {asset.type.toLowerCase()}
                    </span>

                    <span className="absolute bottom-3 right-3 rounded-lg bg-slate-950/70 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
                      {formatSize(asset.fileSize)}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="break-words text-sm font-bold leading-7 text-slate-900">
                      {displayTitle}
                    </h3>

                    {asset.caption && (
                      <p className="mt-2 break-words text-xs leading-6 text-slate-500">
                        {asset.caption}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[11px] leading-5 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <UserRound
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {asset.uploadedBy.name}
                      </span>
                      <span>{formatDate(asset.createdAt)}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${
                          inUse
                            ? "border-blue-100 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        <FileText className="h-3 w-3" aria-hidden="true" />
                        {inUse
                          ? `Used in ${asset._count.articles} ${
                              asset._count.articles === 1 ? "article" : "articles"
                            }`
                          : "Not linked to articles"}
                      </span>

                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                        {asset.storageProvider}
                      </span>
                    </div>

                    <details className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                        File URL & details
                      </summary>

                      <code className="mt-3 block break-all text-[10px] leading-6 text-slate-500">
                        {asset.url}
                      </code>

                      {asset.altText && (
                        <p className="mt-3 break-words text-xs leading-6 text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Alt text:
                          </span>{" "}
                          {asset.altText}
                        </p>
                      )}
                    </details>
                  </div>

                  <footer className="sng-media-card-footer flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${displayTitle}`}
                        className="sng-media-button"
                      >
                        Open
                        <ArrowUpRight
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </a>

                      <CopyUrlButton value={asset.url} />
                    </div>

                    {canDelete && (
                      <form action={deleteMedia}>
                        <input
                          type="hidden"
                          name="id"
                          value={asset.id}
                        />

                        <ConfirmSubmitButton
                          disabled={inUse}
                          ariaLabel={`Delete ${displayTitle}`}
                          title={
                            inUse
                              ? "Cannot delete media linked to articles"
                              : "Delete media"
                          }
                          dialogTitle="Delete this media file?"
                          description={`“${asset.title || asset.url}” will be removed from storage and the media library. This action cannot be undone.`}
                          confirmLabel="Delete media"
                          className="sng-media-button is-danger"
                        >
                          <Trash2
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </ConfirmSubmitButton>
                      </form>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}