import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  FolderSearch,
  Users,
  Share2,
  FileStack,
  UploadCloud,
  PlusCircle,
  Activity,
  AlertTriangle,
  Clock,
  ChevronRight,
  ShieldAlert,
  Radio,
  CalendarClock,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { HolographicGraph } from "@/components/graph/HolographicGraph";
import { Button } from "@/components/ui/button";
import { insights } from "@/data/mock";
import { getSession } from "@/lib/session";
import { useStore, getActiveCaseEntities, getActiveCaseRelationships, getActiveCaseRecords } from "@/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — त्रिनेत्र-AI Investigation Platform" },
      { name: "description", content: "MHA Intelligence Operations — active case overview." },
      { property: "og:title", content: "Dashboard — त्रिनेत्र-AI Investigation Platform" },
    ],
  }),
  component: DashboardPage,
});

/* ── Live Threat Pool ──────────────────────────────────────────── */
const THREAT_POOL = [
  ...insights.map(i => ({ id: i.id, headline: i.headline, detail: i.detail, level: "medium" as const })),
  { id: "L1", headline: "Anomalous fund transfer detected", detail: "A shell corporation transferred ₹8.4Cr through 4 intermediary banks in 12 hours.", level: "high" as const },
  { id: "L2", headline: "Burner phone activation surge", detail: "14 new prepaid devices activated in Sector 4 within a 30-minute window.", level: "high" as const },
  { id: "L3", headline: "Encrypted traffic spike", detail: "Unusual volume of TOR traffic originating from previously dormant IP range.", level: "medium" as const },
  { id: "L4", headline: "Cross-border travel correlation", detail: "Two subjects boarded separate flights arriving at the same destination 2 hours apart.", level: "medium" as const },
  { id: "L5", headline: "Vehicle proximity alert", detail: "Target vehicle spotted idling near key infrastructure asset for 45 minutes.", level: "critical" as const },
];

const LEVEL_META = {
  critical: { label: "CRITICAL", dot: "bg-red-500", border: "border-red-500/40", text: "text-red-400" },
  high:     { label: "HIGH",     dot: "bg-amber-500", border: "border-amber-500/30", text: "text-amber-400" },
  medium:   { label: "MEDIUM",  dot: "bg-primary/80", border: "border-primary/20", text: "text-primary" },
};

/* ── Live Clock ────────────────────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono text-sm text-muted-foreground tabular-nums">
      {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())} IST
    </span>
  );
}

/* ── Threat Level Badge ────────────────────────────────────────── */
function ThreatBadge({ threats }: { threats: typeof THREAT_POOL }) {
  const critCount = threats.filter(t => t.level === "critical").length;
  const highCount = threats.filter(t => t.level === "high").length;
  const overall = critCount > 0 ? "critical" : highCount > 1 ? "high" : "medium";
  const meta = LEVEL_META[overall];
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-2 ${meta.border} bg-card`}>
      <span className="relative flex size-2.5">
        <span className={`animate-ping absolute inline-flex size-full rounded-full opacity-60 ${meta.dot}`} />
        <span className={`relative inline-flex rounded-full size-2.5 ${meta.dot}`} />
      </span>
      <div className="leading-none">
        <div className={`text-[10px] font-mono uppercase tracking-widest ${meta.text}`}>Threat Level</div>
        <div className={`text-base font-bold tracking-wider font-mono ${meta.text}`}>{meta.label}</div>
      </div>
      <ShieldAlert className={`size-5 ml-1 ${meta.text}`} />
    </div>
  );
}

/* ── Stat Overlay Badge ────────────────────────────────────────── */
function StatOverlay({ label, value, icon: Icon, pos }: {
  label: string; value: number | string; icon: React.ElementType; pos: string;
}) {
  return (
    <div className={`absolute ${pos} flex items-center gap-1.5 rounded-md border border-primary/30 bg-card/90 px-2.5 py-1.5 backdrop-blur-sm shadow-lg z-10`}>
      <Icon className="size-3 text-primary shrink-0" />
      <span className="font-mono text-xs font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

/* ── Mini Table ────────────────────────────────────────────────── */
function MiniTable({ title, icon: Icon, rows, cols }: {
  title: string;
  icon: React.ElementType;
  rows: Record<string, string>[];
  cols: { key: string; label: string }[];
}) {
  return (
    <div className="panel flex flex-col h-full p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-3.5 text-primary shrink-0" />
        <span className="text-xs font-semibold tracking-tight uppercase font-mono text-muted-foreground">{title}</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border/60">
              {cols.map(c => (
                <th key={c.key} className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground pb-1.5 pr-2">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 6).map((row, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                {cols.map(c => (
                  <td key={c.key} className="py-1.5 pr-2 font-mono text-[11px] text-foreground/80 truncate max-w-[120px]">{row[c.key] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground italic">No records for this case.</p>
        )}
      </div>
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────── */
function DashboardPage() {
  const user = getSession();
  const activeCaseId = useStore(s => s.activeCaseId);
  const cases = useStore(s => s.cases);
  const activeCase = cases.find(c => c.id === activeCaseId);

  const entities = useStore(getActiveCaseEntities);
  const relationships = useStore(getActiveCaseRelationships);
  const supportingRecords = useStore(getActiveCaseRecords);

  const activeCases = cases.filter(c => c.status === "active");

  // Live alert ticker
  const [alerts, setAlerts] = useState(THREAT_POOL.slice(0, 6));
  useEffect(() => {
    const t = setInterval(() => {
      setAlerts(prev => {
        const rest = THREAT_POOL.filter(i => !prev.find(p => p.id === i.id));
        if (!rest.length) return prev;
        const next = rest[Math.floor(Math.random() * rest.length)]!;
        return [next, ...prev].slice(0, 50);
      });
    }, 4500);
    return () => clearInterval(t);
  }, []);

  // CDR records (type: call)
  const cdrRecords = supportingRecords
    .filter(r => r.type === "CDR" || (r.fields?.Type ?? "").toLowerCase().includes("call"))
    .slice(0, 6)
    .map(r => ({
      id: r.id,
      from: r.fields?.From ?? r.id,
      to: r.fields?.To ?? "—",
      date: r.date ?? "—",
    }));

  // FIR records
  const firRecords = supportingRecords
    .filter(r => r.type === "FIR" || r.id.startsWith("FIR") || (r.fields?.Type ?? "").toLowerCase().includes("fir"))
    .slice(0, 6)
    .map(r => ({
      id: r.id,
      title: r.title ?? r.id,
      date: r.date ?? "—",
      status: r.fields?.Status ?? "—",
    }));

  return (
    <AppLayout
      title={`Welcome, ${user?.name ?? "Investigator"}`}
      subtitle="MHA Intelligence Operations Dashboard"
      fullBleed={true}
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/upload"><UploadCloud className="mr-1.5 size-3.5" /> Upload</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/cases/new"><PlusCircle className="mr-1.5 size-3.5" /> New Case</Link>
          </Button>
        </>
      }
    >
      <div className="flex flex-col h-full px-6 py-4 gap-4">

        {/* ── Top Command Bar ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Radio className="size-3.5 text-primary animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Ministry of Home Affairs — त्रिनेत्र-AI
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm text-muted-foreground font-mono">
                Case: <span className="text-primary font-bold">{activeCaseId}</span>
                {activeCase && <span className="text-foreground"> — {activeCase.name}</span>}
              </span>
              <LiveClock />
            </div>
          </div>
          <ThreatBadge threats={alerts} />
        </div>

        {/* ── Main Bento Grid ────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">

          {/* ── LEFT: Graph (col 1-7) ──────────────────────── */}
          <div className="col-span-12 lg:col-span-7 panel relative overflow-hidden min-h-[520px] lg:min-h-0 p-0">
            {/* Floating stat badges */}
            <StatOverlay label="Entities"  value={entities.length}       icon={Users}      pos="top-3 left-3" />
            <StatOverlay label="Links"     value={relationships.length}  icon={Share2}     pos="top-3 left-32" />
            <StatOverlay label="Cases"     value={activeCases.length}    icon={FolderSearch} pos="bottom-3 left-3" />
            <StatOverlay label="Records"   value={supportingRecords.length} icon={FileStack}  pos="bottom-3 left-28" />

            <HolographicGraph entities={entities} relationships={relationships} />
          </div>

          {/* ── RIGHT: Alert Feed (col 8-12) ──────────────── */}
          <div className="col-span-12 lg:col-span-5 panel flex flex-col p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">Live Alert Feed</span>
              <span className="ml-auto flex size-2 relative">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-amber-500 opacity-60" />
                <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
              </span>
            </div>
            <ul className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin">
              {alerts.map(alert => {
                const meta = LEVEL_META[alert.level];
                return (
                  <li
                    key={alert.id}
                    className={`rounded-md border px-3 py-2.5 animate-in fade-in slide-in-from-right-3 duration-400 ${meta.border} bg-card/60`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 inline-flex size-1.5 shrink-0 rounded-full ${meta.dot} relative top-[3px]`} />
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold leading-snug ${meta.text}`}>{alert.headline}</div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{alert.detail}</p>
                      </div>
                      <span className={`ml-auto shrink-0 text-[9px] font-mono uppercase tracking-widest ${meta.text} opacity-70`}>{meta.label}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

        </div>

        {/* ── Bottom Row ─────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4" style={{ minHeight: "200px" }}>

          {/* CDR Table — 4 cols */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <MiniTable
              title="Recent CDR"
              icon={Activity}
              rows={cdrRecords}
              cols={[
                { key: "id",   label: "ID" },
                { key: "from", label: "From" },
                { key: "to",   label: "To" },
                { key: "date", label: "Date" },
              ]}
            />
          </div>

          {/* FIR Table — 4 cols */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <MiniTable
              title="Recent FIR Records"
              icon={FileStack}
              rows={firRecords}
              cols={[
                { key: "id",     label: "FIR #" },
                { key: "title",  label: "Subject" },
                { key: "date",   label: "Date" },
                { key: "status", label: "Status" },
              ]}
            />
          </div>

          {/* Quick Actions — 4 cols */}
          <div className="col-span-12 md:col-span-12 lg:col-span-4 panel p-4 flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Quick Actions</span>
            <Button variant="outline" className="w-full justify-start text-xs h-9" asChild>
              <Link to="/upload"><UploadCloud className="size-3.5 mr-2" />Upload New Data</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs h-9" asChild>
              <Link to="/timeline"><CalendarClock className="size-3.5 mr-2" />Review Timeline</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs h-9" asChild>
              <Link to="/investigation"><Share2 className="size-3.5 mr-2" />Investigation Workspace</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs h-9" asChild>
              <Link to="/cases"><FolderSearch className="size-3.5 mr-2" />All Cases<ChevronRight className="ml-auto size-3.5 opacity-50" /></Link>
            </Button>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}



