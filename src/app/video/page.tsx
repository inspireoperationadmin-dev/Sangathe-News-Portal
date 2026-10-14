import { ArticleStatus, Locale } from "@prisma/client";
import { ArticleListing } from "@/components/article-listing";
import { PublicSection } from "@/components/public-section";
import { prisma } from "@/lib/prisma";
export default async function VideoPage(){const articles=await prisma.article.findMany({where:{locale:Locale.ta,status:{in:[ArticleStatus.PUBLISHED,ArticleStatus.UPDATED,ArticleStatus.CORRECTED]},videoUrl:{not:null}},orderBy:{publishedAt:"desc"},take:30,include:{category:true,author:{select:{name:true}}}});return <PublicSection title="வீடியோ செய்திகள்" description="Video reports, interviews and explainers from Sangathe."><ArticleListing articles={articles}/></PublicSection>}
