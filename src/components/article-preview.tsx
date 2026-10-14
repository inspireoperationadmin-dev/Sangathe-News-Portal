"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Clock3,
  Eye,
  ImageIcon,
  Monitor,
  Smartphone,
  Tag,
  Video,
  Volume2,
  X,
} from "lucide-react";

type PreviewData = {
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string | null;
  imageCaption: string;
  tags: string[];
  videoUrl: string;
  audioUrl: string;
  temporaryImage: boolean;
  words: number;
};

const allowedTags = new Set([
  "P", "H2", "H3", "STRONG", "EM", "U", "S",
  "BLOCKQUOTE", "UL", "OL", "LI", "A", "IMG",
  "HR", "BR", "DIV", "IFRAME",
]);

const blockedTags = new Set([
  "SCRIPT", "STYLE", "OBJECT", "EMBED", "FORM",
  "INPUT", "BUTTON", "TEXTAREA", "SELECT", "SVG", "MATH",
]);

const allowedAttributes: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel"]),
  IMG: new Set(["src", "alt", "title", "width", "height"]),
  P: new Set(["style"]),
  H2: new Set(["style"]),
  H3: new Set(["style"]),
  DIV: new Set(["data-youtube-video"]),
  IFRAME: new Set(["src", "width", "height", "allowfullscreen"]),
};

function safeUrl(
  value: string,
  type: "link" | "media" | "iframe" = "link",
) {
  try {
    const url = new URL(value);

    if (type === "iframe") {
      return (
        url.protocol === "https:" &&
        [
          "www.youtube.com",
          "youtube.com",
          "www.youtube-nocookie.com",
          "youtube-nocookie.com",
        ].includes(url.hostname.toLowerCase()) &&
        url.pathname.startsWith("/embed/")
      );
    }

    return (
      type === "link"
        ? ["http:", "https:", "mailto:", "tel:"]
        : ["http:", "https:"]
    ).includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizePreviewHtml(input: string) {
  const parsed = new DOMParser().parseFromString(input, "text/html");

  for (const element of Array.from(parsed.body.querySelectorAll("*"))) {
    if (blockedTags.has(element.tagName)) {
      element.remove();
      continue;
    }

    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    const permitted =
      allowedAttributes[element.tagName] || new Set<string>();

    for (const attribute of Array.from(element.attributes)) {
      if (!permitted.has(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (element.hasAttribute("style")) {
      const alignment = (element as HTMLElement).style.textAlign;

      if (["left", "center", "right", "justify"].includes(alignment)) {
        element.setAttribute("style", `text-align: ${alignment}`);
      } else {
        element.removeAttribute("style");
      }
    }

    if (element.tagName === "A") {
      const href = element.getAttribute("href") || "";

      if (!safeUrl(href)) {
        element.removeAttribute("href");
      } else {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      }
    }

    if (element.tagName === "IMG") {
      if (!safeUrl(element.getAttribute("src") || "", "media")) {
        element.remove();
      }
    }

    if (element.tagName === "IFRAME") {
      if (!safeUrl(element.getAttribute("src") || "", "iframe")) {
        element.remove();
      } else {
        element.setAttribute("title", "Embedded article video");
        element.setAttribute("loading", "lazy");
      }
    }
  }

  return parsed.body.innerHTML;
}

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function youtubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) return null;

    const hostname = url.hostname.toLowerCase();
    let id = "";

    if (hostname === "youtu.be") {
      id = url.pathname.split("/")[1] || "";
    } else if (
      ["youtube.com", "www.youtube.com", "m.youtube.com",
        "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(hostname)
    ) {
      if (
        url.pathname.startsWith("/shorts/") ||
        url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/live/")
      ) {
        id = url.pathname.split("/")[2] || "";
      } else {
        id = url.searchParams.get("v") || "";
      }
    }

    return /^[A-Za-z0-9_-]{11}$/.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : null;
  } catch {
    return null;
  }
}

const previewStyles = `
  .sng-preview-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    padding: 12px 20px;
    border: 1px solid #bfdbfe;
    border-radius: 12px;
    background: linear-gradient(145deg, white, #eff6ff);
    color: #1d4ed8;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: inset 0 1px 0 white, 0 4px 10px -8px #2563eb;
    transition: transform .2s ease, box-shadow .2s ease;
  }

  .sng-preview-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(15,23,42,.65);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .sng-preview-dialog {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1080px;
    max-height: calc(100dvh - 40px);
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.55);
    border-radius: 24px;
    background: #f1f5f9;
    box-shadow: 0 30px 100px -30px rgba(0,0,0,.5);
    animation: sng-preview-enter .25s ease both;
  }

  .sng-preview-header {
    flex-shrink: 0;
    background: rgba(255,255,255,.94);
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 20px;
  }

  .sng-preview-mode {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 38px;
    padding: 8px 12px;
    border: 1px solid transparent;
    border-radius: 10px;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background .2s ease, box-shadow .2s ease;
  }

  .sng-preview-mode.is-active {
    border-color: #dbeafe;
    background: white;
    color: #2563eb;
    box-shadow: 0 3px 8px rgba(15,23,42,.06);
  }

  .sng-preview-close {
    display: flex;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    color: #64748b;
    cursor: pointer;
    transition: background .2s ease, color .2s ease;
  }

  .sng-preview-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 24px;
  }

  .sng-preview-paper {
    margin: 0 auto;
    width: 100%;
    max-width: 900px;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    background: white;
    box-shadow: 0 12px 30px -24px rgba(15,23,42,.3);
    transition: max-width .3s ease;
    overflow-wrap: anywhere;
  }

  .sng-preview-paper.is-mobile { max-width: 390px; }
  .sng-preview-story { padding: 36px; }

  .sng-preview-headline {
    margin-top: 16px;
    color: #0f172a;
    font-size: clamp(26px, 3vw, 40px);
    font-weight: 750;
    line-height: 1.65;
    letter-spacing: -.02em;
  }

  .sng-preview-paper.is-mobile .sng-preview-story { padding: 22px 18px; }
  .sng-preview-paper.is-mobile .sng-preview-headline { font-size: 26px; }

  .sng-preview-copy {
    color: #334155;
    font-size: 17px;
    line-height: 1.95;
  }

  .sng-preview-copy > * + * { margin-top: 1em; }
  .sng-preview-copy p { margin-bottom: .8em; }

  .sng-preview-copy h2 {
    font-size: 1.5em;
    font-weight: 750;
    color: #0f172a;
    line-height: 1.65;
    margin-top: 1.5em;
  }

  .sng-preview-copy h3 {
    font-size: 1.2em;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.7;
    margin-top: 1.3em;
  }

  .sng-preview-copy strong { font-weight: 700; }
  .sng-preview-copy em { font-style: italic; }
  .sng-preview-copy ul { list-style: disc; padding-left: 1.6em; }
  .sng-preview-copy ol { list-style: decimal; padding-left: 1.6em; }
  .sng-preview-copy li { margin-top: .4em; }
  .sng-preview-copy li p { margin: 0; }

  .sng-preview-copy blockquote {
    border-left: 3px solid #3b82f6;
    border-radius: 0 12px 12px 0;
    background: #eff6ff;
    padding: 16px 20px;
    color: #475569;
  }

  .sng-preview-copy a {
    color: #2563eb;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .sng-preview-copy img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    margin: 1.5em auto;
  }

  .sng-preview-copy iframe {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    border: 0;
    border-radius: 12px;
  }

  .sng-preview-copy hr {
    border: 0;
    border-top: 1px solid #e2e8f0;
    margin: 2em 0;
  }

  .sng-preview-trigger:focus-visible,
  .sng-preview-overlay button:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  @media (hover: hover) {
    .sng-preview-trigger:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px -12px rgba(37,99,235,.4);
    }
    .sng-preview-close:hover { background: #fff1f2; color: #dc2626; }
    .sng-preview-mode:hover:not(.is-active) { background: #e2e8f0; }
  }

  @media (max-width: 640px) {
    .sng-preview-overlay { padding: 8px; }
    .sng-preview-dialog {
      max-height: calc(100dvh - 16px);
      border-radius: 18px;
    }
    .sng-preview-header { padding: 12px; }
    .sng-preview-scroll { padding: 12px; }
    .sng-preview-story { padding: 24px 18px; }
    .sng-preview-headline { font-size: 26px; }
    .sng-preview-copy { font-size: 16px; }
  }

  @keyframes sng-preview-enter {
    from { opacity: 0; transform: translateY(12px) scale(.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-preview-trigger, .sng-preview-overlay * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export function ArticlePreview({
  existingImage,
}: {
  existingImage?: string | null;
}) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = useCallback(() => {
    setPreview(null);
  }, []);

  useEffect(() => {
    if (!preview) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], audio[controls], iframe, [tabindex="0"]',
      );

      if (!elements?.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      const current = document.activeElement;
      const outside = !dialogRef.current?.contains(current);

      if (event.shiftKey && (current === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    const keepFocusInside = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        !dialogRef.current?.contains(event.target)
      ) {
        closeRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("focusin", keepFocusInside);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("focusin", keepFocusInside);
      document.body.style.overflow = previousOverflow;

      if (preview.temporaryImage && preview.imageUrl) {
        URL.revokeObjectURL(preview.imageUrl);
      }

      triggerRef.current?.focus();
    };
  }, [preview, close]);

  const open = () => {
    const form = triggerRef.current?.closest("form");
    if (!form) return;

    const data = new FormData(form);
    const categoryField = form.elements.namedItem("categoryId");

    const category =
      categoryField instanceof HTMLSelectElement && categoryField.value
        ? categoryField.selectedOptions[0]?.text.trim() || ""
        : "";

    const file = data.get("imageFile");
    const hasNewImage = file instanceof File && file.size > 0;
    const content = sanitizePreviewHtml(textValue(data, "content"));

    const plainText =
      new DOMParser().parseFromString(content, "text/html").body.textContent || "";

    setMode("desktop");
    setPreview({
      title: textValue(data, "title"),
      summary: textValue(data, "summary"),
      content,
      category,
      imageUrl: hasNewImage
        ? URL.createObjectURL(file)
        : data.has("removeFeaturedImage")
          ? null
          : existingImage || null,
      imageCaption: textValue(data, "imageCaption"),
      tags: Array.from(
        new Set(
          textValue(data, "tags")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
      ),
      videoUrl: textValue(data, "videoUrl"),
      audioUrl: textValue(data, "audioUrl"),
      temporaryImage: hasNewImage,
      words: plainText.trim()
        ? plainText.trim().split(/\s+/u).length
        : 0,
    });
  };

  const embedUrl = preview ? youtubeEmbedUrl(preview.videoUrl) : null;
  const minutes = preview?.words ? Math.ceil(preview.words / 180) : 0;

  return (
    <>
      <style>{previewStyles}</style>

      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        className="sng-preview-trigger"
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
        Preview article
      </button>

      {preview &&
        createPortal(
          <div
            className="sng-preview-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <section
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              aria-describedby={`${id}-description`}
              className="sng-preview-dialog"
            >
              <header className="sng-preview-header">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 sm:flex">
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <div>
                      <h2
                        id={`${id}-title`}
                        className="text-sm font-bold text-slate-900"
                      >
                        Article preview
                      </h2>
                      <p
                        id={`${id}-description`}
                        className="mt-1 text-xs leading-5 text-slate-500"
                      >
                        Current form values · Not saved or published by preview
                      </p>
                    </div>
                  </div>

                  <button
                    ref={closeRef}
                    type="button"
                    onClick={close}
                    aria-label="Close article preview"
                    className="sng-preview-close shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div
                    role="group"
                    aria-label="Preview width"
                    className="inline-flex gap-1 rounded-xl bg-slate-100 p-1"
                  >
                    <button
                      type="button"
                      aria-pressed={mode === "desktop"}
                      onClick={() => setMode("desktop")}
                      className={`sng-preview-mode ${mode === "desktop" ? "is-active" : ""}`}
                    >
                      <Monitor className="h-4 w-4" aria-hidden="true" />
                      Desktop
                    </button>

                    <button
                      type="button"
                      aria-pressed={mode === "mobile"}
                      onClick={() => setMode("mobile")}
                      className={`sng-preview-mode ${mode === "mobile" ? "is-active" : ""}`}
                    >
                      <Smartphone className="h-4 w-4" aria-hidden="true" />
                      Mobile
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Layout preview · Live page may differ
                  </span>
                </div>
              </header>

              <div ref={scrollRef} className="sng-preview-scroll">
                <div
                  className={`sng-preview-paper ${mode === "mobile" ? "is-mobile" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <span className="text-sm font-bold tracking-tight text-slate-900">
                      Sangathe<span className="text-blue-600">.</span>
                    </span>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                      Preview
                    </span>
                  </div>

                  <article className="sng-preview-story" lang="ta">
                    {preview.category && (
                      <span className="inline-block rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                        {preview.category}
                      </span>
                    )}

                    <h1 className="sng-preview-headline">
                      {preview.title || "தலைப்பு இன்னும் சேர்க்கப்படவில்லை"}
                    </h1>

                    {preview.summary && (
                      <p className="mt-5 text-lg leading-8 text-slate-500">
                        {preview.summary}
                      </p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-slate-100 py-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        Newsroom preview
                      </span>

                      {minutes > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                          ~{minutes} min read
                        </span>
                      )}
                    </div>

                    {preview.imageUrl ? (
                      <figure className="mt-7">
                        <img
                          src={preview.imageUrl}
                          alt={preview.imageCaption || "Featured article image"}
                          className="aspect-video w-full rounded-2xl bg-slate-100 object-cover"
                        />
                        {preview.imageCaption && (
                          <figcaption className="mt-3 border-l-2 border-blue-200 pl-3 text-xs leading-6 text-slate-500">
                            {preview.imageCaption}
                          </figcaption>
                        )}
                      </figure>
                    ) : (
                      <div className="mt-7 flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                        <ImageIcon
                          className="h-7 w-7 text-slate-300"
                          aria-hidden="true"
                        />
                        <p className="text-xs text-slate-500">
                          No featured image selected
                        </p>
                      </div>
                    )}

                    {preview.content ? (
                      <div
                        className="sng-preview-copy mt-8"
                        dangerouslySetInnerHTML={{ __html: preview.content }}
                      />
                    ) : (
                      <p className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                        Article body is empty.
                      </p>
                    )}

                    {preview.videoUrl && safeUrl(preview.videoUrl, "media") && (
                      <section className="mt-8">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Video className="h-4 w-4 text-blue-500" />
                          Video
                        </h3>

                        {embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title="Article video preview"
                            allow="encrypted-media; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            className="aspect-video w-full rounded-xl border-0 bg-black"
                          />
                        ) : (
                          <a
                            href={preview.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-700"
                          >
                            Open attached video
                            <ArrowUpRight className="h-4 w-4 shrink-0" />
                          </a>
                        )}
                      </section>
                    )}

                    {preview.audioUrl && safeUrl(preview.audioUrl, "media") && (
                      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Volume2 className="h-4 w-4 text-blue-500" />
                          Listen to this story
                        </h3>
                        <audio
                          controls
                          preload="none"
                          src={preview.audioUrl}
                          className="w-full"
                        >
                          Your browser does not support audio playback.
                        </audio>
                      </section>
                    )}

                    {preview.tags.length > 0 && (
                      <footer className="mt-9 border-t border-slate-100 pt-5">
                        <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <Tag className="h-3.5 w-3.5" />
                          Story topics
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {preview.tags.map((tag) => (
                            <span
                              key={tag}
                              className="max-w-full break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </footer>
                    )}
                  </article>
                </div>
              </div>

              <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-5 py-3">
                <span className="text-[11px] text-slate-500">
                  Close preview to continue editing.
                </span>
                <button
                  type="button"
                  onClick={close}
                  className="min-h-10 rounded-xl border border-blue-100 bg-blue-50 px-4 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Back to editor
                </button>
              </footer>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}