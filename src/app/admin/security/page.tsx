import {
  CheckCircle2,
  ChevronRight,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  beginTwoFactor,
  changeOwnPassword,
  disableTwoFactor,
  enableTwoFactor,
} from "@/actions/users";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";

const styles = `
  .sng-security {
    position: relative;
    isolation: isolate;
  }

  .sng-security .sng-security-panel {
    min-width: 0;
    border: 1px solid rgba(203,213,225,.75);
    border-radius: 22px;
    background: rgba(255,255,255,.94);
    box-shadow:
      inset 0 1px 0 white,
      0 12px 30px -25px rgba(15,23,42,.3);
    transition: border-color .2s ease, box-shadow .2s ease;
  }

  .sng-security .sng-security-icon {
    display: flex;
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 1px solid #dbeafe;
    border-radius: 15px;
    background: linear-gradient(145deg, white, #e8efff);
    color: #2563eb;
    box-shadow:
      3px 3px 8px rgba(148,163,184,.12),
      -2px -2px 6px white;
  }

  .sng-security .sng-security-input {
    display: block;
    width: 100%;
    min-width: 0;
    min-height: 48px;
    margin-top: 8px;
    padding: 12px 14px;
    border: 1px solid #dbe3ee;
    border-radius: 13px;
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

  .sng-security .sng-security-input::placeholder {
    color: #94a3b8;
  }

  .sng-security .sng-security-input:focus {
    background: white;
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(59,130,246,.1);
  }

  .sng-security .sng-security-code {
    max-width: 280px;
    font-family: ui-monospace, monospace;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: .25em;
    text-align: center;
  }

  .sng-security .sng-security-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 11px 18px;
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

  .sng-security .sng-security-button.is-primary {
    border-color: #2563eb;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 6px 16px -10px rgba(37,99,235,.6);
  }

  .sng-security .sng-security-button.is-green {
    border-color: #047857;
    background: linear-gradient(135deg, #059669, #047857);
    color: white;
  }

  .sng-security .sng-security-button.is-danger {
    border-color: #fecdd3;
    background: #fff1f2;
    color: #be123c;
  }

  .sng-security .sng-security-step {
    display: flex;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
  }

  .sng-security button:focus-visible,
  .sng-security summary:focus-visible {
    outline: 3px solid #60a5fa;
    outline-offset: 3px;
  }

  .sng-security .sng-security-entry {
    animation: sng-security-enter .3s ease both;
  }

  @supports (backdrop-filter: blur(12px)) {
    .sng-security .sng-security-panel {
      backdrop-filter: blur(12px);
    }
  }

  @media (hover: hover) {
    .sng-security .sng-security-panel:hover {
      border-color: #bfdbfe;
      box-shadow: 0 14px 32px -25px rgba(37,99,235,.3);
    }

    .sng-security .sng-security-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -12px rgba(15,23,42,.4);
    }
  }

  @keyframes sng-security-enter {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .sng-security * {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{
    secret?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const actor = await requireUser();
  const params = await searchParams;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    select: { twoFactorEnabled: true },
  });

  const setupPending = Boolean(
    params.secret && !user.twoFactorEnabled,
  );

  const uri = setupPending
    ? `otpauth://totp/Sangathe:${encodeURIComponent(actor.email)}?secret=${encodeURIComponent(params.secret!)}&issuer=Sangathe&algorithm=SHA1&digits=6&period=30`
    : null;

  return (
    <main className="sng-security mx-auto max-w-4xl space-y-6 px-4 py-7 md:px-6">
      <style>{styles}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      </div>

      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          Account protection
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Security settings
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Manage your authenticator and password for newsroom access.
        </p>
      </header>

      <AdminToast
        key={params.error || params.success || "none"}
        success={params.success}
        error={params.error}
      />

      <section
        aria-label="Current account"
        className="sng-security-panel flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="sng-security-icon">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="break-words text-sm font-bold text-slate-900">
              {actor.name}
            </p>
            <p className="mt-1 break-all text-xs text-slate-500">
              {actor.email}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${
            user.twoFactorEnabled
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-current"
          />
          {user.twoFactorEnabled ? "2FA enabled" : "2FA not enabled"}
        </span>
      </section>

      <section
        aria-labelledby="two-factor-heading"
        className="sng-security-panel sng-security-entry"
      >
        <header className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6">
          <span className="sng-security-icon">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="two-factor-heading"
              className="text-base font-bold text-slate-900"
            >
              Two-factor authentication
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Use a time-based code from a TOTP-compatible authenticator.
            </p>
          </div>
        </header>

        <div className="p-5 sm:p-6">
          {!user.twoFactorEnabled && !params.secret && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
              <h3 className="text-sm font-semibold text-slate-800">
                Add an authenticator to your account
              </h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                Start setup, add the supplied key to your app, then
                verify its six-digit code.
              </p>

              <form action={beginTwoFactor} className="mt-5">
                <button
                  type="submit"
                  className="sng-security-button is-primary"
                >
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  Set up authenticator
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          )}

          {setupPending && (
            <div className="space-y-5">
              <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                <div className="flex items-start gap-3">
                  <span className="sng-security-step" aria-hidden="true">
                    01
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Add the setup key
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      In your authenticator, add a time-based account
                      using this key.
                    </p>
                  </div>
                </div>

                <code className="mt-4 block select-all break-all rounded-xl border border-blue-100 bg-white p-4 font-mono text-sm font-semibold leading-7 text-blue-800">
                  {params.secret}
                </code>

                <p className="mt-3 text-xs leading-6 text-slate-500">
                  Account name: Sangathe · {actor.email}
                </p>

                <details className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                    Show authenticator URI
                  </summary>
                  <code className="mt-3 block select-all break-all text-[11px] leading-6 text-slate-500">
                    {uri}
                  </code>
                </details>
              </section>

              <form
                action={enableTwoFactor}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="sng-security-step" aria-hidden="true">
                    02
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Verify your authenticator
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      Enter the current six-digit code from your app.
                    </p>
                  </div>
                </div>

                <label className="mt-5 block text-sm font-semibold text-slate-700">
                  Verification code *
                  <input
                    name="token"
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="sng-security-input sng-security-code"
                  />
                </label>

                <button
                  type="submit"
                  className="sng-security-button is-green mt-5"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Enable two-factor authentication
                </button>
              </form>
            </div>
          )}

          {user.twoFactorEnabled && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-800">
                    Authenticator enabled
                  </h3>
                  <p className="mt-1 text-xs leading-6 text-emerald-700">
                    Your account uses an authenticator code at login.
                  </p>
                </div>
              </div>

              <form
                action={disableTwoFactor}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
              >
                <h3 className="text-sm font-semibold text-slate-800">
                  Disable authenticator
                </h3>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Enter a current code to remove two-factor
                  authentication from your account.
                </p>

                <label className="mt-4 block text-sm font-semibold text-slate-700">
                  Authenticator code *
                  <input
                    name="token"
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="sng-security-input sng-security-code"
                  />
                </label>

                <button
                  type="submit"
                  className="sng-security-button is-danger mt-5"
                >
                  Disable two-factor authentication
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      <section
        aria-labelledby="change-password-heading"
        className="sng-security-panel sng-security-entry"
      >
        <header className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6">
          <span className="sng-security-icon">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="change-password-heading"
              className="text-base font-bold text-slate-900"
            >
              Change password
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Changing your password signs out existing sessions.
            </p>
          </div>
        </header>

        <form action={changeOwnPassword} className="p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Current password *
              <input
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter current password"
                className="sng-security-input"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              New password *
              <input
                name="newPassword"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                placeholder="At least 12 characters"
                className="sng-security-input"
              />
              <span className="mt-2 block text-xs font-normal text-slate-500">
                Minimum 12 characters.
              </span>
            </label>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              className="sng-security-button is-primary w-full sm:w-auto"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Change password
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}