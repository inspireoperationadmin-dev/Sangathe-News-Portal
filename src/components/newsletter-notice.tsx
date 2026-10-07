"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

export function NewsletterNotice({ status }: { status?: string }) {
  const [shown, setShown] = useState(status === "ok" || status === "invalid");

  useEffect(() => {
    if (status !== "ok" && status !== "invalid") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("newsletter");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    const timer = window.setTimeout(() => setShown(false), 4500);
    return () => window.clearTimeout(timer);
  }, [status]);

  if (!shown) return null;
  const success = status === "ok";
  return <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm" role={success ? "status" : "alert"} aria-live="polite">
    <div className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-2xl ${success ? "border-emerald-200" : "border-red-200"}`}>
      {success ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true"/> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true"/>}
      <div className="min-w-0 flex-1"><p className={`font-black ${success ? "text-emerald-900" : "text-red-900"}`}>{success ? "Subscription confirmed" : "Email address not accepted"}</p><p className="mt-1 text-sm leading-5 text-slate-600">{success ? "You are now subscribed to the Sangathe newsletter." : "Enter a valid email address and try again."}</p></div>
      <button type="button" onClick={() => setShown(false)} aria-label="Dismiss message" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"><X className="h-4 w-4"/></button>
    </div>
  </div>;
}
