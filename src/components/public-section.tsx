import Link from "next/link";
import { ArrowLeft, Newspaper } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export function PublicSection({title,description,children}:{title:string;description:string;children:React.ReactNode}){return <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"><Link href="/" className="flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft className="h-4 w-4"/>முகப்பு</Link><Link href="/" className="flex items-center gap-2 text-xl font-black"><Newspaper className="h-6 w-6 text-red-600"/>சங்கதி</Link></div></header><main className="mx-auto w-full max-w-7xl flex-1 px-4 py-9"><h1 className="text-3xl font-black md:text-4xl">{title}</h1><p className="mb-7 mt-2 text-sm text-slate-500">{description}</p>{children}</main><SiteFooter/></div>}
