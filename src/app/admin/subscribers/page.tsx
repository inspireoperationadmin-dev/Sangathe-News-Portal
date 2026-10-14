import Link from "next/link";
import { Role } from "@prisma/client";
import {
  Mail,
  MailCheck,
  Search,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import { toggleNewsletterSubscriber } from "@/actions/newsletter";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = `
  .sng-subscribers {
    position: relative;
    isolation: isolate;
  }

  .sng-subscribers .sng-subscriber-panel {
    min-width: 0;
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 30px -25px rgba(15,23,42,.3);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-subscribers .sng-subscriber-icon {
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

  .sng-subscribers .sng-subscriber-input {
    display: block;
    width: 100%;
    min-width: 0;
    min-height: 46px;
    padding: 11px 13px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: #f8fafc;
    color: #334155;
    font-size: 13px;
    outline: none;
    box-shadow: inset 2px 2px 5px rgba(148,163,184,.06);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-subscribers .sng-subscriber-input:focus {
    background: white;
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }

  .sng-subscribers .sng-subscriber-input::placeholder {
    color: #94a3b8;
  }

  .sng-subscribers .sng-subscriber-button {
    display: inline-flex;
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
    box-shadow: inset 0 1px 0 white;
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .sng-subscribers .sng-subscriber-button.is-primary {
    border-color: #2563eb;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
  }

  .sng-subscribers .sng-subscriber-button.is-deactivate {
    border-color: #fde68a;
    background: #fffbeb;
    color: #92400e;
  }

  .sng-subscribers .sng-subscriber-button.is-reactivate {
    border-color: #a7f3d0;
    background: #ecfdf5;
    color: #047857;
  }

  .sng-subscribers .sng-subscriber-row {
    transition: background .2s ease;
  }

  .sng-subscribers button:focus-visible,
  .sng-subscribers a:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-subscribers .sng-subscriber-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-subscribers .sng-subscriber-panel:hover {
      border-color: #bfdbfe;
    }

    .sng-subscribers .sng-subscriber-row:hover {
      background: #f8fafc;
    }

    .sng-subscribers .sng-subscriber-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -12px rgba(15,23,42,.4);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-subscribers * {
      transition: none !important;
    }
  }
`;

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}) {
  await requireUser([Role.ADMIN]);

  const params = await searchParams;
  const query = (params.q || "").trim();
  const status =
    params.status === "active" || params.status === "inactive"
      ? params.status
      : "all";

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
    take: 1000,
  });

  const active = subscribers.filter((item) => item.isActive).length;
  const inactive = subscribers.length - active;

  const filtered = subscribers.filter((item) => {
    const matchesEmail = item.email
      .toLowerCase()
      .includes(query.toLowerCase());

    const matchesStatus =
      status === "all" ||
      (status === "active" && item.isActive) ||
      (status === "inactive" && !item.isActive);

    return matchesEmail && matchesStatus;
  });

  const stats = [
    {
      label: "Records loaded",
      value: subscribers.length,
      icon: Users,
      tone: "text-blue-600",
    },
    {
      label: "Active in loaded records",
      value: active,
      icon: MailCheck,
      tone: "text-emerald-600",
    },
    {
      label: "Unsubscribed in loaded records",
      value: inactive,
      icon: UserMinus,
      tone: "text-slate-500",
    },
  ];

  return (
    <main className="sng-subscribers mx-auto max-w-6xl space-y-6 px-4 py-7 md:px-6">
      <style>{styles}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          Audience management
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Newsletter subscribers
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Review email subscriptions and manage their active status.
        </p>
      </header>

      <section
        aria-label="Loaded subscriber overview"
        className="grid gap-4 sm:grid-cols-3"
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="sng-subscriber-panel flex items-center gap-4 p-5"
          >
            <span className="sng-subscriber-icon">
              <stat.icon
                className={`h-5 w-5 ${stat.tone}`}
                aria-hidden="true"
              />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">
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
        aria-label="Search subscribers"
        className="sng-subscriber-panel p-5"
      >
        <form
          action="/admin/subscribers"
          method="get"
          className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_170px_auto]"
        >
          <label className="block text-xs font-semibold text-slate-600">
            Email search
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by email address…"
              className="sng-subscriber-input mt-2"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-600">
            Subscription status
            <select
              name="status"
              defaultValue={status}
              className="sng-subscriber-input mt-2"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Unsubscribed</option>
            </select>
          </label>

          <button
            type="submit"
            className="sng-subscriber-button is-primary"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] leading-5 text-slate-500">
            Search and counts cover the latest 1,000 subscription records.
          </p>

          {(query || status !== "all") && (
            <Link
              href="/admin/subscribers"
              className="rounded-md text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              Clear filters
            </Link>
          )}
        </div>
      </section>

      <section
        aria-labelledby="subscriber-list-heading"
        className="sng-subscriber-panel overflow-hidden"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2
              id="subscriber-list-heading"
              className="text-base font-bold text-slate-900"
            >
              Subscriber directory
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Newest subscriptions first · Times in Sri Lanka
            </p>
          </div>

          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            {filtered.length.toLocaleString("en-LK")} results
          </span>
        </header>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <span className="sng-subscriber-icon">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>

            <h3 className="mt-5 text-lg font-semibold text-slate-800">
              {subscribers.length === 0
                ? "No subscribers yet"
                : "No matching subscriptions"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {subscribers.length === 0
                ? "Newsletter subscription records will appear here."
                : "Try another email search or subscription status."}
            </p>
          </div>
        ) : (
          <div
            role="region"
            aria-label="Subscriber directory table"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-4">
                    Email address
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Subscribed
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="sng-subscriber-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-xs font-bold uppercase text-blue-600"
                        >
                          {item.email.charAt(0)}
                        </span>
                        <span className="break-all text-xs font-semibold text-slate-700">
                          {item.email}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {formatDate(item.subscribedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${
                          item.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-current"
                        />
                        {item.isActive ? "Active" : "Unsubscribed"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <form
                        action={toggleNewsletterSubscriber}
                        className="flex justify-end"
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={item.id}
                        />

                        <button
                          type="submit"
                          name="active"
                          value={item.isActive ? "false" : "true"}
                          aria-label={`${
                            item.isActive ? "Deactivate" : "Reactivate"
                          } subscription for ${item.email}`}
                          className={`sng-subscriber-button ${
                            item.isActive
                              ? "is-deactivate"
                              : "is-reactivate"
                          }`}
                        >
                          {item.isActive ? (
                            <UserMinus
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          ) : (
                            <UserPlus
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          )}
                          {item.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}