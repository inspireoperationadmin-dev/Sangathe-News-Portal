// src/app/category/[slug]/page.tsx
import { getArticlesByCategory } from "@/queries/article";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ArrowLeft, ArrowRight, Newspaper, FolderOpen } from "lucide-react";
import { Locale } from "@prisma/client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60; // ஒவ்வொரு 60 விநாடிக்கும் பக்கம் புதுப்பிக்கப்படும்

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const categoryData = await getArticlesByCategory(slug, Locale.ta);

  if (!categoryData) {
    notFound();
  }

  const articles = categoryData.articles;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-700 hover:text-red-600 transition text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> முகப்பிற்குத் திரும்பு
          </Link>
          <Link href="/" className="flex items-center gap-1.5 font-black text-xl text-slate-900">
            <Newspaper className="h-6 w-6 text-red-600" /> சங்கதி
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Category Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">
              {categoryData.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              மொத்தம் {articles.length} செய்திகள் இப்பிரிவில் உள்ளன
            </p>
          </div>
        </div>

        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            இப்பிரிவில் தற்போது செய்திகள் எதுவும் இல்லை.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {article.featuredImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      படம் இல்லை
                    </div>
                  )}

                  <div className="p-4">
                    <Link href={`/news/${article.slug}`}>
                      <h2 className="font-bold text-slate-900 mt-1 mb-2 hover:text-red-600 transition leading-snug line-clamp-2">
                        {article.title}
                      </h2>
                    </Link>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString("ta-LK")
                      : "இப்போது"}
                  </span>
                  <Link
                    href={`/news/${article.slug}`}
                    className="text-red-600 font-bold hover:underline flex items-center gap-0.5"
                  >
                    வாசிக்க <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

      </main>

    </div>
  );
}