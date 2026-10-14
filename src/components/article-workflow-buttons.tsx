"use client";

import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
  Save,
  Send,
} from "lucide-react";

type WorkflowAction = {
  value: string;
  label: string;
  primary: boolean;
  icon: "save" | "send" | "approve" | "return";
};

function ActionIcon({ type }: { type: WorkflowAction["icon"] }) {
  const className = "h-4 w-4 shrink-0";

  if (type === "save") {
    return <Save className={className} aria-hidden="true" />;
  }

  if (type === "approve") {
    return <CheckCircle2 className={className} aria-hidden="true" />;
  }

  if (type === "return") {
    return <RotateCcw className={className} aria-hidden="true" />;
  }

  return <Send className={className} aria-hidden="true" />;
}

function pendingLabel(action: WorkflowAction) {
  if (action.icon === "return") return "Returning…";
  if (action.icon === "approve") return "Approving…";
  if (action.value === "RELEASE") return "Processing…";
  if (action.icon === "send") return "Submitting…";
  return "Saving…";
}

export function ArticleWorkflowButtons({
  actions,
}: {
  actions: WorkflowAction[];
}) {
  const { pending, data } = useFormStatus();
  const submittedStatus = data?.get("status");

  const selectedAction = actions.find(
    (action) => action.value === submittedStatus,
  );

  return (
    <div className="sng-workflow flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
      <style>{`
        .sng-workflow .sng-workflow-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 48px;
          padding: 12px 20px;
          border: 1px solid #dbe3ee;
          border-radius: 12px;
          background: linear-gradient(145deg, #ffffff, #f8fafc);
          color: #334155;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.5;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.95),
            0 4px 10px -8px rgba(15,23,42,.3);
          transition:
            transform .2s ease,
            box-shadow .2s ease,
            border-color .2s ease;
        }

        .sng-workflow .sng-workflow-button.is-primary {
          border-color: #2563eb;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.2),
            0 6px 16px -9px rgba(37,99,235,.6);
        }

        .sng-workflow .sng-workflow-button.is-return {
          border-color: #fde68a;
          background: linear-gradient(145deg, #ffffff, #fffbeb);
          color: #92400e;
        }

        .sng-workflow .sng-workflow-button:focus-visible {
          outline: 3px solid #60a5fa;
          outline-offset: 3px;
        }

        .sng-workflow .sng-workflow-button:disabled {
          cursor: wait;
          opacity: .55;
        }

        .sng-workflow .sng-workflow-button.is-submitting {
          opacity: 1;
        }

        .sng-workflow .sng-workflow-button:active:not(:disabled) {
          transform: scale(.98);
        }

        .sng-workflow .sng-workflow-spinner {
          animation: sng-workflow-spin .85s linear infinite;
        }

        @media (hover: hover) {
          .sng-workflow .sng-workflow-button:hover:not(:disabled) {
            transform: translateY(-2px);
            border-color: #93c5fd;
            box-shadow: 0 9px 20px -12px rgba(37,99,235,.4);
          }

          .sng-workflow .sng-workflow-button.is-primary:hover:not(:disabled) {
            border-color: #1d4ed8;
            box-shadow: 0 10px 22px -12px rgba(37,99,235,.65);
          }

          .sng-workflow .sng-workflow-button.is-return:hover:not(:disabled) {
            border-color: #fbbf24;
            box-shadow: 0 9px 20px -12px rgba(180,83,9,.3);
          }
        }

        @keyframes sng-workflow-spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .sng-workflow .sng-workflow-button {
            transition: none !important;
          }

          .sng-workflow .sng-workflow-spinner {
            animation: none;
          }
        }
      `}</style>

      {actions.map((action) => {
        const submitting =
          pending && submittedStatus === action.value;

        const variant = action.primary
          ? "is-primary"
          : action.icon === "return"
            ? "is-return"
            : "";

        return (
          <button
            key={action.value}
            type="submit"
            name="status"
            value={action.value}
            disabled={pending}
            aria-busy={submitting || undefined}
            className={`sng-workflow-button ${variant} ${
              submitting ? "is-submitting" : ""
            }`}
          >
            {submitting ? (
              <LoaderCircle
                className="sng-workflow-spinner h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <ActionIcon type={action.icon} />
            )}

            <span>
              {submitting ? pendingLabel(action) : action.label}
            </span>
          </button>
        );
      })}

      <span role="status" aria-live="polite" className="sr-only">
        {pending
          ? selectedAction
            ? pendingLabel(selectedAction)
            : "Processing article…"
          : ""}
      </span>
    </div>
  );
}