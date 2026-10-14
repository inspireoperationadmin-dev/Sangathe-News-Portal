"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ImagePlus,
  Images,
  UploadCloud,
  X,
} from "lucide-react";

type Preview = {
  file: File;
  url: string;
};

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 8 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function ImageFilePicker({
  name,
  multiple = false,
  maxFiles = 1,
  helpText,
}: {
  name: string;
  multiple?: boolean;
  maxFiles?: number;
  helpText: string;
}) {
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;

  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<File[]>([]);
  const urlsRef = useRef<string[]>([]);
  const dragDepthRef = useRef(0);

  const [previews, setPreviews] = useState<Preview[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const limit = multiple ? Math.max(1, maxFiles) : 1;

  const updatePreviews = (files: File[]) => {
    const next = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = next.map((item) => item.url);
    setPreviews(next);
  };

  const setInputFiles = (files: File[]) => {
    const input = inputRef.current;
    if (!input) return;

    const transfer = new DataTransfer();

    files.forEach((file) => transfer.items.add(file));

    input.files = transfer.files;
    filesRef.current = files;
    updatePreviews(files);
  };

  useEffect(() => {
    const form = inputRef.current?.form;

    const handleReset = () => {
      filesRef.current = [];
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current = [];
      dragDepthRef.current = 0;
      setPreviews([]);
      setError("");
      setDragging(false);
    };

    form?.addEventListener("reset", handleReset);

    return () => {
      form?.removeEventListener("reset", handleReset);
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const acceptFiles = (incoming: File[]) => {
    if (!incoming.length) return;

    const messages: string[] = [];
    const valid: File[] = [];

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        messages.push(`${file.name}: choose JPG, PNG, WebP or GIF.`);
        continue;
      }

      if (file.size > MAX_BYTES) {
        messages.push(`${file.name}: exceeds the 8 MB limit.`);
        continue;
      }

      if (file.size === 0) {
        messages.push(`${file.name}: this file is empty.`);
        continue;
      }

      valid.push(file);
    }

    const candidates = multiple
      ? [...filesRef.current, ...valid]
      : valid.length
        ? valid
        : filesRef.current;

    const seen = new Set<string>();

    const unique = candidates.filter((file) => {
      const key = fileKey(file);

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });

    if (unique.length > limit) {
      messages.push(
        `You can select up to ${limit} ${limit === 1 ? "image" : "images"}. Extra selections were skipped.`,
      );
    }

    setInputFiles(unique.slice(0, limit));
    setError(messages.join(" "));
  };

  const removeFile = (index: number) => {
    setInputFiles(
      filesRef.current.filter((_, fileIndex) => fileIndex !== index),
    );
    setError("");
  };

  const clearFiles = () => {
    setInputFiles([]);
    setError("");
  };

  return (
    <div className="sng-picker min-w-0">
      <style>{`
        .sng-picker .sng-upload-zone {
          position: relative;
          display: flex;
          min-height: 190px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 16px;
          border: 1.5px dashed #bfcee3;
          border-radius: 20px;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,.96),
            rgba(239,246,255,.8)
          );
          text-align: center;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 white,
            0 6px 20px -18px rgba(37,99,235,.35);
          transition:
            border-color .2s ease,
            background .2s ease,
            box-shadow .2s ease,
            transform .2s ease;
        }

        .sng-picker .sng-upload-zone.is-dragging {
          border-color: #2563eb;
          background: #eff6ff;
          box-shadow: 0 0 0 4px rgba(59,130,246,.12);
        }

        .sng-picker .sng-upload-zone:focus-within {
          outline: 3px solid #60a5fa;
          outline-offset: 3px;
        }

        .sng-picker .sng-upload-icon {
          display: flex;
          height: 56px;
          width: 56px;
          align-items: center;
          justify-content: center;
          border: 1px solid #dbeafe;
          border-radius: 18px;
          background: linear-gradient(145deg, white, #e8efff);
          color: #2563eb;
          box-shadow:
            4px 4px 10px rgba(148,163,184,.15),
            -3px -3px 8px rgba(255,255,255,.9);
          transition: transform .25s ease;
        }

        .sng-picker .sng-upload-card {
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: white;
          box-shadow: 0 4px 14px -12px rgba(15,23,42,.3);
          animation: sng-picker-enter .25s ease both;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .sng-picker .sng-upload-card img {
          transition: transform .35s ease;
        }

        .sng-picker .sng-remove {
          display: flex;
          height: 40px;
          width: 40px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.4);
          border-radius: 12px;
          background: rgba(15,23,42,.7);
          color: white;
          backdrop-filter: blur(8px);
          cursor: pointer;
          transition: background .2s ease, transform .2s ease;
        }

        .sng-picker button:focus-visible {
          outline: 3px solid #60a5fa;
          outline-offset: 3px;
        }

        @media (hover: hover) {
          .sng-picker .sng-upload-zone:hover {
            border-color: #60a5fa;
            box-shadow: 0 10px 28px -20px rgba(37,99,235,.4);
          }

          .sng-picker .sng-upload-zone:hover .sng-upload-icon {
            transform: translateY(-3px);
          }

          .sng-picker .sng-upload-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 24px -16px rgba(15,23,42,.3);
          }

          .sng-picker .sng-upload-card:hover img {
            transform: scale(1.035);
          }

          .sng-picker .sng-remove:hover {
            background: #dc2626;
            transform: scale(1.05);
          }
        }

        @keyframes sng-picker-enter {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .sng-picker * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="mb-3 flex items-center justify-between gap-3">
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          <ImagePlus
            className="h-4 w-4 text-blue-500"
            aria-hidden="true"
          />
          {multiple ? "Choose gallery images" : "Upload image"}
        </label>

        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
          {multiple ? `Up to ${limit} images` : "Single image"}
        </span>
      </div>

      <label
        htmlFor={inputId}
        className={`sng-upload-zone ${dragging ? "is-dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();

          if (!event.dataTransfer.types.includes("Files")) return;

          dragDepthRef.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

          if (dragDepthRef.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepthRef.current = 0;
          setDragging(false);
          acceptFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          name={name}
          multiple={multiple}
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
          aria-invalid={Boolean(error)}
          onChange={(event) =>
            acceptFiles(Array.from(event.currentTarget.files || []))
          }
          className="sr-only"
        />

        <span className="sng-upload-icon" aria-hidden="true">
          {multiple ? (
            <Images className="h-6 w-6" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
        </span>

        <span>
          <span className="block text-sm font-semibold text-slate-800">
            {dragging
              ? "Drop your images here"
              : previews.length
                ? multiple
                  ? "Add more images"
                  : "Choose a different image"
                : "Click to browse or drag images here"}
          </span>

          <span className="mt-2 block text-xs leading-5 text-slate-500">
            JPG, PNG, WebP or GIF · Maximum 8 MB each
          </span>
        </span>

        <span
          aria-hidden="true"
          className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-xs font-semibold text-blue-600 shadow-sm"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Browse files
        </span>
      </label>

      <p
        id={helpId}
        className="mt-3 text-xs leading-5 text-slate-500"
      >
        {helpText}
      </p>

      {error && (
        <div
          id={errorId}
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <p className="min-w-0 break-words">{error}</p>
        </div>
      )}

      <p role="status" className="sr-only">
        {previews.length} images selected.
      </p>

      {previews.length > 0 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              {previews.length}{" "}
              {previews.length === 1 ? "image selected" : "images selected"}
            </p>

            <button
              type="button"
              onClick={clearFiles}
              className="min-h-10 rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              Clear selection
            </button>
          </div>

          <div
            className={`grid gap-3 ${
              multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
            }`}
          >
            {previews.map((preview, index) => (
              <figure
                key={fileKey(preview.file)}
                className="sng-upload-card"
              >
                <div className="relative overflow-hidden bg-slate-100">
                  <img
                    src={preview.url}
                    alt={`Selected image: ${preview.file.name}`}
                    className={
                      multiple
                        ? "aspect-[4/3] w-full object-cover"
                        : "max-h-80 w-full object-contain"
                    }
                  />

                  <span className="absolute left-2 top-2 rounded-lg border border-white/40 bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 backdrop-blur">
                    {multiple ? `Image ${index + 1}` : "Preview"}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${preview.file.name}`}
                    title="Remove selected image"
                    className="sng-remove absolute right-2 top-2"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <figcaption className="flex min-w-0 items-center gap-2 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                    <ImagePlus
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </span>

                  <span className="min-w-0">
                    <span
                      title={preview.file.name}
                      className="block truncate text-xs font-semibold text-slate-700"
                    >
                      {preview.file.name}
                    </span>

                    <span className="mt-1 block text-[10px] text-slate-500">
                      {formatSize(preview.file.size)}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="mt-3 text-[11px] leading-5 text-slate-500">
            Selected images upload when you save the article.
          </p>
        </div>
      )}
    </div>
  );
}