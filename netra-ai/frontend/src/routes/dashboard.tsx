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
import { EntityResolutionDemo } from "@/components/dashboard/EntityResolutionDemo";
import { LiveAnalysis } from "@/components/dashboard/LiveAnalysis";
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
  ...insights.map((i) => ({ id: i.id, headline: i.headline, detail: i.detail, level: "medium" as const })),
  { id: "L1", headline: "Cross-border travel correlation", detail: "Two subjects boarded separate flights arriving at the same destination 2 hours apart.", level: "critical" as const },
  { id: "L2", headline: "TOR traffic spike", detail: "Unusual volume of TOR traffic originating from previously dormant IP range.", level: "high" as const },
  { id: "L3", headline: "Vehicle proximity alert", detail: "Target vehicle spotted idling near key infrastructure asset for 45 minutes.", level: "critical" as const },
  { id: "L4", headline: "Pattern: Burr detected", detail: "14 nodes matched, 30+ new relationships surfaced across phone clusters.", level: "medium" as const },
  { id: "L5", headline: "Anomalous fund transfer detected", detail: "A shell corporation transferred ₹8.4Cr through 4 intermediary banks in 12 hours.", level: "high" as const },
];

function ServerNodesMetrics() {
  return (
    <section className="col-span-12 mt-2 mb-4 bg-background/30 border border-border/50 p-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold tracking-tight">Infrastructure & Compute Nodes</h2>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Edge GPU Nodes", val: "42 Active", state: "text-green-500" },
          { label: "Graph DB Replicas", val: "3 / 3 Sync", state: "text-green-500" },
          { label: "API Gateway Load", val: "1.4k Req/s", state: "text-amber-500" },
          { label: "Merkle Hash Rate", val: "440 H/s", state: "text-green-500" },
        ].map((n, i) => (
          <div key={i} className="bg-secondary/30 p-4 rounded-xl border border-white/5">
            <div className="text-sm text-muted-foreground">{n.label}</div>
            <div className={`text-xl font-mono font-bold mt-1 ${n.state}`}>{n.val}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardPage() {
  const user = getSession();
  const activeCaseId = useStore((s) => s.activeCaseId);
  const cases = useStore((s) => s.cases);
  const activeCase = cases.find((c) => c.id === activeCaseId);

  const entities = useStore(getActiveCaseEntities);
  const relationships = useStore(getActiveCaseRelationships);
  const supportingRecords = useStore(getActiveCaseRecords);

  // Live Threat Alerts Ticker
  const [alerts, setAlerts] = useState(THREAT_POOL.slice(0, 4));
  useEffect(() => {
    const t = setInterval(() => {
      setAlerts((prev) => {
        const rest = THREAT_POOL.filter((i) => !prev.find((p) => p.id === i.id));
        if (!rest.length) return prev;
        const next = rest[Math.floor(Math.random() * rest.length)]!;
        return [next, ...prev].slice(0, 50);
      });
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const cdrRecords = supportingRecords.filter((r) => r.kind === "CDR" || r.type === "CDR");
  const txnRecords = supportingRecords.filter((r) => r.kind === "TXN" || r.type === "TXN");
  const firRecords = supportingRecords.filter((r) => r.kind === "FIR" || r.kind === "GEO" || r.type === "FIR");

  return (
    <AppLayout>
      {/* ============================================ */}
      {/* MAIN GRID - 12 Columns (FULL WIDTH - No Sidebar) */}
      {/* ============================================ */}
      <div className="grid grid-cols-12 gap-5 w-full">

        {/* --- ROW 1: LEFT (col-span-12 lg:col-span-8) = GRAPH --- */}
        <div className="col-span-12 lg:col-span-8 bg-secondary/30 rounded-2xl border border-border/50 p-4 min-h-[440px] flex flex-col relative">
          {/* Floating Stats */}
          <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Share2 className="size-3.5 text-primary" />
              Entity Relationship Map
            </h3>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-full font-bold text-primary font-mono">{cases.length} Cases</span>
              <span className="px-3 py-1 bg-secondary border border-border rounded-full font-mono">{entities.length} Entities</span>
              <span className="px-3 py-1 bg-secondary border border-border rounded-full font-mono">{relationships.length} Links</span>
            </div>
          </div>

          {/* Graph Container */}
          <div className="w-full h-[370px] rounded-xl overflow-hidden border border-border/60 relative bg-background/50 flex-1">
            <HolographicGraph entities={entities} relationships={relationships} />
          </div>

          {/* Mini Legend */}
          <div className="absolute bottom-6 left-6 flex gap-3 text-[9px] text-muted-foreground bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 pointer-events-none z-10">
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1"></span> Person</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1"></span> Device</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1"></span> Account</span>
          </div>
        </div>

        {/* --- ROW 1: RIGHT (col-span-12 lg:col-span-4) = ALERTS --- */}
        <div className="col-span-12 lg:col-span-4 bg-card rounded-2xl border border-border/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between items-center mb-3">
              <span className="flex items-center gap-1.5">🚨 Threat Alerts</span>
              <span className="text-[9px] bg-secondary border border-border px-2 py-0.5 rounded-full font-mono">Live</span>
            </h3>
            <div className="space-y-2.5 overflow-y-auto max-h-[370px] pr-1">
              {/* Alert 1 */}
              <div className="p-3 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg transition-colors hover:bg-red-500/15">
                <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-red-400">Cross-border travel</h4><span className="text-[9px] text-muted-foreground font-mono">2h ago</span></div>
                <p className="text-xs text-foreground/70 mt-1">Two subjects boarded flights arriving same destination 2 hrs apart.</p>
                <Link to="/investigation" className="inline-block text-[10px] font-bold text-primary mt-1.5 hover:underline">Assign →</Link>
              </div>
              {/* Alert 2 */}
              <div className="p-3 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg transition-colors hover:bg-orange-500/15">
                <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-orange-400">TOR traffic spike</h4><span className="text-[9px] text-muted-foreground font-mono">45m ago</span></div>
                <p className="text-xs text-foreground/70 mt-1">Unusual volume from previously dormant IP range.</p>
                <Link to="/investigation" className="inline-block text-[10px] font-bold text-primary mt-1.5 hover:underline">Investigate →</Link>
              </div>
              {/* Alert 3 */}
              <div className="p-3 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-lg transition-colors hover:bg-yellow-500/15">
                <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-yellow-400">Vehicle proximity</h4><span className="text-[9px] text-muted-foreground font-mono">10m ago</span></div>
                <p className="text-xs text-foreground/70 mt-1">Target idling near key infrastructure (45 mins).</p>
                <Link to="/surveillance" className="inline-block text-[10px] font-bold text-primary mt-1.5 hover:underline">Geo-locate →</Link>
              </div>
              {/* Alert 4 */}
              <div className="p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg transition-colors hover:bg-blue-500/15">
                <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-blue-400">Pattern: Burr</h4><span className="text-[9px] text-muted-foreground font-mono">30m ago</span></div>
                <p className="text-xs text-foreground/70 mt-1">14 nodes matched, 30+ new relationships.</p>
                <Link to="/investigation" className="inline-block text-[10px] font-bold text-primary mt-1.5 hover:underline">Review →</Link>
              </div>
            </div>
          </div>
        </div>

        {/* --- ROW 2: LEFT (col-span-12 lg:col-span-8) = RECORDS --- */}
        <div className="col-span-12 lg:col-span-8 bg-secondary/30 rounded-2xl border border-border/50 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
            <span>📄 Supporting Records ({supportingRecords.length || 16} total)</span>
            <Link to="/investigation" className="text-[10px] font-mono text-primary hover:underline lowercase">view all &rarr;</Link>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card p-3.5 rounded-xl border border-border/40">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">CDR</span>
              <div className="text-xl font-mono font-bold mt-1">{cdrRecords.length || 8}</div>
              <span className="text-[9px] text-green-400 font-mono">+2 new</span>
            </div>
            <div className="bg-card p-3.5 rounded-xl border border-border/40">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">TXN</span>
              <div className="text-xl font-mono font-bold mt-1">{txnRecords.length || 4}</div>
              <span className="text-[9px] text-yellow-400 font-mono">⚠️ 1 flagged</span>
            </div>
            <div className="bg-card p-3.5 rounded-xl border border-border/40">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">FIR / GEO</span>
              <div className="text-xl font-mono font-bold mt-1">{firRecords.length || 4}</div>
              <span className="text-[9px] text-blue-400 font-mono">✅ 2 resolved</span>
            </div>
          </div>
        </div>

        {/* --- ROW 2: RIGHT (col-span-12 lg:col-span-4) = QUICK ACTIONS --- */}
        <div className="col-span-12 lg:col-span-4 bg-card rounded-2xl border border-border/50 p-4 flex flex-col justify-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            ⚡ Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="outline" className="py-2.5 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-xs font-bold text-primary transition-all justify-center h-auto" asChild>
              <Link to="/upload">Upload Data</Link>
            </Button>
            <Button variant="outline" className="py-2.5 px-3 bg-secondary hover:bg-secondary/70 border border-border rounded-lg text-xs font-bold transition-all justify-center h-auto" asChild>
              <Link to="/timeline">Timeline</Link>
            </Button>
            <Button variant="outline" className="py-2.5 px-3 bg-secondary hover:bg-secondary/70 border border-border rounded-lg text-xs font-bold transition-all col-span-2 justify-center h-auto" asChild>
              <Link to="/cases/new">+ New Investigation</Link>
            </Button>
          </div>
        </div>

        {/* --- Live Analysis & Entity Resolution below the bento grid --- */}
        <div className="col-span-12">
          <LiveAnalysis entities={entities} relationships={relationships} />
        </div>
        <div className="col-span-12">
          <EntityResolutionDemo />
        </div>
        <div className="col-span-12">
          <ServerNodesMetrics />
        </div>
      </div>
      
      {/* Optional Footer Metrics */}
      <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap gap-6 text-[10px] text-muted-foreground font-mono">
        <span>Edge Nodes: <strong className="text-foreground">{entities.length}</strong></span>
        <span>Graph DB: <strong className="text-foreground">3 replicas</strong></span>
        <span>API Load: <strong className="text-foreground">1.4k req/s</strong></span>
      </div>
    </AppLayout>
  );
}
