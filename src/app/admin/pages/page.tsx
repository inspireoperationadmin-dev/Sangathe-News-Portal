import { Role } from "@prisma/client";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Files,
  Save,
} from "lucide-react";

import { saveSitePage } from "@/actions/pages";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_PAGES } from "@/lib/site-pages";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

const styles = `
  .sng-pages {
    position: relative;
    isolation: isolate;
  }

  .sng-pages .sng-page-panel {
    min-width: 0;
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 30px -25px rgba(15,23,42,.3);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-pages .sng-page-icon {
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

  .sng-pages .sng-page-summary {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px;
    border-radius: 22px;
    cursor: pointer;
    list-style: none;
    transition: background .2s ease;
  }

  .sng-pages .sng-page-summary::-webkit-details-marker {
    display: none;
  }

  .sng-pages .sng-page-summary::marker {
    content: "";
  }

  .sng-pages details[open] > .sng-page-summary {
    border-radius: 22px 22px 0 0;
    background: linear-gradient(135deg, white, #eff6ff);
  }

  .sng-pages .sng-page-chevron {
    transition: transform .2s ease;
  }

  .sng-pages details[open] .sng-page-chevron {
    transform: rotate(180deg);
  }

  .sng-pages .sng-page-input {
    display: block;
    width: 100%;
    min-height: 48px;
    margin-top: 8px;
    padding: 12px 14px;
    border: 1px solid #dbe3ee;
    border-radius: 13px;
    background: #f8fafc;
    color: #0f172a;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.8;
    outline: none;
    box-shadow:
      inset 2px 2px 5px rgba(148,163,184,.07),
      inset -2px -2px 5px white;
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-pages .sng-page-input:focus {
    background: white;
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }

  .sng-pages .sng-page-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 11px 17px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: linear-gradient(145deg, white, #f8fafc);
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: inset 0 1px 0 white;
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .sng-pages .sng-page-button.is-primary {
    border-color: #2563eb;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 6px 16px -10px rgba(37,99,235,.6);
  }

  .sng-pages summary:focus-visible,
  .sng-pages button:focus-visible,
  .sng-pages a:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  .sng-pages .sng-page-entry {
    animation: sng-page-enter .3s ease both;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-pages .sng-page-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-pages .sng-page-panel:hover {
      border-color: #bfdbfe;
      box-shadow: 0 14px 32px -25px rgba(37,99,235,.3);
    }

    .sng-pages .sng-page-summary:hover {
      background: #f8fafc;
    }

    .sng-pages .sng-page-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -12px rgba(15,23,42,.4);
    }
  }

  @keyframes sng-page-enter {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-pages * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default async function PagesManager({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  await requireUser([Role.ADMIN]);

  const params = await searchParams;
  const saved = await prisma.sitePage.findMany();
  const bySlug = new Map(saved.map((page) => [page.slug, page]));

  const customCount = SITE_PAGES.filter((definition) =>
    bySlug.has(definition.slug),
  ).length;

  const stats = [
    {
      label: "Managed pages",
      value: SITE_PAGES.length,
      icon: Files,
    },
    {
      label: "Saved custom content",
      value: customCount,
      icon: CheckCircle2,
    },
    {
      label: "Using default content",
      value: SITE_PAGES.length - customCount,
      icon: FileText,
    },
  ];

  return (
    <main className="sng-pages mx-auto max-w-6xl space-y-6 px-4 py-7 md:px-6">
      <style>{styles}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          Trust & organisation
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Public pages
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Manage the legal, editorial and organisation pages readers
          see on your website.
        </p>
      </header>

      <AdminToast
        key={params.error || params.success || "none"}
        success={params.success}
        error={params.error}
      />

      <section
        aria-label="Public page overview"
        className="grid gap-4 sm:grid-cols-3"
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="sng-page-panel flex items-center gap-4 p-5"
          >
            <span className="sng-page-icon">
              <stat.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {stat.label}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="public-page-list-heading">
        <div className="mb-4 px-1">
          <h2
            id="public-page-list-heading"
            className="text-base font-bold text-slate-900"
          >
            Page directory
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Open a page to edit its title and HTML content.
          </p>
        </div>

        <div className="space-y-4">
          {SITE_PAGES.map((definition) => {
            const page = bySlug.get(definition.slug);
            const path = `/${definition.slug}`;

            return (
              <details
                key={definition.slug}
                className="sng-page-panel sng-page-entry"
                open={!page}
              >
                <summary className="sng-page-summary">
                  <span className="sng-page-icon">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-bold leading-7 text-slate-900">
                      {page?.title || definition.title}
                    </span>
                    <span className="mt-1 block break-all text-xs text-slate-500">
                      {path}
                    </span>
                  </span>

                  <span
                    className={`hidden shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold sm:inline-flex ${
                      page
                        ? "border-blue-100 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {page ? "Custom content" : "Default content"}
                  </span>

                  <ChevronDown
                    className="sng-page-chevron h-4 w-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                </summary>

                <form
                  action={saveSitePage}
                  className="border-t border-slate-100 p-5 sm:p-6"
                >
                  <input
                    type="hidden"
                    name="slug"
                    value={definition.slug}
                  />

                  <div className="space-y-5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Page title *
                      <input
                        name="title"
                        required
                        defaultValue={page?.title || definition.title}
                        className="sng-page-input"
                      />
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      Page content *
                      <textarea
                        name="content"
                        required
                        rows={12}
                        defaultValue={page?.content || definition.content}
                        className="sng-page-input resize-y font-mono"
                      />
                      <span className="mt-3 block text-xs font-normal leading-6 text-slate-500">
                        Safe HTML headings, paragraphs, lists and links
                        are supported. Edit the HTML directly here.
                      </span>
                    </label>
                  </div>

                  <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Publish to apply your changes
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        View page opens the current public page.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <a
                        href={path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sng-page-button"
                      >
                        View page
                        <ArrowUpRight
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </a>

                      <button
                        type="submit"
                        className="sng-page-button is-primary"
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        Publish page
                      </button>
                    </div>
                  </div>
                </form>
              </details>
            );
          })}
        </div>
      </section>
    </main>
  );
}