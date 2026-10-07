import { MediaType, Role } from "@prisma/client";
import { Film, ImageIcon, Music, Trash2, Upload } from "lucide-react";
import { deleteMedia, uploadMedia } from "@/actions/media";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2Status } from "@/lib/r2";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { CopyUrlButton } from "@/components/copy-url-button";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";
export default async function MediaPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const user = await requireUser([Role.ADMIN, Role.EDITOR, Role.SUB_EDITOR]);
  const params = await searchParams;
  const storage = r2Status();
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { uploadedBy: { select: { name: true } }, _count: { select: { articles: true } } } });
  const field = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";
  return <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 md:px-6"><header><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Reusable newsroom files</p><h1 className="mt-1 text-3xl font-black">Media library</h1><p className="mt-2 text-slate-600">Upload and review images, video and audio stored permanently in Cloudflare R2.</p></header>
    <AdminToast key={params.error || params.success || "none"} success={params.success} error={params.error}/>
    <section className={`rounded-xl border p-4 ${storage.configured ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-950"}`}><p className="font-black">Cloudflare R2: {storage.configured ? "Configured" : "Configuration required"}</p><p className="mt-1 text-sm">{storage.configured ? `New uploads are stored at ${storage.publicUrl}.` : "Add the five R2 environment variables before uploading media."}</p></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-black"><Upload className="h-5 w-5 text-blue-700"/>Upload media</h2><form action={uploadMedia} className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4"><label className="text-sm font-bold">File<input type="file" name="file" required accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,audio/mpeg,audio/wav" className={field+" py-2"}/></label><label className="text-sm font-bold">Title<input name="title" className={field}/></label><label className="text-sm font-bold">Caption<input name="caption" className={field}/></label><label className="text-sm font-bold">Alternative text<input name="altText" className={field}/></label><button className="min-h-11 rounded-lg bg-blue-700 px-4 font-bold text-white">Upload to library</button></form></section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{assets.map(asset=><article key={asset.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{asset.type===MediaType.IMAGE?<Image src={asset.url} alt={asset.altText||asset.title||""} width={640} height={360} className="aspect-video w-full object-cover"/>:<div className="flex aspect-video items-center justify-center bg-slate-900 text-white">{asset.type===MediaType.VIDEO?<Film className="h-12 w-12"/>:<Music className="h-12 w-12"/>}</div>}<div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{asset.title||asset.url}</p><p className="mt-1 text-xs text-slate-500">{asset.type} · {asset.storageProvider} · {Math.ceil((asset.fileSize||0)/1024)} KB · {asset.uploadedBy.name}</p><p className="mt-1 text-xs text-slate-500">Used in {asset._count.articles} article(s)</p></div>{(user.role===Role.ADMIN||user.role===Role.EDITOR)&&<form action={deleteMedia}><input type="hidden" name="id" value={asset.id}/><ConfirmSubmitButton disabled={asset._count.articles>0} ariaLabel="Delete media" title="Delete media" dialogTitle="Delete this media file?" description={`“${asset.title || asset.url}” will be removed from storage and the media library. This action cannot be undone.`} confirmLabel="Delete media" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-4 w-4"/></ConfirmSubmitButton></form>}</div><div className="mt-3 flex items-start gap-2"><code className="min-w-0 flex-1 break-all rounded bg-slate-100 p-3 text-xs leading-5 text-slate-700">{asset.url}</code><CopyUrlButton value={asset.url}/></div></div></article>)}</section>
    {assets.length===0&&<div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500"><ImageIcon className="mx-auto mb-3 h-10 w-10"/>No media uploaded yet.</div>}
  </main>;
}
