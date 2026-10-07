"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, ImageIcon, Tag, X } from "lucide-react";

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
};

const allowedTags = new Set(["P", "H2", "H3", "STRONG", "EM", "U", "S", "BLOCKQUOTE", "UL", "OL", "LI", "A", "IMG", "HR", "BR", "DIV", "IFRAME"]);
const allowedAttributes: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel"]),
  IMG: new Set(["src", "alt", "title", "width", "height"]),
  P: new Set(["style"]),
  H2: new Set(["style"]),
  H3: new Set(["style"]),
  DIV: new Set(["data-youtube-video"]),
  IFRAME: new Set(["src", "width", "height", "allowfullscreen", "allow", "frameborder"]),
};

function safeUrl(value: string, iframe = false) {
  try {
    const url = new URL(value);
    if (iframe) return ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com"].includes(url.hostname);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizePreviewHtml(input: string) {
  const documentNode = new DOMParser().parseFromString(input, "text/html");
  for (const element of Array.from(documentNode.body.querySelectorAll("*"))) {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }
    const tagAttributes = allowedAttributes[element.tagName] || new Set<string>();
    for (const attribute of Array.from(element.attributes)) {
      if (!tagAttributes.has(attribute.name)) element.removeAttribute(attribute.name);
    }
    if (element.hasAttribute("style")) {
      const alignment = (element as HTMLElement).style.textAlign;
      if (["left", "center", "right", "justify"].includes(alignment)) element.setAttribute("style", `text-align: ${alignment}`);
      else element.removeAttribute("style");
    }
    if (element instanceof HTMLAnchorElement) {
      if (!safeUrl(element.href)) element.removeAttribute("href");
      else { element.target = "_blank"; element.rel = "noopener noreferrer"; }
    }
    if (element instanceof HTMLImageElement && !safeUrl(element.src)) element.remove();
    if (element instanceof HTMLIFrameElement && !safeUrl(element.src, true)) element.remove();
  }
  return documentNode.body.innerHTML;
}

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function youtubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    let id = "";
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] || "";
    else id = url.searchParams.get("v") || "";
    return id && /^[\w-]{6,}$/u.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export function ArticlePreview({ existingImage }: { existingImage?: string | null }) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setPreview(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!preview) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      if (preview.temporaryImage && preview.imageUrl) URL.revokeObjectURL(preview.imageUrl);
    };
  }, [preview]);

  const open = () => {
    const form = triggerRef.current?.closest("form");
    if (!form) return;
    const formData = new FormData(form);
    const categoryField = form.elements.namedItem("categoryId");
    const category = categoryField instanceof HTMLSelectElement ? categoryField.selectedOptions[0]?.text.trim() || "" : "";
    const imageFile = formData.get("imageFile");
    const hasNewImage = imageFile instanceof File && imageFile.size > 0;
    const rawTags = textValue(formData, "tags");
    setPreview({
      title: textValue(formData, "title"),
      summary: textValue(formData, "summary"),
      content: sanitizePreviewHtml(textValue(formData, "content")),
      category: category === "Select a category" ? "" : category,
      imageUrl: hasNewImage ? URL.createObjectURL(imageFile) : formData.get("removeFeaturedImage") === "on" ? null : existingImage || null,
      imageCaption: textValue(formData, "imageCaption"),
      tags: rawTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      videoUrl: textValue(formData, "videoUrl"),
      audioUrl: textValue(formData, "audioUrl"),
      temporaryImage: hasNewImage,
    });
  };

  const embedUrl = preview ? youtubeEmbedUrl(preview.videoUrl) : null;
  return <>
    <button ref={triggerRef} type="button" onClick={open} className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-5 font-bold text-blue-800 transition hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><Eye className="h-4 w-4" aria-hidden="true"/>Preview article</button>
    {preview && createPortal(<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-sm md:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="article-preview-title" className="mx-auto min-h-full w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-7">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Draft preview</p><p className="text-sm text-slate-500">This is how the current unsaved story will appear to readers.</p></div>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close article preview" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><X className="h-5 w-5"/></button>
        </header>
        <article className="mx-auto max-w-4xl px-5 py-8 md:px-10 md:py-12" lang="ta">
          {preview.category && <p className="text-sm font-black uppercase tracking-[0.12em] text-red-600">{preview.category}</p>}
          <h1 id="article-preview-title" className="mt-3 text-3xl font-black leading-tight text-slate-950 md:text-5xl">{preview.title || "தலைப்பு இன்னும் சேர்க்கப்படவில்லை"}</h1>
          {preview.summary && <p className="mt-5 text-lg font-medium leading-8 text-slate-600 md:text-xl">{preview.summary}</p>}
          <div className="mt-6 flex items-center gap-2 border-y border-slate-200 py-3 text-sm text-slate-500"><span className="font-bold text-slate-800">Newsroom preview</span><span aria-hidden="true">·</span><span>Not published</span></div>
          {preview.imageUrl ? <figure className="mt-8"><img src={preview.imageUrl} alt={preview.imageCaption || "Featured article image"} className="aspect-video w-full rounded-xl bg-slate-100 object-cover"/>{preview.imageCaption && <figcaption className="mt-2 text-sm text-slate-500">{preview.imageCaption}</figcaption>}</figure> : <div className="mt-8 flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-400"><ImageIcon className="mr-2 h-5 w-5"/>No featured image selected</div>}
          {preview.content ? <div className="article-content mt-9 text-base leading-relaxed text-slate-800 md:text-lg" dangerouslySetInnerHTML={{ __html: preview.content }}/> : <p className="mt-9 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">Article body is empty.</p>}
          {embedUrl && <div className="mt-8 aspect-video overflow-hidden rounded-xl bg-black"><iframe src={embedUrl} title="Article video preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-0"/></div>}
          {preview.videoUrl && !embedUrl && <a href={preview.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-8 block break-all rounded-lg border border-blue-200 bg-blue-50 p-3 font-semibold text-blue-800 underline">Open attached video</a>}
          {preview.audioUrl && <audio controls preload="metadata" src={preview.audioUrl} className="mt-8 w-full">Your browser does not support audio playback.</audio>}
          {preview.tags.length > 0 && <footer className="mt-10 border-t border-slate-200 pt-6"><p className="flex items-center gap-2 text-sm font-black text-slate-700"><Tag className="h-4 w-4"/>Tags</p><div className="mt-3 flex flex-wrap gap-2">{preview.tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">#{tag}</span>)}</div></footer>}
        </article>
      </section>
    </div>, document.body)}
  </>;
}
