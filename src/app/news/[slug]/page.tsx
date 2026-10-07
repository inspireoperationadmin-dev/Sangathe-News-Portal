// src/app/news/[slug]/page.tsx
import { getArticleBySlug, getRelatedArticles, recordArticleView } from "@/queries/article";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { Clock, ArrowLeft, Newspaper } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { sanitizeArticleHtml } from "@/lib/article-content";
import { Locale } from "@prisma/client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug, Locale.ta);

  if (!article) {
    return { title: "செய்தி கிடைக்கவில்லை | சங்கதி" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const articleUrl = `${siteUrl}/news/${article.slug}`;
  const imageUrl = article.featuredImage ? new URL(article.featuredImage, siteUrl).toString() : `${siteUrl}/default-og.svg`;

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.summary || article.title,
    alternates: { canonical: articleUrl },
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.summary || article.title,
      url: articleUrl,
      siteName: "சங்கதி | Sangathe Media",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: article.title }],
      type: "article",
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      locale: "ta_LK",
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.summary || article.title,
      images: [imageUrl],
    },
  };
}

export default async function SingleArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug, Locale.ta);

  if (!article) {
    notFound();
  }

  // வாசிப்பு எண்ணிக்கையை அதிகரித்தல் & தொடர்புடைய செய்திகளை எடுத்தல்
  await recordArticleView(slug, Locale.ta);
  const relatedArticles = article.relatedFrom.length > 0 ? article.relatedFrom.map(item => item.relatedArticle) : await getRelatedArticles(article.categoryId, article.id, Locale.ta, 3);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const articleUrl = `${siteUrl}/news/${article.slug}`;

  // Google News Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.seoTitle || article.title,
    description: article.seoDescription || article.summary || article.title,
    image: article.featuredImage ? [new URL(article.featuredImage, siteUrl).toString()] : [],
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    inLanguage: "ta",
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    author: { "@type": "Organization", name: "சங்கதி" },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "சங்கதி",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.svg` },
    },
  };

  const safeContent = sanitizeArticleHtml(article.content);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-between">
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"முகப்பு",item:siteUrl},{"@type":"ListItem",position:2,name:article.category.name,item:`${siteUrl}/category/${article.category.slug}`},{"@type":"ListItem",position:3,name:article.title,item:articleUrl}]})}}/>

      <div>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 py-3.5 px-4 sticky top-0 z-30 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 text-slate-700 hover:text-red-600 transition text-xs font-bold">
              <ArrowLeft className="w-4 h-4" /> முகப்பிற்குத் திரும்பு
            </Link>
            <Link href="/" className="flex items-center gap-1.5 font-black text-xl text-slate-900">
              <Newspaper className="h-6 w-6 text-red-600" /> சங்கதி
            </Link>
          </div>
        </header>

        {/* Main Article */}
        <main className="max-w-4xl mx-auto px-4 py-6 md:py-10">
          <article className="bg-white p-5 md:p-10 rounded-2xl border border-slate-200 shadow-sm">
            
            {/* Category */}
            <span className="bg-red-50 text-red-600 text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">
              {article.category.name}
            </span>
            {article.isBreaking && <span className="ml-2 rounded-md bg-red-600 px-3 py-1 text-xs font-black text-white">பிரேக்கிங்</span>}
            {article.isDeveloping && <span className="ml-2 rounded-md bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">தொடரும் செய்தி</span>}
            {article.isExclusive && <span className="ml-2 rounded-md bg-violet-100 px-3 py-1 text-xs font-black text-violet-900">பிரத்தியேகம்</span>}

            {/* Title */}
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-4 leading-snug">
              {article.title}
            </h1>

            {/* Publication timestamp */}
            <div className="flex flex-wrap items-center justify-between py-3 border-y border-slate-100 text-xs text-slate-500 gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleString("ta-LK", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "இப்போது"}
                </span>

              </div>

              {/* Social Share Buttons (WhatsApp, Facebook, Telegram) */}
              <div className="flex items-center gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${article.title}\n\n${articleUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold transition shadow-sm"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-bold transition shadow-sm"
                >
                  Facebook
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1 rounded text-xs font-bold transition shadow-sm"
                >
                  Telegram
                </a>
                <a href={`https://x.com/intent/post?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noreferrer" className="rounded bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">X</a>
              </div>
            </div>

            {/* Featured Image */}
            {article.featuredImage && (
              <div className="my-6">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-sm bg-slate-100">
                  <Image
                    src={article.featuredImage}
                    alt={article.title}
                    fill
                    priority
                    sizes="(max-width: 896px) 100vw, 896px"
                    className="object-cover"
                  />
                </div>
                {article.imageCaption && (
                  <p className="text-xs text-slate-500 mt-2 text-center italic">
                    {article.imageCaption}
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            {article.summary && (
              <p className="text-base md:text-lg font-medium text-slate-700 leading-relaxed my-6 pb-6 border-b border-slate-100 italic">
                {article.summary}
              </p>
            )}

            {/* Content Body */}
            <div className="article-content text-base md:text-lg leading-relaxed text-slate-800" dangerouslySetInnerHTML={{ __html: safeContent }} />

            {article.videoUrl && <section className="mt-8"><h2 className="mb-3 text-lg font-black">Video</h2>{article.videoUrl.includes("youtube.com") || article.videoUrl.includes("youtu.be") ? <iframe src={article.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} title={article.title} className="aspect-video w-full rounded-xl border-0" allowFullScreen/> : <video src={article.videoUrl} controls className="w-full rounded-xl"/>}</section>}
            {article.audioUrl && <section className="mt-8"><h2 className="mb-3 text-lg font-black">Audio</h2><audio src={article.audioUrl} controls className="w-full"/></section>}
            {article.media.length > 0 && <section className="mt-8"><h2 className="mb-3 text-lg font-black">Photo gallery</h2><div className="grid gap-4 sm:grid-cols-2">{article.media.map(item => <figure key={item.media.id} className="overflow-hidden rounded-xl border border-slate-200"><Image src={item.media.url} alt={item.media.altText || item.media.title || article.title} width={800} height={450} className="aspect-video w-full object-cover"/>{(item.caption || item.media.caption) && <figcaption className="p-3 text-xs text-slate-500">{item.caption || item.media.caption}</figcaption>}</figure>)}</div></section>}
            {article.tags.length > 0 && <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-5">{article.tags.map(item => <Link key={item.tag.id} href={`/search?tag=${encodeURIComponent(item.tag.slug)}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700">#{item.tag.name}</Link>)}</div>}

          </article>

          {/* Related Articles Section (RFP Section 5) */}
          {relatedArticles.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-red-600">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                <h3 className="font-black text-slate-900 uppercase text-sm tracking-wide">
                  தொடர்புடைய செய்திகள் (Related Stories)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/news/${rel.slug}`}
                    className="bg-white p-3 rounded-xl border border-slate-200 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {rel.featuredImage && (
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-2 bg-slate-100">
                          <Image src={rel.featuredImage} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <h4 className="font-bold text-xs text-slate-900 hover:text-red-600 line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rel.publishedAt ? new Date(rel.publishedAt).toLocaleDateString("ta-LK") : "இப்போது"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>

      <SiteFooter />

    </div>
  );
}
