import type { ReactNode } from "react";
import { ArticleStatus, Role } from "@prisma/client";
import {
  Bell,
  CalendarDays,
  Check,
  FileText,
  Flame,
  GalleryHorizontal,
  ImageIcon,
  MapPin,
  NotebookPen,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  Users,
  Video,
  Volume2,
} from "lucide-react";
import Image from "next/image";

import { RichTextEditor } from "@/components/rich-text-editor";
import { ArticlePreview } from "@/components/article-preview";
import { ImageFilePicker } from "@/components/image-file-picker";
import { ArticleWorkflowButtons } from "@/components/article-workflow-buttons";
import { toColomboDateTimeInput } from "@/lib/datetime";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type RelatedOption = {
  id: string;
  title: string;
};

type ArticleValues = {
  id?: string;
  title: string;
  categoryId: string;
  summary: string | null;
  content: string;
  featuredImage: string | null;
  imageCaption: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: ArticleStatus;
  isBreaking: boolean;
  isDeveloping: boolean;
  isExclusive: boolean;
  breakingExpiresAt: Date | null;
  scheduledAt: Date | null;
  correctionNote: string | null;
  editorialNote: string | null;
  location: string | null;
  people: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  tags?: { tag: { name: string } }[];
  media?: {
    media: {
      id: string;
      url: string;
      title: string | null;
      caption: string | null;
    };
  }[];
  relatedFrom?: {
    relatedArticle: {
      id: string;
      title: string;
    };
  }[];
};

type WorkflowAction = {
  value: string;
  label: string;
  primary: boolean;
  icon: "save" | "send" | "approve" | "return";
};

function workflowActions(
  role: Role,
  status?: ArticleStatus,
): WorkflowAction[] {
  if (role === Role.REPORTER) {
    return [
      {
        value: ArticleStatus.DRAFT,
        label: "Save Draft",
        primary: false,
        icon: "save",
      },
      {
        value: ArticleStatus.SUBMITTED_FOR_REVIEW,
        label: "Submit for Review",
        primary: true,
        icon: "send",
      },
    ];
  }

  

  if (role === Role.SUB_EDITOR) {
    if (status === ArticleStatus.SUBMITTED_FOR_REVIEW) {
      return [
        {
          value: ArticleStatus.EDITING,
          label: "Save as Editing",
          primary: true,
          icon: "save",
        },
        {
          value: ArticleStatus.RETURNED,
          label: "Return to Reporter",
          primary: false,
          icon: "return",
        },
      ];
    }

    if (status === ArticleStatus.EDITING) {
      return [
        {
          value: ArticleStatus.RETURNED,
          label: "Return to Reporter",
          primary: false,
          icon: "return",
        },
        {
          value: ArticleStatus.SUBMITTED_FOR_APPROVAL,
          label: "Submit for Final Approval",
          primary: true,
          icon: "send",
        },
      ];
    }

    return [
      {
        value: ArticleStatus.EDITING,
        label: "Save Editing",
        primary: false,
        icon: "save",
      },
      {
        value: ArticleStatus.SUBMITTED_FOR_APPROVAL,
        label: "Submit for Final Approval",
        primary: true,
        icon: "send",
      },
    ];
  }

  if (
    status === ArticleStatus.PUBLISHED ||
    status === ArticleStatus.UPDATED ||
    status === ArticleStatus.CORRECTED
  ) {
    return [
      {
        value: ArticleStatus.UPDATED,
        label: "Save Published Update",
        primary: false,
        icon: "save",
      },
      {
        value: ArticleStatus.CORRECTED,
        label: "Publish Correction",
        primary: true,
        icon: "send",
      },
    ];
  }

  if (
    status === ArticleStatus.SUBMITTED_FOR_REVIEW ||
    status === ArticleStatus.SUBMITTED_FOR_APPROVAL ||
    status === ArticleStatus.EDITING ||
    status === ArticleStatus.RETURNED
  ) {
    return [
      {
        value: ArticleStatus.RETURNED,
        label: "Return to Reporter",
        primary: false,
        icon: "return",
      },
      {
        value: ArticleStatus.APPROVED,
        label: "Approve Article",
        primary: true,
        icon: "approve",
      },
    ];
  }

  if (
    status === ArticleStatus.APPROVED ||
    status === ArticleStatus.SCHEDULED
  ) {
    return [
      {
        value: status,
        label:
          status === ArticleStatus.SCHEDULED
            ? "Save scheduled changes"
            : "Save approved changes",
        primary: false,
        icon: "save",
      },
      {
        value: ArticleStatus.RETURNED,
        label: "Return to Reporter",
        primary: false,
        icon: "return",
      },
      {
        value: "RELEASE",
        label: "Schedule / Publish",
        primary: true,
        icon: "send",
      },
    ];
  }

  return [
    {
      value: ArticleStatus.APPROVED,
      label: "Approve Article",
      primary: false,
      icon: "approve",
    },
    {
      value: "RELEASE",
      label: "Schedule / Publish",
      primary: true,
      icon: "send",
    },
  ];
}

function Panel({
  id,
  number,
  title,
  description,
  icon,
  children,
  className = "",
}: {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={`sng-panel ${className}`}
    >
      <header className="flex items-start gap-4 border-b border-slate-200/70 px-5 py-5 sm:px-7">
        <span
          aria-hidden="true"
          className="sng-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-blue-700"
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Section {number}
          </p>
          <h2
            id={`${id}-heading`}
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </header>

      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`block min-w-0 text-sm font-semibold text-slate-700 ${className}`}
    >
      <span className="mb-2 block">{label}</span>
      {children}
      {hint && (
        <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

function StoryToggle({
  name,
  title,
  description,
  icon,
  checked,
  tone = "blue",
}: {
  name: string;
  title: string;
  description: string;
  icon: ReactNode;
  checked?: boolean;
  tone?: "blue" | "red" | "amber" | "violet";
}) {
  return (
    <label className={`sng-toggle sng-toggle-${tone}`}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        className="peer sr-only"
      />

      <span
        aria-hidden="true"
        className="sng-toggle-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-800">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>

      <span
        aria-hidden="true"
        className="sng-switch relative h-6 w-11 shrink-0 rounded-full bg-slate-200 transition-colors"
      >
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform" />
      </span>
    </label>
  );
}

export function ArticleForm({
  action,
  categories,
  role,
  article,
  relatedOptions = [],
}: {
  action: (formData: FormData) => Promise<void>;
  categories: CategoryOption[];
  role: Role;
  article?: ArticleValues;
  relatedOptions?: RelatedOption[];
}) {
  const isEditor = role === Role.ADMIN || role === Role.EDITOR;
  const actions = workflowActions(role, article?.status);
  const availableRelated = relatedOptions.filter(
    (option) => option.id !== article?.id,
  );

  const statusLabel = article
    ? article.status.replaceAll("_", " ").toLowerCase()
    : "New article";

  return (
    <form action={action} className="sng-article-form relative space-y-6">
      <style>{`
        .sng-article-form {
          --sng-blue: #2563eb;
          isolation: isolate;
          color: #0f172a;
        }

        .sng-article-form .sng-panel {
          position: relative;
          min-width: 0;
          border: 1px solid rgba(203, 213, 225, .72);
          border-radius: 24px;
          background: rgba(255, 255, 255, .92);
          box-shadow:
            0 12px 32px -24px rgba(15, 23, 42, .3),
            inset 0 1px 0 rgba(255, 255, 255, .95);
          transition: border-color .25s ease, box-shadow .25s ease;
          animation: sng-arrive .45s ease both;
        }

        .sng-article-form .sng-panel:focus-within {
          border-color: rgba(96, 165, 250, .7);
          box-shadow:
            0 12px 35px -22px rgba(37, 99, 235, .25),
            inset 0 1px 0 white;
        }

        .sng-article-form .sng-icon {
          background: linear-gradient(145deg, #ffffff, #e8efff);
          border: 1px solid rgba(191, 219, 254, .75);
          box-shadow:
            4px 4px 10px rgba(148, 163, 184, .15),
            -3px -3px 8px rgba(255, 255, 255, .95);
        }

        .sng-article-form .sng-field {
          display: block;
          width: 100%;
          min-height: 48px;
          border-radius: 14px;
          border: 1px solid #dbe3ee;
          background: #f8fafc;
          padding: 12px 14px;
          color: #0f172a;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.6;
          box-shadow:
            inset 2px 2px 5px rgba(148, 163, 184, .08),
            inset -2px -2px 5px rgba(255, 255, 255, .95);
          outline: none;
          transition:
            background .2s ease,
            border-color .2s ease,
            box-shadow .2s ease;
        }

        .sng-article-form .sng-field::placeholder {
          color: #94a3b8;
        }

        .sng-article-form .sng-field:focus {
          background: white;
          border-color: #60a5fa;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, .1);
        }

        .sng-article-form .sng-headline {
          font-size: clamp(20px, 2.2vw, 28px);
          font-weight: 700;
          line-height: 1.7;
        }

        .sng-article-form .sng-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 82px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #f8fafc;
          cursor: pointer;
          transition:
            transform .2s ease,
            border-color .2s ease,
            background .2s ease,
            box-shadow .2s ease;
          --toggle-color: #2563eb;
          --toggle-soft: #eff6ff;
          --toggle-border: #bfdbfe;
        }

        .sng-article-form .sng-toggle-red {
          --toggle-color: #dc2626;
          --toggle-soft: #fff1f2;
          --toggle-border: #fecdd3;
        }

        .sng-article-form .sng-toggle-amber {
          --toggle-color: #b45309;
          --toggle-soft: #fffbeb;
          --toggle-border: #fde68a;
        }

        .sng-article-form .sng-toggle-violet {
          --toggle-color: #7c3aed;
          --toggle-soft: #f5f3ff;
          --toggle-border: #ddd6fe;
        }

        .sng-article-form .sng-toggle-icon {
          color: var(--toggle-color);
          background: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 3px 8px rgba(15, 23, 42, .04);
        }

        .sng-article-form .sng-toggle:has(input:checked) {
          background: var(--toggle-soft);
          border-color: var(--toggle-border);
          box-shadow: 0 6px 18px -12px var(--toggle-color);
        }

        .sng-article-form .sng-toggle:has(input:checked) .sng-switch {
          background: var(--toggle-color);
        }

        .sng-article-form .sng-toggle:has(input:checked) .sng-switch > span {
          transform: translateX(20px);
        }

        .sng-article-form .sng-toggle:has(input:focus-visible) {
          outline: 3px solid #60a5fa;
          outline-offset: 3px;
        }

        .sng-article-form .sng-media-card {
          transition: transform .25s ease, box-shadow .25s ease;
        }

        .sng-article-form .sng-media-card img {
          transition: transform .4s ease;
        }

        .sng-article-form .sng-action-bar {
          background: rgba(255, 255, 255, .94);
          box-shadow:
            0 -4px 24px -16px rgba(15, 23, 42, .22),
            0 12px 30px -16px rgba(15, 23, 42, .25),
            inset 0 1px 0 white;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .sng-article-form .sng-action-bar button {
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .sng-article-form .sng-action-bar button:focus-visible {
          outline: 3px solid #60a5fa;
          outline-offset: 3px;
        }

        .sng-article-form .sng-action-bar button:active:not(:disabled) {
          transform: scale(.98);
        }

        .sng-article-form .sng-attention {
          animation: sng-attention 1.8s ease-out 3;
        }

        @supports (backdrop-filter: blur(12px)) {
          .sng-article-form .sng-panel {
            backdrop-filter: blur(12px);
          }
        }

        @media (hover: hover) {
          .sng-article-form .sng-panel:hover {
            border-color: #c3d3eb;
            box-shadow: 0 16px 40px -25px rgba(37, 99, 235, .25);
          }

          .sng-article-form .sng-toggle:hover {
            transform: translateY(-2px);
            border-color: var(--toggle-border);
          }

          .sng-article-form .sng-media-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 24px -16px rgba(15, 23, 42, .35);
          }

          .sng-article-form .sng-media-card:hover img {
            transform: scale(1.035);
          }

          .sng-article-form .sng-action-bar button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 14px -8px rgba(37, 99, 235, .4);
          }
        }

        @keyframes sng-arrive {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes sng-attention {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, .22); }
          75%, 100% { box-shadow: 0 0 0 7px rgba(59, 130, 246, 0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .sng-article-form *,
          .sng-article-form *::before,
          .sng-article-form *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl"
      >
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -left-20 top-[35%] h-64 w-64 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      {/* Form overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/70 p-5">
        <div className="flex items-center gap-3">
          <span className="sng-icon flex h-11 w-11 items-center justify-center rounded-2xl text-blue-700">
            <NotebookPen className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {article ? "Refine your story" : "Build your next story"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Write, add media, then choose a workflow action.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3 py-2 text-xs font-semibold capitalize text-blue-700 shadow-sm">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-blue-500"
          />
          {statusLabel}
        </span>
      </div>

      <Panel
        id="story-desk"
        number="01"
        title="Story desk"
        description="Start with a clear headline and a short summary."
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="space-y-6">
          <Field label="Headline *">
            <input
              name="title"
              required
              defaultValue={article?.title}
              placeholder="தமிழில் செய்தித் தலைப்பை எழுதுங்கள்…"
              className="sng-field sng-headline"
            />
          </Field>

          <Field
            label="Short summary"
            hint="Give readers the essential details before the full story."
          >
            <textarea
              name="summary"
              rows={3}
              defaultValue={article?.summary || ""}
              placeholder="செய்தியின் முக்கிய தகவல்களைச் சுருக்கமாக எழுதுங்கள்…"
              className="sng-field resize-y"
            />
          </Field>
        </div>
      </Panel>

      <Panel
        id="article-body"
        number="02"
        title="Article body"
        description="Write the complete story and format it using the editor."
        icon={<NotebookPen className="h-5 w-5" />}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs leading-5 text-slate-500">
            Use headings and short paragraphs for comfortable reading.
          </p>
          <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
            Rich text
          </span>
        </div>

        <div className="min-w-0 rounded-2xl bg-slate-50/60 p-1">
          <RichTextEditor initialContent={article?.content || ""} />
        </div>
      </Panel>

      <Panel
        id="story-details"
        number="03"
        title="Category & cover"
        description="Choose where the story belongs and add its featured image."
        icon={<ImageIcon className="h-5 w-5" />}
      >
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <Field label="Category *">
              <select
                name="categoryId"
                required
                defaultValue={article?.categoryId || ""}
                className="sng-field"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Image caption"
              hint="Describe the image and include a photo credit where needed."
            >
              <input
                name="imageCaption"
                defaultValue={article?.imageCaption || ""}
                placeholder="படத்தின் விளக்கம் / பட உதவி"
                className="sng-field"
              />
            </Field>
          </div>

          <div className="min-w-0 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <ImageIcon
                className="h-4 w-4 text-blue-600"
                aria-hidden="true"
              />
              <h3 className="text-sm font-bold text-slate-800">
                Featured image
              </h3>
            </div>

            <ImageFilePicker
              name="imageFile"
              helpText="JPG, PNG, WebP or GIF, maximum 8 MB. Preview or remove your selection before saving."
            />

            {article?.featuredImage && (
              <div className="sng-media-card mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="overflow-hidden">
                  <Image
                    src={article.featuredImage}
                    alt={article.imageCaption || article.title}
                    width={800}
                    height={450}
                    className="aspect-video w-full object-cover"
                  />
                </div>

                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-700">
                    Current cover
                  </p>
                  <p className="mt-1 break-all text-[11px] leading-5 text-slate-500">
                    {article.featuredImage}
                  </p>
                </div>

                <label className="flex min-h-12 cursor-pointer items-center gap-3 border-t border-red-100 bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-700">
                  <input
                    type="checkbox"
                    name="removeFeaturedImage"
                    className="h-4 w-4 shrink-0 accent-red-600"
                  />
                  Remove current cover when saved
                </label>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        id="multimedia"
        number="04"
        title="Media & discovery"
        description="Connect the story with images, media and searchable details."
        icon={<GalleryHorizontal className="h-5 w-5" />}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Tags" hint="Separate tags with commas.">
            <div className="relative">
              <Tags
                className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                name="tags"
                defaultValue={
                  article?.tags?.map((item) => item.tag.name).join(", ") ||
                  ""
                }
                placeholder="politics, Jaffna, election"
                className="sng-field"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </Field>

          <Field label="Location">
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                name="location"
                defaultValue={article?.location || ""}
                placeholder="Jaffna"
                className="sng-field"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </Field>

          <Field label="People mentioned">
            <div className="relative">
              <Users
                className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                name="people"
                defaultValue={article?.people || ""}
                placeholder="Names separated by commas"
                className="sng-field"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </Field>

          <Field label="Video or YouTube URL">
            <div className="relative">
              <Video
                className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="url"
                name="videoUrl"
                defaultValue={article?.videoUrl || ""}
                placeholder="https://youtube.com/watch?v=…"
                className="sng-field"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </Field>

          <Field label="Audio URL">
            <div className="relative">
              <Volume2
                className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="url"
                name="audioUrl"
                defaultValue={article?.audioUrl || ""}
                placeholder="https://…/audio.mp3"
                className="sng-field"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </Field>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <GalleryHorizontal
              className="h-4 w-4 text-blue-600"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-slate-800">
              Image gallery
            </h3>
          </div>

          <ImageFilePicker
            name="galleryFiles"
            multiple
            maxFiles={12}
            helpText="Add up to 12 images. Preview or remove selections before saving."
          />
        </div>

        {!!article?.media?.length && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold text-slate-700">
              Saved gallery
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                {article.media.length}
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {article.media.map((item) => (
                <div
                  key={item.media.id}
                  className="sng-media-card overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="overflow-hidden">
                    <Image
                      src={item.media.url}
                      alt={item.media.title || "Gallery image"}
                      width={480}
                      height={270}
                      className="aspect-video w-full object-cover"
                    />
                  </div>

                  <p className="truncate p-3 text-xs text-slate-600">
                    {item.media.caption ||
                      item.media.title ||
                      "Gallery image"}
                  </p>

                  <label className="flex min-h-11 cursor-pointer items-center gap-2 border-t border-red-100 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                    <input
                      type="checkbox"
                      name="removeMediaIds"
                      value={item.media.id}
                      className="h-4 w-4 shrink-0 accent-red-600"
                    />
                    Remove on save
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {role !== Role.REPORTER && availableRelated.length > 0 && (
          <Field
            label="Related articles"
            hint="Hold Ctrl on Windows or Command on Mac to select up to six stories."
            className="mt-6"
          >
            <select
              name="relatedArticleIds"
              multiple
              defaultValue={
                article?.relatedFrom?.map(
                  (item) => item.relatedArticle.id,
                ) || []
              }
              className="sng-field min-h-40"
            >
              {availableRelated.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </Field>
        )}
      </Panel>

      <Panel
        id="desk-notes"
        number="05"
        title="Desk notes"
        description="Keep editorial instructions and revision details together."
        icon={<NotebookPen className="h-5 w-5" />}
      >
        <div className={`grid gap-5 ${article ? "md:grid-cols-2" : ""}`}>
          <Field
            label="Internal editorial note"
            hint="Visible only inside the newsroom."
          >
            <textarea
              name="editorialNote"
              rows={4}
              defaultValue={article?.editorialNote || ""}
              placeholder="Add context or instructions for the editorial team…"
              className="sng-field resize-y"
            />
          </Field>

          {article && (
            <Field
              label="Revision or return note"
              hint="Required when returning an article to its reporter."
            >
              <textarea
                name="changeNote"
                rows={4}
                placeholder="Explain the changes or what needs correcting…"
                className="sng-field resize-y"
              />
            </Field>
          )}
        </div>
      </Panel>

      {role !== Role.REPORTER && (
        <Panel
          id="search-metadata"
          number="06"
          title="Search metadata"
          description="Prepare the headline and description used for search."
          icon={<Search className="h-5 w-5" />}
        >
          <div className="grid items-start gap-5 md:grid-cols-2">
            <Field
              label="SEO headline"
              hint="Maximum 70 characters."
            >
              <input
                name="seoTitle"
                defaultValue={article?.seoTitle || ""}
                maxLength={70}
                placeholder="A clear title for search results"
                className="sng-field"
              />
            </Field>

            <Field
              label="Meta description"
              hint="Maximum 180 characters."
            >
              <textarea
                name="seoDescription"
                rows={3}
                defaultValue={article?.seoDescription || ""}
                maxLength={180}
                placeholder="Summarise the story for search results…"
                className="sng-field resize-y"
              />
            </Field>
          </div>
        </Panel>
      )}

      {isEditor && (
        <Panel
          id="editor-controls"
          number="07"
          title="Publishing controls"
          description="Manage story labels, corrections and publication timing."
          icon={<ShieldCheck className="h-5 w-5" />}
        >
          <div className="grid gap-3 xl:grid-cols-3">
            <StoryToggle
              name="isBreaking"
              title="Breaking news"
              description="Highlight an urgent news update."
              checked={article?.isBreaking}
              tone="red"
              icon={<Flame className="h-5 w-5" />}
            />

            <StoryToggle
              name="isDeveloping"
              title="Developing story"
              description="Mark a story that is still unfolding."
              checked={article?.isDeveloping}
              tone="amber"
              icon={<Volume2 className="h-5 w-5" />}
            />

            <StoryToggle
              name="isExclusive"
              title="Exclusive story"
              description="Highlight original reporting."
              checked={article?.isExclusive}
              tone="violet"
              icon={<Sparkles className="h-5 w-5" />}
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field
              label="Breaking status expires"
              hint="Enter the expiry date and time in Sri Lanka time."
            >
              <input
                type="datetime-local"
                name="breakingExpiresAt"
                defaultValue={toColomboDateTimeInput(
                  article?.breakingExpiresAt,
                )}
                className="sng-field"
              />
            </Field>

            <div id="correction-note">
              <Field
                label="Internal correction record"
                hint="Required for Publish Correction. Visible only inside the CMS."
              >
                <textarea
                  name="correctionNote"
                  rows={3}
                  defaultValue={article?.correctionNote || ""}
                  placeholder="Record what was corrected and why…"
                  className="sng-field resize-y"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Publication timing
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  All dates and times use Sri Lanka time.
                </p>
              </div>
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-2">
              <Field
                label="Scheduled publication"
                hint="Choose a future date to schedule. Leave empty to publish immediately when using Schedule / Publish."
              >
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  defaultValue={toColomboDateTimeInput(
                    article?.scheduledAt,
                  )}
                  className="sng-field"
                />
              </Field>

              <StoryToggle
                name="sendNotification"
                title="Notify push subscribers"
                description="Send a notification when this article is published."
                icon={<Bell className="h-5 w-5" />}
              />
            </div>
          </div>
        </Panel>
      )}

      {/* Existing preview and workflow components */}
      <section
        aria-label="Article workflow actions"
        className="sng-action-bar sticky bottom-3 z-20 rounded-2xl border border-slate-200 p-4 sm:p-5"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <span className="sng-attention flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
              <Check className="h-5 w-5" aria-hidden="true" />
            </span>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Review & save
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Changes are saved when you choose a workflow action.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <ArticlePreview existingImage={article?.featuredImage} />
            <ArticleWorkflowButtons actions={actions} />
          </div>
        </div>
      </section>
    </form>
  );
}