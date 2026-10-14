import { Role } from "@prisma/client";
import {
  CheckCircle2,
  KeyRound,
  Save,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  createUser,
  resetUserPassword,
  updateUser,
} from "@/actions/users";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

const roleLabels: Record<Role, string> = {
  ADMIN: "Administrator",
  EDITOR: "Editor",
  SUB_EDITOR: "Sub-editor",
  REPORTER: "Reporter",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] || "")
    .join("")
    .toUpperCase();
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-LK", {
    timeZone: "Asia/Colombo",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const styles = `
  .sng-users {
    position: relative;
    isolation: isolate;
  }

  .sng-users .sng-user-panel {
    min-width: 0;
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 30px -25px rgba(15,23,42,.3);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-users .sng-user-icon {
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

  .sng-users .sng-user-input {
    display: block;
    width: 100%;
    min-width: 0;
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
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-users .sng-user-input::placeholder {
    color: #94a3b8;
  }

  .sng-users .sng-user-input:focus {
    background: white;
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }

  .sng-users .sng-user-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 11px 16px;
    border: 1px solid #dbe3ee;
    border-radius: 12px;
    background: linear-gradient(145deg, white, #f8fafc);
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: inset 0 1px 0 white;
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .sng-users .sng-user-button.is-primary {
    border-color: #2563eb;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 6px 16px -10px rgba(37,99,235,.6);
  }

  .sng-users .sng-user-button:disabled {
    opacity: .4;
    cursor: not-allowed;
  }

  .sng-users .sng-user-avatar {
    display: flex;
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 1px solid #bfdbfe;
    border-radius: 16px;
    background: linear-gradient(145deg, #eff6ff, #dbeafe);
    color: #1d4ed8;
    font-size: 14px;
    font-weight: 700;
    box-shadow: inset 0 1px 0 white;
  }

  .sng-users .sng-access-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
  }

  .sng-users .sng-access-switch {
    position: relative;
    width: 42px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 999px;
    background: #cbd5e1;
    transition: background .2s ease;
  }

  .sng-users .sng-access-switch::after {
    content: "";
    position: absolute;
    left: 4px;
    top: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(15,23,42,.15);
    transition: transform .2s ease;
  }

  .sng-users .sng-access-toggle:has(input:checked)
  .sng-access-switch {
    background: #2563eb;
  }

  .sng-users .sng-access-toggle:has(input:checked)
  .sng-access-switch::after {
    transform: translateX(18px);
  }

  .sng-users .sng-access-toggle:has(input:focus-visible)
  .sng-access-switch,
  .sng-users button:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  .sng-users .sng-user-entry {
    animation: sng-user-enter .3s ease both;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-users .sng-user-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-users .sng-user-panel:hover {
      border-color: #bfdbfe;
      box-shadow: 0 14px 32px -25px rgba(37,99,235,.3);
    }

    .sng-users .sng-user-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -12px rgba(15,23,42,.4);
    }
  }

  @keyframes sng-user-enter {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-users * {
      animation: none !important;
      transition: none !important;
    }
    .sng-users .sng-access-switch::after {
      transition: none !important;
    }
  }
`;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}) {
  const actor = await requireUser([Role.ADMIN]);

  const [users, message] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    searchParams,
  ]);

  const stats = [
    {
      label: "Newsroom accounts",
      value: users.length,
      icon: Users,
    },
    {
      label: "Active accounts",
      value: users.filter((user) => user.isActive).length,
      icon: CheckCircle2,
    },
    {
      label: "Administrators",
      value: users.filter((user) => user.role === Role.ADMIN).length,
      icon: ShieldCheck,
    },
    {
      label: "2FA enabled",
      value: users.filter((user) => user.twoFactorEnabled).length,
      icon: KeyRound,
    },
  ];

  const label = "block min-w-0 text-sm font-semibold text-slate-700";

  const roleOptions = Object.values(Role).map((role) => (
    <option key={role} value={role}>
      {roleLabels[role]}
    </option>
  ));

  return (
    <main className="sng-users mx-auto max-w-7xl space-y-6 px-4 py-7 md:px-6">
      <style>{styles}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          Access management
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Users & newsroom roles
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Create accounts and manage reporting, editing and publishing access.
        </p>
      </header>

      <AdminToast
        key={message.error || message.success || "none"}
        success={message.success}
        error={message.error}
      />

      <section
        aria-label="Account overview"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="sng-user-panel flex items-center gap-4 p-5"
          >
            <span className="sng-user-icon">
              <stat.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {stat.label}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section
        aria-labelledby="create-user-heading"
        className="sng-user-panel"
      >
        <header className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6">
          <span className="sng-user-icon">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="create-user-heading"
              className="text-base font-bold text-slate-900"
            >
              Create a user
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Add a newsroom account and assign its role.
            </p>
          </div>
        </header>

        <form action={createUser} className="p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className={label}>
              Full name *
              <input
                name="name"
                required
                minLength={2}
                autoComplete="off"
                placeholder="Enter full name"
                className="sng-user-input"
              />
            </label>

            <label className={label}>
              Email *
              <input
                name="email"
                type="email"
                required
                autoComplete="off"
                placeholder="name@example.com"
                className="sng-user-input"
              />
            </label>

            <label className={label}>
              Temporary password *
              <input
                name="password"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                placeholder="At least 12 characters"
                className="sng-user-input"
              />
              <span className="mt-2 block text-xs font-normal text-slate-500">
                Minimum 12 characters.
              </span>
            </label>

            <label className={label}>
              Newsroom role
              <select name="role" className="sng-user-input">
                {roleOptions}
              </select>
            </label>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              className="sng-user-button is-primary w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Create user
            </button>
          </div>
        </form>
      </section>

      <section aria-labelledby="user-directory-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2
            id="user-directory-heading"
            className="text-base font-bold text-slate-900"
          >
            Account directory
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {users.length} accounts
          </span>
        </div>

        {users.map((user) => {
          const isSelf = user.id === actor.id;

          return (
            <article
              key={user.id}
              className="sng-user-panel sng-user-entry"
            >
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="sng-user-avatar" aria-hidden="true">
                    {initials(user.name) || "U"}
                  </span>

                  <div className="min-w-0">
                    <h3 className="break-words text-base font-bold leading-7 text-slate-900">
                      {user.name}
                    </h3>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {user.email}
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-slate-400">
                      Last updated {formatDate(user.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isSelf && (
                    <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700">
                      Your account
                    </span>
                  )}

                  <span className="rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1.5 text-[10px] font-semibold text-violet-700">
                    {roleLabels[user.role]}
                  </span>

                  <span
                    className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${
                      user.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-500"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-medium text-slate-600">
                    <KeyRound className="h-3 w-3" aria-hidden="true" />
                    2FA {user.twoFactorEnabled ? "enabled" : "not enabled"}
                  </span>
                </div>
              </header>

              <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-2">
                <form
                  action={updateUser}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                >
                  <input type="hidden" name="id" value={user.id} />

                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ShieldCheck
                      className="h-4 w-4 text-blue-500"
                      aria-hidden="true"
                    />
                    Account access
                  </h4>

                  <label className={`${label} mt-4`}>
                    Role
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="sng-user-input"
                    >
                      {roleOptions}
                    </select>
                  </label>

                  <label className="sng-access-toggle mt-4">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={user.isActive}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="sng-access-switch"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Active account
                    </span>
                  </label>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] leading-5 text-slate-500">
                      {isSelf
                        ? "Your own access cannot be changed here."
                        : "Save to apply role and active-status changes."}
                    </p>

                    <button
                      type="submit"
                      disabled={isSelf}
                      className="sng-user-button is-primary"
                    >
                      <Save className="h-4 w-4" aria-hidden="true" />
                      Save access
                    </button>
                  </div>
                </form>

                <form
                  action={resetUserPassword}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                >
                  <input type="hidden" name="id" value={user.id} />

                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <KeyRound
                      className="h-4 w-4 text-blue-500"
                      aria-hidden="true"
                    />
                    Reset password
                  </h4>

                  <label className={`${label} mt-4`}>
                    New password *
                    <input
                      name="password"
                      type="password"
                      minLength={12}
                      required
                      autoComplete="new-password"
                      placeholder="At least 12 characters"
                      className="sng-user-input"
                    />
                  </label>

                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    Enter a new password, then submit to replace this
                    account’s current password.
                  </p>

                  <div className="mt-5 flex justify-end">
                    <button type="submit" className="sng-user-button">
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      Reset password
                    </button>
                  </div>
                </form>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}