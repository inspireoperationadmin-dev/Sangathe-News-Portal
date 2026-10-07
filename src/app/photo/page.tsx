import { ArticleStatus, Locale } from "@prisma/client";
import { ArticleListing } from "@/components/article-listing";
import { PublicSection } from "@/components/public-section";
import { prisma } from "@/lib/prisma";
export const revalidate=60;
export default async function PhotoPage(){const articles=await prisma.article.findMany({where:{locale:Locale.ta,status:{in:[ArticleStatus.PUBLISHED,ArticleStatus.UPDATED,ArticleStatus.CORRECTED]},media:{some:{}}},orderBy:{publishedAt:"desc"},take:30,include:{category:true,author:{select:{name:true}}}});return <PublicSection title="புகைப்பட செய்திகள்" description="Photo stories and galleries from Sangathe."><ArticleListing articles={articles}/></PublicSection>}
