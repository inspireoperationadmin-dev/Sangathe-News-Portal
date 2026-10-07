import Link from "next/link";
import { Locale } from "@prisma/client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ArticleListing } from "@/components/article-listing";
import { PublicSection } from "@/components/public-section";
import { searchArticles } from "@/queries/article";

export default async function ArchivePage({searchParams}:{searchParams:Promise<{page?:string}>}){const params=await searchParams;const page=Math.max(1,Number.parseInt(params.page||"1",10)||1);const result=await searchArticles({page,pageSize:18},Locale.ta);return <PublicSection title="செய்திக் காப்பகம்" description={`${result.total} published stories in the Sangathe archive.`}><ArticleListing articles={result.articles}/>{result.pages>1&&<nav className="mt-8 flex items-center justify-center gap-3">{page>1&&<Link href={`/archive?page=${page-1}`} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-bold"><ArrowLeft className="h-4 w-4"/>Previous</Link>}<span className="text-sm font-bold">Page {page} of {result.pages}</span>{page<result.pages&&<Link href={`/archive?page=${page+1}`} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-bold">Next<ArrowRight className="h-4 w-4"/></Link>}</nav>}</PublicSection>}
