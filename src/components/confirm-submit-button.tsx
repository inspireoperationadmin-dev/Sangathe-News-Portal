"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, LogOut, X } from "lucide-react";

export function ConfirmSubmitButton({
  children,
  className,
  disabled = false,
  ariaLabel,
  title,
  dialogTitle,
  description,
  confirmLabel,
  kind = "delete",
}: {
  children: React.ReactNode;
  className: string;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
  dialogTitle: string;
  description: string;
  confirmLabel: string;
  kind?: "delete" | "signout";
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const close = useCallback(() => {
    if (submitting) return;
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, [submitting]);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !submitting) close(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, submitting, close]);

  const confirm = () => {
    const form = triggerRef.current?.form;
    if (!form) { setOpen(false); return; }
    setSubmitting(true);
    form.requestSubmit();
  };

  return <>
    <button ref={triggerRef} type="button" disabled={disabled} aria-label={ariaLabel} title={title} onClick={() => setOpen(true)} className={className}>{children}</button>
    {open && createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${kind === "delete" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{kind === "delete" ? <AlertTriangle className="h-6 w-6"/> : <LogOut className="h-6 w-6"/>}</span>
          <button type="button" onClick={close} disabled={submitting} aria-label="Close confirmation" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><X className="h-5 w-5"/></button>
        </div>
        <h2 id={titleId} className="mt-4 text-xl font-black text-slate-950">{dialogTitle}</h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={close} disabled={submitting} className="min-h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-5 font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
          <button type="button" onClick={confirm} disabled={submitting} className={`min-h-11 cursor-pointer rounded-lg px-5 font-bold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70 ${kind === "delete" ? "bg-red-700 hover:bg-red-800 focus-visible:outline-red-700" : "bg-slate-950 hover:bg-slate-800 focus-visible:outline-slate-950"}`}>{submitting ? "Please wait…" : confirmLabel}</button>
        </div>
      </section>
    </div>, document.body)}
  </>;
}
