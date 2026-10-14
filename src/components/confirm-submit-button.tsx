"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal, useFormStatus } from "react-dom";
import {
  AlertTriangle,
  ArrowRight,
  LoaderCircle,
  LogOut,
  Trash2,
  X,
} from "lucide-react";

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
  children: ReactNode;
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
  const { pending } = useFormStatus();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const confirmingRef = useRef(false);

  const titleId = useId();
  const descriptionId = useId();
  const isDelete = kind === "delete";

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const elements =
        dialogRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not([disabled])",
        );

      if (!elements?.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      const current = document.activeElement;
      const outside = !dialogRef.current?.contains(current);

      if (event.shiftKey && (current === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    const keepFocusInside = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        !dialogRef.current?.contains(event.target)
      ) {
        cancelRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("focusin", keepFocusInside);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("focusin", keepFocusInside);

      if (!triggerRef.current?.disabled) {
        triggerRef.current?.focus();
      }
    };
  }, [open, close]);

  const confirm = () => {
    if (pending || disabled || confirmingRef.current) return;

    const form = triggerRef.current?.form;
    const submitter = submitRef.current;

    if (!form || !submitter) {
      close();
      return;
    }

    // Close first so native validation can focus an invalid form field.
    close();

    if (!form.reportValidity()) return;

    confirmingRef.current = true;

    try {
      form.requestSubmit(submitter);
    } finally {
      queueMicrotask(() => {
        confirmingRef.current = false;
      });
    }
  };

  return (
    <>
      <style>{`
        .sng-confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 120;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15,23,42,.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .sng-confirm-dialog {
          position: relative;
          width: 100%;
          max-width: 440px;
          max-height: calc(100dvh - 40px);
          overflow-y: auto;
          border: 1px solid rgba(255,255,255,.75);
          border-radius: 24px;
          background: rgba(255,255,255,.98);
          padding: 28px;
          box-shadow:
            0 25px 80px -25px rgba(15,23,42,.5),
            inset 0 1px 0 white;
          animation: sng-confirm-enter .22s ease both;
        }

        .sng-confirm-dialog .sng-confirm-icon {
          display: flex;
          width: 58px;
          height: 58px;
          align-items: center;
          justify-content: center;
          border: 1px solid #fecdd3;
          border-radius: 19px;
          background: linear-gradient(145deg, white, #fff1f2);
          color: #e11d48;
          box-shadow:
            4px 4px 10px rgba(148,163,184,.12),
            -2px -2px 6px white;
        }

        .sng-confirm-dialog.is-signout .sng-confirm-icon {
          border-color: #bfdbfe;
          background: linear-gradient(145deg, white, #eff6ff);
          color: #2563eb;
        }

        .sng-confirm-close {
          display: flex;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: background .2s ease, color .2s ease;
        }

        .sng-confirm-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 46px;
          padding: 12px 18px;
          border: 1px solid #dbe3ee;
          border-radius: 12px;
          background: linear-gradient(145deg, white, #f8fafc);
          color: #475569;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: inset 0 1px 0 white;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .sng-confirm-action.is-danger {
          border-color: #e11d48;
          background: linear-gradient(135deg, #f43f5e, #e11d48);
          color: white;
          box-shadow: 0 6px 16px -10px rgba(225,29,72,.6);
        }

        .sng-confirm-action.is-signout {
          border-color: #2563eb;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 6px 16px -10px rgba(37,99,235,.6);
        }

        .sng-confirm-dialog button:focus-visible {
          outline: 3px solid #60a5fa;
          outline-offset: 3px;
        }

        .sng-confirm-loading {
          animation: sng-confirm-spin .85s linear infinite;
        }

        @media (hover: hover) {
          .sng-confirm-close:hover {
            background: #f1f5f9;
            color: #0f172a;
          }

          .sng-confirm-action:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 18px -12px rgba(15,23,42,.4);
          }
        }

        @media (max-width: 480px) {
          .sng-confirm-dialog { padding: 22px; }
        }

        @keyframes sng-confirm-enter {
          from { opacity: 0; transform: translateY(8px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes sng-confirm-spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .sng-confirm-overlay *,
          .sng-confirm-loading {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || pending}
        aria-label={pending ? "Processing…" : ariaLabel}
        aria-busy={pending || undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={title}
        onClick={() => setOpen(true)}
        className={className}
      >
        {pending ? (
          <>
            <LoaderCircle
              className="sng-confirm-loading h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="sr-only">Processing…</span>
          </>
        ) : (
          children
        )}
      </button>

      {/* A real submitter keeps the existing form action intact. */}
      <button
        ref={submitRef}
        type="submit"
        hidden
        disabled={disabled || pending}
        tabIndex={-1}
        aria-hidden="true"
      />

      {open &&
        createPortal(
          <div
            className="sng-confirm-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <section
              ref={dialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              className={`sng-confirm-dialog ${
                isDelete ? "" : "is-signout"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="sng-confirm-icon" aria-hidden="true">
                  {isDelete ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : (
                    <LogOut className="h-6 w-6" />
                  )}
                </span>

                <button
                  type="button"
                  onClick={close}
                  aria-label="Close confirmation"
                  className="sng-confirm-close"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <p
                className={`mt-6 text-[10px] font-bold uppercase tracking-[0.2em] ${
                  isDelete ? "text-rose-600" : "text-blue-600"
                }`}
              >
                {isDelete ? "Confirm deletion" : "Account session"}
              </p>

              <h2
                id={titleId}
                className="mt-2 text-xl font-bold leading-8 tracking-tight text-slate-900"
              >
                {dialogTitle}
              </h2>

              <p
                id={descriptionId}
                className="mt-3 break-words text-sm leading-7 text-slate-500"
              >
                {description}
              </p>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={close}
                  className="sng-confirm-action"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirm}
                  disabled={disabled || pending}
                  className={`sng-confirm-action ${
                    isDelete ? "is-danger" : "is-signout"
                  }`}
                >
                  {isDelete ? (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  )}
                  {confirmLabel}
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}