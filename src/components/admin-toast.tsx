"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

export function AdminToast({ success, error }: { success?: string; error?: string }) {
  const message = error || success;
  const isError = Boolean(error);
  const [shown, setShown] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("success");
    url.searchParams.delete("error");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    const timer = window.setTimeout(() => setShown(false), isError ? 6500 : 4500);
    return () => window.clearTimeout(timer);
  }, [isError, message]);

  if (!shown || !message) return null;
  return <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm" role={isError ? "alert" : "status"} aria-live={isError ? "assertive" : "polite"}>
    <div className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-2xl ${isError ? "border-red-200" : "border-emerald-200"}`}>
      {isError ? <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true"/> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true"/>}
      <div className="min-w-0 flex-1"><p className={`font-black ${isError ? "text-red-900" : "text-emerald-900"}`}>{isError ? "Action needs attention" : "Action completed"}</p><p className="mt-1 text-sm leading-5 text-slate-600">{message}</p></div>
      <button type="button" onClick={() => setShown(false)} aria-label="Dismiss notification" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><X className="h-4 w-4"/></button>
    </div>
  </div>;
}
