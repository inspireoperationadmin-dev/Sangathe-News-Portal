"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Copy, LoaderCircle } from "lucide-react";

type CopyState = "idle" | "copying" | "copied" | "error";

function fallbackCopy(value: string) {
  const previousFocus = document.activeElement;
  const selection = window.getSelection();
  const ranges = selection
    ? Array.from(
        { length: selection.rangeCount },
        (_, index) => selection.getRangeAt(index).cloneRange(),
      )
    : [];

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.readOnly = true;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.fontSize = "16px";
  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();

    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus({ preventScroll: true });
    }

    if (selection) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
  }
}

export function CopyUrlButton({ value }: { value: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = async () => {
    if (busyRef.current) return;

    busyRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState("copying");

    let success = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        success = true;
      }
    } catch {
      success = false;
    }

    if (!success) {
      success = fallbackCopy(value);
    }

    busyRef.current = false;
    if (!mountedRef.current) return;

    setState(success ? "copied" : "error");

    timeoutRef.current = setTimeout(() => {
      setState("idle");
    }, success ? 2000 : 4000);
  };

  const label =
    state === "copied"
      ? "Copied"
      : state === "copying"
        ? "Copying…"
        : state === "error"
          ? "Try again"
          : "Copy URL";

  return (
    <>
      <style>{`
        .sng-copy-button {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 14px;
          border: 1px solid #dbe3ee;
          border-radius: 12px;
          background: linear-gradient(145deg, white, #f8fafc);
          color: #475569;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 white,
            0 4px 10px -9px rgba(15,23,42,.3);
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease,
            box-shadow .18s ease;
        }

        .sng-copy-button.is-copied {
          border-color: #a7f3d0;
          background: linear-gradient(145deg, white, #ecfdf5);
          color: #047857;
        }

        .sng-copy-button.is-error {
          border-color: #fecdd3;
          background: #fff1f2;
          color: #be123c;
        }

        .sng-copy-button:disabled {
          cursor: wait;
          opacity: .7;
        }

        .sng-copy-button:focus-visible {
          outline: 3px solid #60a5fa;
          outline-offset: 3px;
        }

        .sng-copy-button:active:not(:disabled) {
          transform: scale(.97);
        }

        .sng-copy-spinner {
          animation: sng-copy-spin .85s linear infinite;
        }

        @media (hover: hover) {
          .sng-copy-button:hover:not(:disabled) {
            transform: translateY(-2px);
            border-color: #93c5fd;
            box-shadow: 0 8px 16px -12px rgba(37,99,235,.4);
          }

          .sng-copy-button.is-copied:hover {
            border-color: #6ee7b7;
          }

          .sng-copy-button.is-error:hover {
            border-color: #fda4af;
          }
        }

        @keyframes sng-copy-spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .sng-copy-button {
            transition: none;
          }

          .sng-copy-spinner {
            animation: none;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={copy}
        disabled={state === "copying"}
        aria-busy={state === "copying" || undefined}
        aria-label={
          state === "error"
            ? "Copy failed. Try copying the URL again."
            : label
        }
        title={
          state === "error"
            ? "Copy failed. Retry or copy the displayed URL manually."
            : "Copy file URL"
        }
        className={`sng-copy-button ${
          state === "copied"
            ? "is-copied"
            : state === "error"
              ? "is-error"
              : ""
        }`}
      >
        {state === "copying" ? (
          <LoaderCircle
            className="sng-copy-spinner h-4 w-4"
            aria-hidden="true"
          />
        ) : state === "copied" ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : state === "error" ? (
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}

        {label}
      </button>

      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied"
          ? "URL copied to clipboard."
          : state === "error"
            ? "Copy failed. Retry or copy the displayed URL manually."
            : ""}
      </span>
    </>
  );
}