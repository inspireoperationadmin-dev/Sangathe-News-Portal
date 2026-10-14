import {
  ArrowDown,
  ArrowUp,
  FileText,
  FolderOpen,
  FolderTree,
  GitBranch,
  Info,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Locale, Role } from "@prisma/client";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCategory,
  deleteCategory,
  moveCategory,
  updateCategory,
} from "@/actions/categories";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

const styles = `
  .sng-categories {
    position: relative;
    isolation: isolate;
  }

  .sng-categories .sng-category-panel {
    min-width: 0;
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 30px -25px rgba(15,23,42,.3);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-categories .sng-category-icon {
    display: flex;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 1px solid #dbeafe;
    border-radius: 14px;
    background: linear-gradient(145deg, white, #e8efff);
    color: #2563eb;
    box-shadow:
      3px 3px 8px rgba(148,163,184,.12),
      -2px -2px 6px white;
  }

  .sng-categories .sng-category-input {
    display: block;
    width: 100%;
    min-height: 48px;
    margin-top: 8px;
    padding: 12px 14px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: #f8fafc;
    color: #0f172a;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.6;
    outline: none;
    box-shadow:
      inset 2px 2px 5px rgba(148,163,184,.07),
      inset -2px -2px 5px white;
    transition:
      border-color .2s ease,
      box-shadow .2s ease,
      background .2s ease;
  }

  .sng-categories .sng-category-input::placeholder {
    color: #94a3b8;
  }

  .sng-categories .sng-category-input:focus {
    border-color: #60a5fa;
    background: white;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }

  .sng-categories .sng-category-input:disabled {
    cursor: not-allowed;
    color: #64748b;
    background: #f1f5f9;
  }

  .sng-categories .sng-category-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 44px;
    min-height: 44px;
    padding: 10px 15px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: linear-gradient(145deg, white, #f8fafc);
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.5;
    cursor: pointer;
    box-shadow: inset 0 1px 0 white;
    transition:
      transform .18s ease,
      box-shadow .18s ease,
      border-color .18s ease;
  }

  .sng-categories .sng-category-button.is-primary {
    border-color: #2563eb;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 6px 16px -10px rgba(37,99,235,.6);
  }

  .sng-categories .sng-category-button.is-danger {
    border-color: #fecdd3;
    background: #fff1f2;
    color: #be123c;
  }

  .sng-categories .sng-category-button:disabled {
    opacity: .4;
    cursor: not-allowed;
  }

  .sng-categories button:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  .sng-categories .sng-category-child {
    margin-left: 16px;
    border-left: 3px solid #93c5fd;
  }

  .sng-categories .sng-category-entry {
    animation: sng-category-enter .3s ease both;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-categories .sng-category-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-categories .sng-category-panel:hover {
      border-color: #bfdbfe;
      box-shadow: 0 14px 32px -25px rgba(37,99,235,.3);
    }

    .sng-categories .sng-category-button:hover:not(:disabled) {
      transform: translateY(-2px);
      border-color: #93c5fd;
      box-shadow: 0 8px 16px -12px rgba(37,99,235,.4);
    }

    .sng-categories .sng-category-button.is-danger:hover:not(:disabled) {
      border-color: #fda4af;
      box-shadow: 0 8px 16px -12px rgba(225,29,72,.4);
    }
  }

  @media (min-width: 768px) {
    .sng-categories .sng-category-child { margin-left: 40px; }
  }

  @keyframes sng-category-enter {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-categories * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  await requireUser([Role.ADMIN]);

  const params = await searchParams;

  const categories = await prisma.category.findMany({
    where: { locale: Locale.ta },
    orderBy: [
      { parentId: "asc" },
      { order: "asc" },
      { name: "asc" },
    ],
    include: {
      parent: { select: { name: true } },
      _count: {
        select: {
          articles: true,
          children: true,
        },
      },
    },
  });

  const parents = categories.filter((category) => !category.parentId);

  // Place each parent's subcategories directly after that parent.
  const grouped = parents.flatMap((parent) => [
    parent,
    ...categories.filter((category) => category.parentId === parent.id),
  ]);

  const includedIds = new Set(grouped.map((category) => category.id));
  const orderedCategories = [
    ...grouped,
    ...categories.filter((category) => !includedIds.has(category.id)),
  ];

  const articleCount = categories.reduce(
    (total, category) => total + category._count.articles,
    0,
  );

  const stats = [
    {
      label: "Top-level categories",
      value: parents.length,
      icon: FolderTree,
    },
    {
      label: "Subcategories",
      value: categories.length - parents.length,
      icon: GitBranch,
    },
    {
      label: "Articles in Tamil categories",
      value: articleCount,
      icon: FileText,
    },
  ];

  const input = "sng-category-input";
  const label = "block min-w-0 text-sm font-semibold text-slate-700";

  return (
    <main className="sng-categories mx-auto max-w-7xl space-y-6 px-4 py-7 md:px-6">
      <style>{styles}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            Content organisation
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Categories
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Organise Tamil stories and manage their navigation order.
          </p>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
          தமிழ் · Tamil
        </span>
      </header>

      <AdminToast
        key={params.error || params.success || "none"}
        success={params.success}
        error={params.error}
      />

      <section
        aria-label="Category overview"
        className="grid gap-4 sm:grid-cols-3"
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="sng-category-panel flex items-center gap-4 p-5"
          >
            <span className="sng-category-icon">
              <stat.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {stat.value.toLocaleString("en-LK")}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {stat.label}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section
        aria-labelledby="new-category-heading"
        className="sng-category-panel"
      >
        <header className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6">
          <span className="sng-category-icon">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="new-category-heading"
              className="text-base font-bold text-slate-900"
            >
              New category
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Create a main section or add a subcategory.
            </p>
          </div>
        </header>

        <form action={createCategory} className="p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className={label}>
              Tamil name *
              <input
                name="name"
                required
                placeholder="உள்ளூர் செய்திகள்"
                className={input}
              />
            </label>

            <label className={label}>
              URL slug *
              <input
                name="slug"
                required
                pattern="[a-z0-9-]+"
                title="Use lowercase English letters, numbers and hyphens."
                placeholder="local-news"
                className={input}
              />
              <span className="mt-2 block text-xs font-normal text-slate-500">
                Lowercase English letters, numbers and hyphens only.
              </span>
            </label>

            <label className={label}>
              Parent category
              <select name="parentId" className={input}>
                <option value="">Top-level category</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={label}>
              Description
              <input
                name="description"
                placeholder="Briefly describe this category…"
                className={input}
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              className="sng-category-button is-primary w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create category
            </button>
          </div>
        </form>
      </section>

      <section
        aria-labelledby="category-list-heading"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2
              id="category-list-heading"
              className="flex items-center gap-2 text-base font-bold text-slate-900"
            >
              <FolderTree
                className="h-5 w-5 text-blue-500"
                aria-hidden="true"
              />
              Category structure
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Subcategories appear below their parent section.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {categories.length} categories
          </span>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
            aria-hidden="true"
          />
          <p className="text-xs leading-6 text-blue-800">
            Use the arrows to change navigation order. A category with
            articles or subcategories cannot be deleted.
          </p>
        </div>

        {orderedCategories.length === 0 && (
          <div className="sng-category-panel flex flex-col items-center p-10 text-center">
            <span className="sng-category-icon mb-4">
              <FolderOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="font-semibold text-slate-800">
              No Tamil categories yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Create your first category using the form above.
            </p>
          </div>
        )}

        {orderedCategories.map((category) => {
          const hasChildren = category._count.children > 0;
          const canDelete =
            category._count.articles === 0 && !hasChildren;

          return (
            <article
              key={category.id}
              className={`sng-category-panel sng-category-entry ${
                category.parentId ? "sng-category-child" : ""
              }`}
            >
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="sng-category-icon">
                    {category.parentId ? (
                      <GitBranch className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <FolderTree className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                      {category.parent
                        ? `Subcategory of ${category.parent.name}`
                        : "Top-level category"}
                    </p>
                    <h3 className="mt-1 break-words text-base font-bold leading-7 text-slate-900">
                      {category.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                      <span className="rounded-md bg-slate-100 px-2 py-1">
                        {category._count.articles} articles
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1">
                        {category._count.children} subcategories
                      </span>
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-600">
                        Order {category.order}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <form action={moveCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <button
                      type="submit"
                      name="direction"
                      value="up"
                      title="Move up"
                      aria-label={`Move ${category.name} up`}
                      className="sng-category-button"
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>

                  <form action={moveCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <button
                      type="submit"
                      name="direction"
                      value="down"
                      title="Move down"
                      aria-label={`Move ${category.name} down`}
                      className="sng-category-button"
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </header>

              <div className="p-5 sm:p-6">
                <form action={updateCategory}>
                  <input type="hidden" name="id" value={category.id} />

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className={label}>
                      Tamil name *
                      <input
                        name="name"
                        required
                        defaultValue={category.name}
                        className={input}
                      />
                    </label>

                    <label className={label}>
                      URL slug *
                      <input
                        name="slug"
                        required
                        defaultValue={category.slug}
                        pattern="[a-z0-9-]+"
                        title="Use lowercase English letters, numbers and hyphens."
                        className={input}
                      />
                    </label>

                    <label className={label}>
                      Parent category
                      <select
                        name="parentId"
                        defaultValue={category.parentId || ""}
                        disabled={hasChildren}
                        className={input}
                      >
                        <option value="">Top-level category</option>
                        {parents
                          .filter((parent) => parent.id !== category.id)
                          .map((parent) => (
                            <option key={parent.id} value={parent.id}>
                              {parent.name}
                            </option>
                          ))}
                      </select>

                      {hasChildren && (
                        <>
                          <input
                            type="hidden"
                            name="parentId"
                            value={category.parentId || ""}
                          />
                          <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
                            Parent selection is locked while this category
                            has subcategories.
                          </span>
                        </>
                      )}
                    </label>

                    <label className={label}>
                      Description
                      <input
                        name="description"
                        defaultValue={category.description || ""}
                        placeholder="Add a short description…"
                        className={input}
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="submit"
                      className="sng-category-button is-primary"
                    >
                      <Save className="h-4 w-4" aria-hidden="true" />
                      Save changes
                    </button>
                  </div>
                </form>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-xs leading-5 text-slate-500">
                    {canDelete
                      ? "This category is empty and can be deleted."
                      : "Remove or reassign its articles and subcategories before deleting."}
                  </p>

                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <ConfirmSubmitButton
                      disabled={!canDelete}
                      ariaLabel={`Delete ${category.name}`}
                      title={
                        canDelete
                          ? "Delete empty category"
                          : "Category contains articles or subcategories"
                      }
                      dialogTitle="Delete this category?"
                      description={`“${category.name}” will be permanently removed. This action cannot be undone.`}
                      confirmLabel="Delete category"
                      className="sng-category-button is-danger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete category
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}