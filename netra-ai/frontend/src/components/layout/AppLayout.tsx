import { useStore } from '@/store';
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
import { type ReactNode, useState, useEffect } from "react";
import { clearSession, getSession } from "@/lib/session";


const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cases", label: "Cases", icon: FolderSearch },
  { to: "/surveillance", label: "Surveillance", icon: ShieldCheck },
  { to: "/compliance", label: "Audit & Custody", icon: Shield },
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
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  fullBleed?: boolean;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = getSession();

  const cases = useStore((s) => s.cases);
  const activeCaseId = useStore((s) => s.activeCaseId);
  // Actions: use getState() directly — don't subscribe to function refs as state
  const setActiveCaseId = (id: string) => useStore.getState().setActiveCaseId(id);

  // Live IST clock — updates every minute
  const [istTimeStr, setIstTimeStr] = useState(() =>
    new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  );
  useEffect(() => {
    const tick = () =>
      setIstTimeStr(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Dynamic Threat Index
  const activeCase = cases.find((c) => c.id === activeCaseId);
  const threatLevel =
    cases.length === 0
      ? { label: "LOW", cls: "bg-green-600/20 text-green-400 border-green-500/30" }
      : (activeCase as any)?.status === "active"
      ? { label: "MODERATE", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
      : { label: "MODERATE", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full max-w-full">
      {/* ============================================ */}
      {/* TOP HEADER + HORIZONTAL COMMAND RIBBON       */}
      {/* ============================================ */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md px-6 py-3 transition-colors">
        {/* Row 1: Agency Branding, Threat Level, Case Switcher, User */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          {/* Left: Branding */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary shadow-sm">
              MHA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight">
                  Command Briefing: <span className="text-primary font-semibold">त्रिनेत्र-AI</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  SIH26189
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {istTimeStr} IST
              </p>
            </div>
          </div>

          {/* Right: Case Switcher, Threat Index, Theme Toggle, User Profile */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Active Case Switcher */}
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1 text-xs">
              <span className="font-semibold text-primary uppercase font-mono text-[11px]">Case:</span>
              <select
                className="bg-transparent text-xs font-mono font-medium text-foreground focus:outline-none cursor-pointer max-w-[170px] sm:max-w-[210px] truncate"
                value={activeCaseId}
                onChange={(e) => setActiveCaseId(e.target.value)}
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id} className="bg-background text-foreground">
                    {c.id} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Threat Index */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Threat Index</span>
              <span className={`px-3 py-1 border rounded-full text-xs font-bold animate-pulse ${threatLevel.cls}`}>
                ● {threatLevel.label}
              </span>
            </div>

            {/* Actions if provided by child page */}
            {actions && <div className="flex items-center gap-2">{actions}</div>}

            {/* Theme Toggle */}
            <button
              className="theme-toggle"
              onClick={() => {
                const html = document.documentElement;
                const isDark = html.getAttribute("data-theme") === "dark";
                html.setAttribute("data-theme", isDark ? "light" : "dark");
              }}
              title="Toggle Theme"
            />

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <div className="flex size-8 items-center justify-center rounded-full bg-secondary font-mono text-xs text-foreground border border-border" title={user?.email || "Investigator"}>
                {(user?.name ?? "IN").slice(0, 2).toUpperCase()}
              </div>
              <button
                aria-label="Sign out"
                onClick={() => {
                  clearSession();
                  navigate({ to: "/" });
                }}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Horizontal Command Ribbon Navigation */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                  active
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                }`}
              >
                <Icon className={`size-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ============================================ */}
      {/* MAIN CONTENT: 100% FULL WIDTH (NO SIDEBAR)   */}
      {/* ============================================ */}
      <main className={fullBleed ? "min-h-0 flex-1 w-full max-w-full" : "flex-1 w-full max-w-full px-6 py-6"}>
        {title && title !== "Dashboard" && pathname !== "/dashboard" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
          </div>
        )}
        {children}
      </main>

      <footer className="border-t border-border/40 px-6 py-3 text-xs text-muted-foreground flex flex-wrap justify-between items-center gap-4">
        <span>त्रिनेत्र-AI (MHA Intelligence Platform) &bull; Prototype Build</span>
        <span className="font-mono text-[11px]">All cases, entities & records shown are synthetic demo data.</span>
      </footer>
    </div>
  );
}
