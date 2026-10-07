"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

type Preview = { file: File; url: string };

export function ImageFilePicker({ name, multiple = false, maxFiles = 1, helpText }: {
  name: string;
  multiple?: boolean;
  maxFiles?: number;
  helpText: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);

  useEffect(() => () => urlsRef.current.forEach(url => URL.revokeObjectURL(url)), []);

  const updatePreviews = (files: File[]) => {
    urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    const next = files.map(file => ({ file, url: URL.createObjectURL(file) }));
    urlsRef.current = next.map(item => item.url);
    setPreviews(next);
  };

  const setInputFiles = (files: File[]) => {
    const input = inputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    files.forEach(file => transfer.items.add(file));
    input.files = transfer.files;
    updatePreviews(files);
  };

  const selectFiles = () => {
    const files = Array.from(inputRef.current?.files || []).slice(0, maxFiles);
    setInputFiles(files);
  };

  const removeFile = (index: number) => {
    const files = Array.from(inputRef.current?.files || []).filter((_, fileIndex) => fileIndex !== index);
    setInputFiles(files);
  };

  return <div>
    <label htmlFor={inputId} className="block text-sm font-bold">{multiple ? "Choose gallery images" : "Upload image"}</label>
    <input ref={inputRef} id={inputId} type="file" name={name} multiple={multiple} accept="image/jpeg,image/png,image/webp,image/gif" onChange={selectFiles} className="mt-2 min-h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-200"/>
    <span className="mt-1 block text-xs font-normal text-slate-500">{helpText}</span>

    {previews.length > 0 && <div className={`mt-4 grid gap-3 ${multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"}`} aria-live="polite">
      {previews.map((preview, index) => <figure key={`${preview.file.name}-${preview.file.lastModified}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="relative">
          <img src={preview.url} alt={`Selected preview: ${preview.file.name}`} className={`w-full object-cover ${multiple ? "aspect-video" : "max-h-72"}`}/>
          <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${preview.file.name}`} title="Remove selected image" className="absolute right-2 top-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-slate-950/85 text-white shadow-lg transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><X className="h-4 w-4"/></button>
        </div>
        <figcaption className="flex items-center gap-2 p-2 text-xs text-slate-600"><ImagePlus className="h-3.5 w-3.5 shrink-0"/><span className="truncate">{preview.file.name}</span><span className="ml-auto shrink-0 text-slate-400">{Math.max(1, Math.ceil(preview.file.size / 1024))} KB</span></figcaption>
      </figure>)}
    </div>}
  </div>;
}
