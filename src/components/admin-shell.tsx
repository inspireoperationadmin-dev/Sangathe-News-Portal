"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3, BellRing, CalendarClock, ExternalLink, FileText, FolderTree,
  Images, LayoutDashboard, LogOut, Mail, Menu, Newspaper, ScrollText,
  PanelLeftClose, PanelLeftOpen, ShieldCheck, Users, X,
} from "lucide-react";
import { logoutUser } from "@/actions/auth";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type NavItem = { href: string; label: string; icon: LucideIcon; roles?: Role[]; external?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const editorialRoles = [Role.ADMIN, Role.EDITOR];
const mediaRoles = [Role.ADMIN, Role.EDITOR, Role.SUB_EDITOR];

const groups: NavGroup[] = [
  { label: "Editorial", items: [
    { href: "/admin/articles", label: "Articles", icon: Newspaper },
    { href: "/admin/homepage", label: "Homepage", icon: LayoutDashboard, roles: editorialRoles },
    { href: "/admin/schedule", label: "Schedule", icon: CalendarClock, roles: editorialRoles },
    { href: "/admin/media", label: "Media library", icon: Images, roles: mediaRoles },
  ] },
  { label: "Audience", items: [
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: editorialRoles },
    { href: "/admin/notifications", label: "Push alerts", icon: BellRing, roles: editorialRoles },
    { href: "/admin/subscribers", label: "Subscribers", icon: Mail, roles: [Role.ADMIN] },
  ] },
  { label: "Administration", items: [
    { href: "/admin/categories", label: "Categories", icon: FolderTree, roles: [Role.ADMIN] },
    { href: "/admin/pages", label: "Legal pages", icon: FileText, roles: [Role.ADMIN] },
    { href: "/admin/users", label: "Users", icon: Users, roles: [Role.ADMIN] },
    { href: "/admin/audit", label: "Audit trail", icon: ScrollText, roles: [Role.ADMIN] },
    { href: "/admin/security", label: "Security", icon: ShieldCheck },
  ] },
];

function roleLabel(role: Role) {
  return role.replaceAll("_", " ").toLowerCase().replace(/\b\w/gu, letter => letter.toUpperCase());
}

function SidebarContent({ role, name, email, pathname, collapsed = false, onNavigate, onToggleCollapse }: {
  role: Role;
  name: string;
  email: string;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  return <>
    <div className={`border-b border-slate-800 py-4 ${collapsed ? "px-2" : "px-3"}`}>
      <div className={`flex gap-2 ${collapsed ? "flex-col items-center" : "items-center"}`}>
      <Link href="/admin/articles" onClick={onNavigate} aria-label={collapsed ? "Sangathe Newsroom" : undefined} className={`flex min-h-11 min-w-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${collapsed ? "justify-center" : "flex-1 gap-3 px-2"}`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-950/30"><Newspaper className="h-5 w-5" aria-hidden="true"/></span>
        {!collapsed && <span className="min-w-0"><span className="block truncate text-base font-black tracking-tight text-white">Sangathe</span><span className="block truncate text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Newsroom CMS</span></span>}
      </Link>
      {onToggleCollapse && <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">{collapsed ? <PanelLeftOpen className="h-5 w-5"/> : <PanelLeftClose className="h-5 w-5"/>}</button>}
      </div>
    </div>

    <nav id="newsroom-sidebar-navigation" aria-label="Newsroom navigation" className={`flex-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
      {groups.map(group => {
        const visibleItems = group.items.filter(item => !item.roles || item.roles.includes(role));
        if (!visibleItems.length) return null;
        return <section key={group.label} aria-label={group.label} className={collapsed ? "mb-3 border-b border-slate-800 pb-3 last:border-0" : "mb-5"}>
          <h2 className={collapsed ? "sr-only" : "px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500"}>{group.label}</h2>
          <div className={`${collapsed ? "space-y-1" : "mt-2 space-y-1"}`}>{visibleItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} onClick={onNavigate} aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center rounded-lg text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
              <Icon className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-500"}`} aria-hidden="true"/>{!collapsed && item.label}
            </Link>;
          })}</div>
        </section>;
      })}
    </nav>

    <div className="border-t border-slate-800 p-3">
      {collapsed ? <div title={`${name} · ${roleLabel(role)}`} className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-blue-300">{name.trim().charAt(0).toUpperCase()}</div> : <div className="rounded-xl bg-slate-900 p-3">
        <p className="truncate text-sm font-black text-white">{name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{email}</p>
        <span className="mt-2 inline-flex rounded-full bg-slate-800 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-300">{roleLabel(role)}</span>
      </div>}
      <div className={`mt-2 gap-2 ${collapsed ? "flex flex-col" : "grid grid-cols-2"}`}>
        <Link href="/" target="_blank" onClick={onNavigate} aria-label={collapsed ? "Open website" : undefined} title={collapsed ? "Open website" : undefined} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">{!collapsed && "Website"}<ExternalLink className="h-4 w-4"/></Link>
        <form action={logoutUser}><ConfirmSubmitButton kind="signout" ariaLabel={collapsed ? "Sign out" : undefined} title={collapsed ? "Sign out" : undefined} dialogTitle="Sign out of the newsroom?" description="You will need to sign in again to access the CMS." confirmLabel="Sign out" className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-bold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"><LogOut className="h-4 w-4"/>{!collapsed && "Sign out"}</ConfirmSubmitButton></form>
      </div>
    </div>
  </>;
}

export function AdminShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string; role: Role } }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [mobileOpen]);

  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-800 bg-slate-950 transition-[width] duration-200 lg:flex ${sidebarCollapsed ? "w-20" : "w-72"}`}>
      <SidebarContent {...user} pathname={pathname} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(value => !value)}/>
    </aside>

    <div className={`transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"}`}>
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <Link href="/admin/articles" className="flex items-center gap-2 font-black"><Newspaper className="h-5 w-5 text-red-600"/>Sangathe Newsroom</Link>
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open newsroom menu" aria-expanded={mobileOpen} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><Menu className="h-5 w-5"/></button>
      </header>
      {children}
    </div>

    {mobileOpen && <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden" onMouseDown={event => { if (event.target === event.currentTarget) setMobileOpen(false); }}>
      <aside role="dialog" aria-modal="true" aria-label="Newsroom menu" className="flex h-full w-[min(88vw,19rem)] flex-col bg-slate-950 shadow-2xl">
        <div className="absolute left-[min(calc(88vw-3rem),16rem)] top-3 z-10">
          <button ref={closeButtonRef} type="button" onClick={() => setMobileOpen(false)} aria-label="Close newsroom menu" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"><X className="h-5 w-5"/></button>
        </div>
        <SidebarContent {...user} pathname={pathname} onNavigate={() => setMobileOpen(false)}/>
      </aside>
    </div>}
  </div>;
}
