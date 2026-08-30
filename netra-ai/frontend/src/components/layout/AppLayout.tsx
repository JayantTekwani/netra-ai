import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderSearch,
  UploadCloud,
  Share2,
  CalendarClock,
  Settings,
  LogOut,
  ShieldCheck,
  Shield,
} from "lucide-react";
import type { ReactNode } from "react";
import { clearSession, getSession } from "@/lib/session";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cases", label: "Cases", icon: FolderSearch },
  { to: "/surveillance", label: "Surveillance", icon: ShieldCheck },
  { to: "/audit", label: "Audit & Custody", icon: Shield },
  { to: "/upload", label: "Upload Data", icon: UploadCloud },
  { to: "/investigation", label: "Investigation", icon: Share2 },
  { to: "/timeline", label: "Timeline", icon: CalendarClock },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppLayout({
  children,
  title,
  subtitle,
  actions,
  fullBleed = false,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  fullBleed?: boolean;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = getSession();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/40">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-mono text-base font-semibold tracking-[0.22em] text-foreground">
              NEXUS
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Intelligence Platform
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon
                  className={`size-4 transition-colors ${active ? "text-primary" : "group-hover:text-primary"}`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-secondary font-mono text-xs text-foreground">
              {(user?.name ?? "IN").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium">{user?.name ?? "Investigator"}</div>
              <div className="truncate text-xs text-muted-foreground">
                {user?.email ?? "demo@nexus.gov"}
              </div>
            </div>
            <button
              aria-label="Sign out"
              onClick={() => {
                clearSession();
                navigate({ to: "/" });
              }}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-6 border-b border-border bg-background/85 px-8 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">{actions}</div>
        </header>
        <main className={fullBleed ? "min-h-0 flex-1" : "flex-1 px-8 py-6"}>{children}</main>
        <footer className="border-t border-border px-8 py-3 text-xs text-muted-foreground">
          Prototype build — all cases, entities and records shown are fictional demo data.
        </footer>
      </div>
    </div>
  );
}
