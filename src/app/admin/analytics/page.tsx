import Link from "next/link";
import { ArticleStatus, Locale, Role } from "@prisma/client";
import {
  ArrowUpRight,
  BarChart3,
  Eye,
  FileText,
  FolderTree,
  Info,
  Mail,
  Newspaper,
  Radio,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const numberFormat = new Intl.NumberFormat("en-LK");
const formatNumber = (value: number) => numberFormat.format(value);

export default async function AnalyticsPage() {
  await requireUser([Role.ADMIN, Role.EDITOR]);

  const live = [
    ArticleStatus.PUBLISHED,
    ArticleStatus.UPDATED,
    ArticleStatus.CORRECTED,
  ];

  const [
    publishedCount,
    views,
    subscribers,
    pushSubscribers,
    topArticles,
    tamilCategories,
  ] = await Promise.all([
    prisma.article.count({
      where: { status: { in: live } },
    }),
    prisma.article.aggregate({
      where: { status: { in: live } },
      _sum: { viewCount: true },
    }),
    prisma.newsletterSubscriber.count({
      where: { isActive: true },
    }),
    prisma.pushSubscription.count({
      where: { isActive: true },
    }),
    prisma.article.findMany({
      where: { status: { in: live } },
      orderBy: [{ viewCount: "desc" }, { id: "asc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        viewCount: true,
        author: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.category.findMany({
      where: { locale: Locale.ta },
      include: {
        _count: {
          select: {
            articles: {
              where: { status: { in: live } },
            },
          },
        },
      },
    }),
  ]);

  // Rank using published article counts, excluding drafts.
  const categories = [...tamilCategories]
    .sort(
      (a, b) =>
        b._count.articles - a._count.articles ||
        a.name.localeCompare(b.name, "ta"),
    )
    .slice(0, 10);

  const maximumCategoryCount = Math.max(
    1,
    ...categories.map((category) => category._count.articles),
  );

  const recordedViews = views._sum.viewCount ?? 0;
  const tamilPublishedCount = tamilCategories.reduce(
    (total, category) => total + category._count.articles,
    0,
  );

  const cards = [
    {
      label: "Published stories",
      value: publishedCount,
      description: "Currently published · all languages",
      icon: FileText,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Recorded views",
      value: recordedViews,
      description: "Total views of published stories",
      icon: Eye,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      label: "Newsletter subscribers",
      value: subscribers,
      description: "Active email subscriptions",
      icon: Mail,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Push subscribers",
      value: pushSubscribers,
      description: "Active browser subscriptions",
      icon: Radio,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Newsroom insights
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Analytics overview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            See how your published stories and audience subscriptions
            are performing.
          </p>
        </div>

        <Link
          href="/admin/articles"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          View articles
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <section
        aria-label="Newsroom statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="pt-2 text-sm font-medium text-slate-600">
                  {card.label}
                </p>

                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.tone}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>

              <p className="mt-4 break-words text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {formatNumber(card.value)}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section
          aria-labelledby="most-read-title"
          className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Newspaper className="h-5 w-5" aria-hidden="true" />
              </span>

              <div>
                <h2
                  id="most-read-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Most read articles
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Published stories ranked by recorded views
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Top {topArticles.length}
            </span>
          </div>

          {topArticles.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText
                className="mx-auto h-8 w-8 text-slate-300"
                aria-hidden="true"
              />
              <p className="mt-4 text-sm font-semibold text-slate-700">
                No published stories yet
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Published articles will appear here with their view counts.
              </p>
              <Link
                href="/admin/articles"
                className="mt-5 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                Go to articles
              </Link>
            </div>
          ) : (
            <ol className="divide-y divide-slate-100">
              {topArticles.map((article, index) => (
                <li key={article.id}>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="group flex min-h-24 items-start gap-3 px-4 py-4 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 sm:gap-4 sm:px-5"
                  >
                    <span
                      aria-label={`Rank ${index + 1}`}
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${
                        index === 0
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-semibold leading-6 text-slate-800 group-hover:text-blue-700">
                        {article.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-slate-500">
                        <span>{article.category.name}</span>
                        <span>{article.author.name}</span>
                        <span className="inline-flex items-center gap-1 font-medium text-blue-700">
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatNumber(article.viewCount)} views
                        </span>
                      </div>
                    </div>

                    <ArrowUpRight
                      className="mt-1 hidden h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600 sm:block"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section
          aria-labelledby="category-title"
          className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
              </span>

              <div>
                <h2
                  id="category-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Stories by category
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Tamil edition · published stories
                </p>
              </div>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FolderTree
                className="mx-auto h-8 w-8 text-slate-300"
                aria-hidden="true"
              />
              <p className="mt-4 text-sm font-semibold text-slate-700">
                No Tamil categories available
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Category statistics will appear once categories are available.
              </p>
            </div>
          ) : (
            <div className="p-5">
              {tamilPublishedCount === 0 && (
                <p className="mb-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  No Tamil stories are published yet. All category counts
                  are currently zero.
                </p>
              )}

              <ol className="space-y-5">
                {categories.map((category) => {
                  const count = category._count.articles;
                  const width = (count / maximumCategoryCount) * 100;

                  return (
                    <li key={category.id}>
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <span className="min-w-0 break-words text-sm font-medium leading-6 text-slate-700">
                          {category.name}
                        </span>
                        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 tabular-nums">
                          {formatNumber(count)} {count === 1 ? "story" : "stories"}
                        </span>
                      </div>

                      <div
                        aria-hidden="true"
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                      >
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>

              <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
                Bar lengths compare category counts with the largest
                category shown. Drafts and archived stories are excluded.
              </p>
            </div>
          )}
        </section>
      </div>

      <aside className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4">
        <Info
          className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-slate-700">
            About these numbers
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-600">
            These statistics come from the CMS database. Recorded views
            are cumulative counts, not unique visitors. Summary cards
            and the article ranking cover all languages; the category
            chart covers Tamil. Google Analytics is needed for
            traffic-source and detailed audience reports.
          </p>
        </div>
      </aside>
    </main>
  );
}