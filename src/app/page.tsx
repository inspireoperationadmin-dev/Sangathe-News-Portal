// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/actions/article";
import { Suspense } from "react";
import { getBreakingNews, getHomepageCategorySections, getHomepageFeaturedArticles, getLeadArticle, getMostReadArticles } from "@/queries/article";
import { SiteFooter } from "@/components/site-footer";
import { Clock, ChevronRight, TrendingUp, ArrowUpRight } from "lucide-react";
import { Locale } from "@prisma/client";
import { NewsletterNotice } from "@/components/newsletter-notice";
import { BreakingNews } from "@/components/breaking-news";
import { PublicHeader } from "@/components/public-header";
import { CategoryNav } from "@/components/category-nav";

export const revalidate = 60;

type HomePageProps = { searchParams: Promise<{ newsletter?: string }> };

export default function HomePage({ searchParams }: HomePageProps) {
  return <Suspense fallback={<HomePageSkeleton />}><HomePageContent searchParams={searchParams} /></Suspense>;
}

async function HomePageContent({ searchParams }: HomePageProps) {
  const pageParams=await searchParams;
  const locale = Locale.ta;
  const [categories, breakingNews, leadArticle, mostReadArticles, categorySections] = await Promise.all([
    getCategories(locale),
    getBreakingNews(locale),
    getLeadArticle(locale),
    getMostReadArticles(locale, 5),
    getHomepageCategorySections(locale),
  ]);

  const latestArticles = await getHomepageFeaturedArticles(locale, leadArticle?.id, 6);

  const todayDate = new Date().toLocaleDateString("ta-LK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="customer-home min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-between">
      <NewsletterNotice status={pageParams.newsletter}/>
      
      <div>
        <BreakingNews news={breakingNews} />
        <PublicHeader todayDate={todayDate} />
        <CategoryNav categories={categories} />

        {/* Main News Content */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-8">
          {/* Lead story beside reader favorites */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-7">
          {leadArticle && (
            <section className="lead-section mb-0 lg:col-span-8" aria-labelledby="lead-story-title">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-red-700 sm:mb-4">
                <span className="h-2 w-2 rounded-full bg-red-700" />
                இன்றைய முக்கியச் செய்தி
              </div>
              <article className="lead-story overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="min-w-0">
                    <Link href={`/news/${leadArticle.slug}`} aria-label={`செய்தியை வாசிக்க: ${leadArticle.title}`} className="group block relative aspect-[16/10] sm:aspect-video lg:aspect-auto lg:h-full lg:min-h-[390px] w-full overflow-hidden bg-slate-100">
                      {leadArticle.featuredImage ? (
                        <Image
                          src={leadArticle.featuredImage}
                          alt={leadArticle.title}
                          fill
                          priority
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 700px"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                          படம் இல்லை
                        </div>
                      )}
                    </Link>
                  </div>

                  <div className="flex min-w-0 flex-col justify-between p-4 sm:p-6 md:p-7 lg:p-8">
                    <div>
                      <span className="inline-flex rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-extrabold text-red-700">
                        {leadArticle.category.name}
                      </span>
                      {leadArticle.isDeveloping && <span className="ml-2 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-bold text-amber-900">தொடரும் செய்தி</span>}
                      {leadArticle.isExclusive && <span className="ml-2 inline-flex rounded-full bg-violet-100 px-3 py-1.5 text-[11px] font-bold text-violet-900">பிரத்தியேகம்</span>}
                      <Link href={`/news/${leadArticle.slug}`} className="group block min-w-0">
                        <h1 id="lead-story-title" className="mt-4 break-words text-pretty text-[1.5rem] font-black leading-[1.35] tracking-[-.025em] text-slate-950 transition group-hover:text-red-700 sm:text-3xl sm:leading-tight lg:text-[1.9rem]">
                          {leadArticle.title}
                        </h1>
                      </Link>
                      {leadArticle.summary && <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-600 sm:mt-4 sm:text-[15px]">
                        {leadArticle.summary}
                      </p>}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {leadArticle.publishedAt ? new Date(leadArticle.publishedAt).toLocaleDateString("ta-LK", { dateStyle: "medium" }) : "இப்போது"}
                      </span>
                      <Link href={`/news/${leadArticle.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-red-700">
                        முழுச் செய்தி <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </section>
          )}

          {mostReadArticles.length > 0 && <aside className="lg:col-span-4" aria-labelledby="trending-title">
            <div className="mb-4 flex items-end justify-between border-b border-neutral-200 pb-3">
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold tracking-[.12em] text-red-700">
                  <TrendingUp className="h-3.5 w-3.5" /> வாசகர்கள் தேர்வு
                </p>
                <h2 id="trending-title" className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                  வாசகர்கள் அதிகம் படித்தவை
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {mostReadArticles.slice(0, 3).map((article, idx) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="group relative block min-h-36 overflow-hidden rounded-xl bg-neutral-900 sm:min-h-44 lg:min-h-40">
                  {article.featuredImage && <Image src={article.featuredImage} alt="" fill sizes="(max-width: 1024px) 100vw, 360px" className="object-cover transition duration-500 group-hover:scale-[1.03]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <span className="mb-2 inline-flex rounded-full bg-[#e51d2a] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white">
                      {idx === 0 ? "மிகவும் வாசிக்கப்பட்டது" : article.category.name}
                    </span>
                    <span className="block line-clamp-2 text-sm font-extrabold leading-snug sm:text-base">{article.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </aside>}
          </div>

          {/* Latest stories below the lead grid */}
          <div className="mt-10">
            
            {/* Latest News (8 Columns) */}
            <section aria-labelledby="latest-news-title">
              <div className="mb-4 flex items-end justify-between border-b border-slate-200 pb-3">
                <div>
                  <p className="mb-1 text-[10px] font-extrabold tracking-[.12em] text-red-700">சங்கதி செய்தி அறை</p>
                  <h2 id="latest-news-title" className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                    சமீபத்திய செய்திகள்
                  </h2>
                </div>
                <Link href="/archive" className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900">
                  அனைத்தும் <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {latestArticles.map((article) => (
                  <article
                    key={article.id}
                    className="latest-card flex flex-row overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md sm:flex-col"
                  >
                    <Link href={`/news/${article.slug}`} aria-label={`செய்தியை வாசிக்க: ${article.title}`} className="latest-card-image relative block aspect-[4/3] w-32 shrink-0 overflow-hidden bg-slate-100 sm:aspect-video sm:w-full">
                      {article.featuredImage ? (
                        <Image src={article.featuredImage} alt={article.title} fill sizes="(max-width: 640px) 128px, (max-width: 1024px) 50vw, 30vw" className="object-cover transition duration-500 hover:scale-[1.04]" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-400">படம் இல்லை</div>
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                      <span className="mb-1.5 line-clamp-1 text-[10px] font-extrabold text-red-700">{article.category.name}</span>
                      <Link href={`/news/${article.slug}`} className="group">
                        <h3 className="line-clamp-3 text-[13px] font-extrabold leading-[1.55] text-slate-900 transition group-hover:text-red-700 sm:text-base sm:leading-snug">
                          {article.title}
                        </h3>
                      </Link>
                      {article.summary && <p className="mt-2 hidden line-clamp-2 text-xs leading-5 text-slate-500 sm:block">{article.summary}</p>}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[10px] text-slate-400 sm:pt-4 sm:text-[11px]">
                        <span>{new Date(article.createdAt).toLocaleDateString("ta-LK")}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-red-700" aria-hidden="true" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {latestArticles.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">இந்தப் பகுதியில் செய்திகள் விரைவில் வெளியாகும்.</p>}
            </section>

          </div>

          {categorySections.map(section => section.articles.length > 0 && <section key={section.id} className="customer-lazy-section mt-10">
            <div className="mb-4 flex items-center justify-between border-b-2 border-red-600 pb-2">
              <h2 className="text-base font-black text-slate-900">{section.name}</h2>
              <Link href={`/category/${section.slug}`} className="flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">அனைத்தையும் பார்க்க <ChevronRight className="h-3.5 w-3.5"/></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.articles.map(article => <article key={article.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <Link href={`/news/${article.slug}`} className="relative block aspect-video bg-slate-100">
                  {article.featuredImage ? <Image src={article.featuredImage} alt="" fill className="object-cover"/> : <span className="flex h-full items-center justify-center text-xs text-slate-400">படம் இல்லை</span>}
                </Link>
                <div className="p-4"><Link href={`/news/${article.slug}`}><h3 className="line-clamp-2 text-sm font-bold leading-snug hover:text-red-600">{article.title}</h3></Link><p className="mt-2 text-[11px] text-slate-400">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("ta-LK") : "இப்போது"}</p></div>
              </article>)}
            </div>
          </section>)}

        </main>
      </div>

      <SiteFooter />

    </div>
  );
}

function HomePageSkeleton() {
  return (
    <div className="customer-home min-h-screen bg-slate-50 text-slate-900" aria-busy="true">
      <div className="sticky top-0 z-50 flex min-h-11 items-center gap-4 bg-[var(--customer-accent-deep)] px-3 text-white">
        <span className="text-xs font-black">அவசரம்</span>
        <span className="h-3 w-3/4 rounded bg-white/25" />
      </div>
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-xl font-black text-slate-900">சங்கதி</span>
          <span className="h-10 w-20 rounded-full bg-orange-100" />
        </div>
        <div className="mx-auto mt-3 h-10 max-w-7xl rounded-lg bg-slate-900" />
      </header>
      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4" aria-busy="true">
        <p role="status" className="mb-3 text-xs font-bold text-slate-500">செய்திகள் ஏற்றப்படுகின்றன…</p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="aspect-[16/10] bg-slate-200 sm:aspect-video" />
          <div className="space-y-3 p-5 sm:p-7">
            <div className="h-5 w-28 rounded-full bg-orange-100" />
            <div className="h-7 w-full rounded bg-slate-200" />
            <div className="h-7 w-4/5 rounded bg-slate-200" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
      </main>
    </div>
  );
}
