import { ArticleStatus, Locale, Role } from "@prisma/client";
import {
  ArrowUpRight,
  Check,
  Eye,
  FolderTree,
  GitBranch,
  Info,
  LayoutDashboard,
  Layers3,
  Save,
  Sparkles,
} from "lucide-react";

import { saveHomepage } from "@/actions/homepage";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

const LIVE = [
  ArticleStatus.PUBLISHED,
  ArticleStatus.UPDATED,
  ArticleStatus.CORRECTED,
];

const styles = `
  .sng-homepage {
    position: relative;
    isolation: isolate;
  }

  .sng-homepage .sng-home-panel {
    min-width: 0;
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 32px -26px rgba(15,23,42,.3);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-homepage .sng-home-icon {
    display: flex;
    height: 44px;
    width: 44px;
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

  .sng-homepage .sng-home-input {
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

  .sng-homepage .sng-home-input:focus {
    background: white;
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }

  .sng-homepage .sng-feature-slot {
    display: block;
    min-width: 0;
    padding: 18px;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-homepage .sng-category-row {
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    background: #f8fafc;
    padding: 16px;
    transition: border-color .2s ease, background .2s ease;
  }

  .sng-homepage .sng-category-row:has(input[type="checkbox"]:checked) {
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  .sng-homepage .sng-category-switch {
    position: relative;
    width: 42px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 999px;
    background: #cbd5e1;
    transition: background .2s ease;
  }

  .sng-homepage .sng-category-switch::after {
    content: "";
    position: absolute;
    left: 4px;
    top: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(15,23,42,.15);
    transition: transform .2s ease;
  }

  .sng-homepage .sng-category-toggle:has(input:checked)
  .sng-category-switch {
    background: #2563eb;
  }

  .sng-homepage .sng-category-toggle:has(input:checked)
  .sng-category-switch::after {
    transform: translateX(18px);
  }

  .sng-homepage .sng-category-toggle:has(input:focus-visible)
  .sng-category-switch {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  .sng-homepage .sng-home-savebar {
    border: 1px solid #dbe3ee;
    border-radius: 18px;
    background: rgba(255,255,255,.94);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 32px -18px rgba(15,23,42,.25);
  }

  .sng-homepage .sng-home-save {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-height: 48px;
    padding: 12px 20px;
    border: 1px solid #2563eb;
    border-radius: 12px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.2),
      0 6px 16px -10px rgba(37,99,235,.6);
    transition: transform .2s ease, box-shadow .2s ease;
  }

  .sng-homepage .sng-home-entry {
    animation: sng-home-enter .35s ease both;
  }

  .sng-homepage button:focus-visible,
  .sng-homepage a:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-homepage .sng-home-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-homepage .sng-home-panel:hover,
    .sng-homepage .sng-feature-slot:hover {
      border-color: #bfdbfe;
      box-shadow: 0 12px 28px -24px rgba(37,99,235,.3);
    }

    .sng-homepage .sng-category-row:hover {
      border-color: #93c5fd;
    }

    .sng-homepage .sng-home-save:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 22px -12px rgba(37,99,235,.6);
    }
  }

  @keyframes sng-home-enter {
    from { opacity: 0; transform: translateY(7px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-homepage * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default async function HomepageManager({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  await requireUser([Role.ADMIN, Role.EDITOR]);

  const params = await searchParams;

  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where: {
        locale: Locale.ta,
        status: { in: LIVE },
      },
      orderBy: { publishedAt: "desc" },
      take: 150,
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        isHomepageLead: true,
        homepageOrder: true,
      },
    }),
    prisma.category.findMany({
      where: { locale: Locale.ta },
      orderBy: [
        { homepageOrder: "asc" },
        { order: "asc" },
      ],
      select: {
        id: true,
        name: true,
        parentId: true,
        showOnHomepage: true,
        homepageOrder: true,
      },
    }),
  ]);

  const leadArticle = articles.find((article) => article.isHomepageLead);
  const lead = leadArticle?.id || "";

  const featured = articles
    .filter((article) => article.homepageOrder !== null)
    .sort(
      (a, b) =>
        (a.homepageOrder ?? 0) - (b.homepageOrder ?? 0),
    );

  const visibleCategories = categories.filter(
    (category) => category.showOnHomepage,
  ).length;

  const storyOptions = articles.map((article) => (
    <option key={article.id} value={article.id}>
      {article.title} · {article.status.toLowerCase()}
    </option>
  ));

  const stats = [
    {
      label: "Saved lead selection",
      value: leadArticle ? "Manual" : "Automatic",
      icon: Sparkles,
    },
    {
      label: "Featured selections shown",
      value: `${Math.min(featured.length, 6)} / 6`,
      icon: Layers3,
    },
    {
      label: "Visible category sections",
      value: String(visibleCategories),
      icon: FolderTree,
    },
  ];

  return (
    <main className="sng-homepage mx-auto max-w-6xl space-y-6 px-4 py-7 md:px-6">
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
            Editorial curation
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Homepage management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Choose the lead story, arrange featured news and organise
            the sections readers see.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          View live homepage
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </header>

      <AdminToast
        key={params.error || params.success || "none"}
        success={params.success}
        error={params.error}
      />

      <section
        aria-label="Saved homepage configuration"
        className="grid gap-4 sm:grid-cols-3"
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="sng-home-panel flex items-center gap-4 p-5"
          >
            <span className="sng-home-icon">
              <stat.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {stat.label}
              </p>
            </div>
          </article>
        ))}
      </section>

      <form action={saveHomepage} className="space-y-6">
        <section
          aria-labelledby="homepage-lead-heading"
          className="sng-home-panel sng-home-entry"
        >
          <header className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6">
            <span className="sng-home-icon">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Section 01
              </p>
              <h2
                id="homepage-lead-heading"
                className="mt-1 text-base font-bold text-slate-900"
              >
                Lead story
              </h2>
            </div>
          </header>

          <div className="p-5 sm:p-6">
            <p className="text-sm leading-6 text-slate-500">
              Select the main story for the homepage. Automatic uses
              the newest published article.
            </p>

            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Homepage lead
              <select
                name="leadArticleId"
                defaultValue={lead}
                className="sng-home-input"
              >
                <option value="">
                  Automatic — newest published article
                </option>
                {storyOptions}
              </select>
            </label>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
                aria-hidden="true"
              />
              <p className="text-xs leading-6 text-blue-800">
                Story selectors include up to 150 latest published,
                updated or corrected Tamil articles.
              </p>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="homepage-featured-heading"
          className="sng-home-panel sng-home-entry"
        >
          <header className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6">
            <span className="sng-home-icon">
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Section 02
              </p>
              <h2
                id="homepage-featured-heading"
                className="mt-1 text-base font-bold text-slate-900"
              >
                Featured story order
              </h2>
            </div>
          </header>

          <div className="p-5 sm:p-6">
            <p className="text-sm leading-6 text-slate-500">
              Arrange six positions in the main news grid. Empty
              positions fall back to the latest stories.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <label key={index} className="sng-feature-slot">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Position {index + 1}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">
                        Main news grid
                      </span>
                    </span>
                  </span>

                  <select
                    name={`featured-${index + 1}`}
                    defaultValue={featured[index]?.id || ""}
                    className="sng-home-input"
                  >
                    <option value="">Automatic fallback</option>
                    {storyOptions}
                  </select>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="homepage-categories-heading"
          className="sng-home-panel sng-home-entry"
        >
          <header className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6">
            <span className="sng-home-icon">
              <FolderTree className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Section 03
              </p>
              <h2
                id="homepage-categories-heading"
                className="mt-1 text-base font-bold text-slate-900"
              >
                Category sections
              </h2>
            </div>
          </header>

          <div className="p-5 sm:p-6">
            <p className="text-sm leading-6 text-slate-500">
              Enable sections below the main news area and set their
              display order.
            </p>

            {categories.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <FolderTree
                  className="mx-auto h-6 w-6 text-slate-300"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm text-slate-500">
                  No Tamil categories are available yet.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className="sng-category-row grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center"
                  >
                    <label className="sng-category-toggle flex min-h-11 cursor-pointer items-center gap-4">
                      <input
                        type="checkbox"
                        name={`category-visible-${category.id}`}
                        defaultChecked={category.showOnHomepage}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className="sng-category-switch"
                      />

                      <span className="min-w-0">
                        <span className="block break-words text-sm font-semibold leading-7 text-slate-800">
                          {category.name}
                        </span>
                        <span className="mt-1 block text-[11px] text-slate-500">
                          {category.parentId
                            ? "Subcategory section"
                            : "Main category section"}
                        </span>
                      </span>
                    </label>

                    <label className="block text-xs font-semibold text-slate-600">
                      Display order
                      <input
                        type="number"
                        min="1"
                        max="99"
                        name={`category-order-${category.id}`}
                        defaultValue={
                          category.homepageOrder || index + 1
                        }
                        className="sng-home-input"
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="sng-home-savebar sticky bottom-3 z-20 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
              <Check className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Save homepage configuration
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Publish to apply your selections to the live homepage.
              </p>
            </div>
          </div>

          <button type="submit" className="sng-home-save">
            <Save className="h-4 w-4" aria-hidden="true" />
            Publish homepage layout
          </button>
        </div>
      </form>
    </main>
  );
}