import { ArticleStatus, Role } from "@prisma/client";
import { FileText, Flame, GalleryHorizontal, ImageIcon, Search, Tags, Video, Volume2 } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ArticlePreview } from "@/components/article-preview";
import { ImageFilePicker } from "@/components/image-file-picker";
import { ArticleWorkflowButtons } from "@/components/article-workflow-buttons";
import Image from "next/image";
import { toColomboDateTimeInput } from "@/lib/datetime";

type CategoryOption = { id: string; name: string; slug: string };
type ArticleValues = {
  id?: string;
  title: string; categoryId: string; summary: string | null; content: string;
  featuredImage: string | null; imageCaption: string | null; seoTitle: string | null;
  seoDescription: string | null; status: ArticleStatus; isBreaking: boolean;
  isDeveloping: boolean; isExclusive: boolean;
  breakingExpiresAt: Date | null; scheduledAt: Date | null;
  correctionNote: string | null; editorialNote: string | null;
  location: string | null; people: string | null; videoUrl: string | null; audioUrl: string | null;
  tags?: { tag: { name: string } }[];
  media?: { media: { id: string; url: string; title: string | null; caption: string | null } }[];
  relatedFrom?: { relatedArticle: { id: string; title: string } }[];
};
type RelatedOption = { id: string; title: string };
type WorkflowAction = { value: string; label: string; primary: boolean; icon: "save" | "send" | "approve" | "return" };

function workflowActions(role: Role, status?: ArticleStatus): WorkflowAction[] {
  if (role === Role.REPORTER) {
    return [
      { value: ArticleStatus.DRAFT, label: "Save Draft", primary: false, icon: "save" },
      { value: ArticleStatus.SUBMITTED_FOR_REVIEW, label: "Submit for Review", primary: true, icon: "send" },
    ];
  }
  if (role === Role.SUB_EDITOR) {
    if (status === ArticleStatus.SUBMITTED_FOR_REVIEW) {
      return [
        { value: ArticleStatus.EDITING, label: "Save as Editing", primary: true, icon: "save" },
        { value: ArticleStatus.RETURNED, label: "Return to Reporter", primary: false, icon: "return" },
      ];
    }
    if (status === ArticleStatus.EDITING) {
      return [
        { value: ArticleStatus.RETURNED, label: "Return to Reporter", primary: false, icon: "return" },
        { value: ArticleStatus.SUBMITTED_FOR_APPROVAL, label: "Submit for Final Approval", primary: true, icon: "send" },
      ];
    }
    return [
      { value: ArticleStatus.EDITING, label: "Save Editing", primary: false, icon: "save" },
      { value: ArticleStatus.SUBMITTED_FOR_APPROVAL, label: "Submit for Final Approval", primary: true, icon: "send" },
    ];
  }
  if (status === ArticleStatus.PUBLISHED || status === ArticleStatus.UPDATED || status === ArticleStatus.CORRECTED) {
    return [
      { value: ArticleStatus.UPDATED, label: "Save Published Update", primary: false, icon: "save" },
      { value: ArticleStatus.CORRECTED, label: "Publish Correction", primary: true, icon: "send" },
    ];
  }
  if (status === ArticleStatus.SUBMITTED_FOR_REVIEW || status === ArticleStatus.SUBMITTED_FOR_APPROVAL || status === ArticleStatus.EDITING || status === ArticleStatus.RETURNED) {
    return [
      { value: ArticleStatus.RETURNED, label: "Return to Reporter", primary: false, icon: "return" },
      { value: ArticleStatus.APPROVED, label: "Approve Article", primary: true, icon: "approve" },
    ];
  }
  if (status === ArticleStatus.APPROVED || status === ArticleStatus.SCHEDULED) {
    return [
      { value: ArticleStatus.RETURNED, label: "Return to Reporter", primary: false, icon: "return" },
      { value: "RELEASE", label: "Schedule / Publish", primary: true, icon: "send" },
    ];
  }
  return [
    { value: ArticleStatus.APPROVED, label: "Approve Article", primary: false, icon: "approve" },
    { value: "RELEASE", label: "Schedule / Publish", primary: true, icon: "send" },
  ];
}

export function ArticleForm({ action, categories, role, article, relatedOptions = [] }: {
  action: (formData: FormData) => Promise<void>; categories: CategoryOption[]; role: Role; article?: ArticleValues; relatedOptions?: RelatedOption[];
}) {
  const field = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200";
  const isEditor = role === Role.ADMIN || role === Role.EDITOR;
  const actions = workflowActions(role, article?.status);

  return <form action={action} className="space-y-6">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500"><FileText className="h-4 w-4" aria-hidden="true"/>Story desk</p>
      </div>
      <div className="space-y-5 p-5 md:p-8">
        <label className="block text-sm font-bold text-slate-700">Headline
          <input name="title" required defaultValue={article?.title} placeholder="தமிழில் செய்தித் தலைப்பை எழுதுங்கள்…" className="mt-2 w-full border-0 border-b-2 border-slate-200 bg-transparent px-0 pb-3 text-xl font-extrabold leading-snug outline-none placeholder:text-slate-300 focus:border-blue-700 md:text-2xl"/>
        </label>
        <label className="block text-sm font-bold text-slate-700">Short summary
          <textarea name="summary" rows={3} defaultValue={article?.summary || ""} placeholder="வாசகருக்கு செய்தியின் முக்கியத்துவத்தைச் சுருக்கமாக விளக்குங்கள்…" className={field + " resize-y py-3 text-base font-normal leading-7"}/>
        </label>
      </div>
    </section>

    <section aria-labelledby="article-body-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div><h2 id="article-body-heading" className="text-lg font-black">Article body</h2><p className="text-sm text-slate-500">Write and format the complete Tamil story.</p></div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">Rich text</span>
      </div>
      <RichTextEditor initialContent={article?.content || ""}/>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <h2 className="flex items-center gap-2 text-lg font-black"><GalleryHorizontal className="h-5 w-5 text-blue-700"/>Multimedia and discovery</h2>
      <p className="mt-1 text-sm text-slate-500">Add gallery images, media embeds and information readers can search for.</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label className="text-sm font-bold"><span className="flex items-center gap-2"><Tags className="h-4 w-4"/>Tags</span><input name="tags" defaultValue={article?.tags?.map(item => item.tag.name).join(", ") || ""} placeholder="politics, Jaffna, election" className={field}/><span className="mt-1 block text-xs font-normal text-slate-500">Separate tags with commas.</span></label>
        <label className="text-sm font-bold">Location<input name="location" defaultValue={article?.location || ""} placeholder="Jaffna" className={field}/></label>
        <label className="text-sm font-bold">People mentioned<input name="people" defaultValue={article?.people || ""} placeholder="Names separated by commas" className={field}/></label>
        <label className="text-sm font-bold"><span className="flex items-center gap-2"><Video className="h-4 w-4"/>Video or YouTube URL</span><input type="url" name="videoUrl" defaultValue={article?.videoUrl || ""} placeholder="https://youtube.com/watch?v=…" className={field}/></label>
        <label className="text-sm font-bold"><span className="flex items-center gap-2"><Volume2 className="h-4 w-4"/>Audio URL</span><input type="url" name="audioUrl" defaultValue={article?.audioUrl || ""} placeholder="https://…/audio.mp3" className={field}/></label>
        <ImageFilePicker name="galleryFiles" multiple maxFiles={12} helpText="Up to 12 images. Preview or remove selections before saving."/>
      </div>
      {article?.media && article.media.length > 0 && <div className="mt-5"><p className="text-sm font-black text-slate-700">Saved gallery images</p><div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">{article.media.map(item => <div key={item.media.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"><Image src={item.media.url} alt={item.media.title || "Gallery image"} width={480} height={270} className="aspect-video w-full object-cover"/><p className="truncate p-2 text-xs text-slate-500">{item.media.caption || item.media.title || "Gallery image"}</p><label className="flex min-h-11 cursor-pointer items-center gap-2 border-t border-red-100 bg-red-50 px-2 text-xs font-bold text-red-800"><input type="checkbox" name="removeMediaIds" value={item.media.id}/>Remove when saved</label></div>)}</div></div>}
      {role !== Role.REPORTER && relatedOptions.length > 0 && <label className="mt-5 block text-sm font-bold">Related articles<select name="relatedArticleIds" multiple defaultValue={article?.relatedFrom?.map(item => item.relatedArticle.id) || []} className={field + " min-h-40 py-2"}>{relatedOptions.filter(option => option.id !== article?.id).map(option => <option key={option.id} value={option.id}>{option.title}</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-500">Use Ctrl or Command to select up to six stories.</span></label>}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <h2 className="text-lg font-black">Story details</h2>
      <p className="mt-1 text-sm text-slate-500">Classify the story and add its lead image after writing.</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <label className="text-sm font-bold">Category
          <select name="categoryId" required defaultValue={article?.categoryId} className={field}>
            <option value="">Select a category</option>
            {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-black"><ImageIcon className="h-4 w-4 text-emerald-700" aria-hidden="true"/>Featured image</h3>
          <div className="mt-3"><ImageFilePicker name="imageFile" helpText="JPG, PNG, WebP or GIF, maximum 8 MB. Preview or remove it before saving."/></div>
          <label className="mt-4 block text-sm font-bold">Image caption<input name="imageCaption" defaultValue={article?.imageCaption || ""} className={field}/></label>
          {article?.featuredImage && <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white"><Image src={article.featuredImage} alt={article.imageCaption || article.title} width={800} height={450} className="aspect-video w-full object-cover"/><p className="break-all p-3 text-xs text-slate-500">{article.featuredImage}</p><label className="flex min-h-11 cursor-pointer items-center gap-2 border-t border-red-100 bg-red-50 px-3 text-sm font-bold text-red-800"><input type="checkbox" name="removeFeaturedImage"/>Remove current featured image when saved</label></div>}
        </div>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <h2 className="text-lg font-black">Desk notes</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-bold">Internal editorial note
          <textarea name="editorialNote" rows={4} defaultValue={article?.editorialNote || ""} className={field + " resize-y py-2 font-normal"}/>
          <span className="mt-1 block text-xs font-normal text-slate-500">Visible only inside the newsroom.</span>
        </label>
        {article && <label className="block text-sm font-bold">Revision or return note
          <textarea name="changeNote" rows={4} className={field + " resize-y py-2 font-normal"} placeholder="Describe the changes, or explain what the reporter must correct"/>
          <span className="mt-1 block text-xs font-normal text-slate-500">Required when returning an article to its reporter.</span>
        </label>}
      </div>
    </section>

    {role !== Role.REPORTER && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <h2 className="flex items-center gap-2 text-lg font-black"><Search className="h-5 w-5 text-blue-700" aria-hidden="true"/>Search metadata</h2>
      <p className="mt-1 text-sm text-slate-500">Editorial desk fields for Google Search and News readiness.</p>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-bold">SEO headline<input name="seoTitle" defaultValue={article?.seoTitle || ""} maxLength={70} className={field}/></label>
        <label className="block text-sm font-bold">Meta description<textarea name="seoDescription" rows={3} defaultValue={article?.seoDescription || ""} maxLength={180} className={field + " resize-y py-2"}/></label>
      </div>
    </section>}

    {isEditor && <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm md:p-7">
      <h2 className="flex items-center gap-2 text-lg font-black text-red-800"><Flame className="h-5 w-5" aria-hidden="true"/>Editor controls</h2>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 font-bold text-red-800"><input type="checkbox" name="isBreaking" defaultChecked={article?.isBreaking}/>Breaking news</label>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 font-bold text-amber-900"><input type="checkbox" name="isDeveloping" defaultChecked={article?.isDeveloping}/>Developing story</label>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 px-3 font-bold text-violet-900"><input type="checkbox" name="isExclusive" defaultChecked={article?.isExclusive}/>Exclusive story</label>
          <label className="mt-4 block text-sm font-bold">Breaking status expires (Sri Lanka time)<input type="datetime-local" name="breakingExpiresAt" defaultValue={toColomboDateTimeInput(article?.breakingExpiresAt)} className={field}/></label>
        </div>
        <label id="correction-note" className="block text-sm font-bold">Internal correction record<textarea name="correctionNote" rows={4} defaultValue={article?.correctionNote || ""} placeholder="Record what was corrected and why." className={field + " resize-y py-2 font-normal"}/><span className="mt-1 block text-xs font-normal text-slate-500">Required when using “Publish Correction”. Visible only inside the newsroom CMS.</span></label>
      </div>
      <label className="mt-5 block max-w-md text-sm font-bold">Scheduled publication (Sri Lanka time)
        <input type="datetime-local" name="scheduledAt" defaultValue={toColomboDateTimeInput(article?.scheduledAt)} className={field}/>
        <span className="mt-1 block text-xs font-normal text-slate-500">Choose a future Sri Lanka date and time. Leave empty to publish immediately.</span>
      </label>
      <label className="mt-4 flex min-h-11 max-w-md cursor-pointer items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 font-bold text-blue-900"><input type="checkbox" name="sendNotification"/>Notify push subscribers when this article is published</label>
    </section>}

    <section className="sticky bottom-3 z-20 rounded-2xl border border-slate-300 bg-white/95 p-4 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-black">Workflow actions</p><p className="text-xs text-slate-500">Your selected action is recorded in the article history.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <ArticlePreview existingImage={article?.featuredImage}/>
          <ArticleWorkflowButtons actions={actions}/>
        </div>
      </div>
    </section>
  </form>;
}
