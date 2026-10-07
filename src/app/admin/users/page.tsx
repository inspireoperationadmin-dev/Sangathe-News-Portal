import { Role } from "@prisma/client";
import { UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createUser, resetUserPassword, updateUser } from "@/actions/users";
import { AdminToast } from "@/components/admin-toast";

export const dynamic = "force-dynamic";
export default async function UsersPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const actor = await requireUser([Role.ADMIN]);
  const [users, message] = await Promise.all([prisma.user.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }), searchParams]);
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
    <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Access control</p><h1 className="mt-1 text-3xl font-black">Users and newsroom roles</h1><p className="mt-2 text-slate-600">Create accounts and control who can report, edit, approve and publish.</p></div>
    <AdminToast key={message.error || message.success || "none"} success={message.success} error={message.error}/>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="create-user"><h2 id="create-user" className="flex items-center gap-2 text-lg font-black"><UserPlus className="h-5 w-5 text-blue-700"/>Create a user</h2>
      <form action={createUser} className="mt-4 grid gap-4 md:grid-cols-4"><label className="text-sm font-bold">Full name<input name="name" required minLength={2} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal"/></label><label className="text-sm font-bold">Email<input name="email" type="email" required autoComplete="off" className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal"/></label><label className="text-sm font-bold">Temporary password<input name="password" type="password" required minLength={12} autoComplete="new-password" className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal"/></label><label className="text-sm font-bold">Role<select name="role" className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal">{Object.values(Role).map(role=><option key={role}>{role}</option>)}</select></label><button className="min-h-11 cursor-pointer rounded-lg bg-blue-700 px-4 font-bold text-white md:col-start-4">Create user</button></form>
    </section>
    <section className="space-y-3" aria-label="Existing users">{users.map(user => <article key={user.id} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_1.2fr]">
      <div><h2 className="font-black">{user.name}</h2><p className="text-sm text-slate-600">{user.email}</p><p className="mt-2 text-xs text-slate-500">2FA: {user.twoFactorEnabled ? "Enabled" : "Not enabled"} · Last updated {user.updatedAt.toLocaleDateString("en-LK")}</p></div>
      <div className="grid gap-3 sm:grid-cols-2"><form action={updateUser} className="flex flex-wrap items-end gap-2"><input type="hidden" name="id" value={user.id}/><label className="text-xs font-bold">Role<select name="role" defaultValue={user.role} className="mt-1 min-h-11 rounded-lg border border-slate-300 px-2">{Object.values(Role).map(role=><option key={role}>{role}</option>)}</select></label><label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input type="checkbox" name="isActive" defaultChecked={user.isActive}/>Active</label><button disabled={user.id === actor.id} className="min-h-11 cursor-pointer rounded-lg bg-slate-900 px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Save access</button></form>
      <form action={resetUserPassword} className="flex items-end gap-2"><input type="hidden" name="id" value={user.id}/><label className="flex-1 text-xs font-bold">New password<input name="password" type="password" minLength={12} required autoComplete="new-password" className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-2"/></label><button className="min-h-11 cursor-pointer rounded-lg border border-slate-300 px-3 text-sm font-bold hover:bg-slate-50">Reset</button></form></div>
    </article>)}</section>
  </main>;
}
