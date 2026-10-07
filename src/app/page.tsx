// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/actions/article";
import { getBreakingNews, getHomepageCategorySections, getHomepageFeaturedArticles, getLeadArticle, getMostReadArticles } from "@/queries/article";
import { SiteFooter } from "@/components/site-footer";
import { Flame, Clock, Newspaper, Search, ChevronRight, TrendingUp } from "lucide-react";
import { Locale } from "@prisma/client";
import { NewsletterNotice } from "@/components/newsletter-notice";

export const revalidate = 60;

export default async function HomePage({searchParams}:{searchParams:Promise<{newsletter?:string}>}) {
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
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col justify-between">
      <NewsletterNotice status={pageParams.newsletter}/>
      
      <div>
        {/* Breaking News Ticker */}
        {breakingNews.length > 0 && (
          <div className="bg-red-600 text-white text-xs py-1.5 px-3 shadow-inner">
            <div className="max-w-7xl mx-auto flex items-center gap-2">
              <span className="bg-black/30 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Flame className="w-3 h-3 fill-yellow-400 text-yellow-400" /> பிரேக்கிங்
              </span>
              <div className="overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                {breakingNews.map((news) => (
                  <Link
                    key={news.id}
                    href={`/news/${news.slug}`}
                    className="hover:underline font-semibold mr-6 inline-block text-[11px] md:text-xs"
                  >
                    {news.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Date Bar */}
        <div className="bg-slate-50 border-b border-slate-200 py-1.5 px-4 text-[11px] text-slate-500">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-medium capitalize">{todayDate}</span>
            <span className="font-semibold text-slate-700">இலங்கை & உலகச் செய்திகள்</span>
          </div>
        </div>

        {/* Main Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-slate-900 block leading-none">
                  சங்கதி
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                  SANGATHE MEDIA
                </span>
              </div>
            </Link>

            <Link href="/search" className="p-2 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-full transition">
              <Search className="w-5 h-5" />
            </Link>
          </div>

          {/* Horizontal Scroll Category Navigation */}
          <nav className="bg-slate-900 text-slate-200 text-xs">
            <div className="max-w-7xl mx-auto px-3 flex items-center space-x-5 py-2.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              <Link href="/" className="font-bold text-red-400 hover:text-white transition shrink-0">
                முகப்பு
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="hover:text-white transition font-semibold text-slate-300 shrink-0 text-xs"
                >
                  {cat.name}
                </Link>
              ))}
              <Link href="/regions" className="shrink-0 font-semibold text-slate-300 hover:text-white">பிராந்தியம்</Link>
              <Link href="/video" className="shrink-0 font-semibold text-slate-300 hover:text-white">வீடியோ</Link>
              <Link href="/photo" className="shrink-0 font-semibold text-slate-300 hover:text-white">புகைப்படம்</Link>
              <Link href="/archive" className="shrink-0 font-semibold text-slate-300 hover:text-white">காப்பகம்</Link>
            </div>
          </nav>
        </header>

        {/* Main News Content */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-8">
          {/* Lead Story */}
          {leadArticle && (
            <section className="mb-8">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6">
                  
                  <div className="lg:col-span-7">
                    <Link href={`/news/${leadArticle.slug}`} className="block relative aspect-video w-full overflow-hidden bg-slate-100">
                      {leadArticle.featuredImage ? (
                        <Image
                          src={leadArticle.featuredImage}
                          alt={leadArticle.title}
                          fill
                          priority
                          sizes="(max-width: 1024px) 100vw, 60vw"
                          className="object-cover hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                          படம் இல்லை
                        </div>
                      )}
                    </Link>
                  </div>

                  <div className="p-4 md:p-6 lg:col-span-5 flex flex-col justify-between">
                    <div>
                      <span className="bg-red-50 text-red-600 text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {leadArticle.category.name}
                      </span>
                      {leadArticle.isDeveloping && <span className="ml-2 rounded-md bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-900">தொடரும் செய்தி</span>}
                      {leadArticle.isExclusive && <span className="ml-2 rounded-md bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-900">பிரத்தியேகம்</span>}
                      <Link href={`/news/${leadArticle.slug}`}>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 mt-2 mb-3 hover:text-red-600 transition leading-snug">
                          {leadArticle.title}
                        </h1>
                      </Link>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                        {leadArticle.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-end text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {leadArticle.publishedAt ? new Date(leadArticle.publishedAt).toLocaleDateString("ta-LK") : "இப்போது"}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </section>
          )}

          {/* Grid Layout: Latest News (Left) + Most Read / Trending (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Latest News (8 Columns) */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-red-600">
                <h2 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-600 inline-block rounded-full"></span>
                  முதன்மைச் செய்திகள் (Featured News)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latestArticles.map((article) => (
                  <article
                    key={article.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <Link href={`/news/${article.slug}`} className="block relative aspect-video w-full overflow-hidden bg-slate-100">
                        {article.featuredImage ? (
                          <Image src={article.featuredImage} alt="" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">படம் இல்லை</div>
                        )}
                      </Link>
                      <div className="p-3.5">
                        <span className="text-[10px] font-bold text-red-600 uppercase">{article.category.name}</span>
                        <Link href={`/news/${article.slug}`}>
                          <h3 className="font-bold text-slate-900 mt-1 mb-1.5 hover:text-red-600 transition leading-snug line-clamp-2 text-sm">
                            {article.title}
                          </h3>
                        </Link>
                      </div>
                    </div>

                    <div className="px-3.5 pb-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-50">
                      <span>{new Date(article.createdAt).toLocaleDateString("ta-LK")}</span>
                      <Link href={`/news/${article.slug}`} className="text-red-600 font-bold hover:underline flex items-center gap-0.5 text-xs">
                        வாசிக்க <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Trending / Most Read Sidebar (4 Columns) - RFP Section 3 */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-slate-900">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <h2 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide">
                  அதிகம் வாசிக்கப்பட்டவை (Trending)
                </h2>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 divide-y divide-slate-100 shadow-sm">
                {mostReadArticles.map((art, idx) => (
                  <div key={art.id} className="py-3 flex items-start gap-3 group">
                    <span className="text-2xl font-black text-slate-300 group-hover:text-red-600 transition shrink-0 w-6">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{art.category.name}</span>
                      <Link href={`/news/${art.slug}`}>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-red-600 transition leading-snug line-clamp-2 mt-0.5">
                          {art.title}
                        </h4>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {categorySections.map(section => section.articles.length > 0 && <section key={section.id} className="mt-10">
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
