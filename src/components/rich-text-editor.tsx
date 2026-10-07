"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Heading2, Heading3, ImagePlus,
  Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, RemoveFormatting,
  Strikethrough, Underline, Undo2, Unlink, Video, X,
} from "lucide-react";

type Editor = ReturnType<typeof useEditor>;
type InsertDialog =
  | { type: "link"; url: string }
  | { type: "image"; url: string; alt: string }
  | { type: "youtube"; url: string };

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active || undefined} disabled={disabled} onClick={onClick} className={`flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md px-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-35 ${active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>{children}</button>;
}

function validUrl(value: string, type: InsertDialog["type"]) {
  try {
    const parsed = new URL(value);
    if (type === "link") return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function InsertMediaDialog({ dialog, onChange, onClose, onApply }: {
  dialog: InsertDialog;
  onChange: (dialog: InsertDialog) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const isImage = dialog.type === "image";
  const title = dialog.type === "link" ? "Add a link" : isImage ? "Insert image from URL" : "Embed YouTube video";
  const description = dialog.type === "link"
    ? "Link the selected words to a reliable web address."
    : isImage
      ? "Use a permanent public image URL. Add a description so screen readers can explain the image."
      : "Paste a public YouTube watch or share URL.";

  useEffect(() => {
    firstInputRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const apply = () => {
    const value = dialog.url.trim();
    if (!value) {
      setError("Enter a URL to continue.");
      firstInputRef.current?.focus();
      return;
    }
    if (!validUrl(value, dialog.type)) {
      setError(dialog.type === "link" ? "Enter a valid web, email, or telephone link." : "Enter a valid http or https URL.");
      firstInputRef.current?.focus();
      return;
    }
    setError("");
    onApply();
  };

  return createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="editor-dialog-title" aria-describedby="editor-dialog-description" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-6" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); apply(); } }}>
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Article body</p><h2 id="editor-dialog-title" className="mt-1 text-xl font-black text-slate-950">{title}</h2></div>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><X className="h-5 w-5"/></button>
      </div>
      <p id="editor-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <label className="mt-5 block text-sm font-bold text-slate-800">{isImage ? "Image URL" : dialog.type === "youtube" ? "YouTube URL" : "Destination URL"}
        <input ref={firstInputRef} type="url" value={dialog.url} onChange={(event) => { onChange({ ...dialog, url: event.target.value }); setError(""); }} placeholder={dialog.type === "youtube" ? "https://youtube.com/watch?v=…" : "https://…"} aria-invalid={Boolean(error)} aria-describedby={error ? "editor-dialog-error" : undefined} className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"/>
      </label>
      {isImage && <label className="mt-4 block text-sm font-bold text-slate-800">Image description <span className="font-normal text-slate-500">(recommended)</span>
        <input value={dialog.alt} onChange={(event) => onChange({ ...dialog, alt: event.target.value })} placeholder="Describe what readers should understand from the image" className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"/>
      </label>}
      {error && <p id="editor-dialog-error" role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="min-h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-5 font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600">Cancel</button>
        <button type="button" onClick={apply} className="min-h-11 cursor-pointer rounded-lg bg-blue-700 px-5 font-bold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">{dialog.type === "link" ? "Apply link" : isImage ? "Insert image" : "Embed video"}</button>
      </div>
    </section>
  </div>, document.body);
}

function Toolbar({ editor }: { editor: NonNullable<Editor> }) {
  const [dialog, setDialog] = useState<InsertDialog | null>(null);
  const closeDialog = useCallback(() => { setDialog(null); editor.chain().focus().run(); }, [editor]);
  const applyDialog = () => {
    if (!dialog) return;
    if (dialog.type === "link") editor.chain().focus().extendMarkRange("link").setLink({ href: dialog.url.trim() }).run();
    if (dialog.type === "image") editor.chain().focus().setImage({ src: dialog.url.trim(), alt: dialog.alt.trim() }).run();
    if (dialog.type === "youtube") editor.commands.setYoutubeVideo({ src: dialog.url.trim(), width: 720, height: 405 });
    setDialog(null);
  };

  return <>
    <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-slate-200 bg-white/95 p-2 backdrop-blur" role="toolbar" aria-label="Article formatting">
      <ToolButton label="Undo" disabled={!editor.can().undo()} onClick={()=>editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4"/></ToolButton><ToolButton label="Redo" disabled={!editor.can().redo()} onClick={()=>editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4"/></ToolButton><span className="mx-1 w-px bg-slate-200" aria-hidden="true"/>
      <ToolButton label="Bold" active={editor.isActive("bold")} onClick={()=>editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4"/></ToolButton><ToolButton label="Italic" active={editor.isActive("italic")} onClick={()=>editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4"/></ToolButton><ToolButton label="Underline" active={editor.isActive("underline")} onClick={()=>editor.chain().focus().toggleUnderline().run()}><Underline className="h-4 w-4"/></ToolButton><ToolButton label="Strikethrough" active={editor.isActive("strike")} onClick={()=>editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4"/></ToolButton>
      <span className="mx-1 w-px bg-slate-200" aria-hidden="true"/><ToolButton label="Heading 2" active={editor.isActive("heading",{level:2})} onClick={()=>editor.chain().focus().toggleHeading({level:2}).run()}><Heading2 className="h-4 w-4"/></ToolButton><ToolButton label="Heading 3" active={editor.isActive("heading",{level:3})} onClick={()=>editor.chain().focus().toggleHeading({level:3}).run()}><Heading3 className="h-4 w-4"/></ToolButton><ToolButton label="Bullet list" active={editor.isActive("bulletList")} onClick={()=>editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4"/></ToolButton><ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={()=>editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4"/></ToolButton><ToolButton label="Block quote" active={editor.isActive("blockquote")} onClick={()=>editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4"/></ToolButton>
      <span className="mx-1 w-px bg-slate-200" aria-hidden="true"/><ToolButton label="Align left" active={editor.isActive({textAlign:"left"})} onClick={()=>editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4"/></ToolButton><ToolButton label="Align center" active={editor.isActive({textAlign:"center"})} onClick={()=>editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4"/></ToolButton><ToolButton label="Align right" active={editor.isActive({textAlign:"right"})} onClick={()=>editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4"/></ToolButton>
      <span className="mx-1 w-px bg-slate-200" aria-hidden="true"/><ToolButton label="Add link" active={editor.isActive("link")} onClick={() => setDialog({ type: "link", url: (editor.getAttributes("link").href as string | undefined) || "https://" })}><Link2 className="h-4 w-4"/></ToolButton><ToolButton label="Remove link" disabled={!editor.isActive("link")} onClick={()=>editor.chain().focus().unsetLink().run()}><Unlink className="h-4 w-4"/></ToolButton><ToolButton label="Insert image from URL" onClick={() => setDialog({ type: "image", url: "https://", alt: "" })}><ImagePlus className="h-4 w-4"/></ToolButton><ToolButton label="Embed YouTube video" onClick={() => setDialog({ type: "youtube", url: "https://" })}><Video className="h-4 w-4"/></ToolButton><ToolButton label="Horizontal rule" onClick={()=>editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4"/></ToolButton><ToolButton label="Clear formatting" onClick={()=>editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting className="h-4 w-4"/></ToolButton>
    </div>
    {dialog && <InsertMediaDialog dialog={dialog} onChange={setDialog} onClose={closeDialog} onApply={applyDialog}/>}
  </>;
}

export function RichTextEditor({ initialContent = "" }: { initialContent?: string }) {
  const [html, setHtml] = useState(initialContent);
  const [text, setText] = useState("");
  const [, setSelectionRevision] = useState(0);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Image.configure({ allowBase64: false }), Youtube.configure({ nocookie: true, controls: true }), TextAlign.configure({ types: ["heading", "paragraph"] })],
    content: initialContent,
    editorProps: { attributes: { class: "tiptap min-h-[520px] px-6 py-7 outline-none md:px-10 md:py-9", lang: "ta", "aria-label": "Article body rich text editor" } },
    onUpdate: ({ editor: current }) => { setHtml(current.getHTML()); setText(current.getText()); },
    onCreate: ({ editor: current }) => setText(current.getText()),
    onSelectionUpdate: () => setSelectionRevision((value) => value + 1),
  });
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return <div className="newsroom-editor overflow-hidden rounded-xl border border-slate-300 bg-white shadow-inner focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
    <input type="hidden" name="content" value={html} required/>
    {editor ? <><Toolbar editor={editor}/><EditorContent editor={editor}/></> : <div className="min-h-[520px] animate-pulse bg-slate-50" aria-label="Loading editor"/>}
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500"><span>{words.toLocaleString()} words · {text.length.toLocaleString()} characters</span><span>About {minutes} min read · Saved when you use a workflow action</span></div>
  </div>;
}
