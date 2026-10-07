import { ArticleStatus, Locale } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic="force-dynamic";
function xml(value:string){return value.replace(/[<>&'\"]/g,character=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[character]!));}
export async function GET(){const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";const since=new Date(Date.now()-48*60*60*1000);const articles=await prisma.article.findMany({where:{locale:Locale.ta,status:{in:[ArticleStatus.PUBLISHED,ArticleStatus.UPDATED,ArticleStatus.CORRECTED]},publishedAt:{gte:since}},orderBy:{publishedAt:"desc"},take:1000,select:{slug:true,title:true,publishedAt:true}});const body=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${articles.map(article=>`<url><loc>${xml(`${siteUrl}/news/${article.slug}`)}</loc><news:news><news:publication><news:name>சங்கதி</news:name><news:language>ta</news:language></news:publication><news:publication_date>${article.publishedAt?.toISOString()}</news:publication_date><news:title>${xml(article.title)}</news:title></news:news></url>`).join("")}</urlset>`;return new Response(body,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, s-maxage=600, stale-while-revalidate=1200"}});}
