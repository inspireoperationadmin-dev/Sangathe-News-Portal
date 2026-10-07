import { LockKeyhole, Newspaper, ShieldCheck } from "lucide-react";
import { loginUser } from "@/actions/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const { error, success } = await searchParams;
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
    <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" aria-labelledby="login-title">
      <div className="bg-slate-950 px-7 py-7 text-white">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-600"><Newspaper aria-hidden="true"/></div>
        <h1 id="login-title" className="text-2xl font-black">Newsroom sign in</h1>
        <p className="mt-1 text-sm text-slate-300">Secure access for Sangathe journalists and editors.</p>
      </div>
      <form action={loginUser} className="space-y-5 p-7">
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>}
        {success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{success}</div>}
        <div><label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email address</label><input id="email" name="email" type="email" autoComplete="username" required className="min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"/></div>
        <div><label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"/></div>
        <div><label htmlFor="otp" className="mb-2 block text-sm font-bold text-slate-700">Authenticator code <span className="font-normal text-slate-500">(if enabled)</span></label><input id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 tracking-[0.35em] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200" aria-describedby="otp-help"/><p id="otp-help" className="mt-1 text-xs text-slate-500">Enter the six digits from your authenticator app.</p></div>
        <button className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 font-bold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><LockKeyhole className="h-4 w-4" aria-hidden="true"/>Sign in securely</button>
        <p className="flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4" aria-hidden="true"/>Accounts lock for 15 minutes after five failed attempts.</p>
      </form>
    </section>
  </main>;
}
