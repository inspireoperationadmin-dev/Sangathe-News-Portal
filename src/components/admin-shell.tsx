"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BellRing,
  CalendarClock,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderTree,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ScrollText,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { logoutUser } from "@/actions/auth";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type ShellUser = {
  name: string;
  email: string;
  role: Role;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const editorialRoles = [Role.ADMIN, Role.EDITOR];
const mediaRoles = [Role.ADMIN, Role.EDITOR, Role.SUB_EDITOR];

const groups: NavGroup[] = [
  {
    label: "Editorial",
    items: [
      { href: "/admin/articles", label: "Articles", icon: Newspaper },
      {
        href: "/admin/homepage",
        label: "Homepage",
        icon: LayoutDashboard,
        roles: editorialRoles,
      },
      {
        href: "/admin/schedule",
        label: "Schedule",
        icon: CalendarClock,
        roles: editorialRoles,
      },
      {
        href: "/admin/media",
        label: "Media library",
        icon: Images,
        roles: mediaRoles,
      },
    ],
  },
  {
    label: "Audience",
    items: [
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: BarChart3,
        roles: editorialRoles,
      },
      {
        href: "/admin/notifications",
        label: "Push alerts",
        icon: BellRing,
        roles: editorialRoles,
      },
      {
        href: "/admin/subscribers",
        label: "Subscribers",
        icon: Mail,
        roles: [Role.ADMIN],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        href: "/admin/categories",
        label: "Categories",
        icon: FolderTree,
        roles: [Role.ADMIN],
      },
      {
        href: "/admin/pages",
        label: "Legal pages",
        icon: FileText,
        roles: [Role.ADMIN],
      },
      {
        href: "/admin/users",
        label: "Users",
        icon: Users,
        roles: [Role.ADMIN],
      },
      {
        href: "/admin/audit",
        label: "Audit trail",
        icon: ScrollText,
        roles: [Role.ADMIN],
      },
      {
        href: "/admin/security",
        label: "Security",
        icon: ShieldCheck,
      },
    ],
  },
];

const focusStyle =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

function roleLabel(role: Role) {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "U"
  );
}

function SidebarContent({
  user,
  pathname,
  collapsed = false,
  onNavigate,
  onToggleCollapse,
  onClose,
}: {
  user: ShellUser;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="shrink-0 border-b border-white/10 p-4">
        <div
          className={`flex ${
            collapsed ? "flex-col items-center gap-3" : "items-center gap-2"
          }`}
        >
          <Link
            href="/admin/articles"
            onClick={onNavigate}
            aria-label="Sangathe newsroom"
            className={`flex min-h-11 min-w-0 items-center gap-3 rounded-xl ${focusStyle} ${
              collapsed ? "justify-center" : "flex-1"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-950/30">
              <Newspaper className="h-5 w-5" aria-hidden="true" />
            </span>

            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-lg font-bold tracking-tight text-white">
                  Sangathe
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Newsroom CMS
                </span>
              </span>
            )}
          </Link>

          {(onToggleCollapse || onClose) && (
            <button
              type="button"
              onClick={onClose || onToggleCollapse}
              aria-label={
                onClose
                  ? "Close newsroom menu"
                  : collapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
              title={
                onClose
                  ? "Close menu"
                  : collapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
              className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white ${focusStyle}`}
            >
              {onClose ? (
                <X className="h-5 w-5" />
              ) : collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      <nav
        aria-label="Newsroom navigation"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 #0f172a" }}
      >
        {groups.map((group) => {
          const items = group.items.filter(
            (item) => !item.roles || item.roles.includes(user.role),
          );

          if (!items.length) return null;

          return (
            <section
              key={group.label}
              aria-label={group.label}
              className={`mb-6 last:mb-0 ${
                collapsed
                  ? "border-b border-white/10 pb-4 last:border-0"
                  : ""
              }`}
            >
              <h2
                className={
                  collapsed
                    ? "sr-only"
                    : "mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                }
              >
                {group.label}
              </h2>

              <div className="space-y-1">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex min-h-11 items-center rounded-xl text-sm font-medium transition-colors ${focusStyle} ${
                        collapsed
                          ? "justify-center px-2"
                          : "gap-3 px-3"
                      } ${
                        active
                          ? "bg-blue-600 text-white shadow-md shadow-blue-950/30"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 ${
                          active
                            ? "text-white"
                            : "text-slate-500 group-hover:text-slate-200"
                        }`}
                        aria-hidden="true"
                      />

                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {active && (
                            <ChevronRight
                              className="h-4 w-4 text-blue-200"
                              aria-hidden="true"
                            />
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div
          className={`flex items-center rounded-xl bg-white/5 ${
            collapsed ? "justify-center p-2" : "gap-3 p-3"
          }`}
          title={collapsed ? `${user.name} · ${roleLabel(user.role)}` : undefined}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-xs font-bold text-blue-300">
            {initials(user.name)}
          </span>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {user.email}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                {roleLabel(user.role)}
              </p>
            </div>
          )}
        </div>

        <div
          className={`mt-3 gap-2 ${
            collapsed ? "flex flex-col" : "grid grid-cols-2"
          }`}
        >
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            aria-label="Open public website in a new tab"
            title="Open website"
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white ${focusStyle}`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {!collapsed && "Website"}
          </Link>

          <form action={logoutUser}>
            <ConfirmSubmitButton
              kind="signout"
              ariaLabel="Sign out"
              title="Sign out"
              dialogTitle="Sign out of the newsroom?"
              description="You will need to sign in again to access the CMS."
              confirmLabel="Sign out"
              className={`flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-2 text-xs font-medium text-red-300 transition hover:bg-red-600 hover:text-white ${focusStyle}`}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {!collapsed && "Sign out"}
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>
    </>
  );
}

export function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: ShellUser;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const currentGroup = groups.find((group) =>
    group.items.some(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    ),
  );

  const currentItem = currentGroup?.items.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const pageTitle = pathname === "/admin/articles/create"
    ? "New article"
    : pathname.startsWith("/admin/articles/") && pathname.endsWith("/edit")
      ? "Edit article"
      : currentItem?.label || "Newsroom";

  useEffect(() => {
    if (!mobileOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const background = backgroundRef.current;
    const previousInert = background?.inert ?? false;

    document.body.style.overflow = "hidden";
    if (background) background.inert = true;
    drawerRef.current
      ?.querySelector<HTMLButtonElement>('button[aria-label="Close newsroom menu"]')
      ?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const elements = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ) || [],
      ).filter((element) => element.getClientRects().length > 0);

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      if (background) background.inert = previousInert;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div ref={backgroundRef}>
        <a
          href="#newsroom-content"
          className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white focus:not-sr-only"
        >
          Skip to content
        </a>

        <aside
          aria-label="Desktop sidebar"
          className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-800 bg-slate-900 transition-[width] duration-200 motion-reduce:transition-none lg:flex ${
            sidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          <SidebarContent
            user={user}
            pathname={pathname}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          />
        </aside>

        <div
          className={`min-w-0 transition-[padding] duration-200 motion-reduce:transition-none ${
            sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
          }`}
        >
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open newsroom menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-newsroom-menu"
                className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden ${focusStyle}`}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>

              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
                <span className="hidden text-slate-400 sm:inline">
                  {currentGroup?.label || "Newsroom"}
                </span>
                <ChevronRight
                  className="hidden h-4 w-4 shrink-0 text-slate-300 sm:block"
                  aria-hidden="true"
                />
                <span className="truncate font-semibold text-slate-800">
                  {pageTitle}
                </span>
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {user.role !== Role.SUB_EDITOR && (
                <Link
                  href="/admin/articles/create"
                  aria-label="Create a new article"
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-4 ${focusStyle}`}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">New article</span>
                </Link>
              )}

              <span
                title={`${user.name} · ${roleLabel(user.role)}`}
                aria-label={`Signed in as ${user.name}`}
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-bold text-blue-700 sm:flex"
              >
                {initials(user.name)}
              </span>
            </div>
          </header>

          <div id="newsroom-content" tabIndex={-1} className="min-w-0 outline-none">
            {children}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 lg:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget) setMobileOpen(false);
          }}
        >
          <aside
            ref={drawerRef}
            id="mobile-newsroom-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Newsroom menu"
            className="flex h-full w-[min(90vw,18rem)] flex-col bg-slate-900 shadow-2xl"
          >
            <SidebarContent
              user={user}
              pathname={pathname}
              onClose={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}