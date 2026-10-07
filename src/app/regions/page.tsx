import Link from "next/link";
import { ArticleStatus, Locale } from "@prisma/client";
import { PublicSection } from "@/components/public-section";
import { prisma } from "@/lib/prisma";
export const revalidate=60;
export default async function RegionsPage(){const locations=await prisma.article.findMany({where:{locale:Locale.ta,status:{in:[ArticleStatus.PUBLISHED,ArticleStatus.UPDATED,ArticleStatus.CORRECTED]},location:{not:null}},distinct:["location"],orderBy:{location:"asc"},select:{location:true}});return <PublicSection title="பிராந்திய செய்திகள்" description="Browse published news by location."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{locations.map(item=><Link key={item.location} href={`/search?location=${encodeURIComponent(item.location||"")}`} className="rounded-xl border border-slate-200 bg-white p-5 font-black shadow-sm hover:border-red-300 hover:text-red-600">{item.location}</Link>)}</div>{locations.length===0&&<p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">No regional stories have been tagged with a location yet.</p>}</PublicSection>}
