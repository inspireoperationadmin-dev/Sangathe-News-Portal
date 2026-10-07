"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, RotateCcw, Save, Send } from "lucide-react";

type WorkflowAction = { value: string; label: string; primary: boolean; icon: "save" | "send" | "approve" | "return" };

function ActionIcon({ type }: { type: WorkflowAction["icon"] }) {
  if (type === "save") return <Save className="h-4 w-4" aria-hidden="true"/>;
  if (type === "approve") return <CheckCircle2 className="h-4 w-4" aria-hidden="true"/>;
  if (type === "return") return <RotateCcw className="h-4 w-4" aria-hidden="true"/>;
  return <Send className="h-4 w-4" aria-hidden="true"/>;
}

export function ArticleWorkflowButtons({ actions }: { actions: WorkflowAction[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(false);
  const [submittingValue, setSubmittingValue] = useState<string | null>(null);

  useEffect(() => {
    const form = containerRef.current?.closest("form");
    if (!form) return;
    const protectSubmission = (event: SubmitEvent) => {
      if (lockedRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      lockedRef.current = true;
      const submitter = event.submitter;
      setSubmittingValue(submitter instanceof HTMLButtonElement ? submitter.value : actions[0]?.value || "submitting");
    };
    form.addEventListener("submit", protectSubmission);
    return () => form.removeEventListener("submit", protectSubmission);
  }, [actions]);

  return <div ref={containerRef} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
    {actions.map(item => {
      const submitting = submittingValue === item.value;
      return <button key={item.value} type="submit" name="status" value={item.value} disabled={submittingValue !== null} aria-busy={submitting || undefined} className={"flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60 " + (item.primary ? "bg-blue-700 text-white hover:bg-blue-800 focus-visible:outline-blue-700" : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-slate-600")}>
        {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true"/> : <ActionIcon type={item.icon}/>} {submitting ? "Saving…" : item.label}
      </button>;
    })}
  </div>;
}
