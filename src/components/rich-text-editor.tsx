"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Clock3,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  PenLine,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
  Video,
  X,
} from "lucide-react";

type EditorInstance = NonNullable<ReturnType<typeof useEditor>>;

type InsertDialog =
  | { type: "link"; url: string }
  | { type: "image"; url: string; alt: string }
  | { type: "youtube"; url: string };

type Tool = {
  label: string;
  icon: ReactNode;
  run: () => void;
  active?: boolean;
  disabled?: boolean;
};

function ToolButton({
  label,
  active,
  disabled,
  run,
  icon,
}: Tool) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={run}
      className={`sng-rte-tool ${active ? "is-active" : ""}`}
    >
      {icon}
    </button>
  );
}

function validUrl(value: string, type: InsertDialog["type"]) {
  try {
    const parsed = new URL(value);

    if (type === "link") {
      return ["http:", "https:", "mailto:", "tel:"].includes(
        parsed.protocol,
      );
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    if (type === "youtube") {
      return [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtube-nocookie.com",
        "youtube-nocookie.com",
      ].includes(parsed.hostname.toLowerCase());
    }

    return true;
  } catch {
    return false;
  }
}

function InsertMediaDialog({
  dialog,
  onChange,
  onClose,
  onApply,
}: {
  dialog: InsertDialog;
  onChange: (dialog: InsertDialog) => void;
  onClose: () => void;
  onApply: () => boolean;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const id = useId();

  const isImage = dialog.type === "image";
  const isVideo = dialog.type === "youtube";

  const title = isImage
    ? "Insert an image"
    : isVideo
      ? "Embed a video"
      : "Add a link";

  const description = isImage
    ? "Use a public image URL and describe what the image shows."
    : isVideo
      ? "Paste a YouTube watch or share URL."
      : "Connect the selected text to a web page, email or telephone number.";

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    firstInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex="0"]',
      );

      if (!elements?.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      const current = document.activeElement;
      const outside = !panelRef.current?.contains(current);

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
        !panelRef.current?.contains(event.target)
      ) {
        firstInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", keepFocusInside);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", keepFocusInside);

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  const apply = () => {
    const value = dialog.url.trim();

    if (!value) {
      setError("Enter a URL to continue.");
      firstInputRef.current?.focus();
      return;
    }

    if (!validUrl(value, dialog.type)) {
      setError(
        isVideo
          ? "Enter a valid YouTube watch or share URL."
          : isImage
            ? "Enter a valid http or https image URL."
            : "Enter a valid web, email or telephone link.",
      );
      firstInputRef.current?.focus();
      return;
    }

    if (!onApply()) {
      setError("This URL could not be inserted. Check it and try again.");
    }
  };

  return createPortal(
    <div
      className="sng-rte-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        className="sng-rte-dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600"
            >
              {isImage ? (
                <ImagePlus className="h-5 w-5" />
              ) : isVideo ? (
                <Video className="h-5 w-5" />
              ) : (
                <Link2 className="h-5 w-5" />
              )}
            </span>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                Story editor
              </p>
              <h2
                id={`${id}-title`}
                className="mt-1 text-xl font-bold tracking-tight text-slate-900"
              >
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="sng-rte-tool shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p
          id={`${id}-description`}
          className="mt-5 text-sm leading-6 text-slate-500"
        >
          {description}
        </p>

        <label className="mt-6 block text-sm font-semibold text-slate-700">
          {isImage
            ? "Image URL"
            : isVideo
              ? "YouTube URL"
              : "Destination URL"}

          <input
            ref={firstInputRef}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={dialog.url}
            onChange={(event) => {
              onChange({ ...dialog, url: event.target.value });
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                apply();
              }
            }}
            placeholder={
              isVideo ? "https://youtube.com/watch?v=…" : "https://…"
            }
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className="sng-rte-input mt-2"
          />
        </label>

        {dialog.type === "image" && (
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Image description
            <span className="ml-1 font-normal text-slate-400">
              (recommended)
            </span>

            <input
              value={dialog.alt}
              onChange={(event) =>
                onChange({ ...dialog, alt: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  apply();
                }
              }}
              placeholder="Describe what the image shows…"
              className="sng-rte-input mt-2"
            />

            <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
              This description helps readers using screen readers.
            </span>
          </label>
        )}

        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200/70 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="sng-rte-dialog-button"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={apply}
            className="sng-rte-dialog-button is-primary"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {isImage ? "Insert image" : isVideo ? "Embed video" : "Apply link"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function Toolbar({ editor }: { editor: EditorInstance }) {
  const [dialog, setDialog] = useState<InsertDialog | null>(null);

  const closeDialog = useCallback(() => {
    setDialog(null);
    editor.chain().focus().run();
  }, [editor]);

  const applyDialog = () => {
    if (!dialog) return false;

    let applied = false;

    if (dialog.type === "link") {
      applied = editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: dialog.url.trim() })
        .run();
    }

    if (dialog.type === "image") {
      applied = editor
        .chain()
        .focus()
        .setImage({
          src: dialog.url.trim(),
          alt: dialog.alt.trim(),
        })
        .run();
    }

    if (dialog.type === "youtube") {
      applied = editor
        .chain()
        .focus()
        .setYoutubeVideo({
          src: dialog.url.trim(),
          width: 720,
          height: 405,
        })
        .run();
    }

    if (applied) setDialog(null);
    return applied;
  };

  const icon = "h-4 w-4";

  const groups: { label: string; tools: Tool[] }[] = [
    {
      label: "History",
      tools: [
        {
          label: "Undo",
          icon: <Undo2 className={icon} />,
          disabled: !editor.can().undo(),
          run: () => { editor.chain().focus().undo().run(); },
        },
        {
          label: "Redo",
          icon: <Redo2 className={icon} />,
          disabled: !editor.can().redo(),
          run: () => { editor.chain().focus().redo().run(); },
        },
      ],
    },
    {
      label: "Text",
      tools: [
        {
          label: "Bold",
          icon: <Bold className={icon} />,
          active: editor.isActive("bold"),
          run: () => { editor.chain().focus().toggleBold().run(); },
        },
        {
          label: "Italic",
          icon: <Italic className={icon} />,
          active: editor.isActive("italic"),
          run: () => { editor.chain().focus().toggleItalic().run(); },
        },
        {
          label: "Underline",
          icon: <Underline className={icon} />,
          active: editor.isActive("underline"),
          run: () => { editor.chain().focus().toggleUnderline().run(); },
        },
        {
          label: "Strikethrough",
          icon: <Strikethrough className={icon} />,
          active: editor.isActive("strike"),
          run: () => { editor.chain().focus().toggleStrike().run(); },
        },
      ],
    },
    {
      label: "Structure",
      tools: [
        {
          label: "Heading 2",
          icon: <Heading2 className={icon} />,
          active: editor.isActive("heading", { level: 2 }),
          run: () => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          },
        },
        {
          label: "Heading 3",
          icon: <Heading3 className={icon} />,
          active: editor.isActive("heading", { level: 3 }),
          run: () => {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          },
        },
        {
          label: "Bullet list",
          icon: <List className={icon} />,
          active: editor.isActive("bulletList"),
          run: () => { editor.chain().focus().toggleBulletList().run(); },
        },
        {
          label: "Numbered list",
          icon: <ListOrdered className={icon} />,
          active: editor.isActive("orderedList"),
          run: () => { editor.chain().focus().toggleOrderedList().run(); },
        },
        {
          label: "Block quote",
          icon: <Quote className={icon} />,
          active: editor.isActive("blockquote"),
          run: () => { editor.chain().focus().toggleBlockquote().run(); },
        },
      ],
    },
    {
      label: "Alignment",
      tools: [
        {
          label: "Align left",
          icon: <AlignLeft className={icon} />,
          active: editor.isActive({ textAlign: "left" }),
          run: () => { editor.chain().focus().setTextAlign("left").run(); },
        },
        {
          label: "Align center",
          icon: <AlignCenter className={icon} />,
          active: editor.isActive({ textAlign: "center" }),
          run: () => { editor.chain().focus().setTextAlign("center").run(); },
        },
        {
          label: "Align right",
          icon: <AlignRight className={icon} />,
          active: editor.isActive({ textAlign: "right" }),
          run: () => { editor.chain().focus().setTextAlign("right").run(); },
        },
      ],
    },
    {
      label: "Insert",
      tools: [
        {
          label: "Add or edit link",
          icon: <Link2 className={icon} />,
          active: editor.isActive("link"),
          run: () =>
            setDialog({
              type: "link",
              url: (editor.getAttributes("link").href as string) || "",
            }),
        },
        {
          label: "Remove link",
          icon: <Unlink className={icon} />,
          disabled: !editor.isActive("link"),
          run: () => { editor.chain().focus().unsetLink().run(); },
        },
        {
          label: "Insert image from URL",
          icon: <ImagePlus className={icon} />,
          run: () => setDialog({ type: "image", url: "", alt: "" }),
        },
        {
          label: "Embed YouTube video",
          icon: <Video className={icon} />,
          run: () => setDialog({ type: "youtube", url: "" }),
        },
        {
          label: "Horizontal rule",
          icon: <Minus className={icon} />,
          run: () => { editor.chain().focus().setHorizontalRule().run(); },
        },
        {
          label: "Clear formatting",
          icon: <RemoveFormatting className={icon} />,
          run: () => {
            editor.chain().focus().unsetAllMarks().clearNodes().run();
          },
        },
      ],
    },
  ];

  return (
    <>
      <div
        className="sng-rte-toolbar"
        role="toolbar"
        aria-label="Article formatting"
      >
        {groups.map((group) => (
          <div
            key={group.label}
            role="group"
            aria-label={group.label}
            className="sng-rte-group"
          >
            <span aria-hidden="true" className="sng-rte-group-label">
              {group.label}
            </span>
            <div className="flex flex-wrap gap-1">
              {group.tools.map((tool) => (
                <ToolButton key={tool.label} {...tool} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {dialog && (
        <InsertMediaDialog
          dialog={dialog}
          onChange={setDialog}
          onClose={closeDialog}
          onApply={applyDialog}
        />
      )}
    </>
  );
}

const editorStyles = `
  .sng-rte {
    border: 1px solid #dbe3ee;
    border-radius: 18px;
    background: white;
    box-shadow: inset 0 1px 0 white, 0 8px 24px -22px #334155;
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  .sng-rte:focus-within {
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgba(59,130,246,.08);
  }
  .sng-rte-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid #e2e8f0;
    border-radius: 18px 18px 0 0;
    background: linear-gradient(135deg, #f8fafc, #eff6ff);
  }
  .sng-rte-group {
    min-width: 0;
    padding: 6px;
    border: 1px solid rgba(203,213,225,.65);
    border-radius: 12px;
    background: rgba(255,255,255,.85);
    box-shadow: inset 0 1px 0 white, 0 2px 5px rgba(15,23,42,.025);
  }
  .sng-rte-group-label {
    display: block;
    margin: 0 4px 5px;
    color: #64748b;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .sng-rte-tool {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
    padding: 8px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: #475569;
    cursor: pointer;
    transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
  }
  .sng-rte-tool.is-active {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-color: #2563eb;
    color: white;
    box-shadow: 0 4px 10px -5px rgba(37,99,235,.65);
  }
  .sng-rte-tool:disabled {
    opacity: .3;
    cursor: not-allowed;
  }
  .sng-rte-tool:focus-visible,
  .sng-rte-dialog-button:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 2px;
  }
  .sng-rte .sng-rte-content {
    min-height: 480px;
    padding: 28px;
    outline: none;
    color: #334155;
    font-size: 16px;
    line-height: 1.95;
    overflow-wrap: anywhere;
  }
  .sng-rte-content > * + * { margin-top: 1em; }
  .sng-rte-content p { margin-bottom: .7em; }
  .sng-rte-content h2 {
    font-size: 1.6em;
    font-weight: 750;
    line-height: 1.65;
    color: #0f172a;
    margin-top: 1.5em;
  }
  .sng-rte-content h3 {
    font-size: 1.25em;
    font-weight: 700;
    line-height: 1.7;
    color: #1e293b;
    margin-top: 1.3em;
  }
  .sng-rte-content strong { font-weight: 700; }
  .sng-rte-content em { font-style: italic; }
  .sng-rte-content ul { list-style: disc; padding-left: 1.6em; }
  .sng-rte-content ol { list-style: decimal; padding-left: 1.6em; }
  .sng-rte-content li { margin-top: .4em; }
  .sng-rte-content li p { margin: 0; }
  .sng-rte-content blockquote {
    border-left: 3px solid #3b82f6;
    border-radius: 0 12px 12px 0;
    background: #eff6ff;
    padding: 16px 20px;
    color: #475569;
  }
  .sng-rte-content a {
    color: #2563eb;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .sng-rte-content hr {
    border: 0;
    border-top: 1px solid #cbd5e1;
    margin: 2em 0;
  }
  .sng-rte-content img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 14px;
    margin: 1.4em auto;
  }
  .sng-rte-content .ProseMirror-selectednode {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }
  .sng-rte-content [data-youtube-video] {
    max-width: 100%;
    margin: 1.4em 0;
  }
  .sng-rte-content iframe {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
  }
  .sng-rte-content pre {
    white-space: pre-wrap;
    border-radius: 12px;
    background: #0f172a;
    color: #e2e8f0;
    padding: 16px;
  }
  .sng-rte-content code {
    font-family: ui-monospace, monospace;
    font-size: .9em;
  }
  .sng-rte-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(15,23,42,.58);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .sng-rte-dialog {
    width: 100%;
    max-width: 500px;
    max-height: calc(100dvh - 40px);
    overflow-y: auto;
    padding: 28px;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,.8);
    background: rgba(255,255,255,.97);
    box-shadow: 0 24px 80px -20px rgba(15,23,42,.45), inset 0 1px 0 white;
    animation: sng-rte-enter .22s ease both;
  }
  .sng-rte-input {
    width: 100%;
    min-height: 48px;
    border-radius: 12px;
    border: 1px solid #dbe3ee;
    background: #f8fafc;
    padding: 12px 14px;
    font-size: 14px;
    font-weight: 400;
    color: #0f172a;
    outline: none;
    box-shadow: inset 2px 2px 5px rgba(148,163,184,.08);
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  .sng-rte-input:focus {
    background: white;
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }
  .sng-rte-input::placeholder { color: #94a3b8; }
  .sng-rte-dialog-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 10px 20px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: white;
    color: #475569;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform .18s ease, box-shadow .18s ease;
  }
  .sng-rte-dialog-button.is-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-color: #2563eb;
    color: white;
    box-shadow: 0 5px 15px -8px #2563eb;
  }
  @media (hover: hover) {
    .sng-rte-tool:hover:not(:disabled):not(.is-active) {
      background: #eff6ff;
      border-color: #dbeafe;
      color: #2563eb;
      transform: translateY(-1px);
    }
    .sng-rte-dialog-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -12px #334155;
    }
  }
  @media (max-width: 640px) {
    .sng-rte-toolbar { gap: 6px; padding: 8px; }
    .sng-rte .sng-rte-content {
      min-height: 360px;
      padding: 20px 16px;
    }
    .sng-rte-dialog { padding: 20px; }
  }
  @keyframes sng-rte-enter {
    from { opacity: 0; transform: translateY(8px) scale(.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .sng-rte *, .sng-rte-overlay * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export function RichTextEditor({
  initialContent = "",
}: {
  initialContent?: string;
}) {
  const [html, setHtml] = useState(initialContent);
  const [text, setText] = useState("");
  const [, setRevision] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
      }),
      Image.configure({ allowBase64: false }),
      Youtube.configure({ nocookie: true, controls: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "tiptap sng-rte-content",
        lang: "ta",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Article body rich text editor",
      },
    },
    onUpdate: ({ editor: current }) => {
      setHtml(current.getHTML());
      setText(current.getText());
    },
    onCreate: ({ editor: current }) => {
      setHtml(current.getHTML());
      setText(current.getText());
    },
    onTransaction: () => setRevision((value) => value + 1),
  });

  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const minutes = words ? Math.ceil(words / 180) : 0;
  const number = (value: number) => value.toLocaleString("en-LK");

  return (
    <div className="sng-rte">
      <style>{editorStyles}</style>

      <input type="hidden" name="content" value={html} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <PenLine className="h-4 w-4 text-blue-500" aria-hidden="true" />
          Writing canvas
        </span>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
          Tamil story
        </span>
      </div>

      {editor ? (
        <>
          <Toolbar editor={editor} />
          <EditorContent editor={editor} />
        </>
      ) : (
        <div
          role="status"
          className="flex min-h-[360px] items-center justify-center bg-slate-50/70 text-sm text-slate-500 sm:min-h-[480px]"
        >
          Loading writing canvas…
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-[18px] border-t border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>
            <strong className="font-semibold text-slate-700">
              {number(words)}
            </strong>{" "}
            words
          </span>

          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />

          <span>{number(text.length)} characters</span>

          {minutes > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              ~{minutes} min read
            </span>
          )}
        </div>

        <p className="text-[11px] leading-5 text-slate-500">
          Saved when you choose a workflow action
        </p>
      </div>
    </div>
  );
}