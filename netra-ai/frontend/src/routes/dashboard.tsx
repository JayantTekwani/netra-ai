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
  Lock,
  ArrowRight,
  Building2,
  Banknote,
  CheckCircle2,
  Send,
  Zap,
  ShieldCheck,
  Search,
  ExternalLink,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { HolographicGraph } from "@/components/graph/HolographicGraph";
import { EntityResolutionDemo } from "@/components/dashboard/EntityResolutionDemo";
import { LiveAnalysis } from "@/components/dashboard/LiveAnalysis";
import { Button } from "@/components/ui/button";
import { insights } from "@/data/mock";
import { getSession } from "@/lib/session";
import { useStore, getActiveCaseEntities, getActiveCaseRelationships, getActiveCaseRecords } from "@/store";
import { toast } from "sonner";

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

/* ── Live Threat Pool with Specialized Syndicates (Module 8) ───────────── */
const THREAT_POOL = [
  {
    id: "TH1",
    headline: "Transit Hub Clustering (Trafficking Risk)",
    detail: "3 phone numbers coordinated hotel bookings & overnight travel reservations across state borders (Delhi → Kolkata corridor) within 48h.",
    level: "critical" as const,
    type: "trafficking",
  },
  {
    id: "SX1",
    headline: "Organized Sextortion & Grooming Syndicate",
    detail: "8 burner numbers from same IMEI hardware cluster simultaneously targeted VICTIM-F-001 over WhatsApp from IP range 103.211.x.x.",
    level: "critical" as const,
    type: "sextortion",
  },
  ...insights.map((i) => ({ id: i.id, headline: i.headline, detail: i.detail, level: "medium" as const, type: "general" })),
  { id: "L1", headline: "Cross-border travel correlation", detail: "Two subjects boarded separate flights arriving at the same destination 2 hours apart.", level: "critical" as const, type: "general" },
  { id: "L2", headline: "TOR traffic spike", detail: "Unusual volume of TOR traffic originating from previously dormant IP range.", level: "high" as const, type: "general" },
  { id: "L3", headline: "Vehicle proximity alert", detail: "Target vehicle spotted idling near key infrastructure asset for 45 minutes.", level: "critical" as const, type: "general" },
  { id: "L5", headline: "Anomalous fund transfer detected", detail: "A shell corporation transferred ₹8.4Cr through 4 intermediary banks in 12 hours.", level: "high" as const, type: "general" },
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
          { label: "I4C CFCFRMS Stream", val: "1.4k Req/s", state: "text-amber-500" },
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

  // Module 8 State: Alert Inspection Modals
  const [inspectAlert, setInspectAlert] = useState<string | null>(null);

  // Module 8 State: Mule Chain Freeze
  const [layer2Frozen, setLayer2Frozen] = useState<boolean>(false);
  const [isFreezing, setIsFreezing] = useState<boolean>(false);

  // Module 8 State: ZKP Inter-State Query
  const [zkpInput, setZkpInput] = useState<string>("358234091234567");
  const [zkpState, setZkpState] = useState<"idle" | "querying" | "matched">("idle");

  useEffect(() => {
    const t = setInterval(() => {
      setAlerts((prev) => {
        const rest = THREAT_POOL.filter((i) => !prev.find((p) => p.id === i.id));
        // When all alerts have cycled, restart from the beginning to keep the live feed running
        const pool = rest.length > 0 ? rest : THREAT_POOL;
        const next = pool[Math.floor(Math.random() * pool.length)]!;
        return [next, ...prev].slice(0, 5);
      });
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const handleCfcFrmsFreeze = () => {
    setIsFreezing(true);
    setTimeout(() => {
      setIsFreezing(false);
      setLayer2Frozen(true);
      toast.success("CFCFRMS 2.0 API Freeze Inscribed", {
        description: "Direct Section 94 BNSS Auto-Lien placed on downstream accounts across HDFC & ICICI Core Banking Systems.",
      });
    }, 1400);
  };

  const handleZkpQuery = () => {
    if (!zkpInput.trim()) return;
    setZkpState("querying");
    setTimeout(() => {
      setZkpState("matched");
      toast.success("Zero-Knowledge Proof Match Confirmed", {
        description: "Cryptographic signal returned: UP Police holds active case record. Zero raw files shared.",
      });
    }, 1600);
  };

  const cdrRecords = supportingRecords.filter((r) => r.kind === "CDR" || r.type === "CDR");
  const txnRecords = supportingRecords.filter((r) => r.kind === "TXN" || r.type === "TXN");
  const firRecords = supportingRecords.filter((r) => r.kind === "FIR" || r.kind === "GEO" || r.type === "FIR");

  return (
    <AppLayout>
      {/* ============================================ */}
      {/* MAIN GRID - 12 Columns (FULL WIDTH)          */}
      {/* ============================================ */}
      <div className="grid grid-cols-12 gap-5 w-full">
        {/* --- ROW 1: LEFT (col-span-12 lg:col-span-8) = GRAPH --- */}
        <div className="col-span-12 lg:col-span-8 bg-secondary/30 rounded-2xl border border-border/50 p-4 min-h-[440px] flex flex-col relative">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Share2 className="size-3.5 text-primary" />
              Entity Relationship Map
            </h3>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-full font-bold text-primary font-mono">
                {cases.length} Cases
              </span>
              <span className="px-3 py-1 bg-secondary border border-border rounded-full font-mono">
                {entities.length} Entities
              </span>
              <span className="px-3 py-1 bg-secondary border border-border rounded-full font-mono">
                {relationships.length} Links
              </span>
            </div>
          </div>

          {/* Graph Container */}
          <div className="w-full h-[370px] rounded-xl overflow-hidden border border-border/60 relative bg-background/50 flex-1">
            <HolographicGraph entities={entities} relationships={relationships} />
          </div>

          {/* Mini Legend */}
          <div className="absolute bottom-6 left-6 flex gap-3 text-[9px] text-muted-foreground bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 pointer-events-none z-10">
            <span>👤 Person</span>
            <span>📞 Device</span>
            <span>💳 Account</span>
          </div>
        </div>

        {/* --- ROW 1: RIGHT (col-span-12 lg:col-span-4) = SPECIALIZED ALERTS --- */}
        <div className="col-span-12 lg:col-span-4 bg-card rounded-2xl border border-border/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between items-center mb-3">
              <span className="flex items-center gap-1.5">🚨 Specialized Threat Alerts</span>
              <span className="text-[9px] bg-secondary border border-border px-2 py-0.5 rounded-full font-mono">
                I4C Stream
              </span>
            </h3>

            <div className="space-y-2.5 overflow-y-auto max-h-[370px] pr-1">
              {/* Alert 1: Transit Hub Clustering (Module 8.1) */}
              <div className="p-3 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg transition-colors hover:bg-red-500/15">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-red-400">Transit Hub Cluster (Trafficking)</h4>
                  <span className="text-[9px] text-muted-foreground font-mono">Just Now</span>
                </div>
                <p className="text-xs text-foreground/70 mt-1">
                  3 phones coordinated hotel bookings + overnight sleeper buses across state borders (Delhi &rarr; Kolkata).
                </p>
                <button
                  onClick={() => setInspectAlert("trafficking")}
                  className="inline-block text-[10px] font-bold text-primary mt-1.5 hover:underline"
                >
                  Inspect Corridor Sub-Graph &rarr;
                </button>
              </div>

              {/* Alert 2: Sextortion Network (Module 8.2) */}
              <div className="p-3 bg-rose-500/10 border-l-4 border-rose-500 rounded-r-lg transition-colors hover:bg-rose-500/15">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-rose-400">Sextortion & Grooming Ring</h4>
                  <span className="text-[9px] text-muted-foreground font-mono">12m ago</span>
                </div>
                <p className="text-xs text-foreground/70 mt-1">
                  8 burner numbers from single IMEI cluster simultaneously targeted VICTIM-F-001 via WhatsApp.
                </p>
                <button
                  onClick={() => setInspectAlert("sextortion")}
                  className="inline-block text-[10px] font-bold text-rose-400 mt-1.5 hover:underline"
                >
                  Inspect Multi-Burner Cluster &rarr;
                </button>
              </div>

              {/* Alert 3 */}
              <div className="p-3 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg transition-colors hover:bg-orange-500/15">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-orange-400">TOR traffic spike</h4>
                  <span className="text-[9px] text-muted-foreground font-mono">45m ago</span>
                </div>
                <p className="text-xs text-foreground/70 mt-1">Unusual volume from previously dormant IP range.</p>
                <Link to="/investigation" className="inline-block text-[10px] font-bold text-primary mt-1.5 hover:underline">
                  Investigate &rarr;
                </Link>
              </div>

              {/* Alert 4 */}
              <div className="p-3 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-lg transition-colors hover:bg-yellow-500/15">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-yellow-400">Vehicle proximity</h4>
                  <span className="text-[9px] text-muted-foreground font-mono">1h ago</span>
                </div>
                <p className="text-xs text-foreground/70 mt-1">Target idling near key infrastructure (45 mins).</p>
                <Link to="/surveillance" className="inline-block text-[10px] font-bold text-primary mt-1.5 hover:underline">
                  Geo-locate &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* --- ROW 2: MULE ACCOUNT CHAIN TRACKER WIDGET (MODULE 8.3) --- */}
        <div className="col-span-12 bg-card rounded-2xl border border-primary/40 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Banknote className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase">
                    I4C CFCFRMS 2.0 &bull; 1930 Live Feed
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">Rapid Micro-Transfer Mapping</span>
                </div>
                <h3 className="text-sm font-bold text-foreground mt-0.5">
                  Mule Account Chain Tracker (Cyber Fraud & Matrimonial Scams)
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-muted-foreground">Traced: <strong className="text-foreground">&#8377;2,40,000</strong></span>
              <span className="text-muted-foreground">&bull; 4 Layers</span>
              <Button
                size="sm"
                onClick={handleCfcFrmsFreeze}
                disabled={isFreezing || layer2Frozen}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold h-8"
              >
                <Zap className="size-3.5 mr-1" />
                {isFreezing ? "Pushing API Lien..." : layer2Frozen ? "Lien Marked ✅" : "Trigger CFCFRMS Freeze API"}
              </Button>
            </div>
          </div>

          {/* FINANCIAL FLOW MULTI-TIER DIAGRAM */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
            {/* Stage 1: Victim */}
            <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 flex flex-col justify-between">
              <div className="text-[10px] text-muted-foreground uppercase">Victim (Matrimonial Scam)</div>
              <div className="font-bold text-foreground mt-1">Sunita K.</div>
              <div className="text-[11px] text-red-400 mt-0.5">-&#8377;2,40,000 (UPI)</div>
              <div className="text-[9px] text-muted-foreground mt-2">Complaint via 1930 Helpline</div>
            </div>

            {/* Stage 2: Layer 1 Mule */}
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/40 flex flex-col justify-between">
              <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center justify-between">
                <span>Layer 1 Mule</span>
                <CheckCircle2 className="size-3" />
              </div>
              <div className="font-bold text-foreground mt-1">SBI Acct #9910</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">&#8377;2,40,000</div>
              <div className="text-[9px] text-emerald-400 font-bold mt-2">FREEZE MARKED (API)</div>
            </div>

            {/* Stage 3: Layer 2 Mules */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
              layer2Frozen ? "bg-emerald-500/10 border-emerald-500/40" : "bg-amber-500/10 border-amber-500/40"
            }`}>
              <div className="text-[10px] uppercase font-bold flex items-center justify-between">
                <span className={layer2Frozen ? "text-emerald-400" : "text-amber-400"}>Layer 2 (4 Mules)</span>
                <span className="text-[9px]">{layer2Frozen ? "FROZEN" : "PENDING"}</span>
              </div>
              <div className="font-bold text-foreground mt-1">HDFC & ICICI (4 Accts)</div>
              <div className="text-[11px] text-foreground mt-0.5">4 x &#8377;60,000</div>
              <div className={`text-[9px] font-bold mt-2 ${layer2Frozen ? "text-emerald-400" : "text-amber-400"}`}>
                {layer2Frozen ? "AUTO-LIEN APPLIED ✅" : "WAITING SP LIEN"}
              </div>
            </div>

            {/* Stage 4: Layer 3 Micro-Smurfing */}
            <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 flex flex-col justify-between">
              <div className="text-[10px] text-muted-foreground uppercase">Layer 3 (8 Mules)</div>
              <div className="font-bold text-foreground mt-1">Paytm Payments Bank</div>
              <div className="text-[11px] text-foreground mt-0.5">8 x &#8377;30,000</div>
              <div className="text-[9px] text-muted-foreground mt-2">Transit Accounts Flagged</div>
            </div>

            {/* Stage 5: ATM Cashout */}
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/40 flex flex-col justify-between">
              <div className="text-[10px] text-red-400 uppercase font-bold flex items-center justify-between">
                <span>ATM Cash-Out</span>
                <AlertTriangle className="size-3" />
              </div>
              <div className="font-bold text-foreground mt-1">Mewat / Alwar ATMs</div>
              <div className="text-[11px] text-red-400 mt-0.5">&#8377;2,40,000 Target</div>
              <div className="text-[9px] text-red-400 font-bold mt-2">CASH-OUT INTERCEPTED</div>
            </div>
          </div>
        </div>

        {/* --- ROW 3: LEFT = ZERO-KNOWLEDGE PROOF INTER-STATE QUERY (MODULE 8.4) --- */}
        <div className="col-span-12 lg:col-span-6 bg-card rounded-2xl border border-border/50 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">
                Zero-Knowledge Proof (ZKP) Inter-State Intelligence Query
              </h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">Cross-Border Silo Breaker</span>
          </div>

          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            State police departments cannot freely share raw case files across borders due to jurisdictional silos.
            TriNetra's ZKP engine queries federated indices across UP, Haryana, and Delhi Police without exposing
            confidential case intelligence.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={zkpInput}
              onChange={(e) => {
                setZkpInput(e.target.value);
                setZkpState("idle");
              }}
              placeholder="Query Target IMEI or Bank Account..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-primary"
            />
            <Button size="sm" onClick={handleZkpQuery} disabled={zkpState === "querying"} className="text-xs">
              {zkpState === "querying" ? "Computing Proof..." : "Query States"}
            </Button>
          </div>

          {zkpState === "matched" && (
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-400 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="size-4" />
                ZKP CRYPTOGRAPHIC MATCH CONFIRMED
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                UP Police Special Task Force holds active FIR records matching IMEI: <strong className="text-foreground">{zkpInput}</strong>.
                Zero private operational details were exposed during verification.
              </p>
              <div className="mt-2 pt-2 border-t border-emerald-500/30 flex justify-between items-center text-[10px]">
                <span>State Node: UP-STF-LUCKNOW</span>
                <span className="text-primary font-bold hover:underline cursor-pointer">
                  Request MHA Formal Coordination &rarr;
                </span>
              </div>
            </div>
          )}
        </div>

        {/* --- ROW 3: RIGHT = QUICK ACTIONS & SUPPORTING RECORDS --- */}
        <div className="col-span-12 lg:col-span-6 bg-card rounded-2xl border border-border/50 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
              <span>📄 Supporting Records ({supportingRecords.length || 16} total)</span>
              <Link to="/investigation" className="text-[10px] font-mono text-primary hover:underline lowercase">
                view all &rarr;
              </Link>
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-secondary/30 p-3 rounded-xl border border-border/40">
                <span className="text-[10px] text-muted-foreground font-mono uppercase">CDR Logs</span>
                <div className="text-xl font-mono font-bold mt-1">{cdrRecords.length || 8}</div>
                <span className="text-[9px] text-green-400 font-mono">+2 new (Airtel)</span>
              </div>
              <div className="bg-secondary/30 p-3 rounded-xl border border-border/40">
                <span className="text-[10px] text-muted-foreground font-mono uppercase">TXN Records</span>
                <div className="text-xl font-mono font-bold mt-1">{txnRecords.length || 4}</div>
                <span className="text-[9px] text-yellow-400 font-mono">⚠️ 1 flagged</span>
              </div>
              <div className="bg-secondary/30 p-3 rounded-xl border border-border/40">
                <span className="text-[10px] text-muted-foreground font-mono uppercase">FIR / GEO</span>
                <div className="text-xl font-mono font-bold mt-1">{firRecords.length || 4}</div>
                <span className="text-[9px] text-blue-400 font-mono">✅ 2 resolved</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">⚡ Quick Actions</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" asChild className="text-xs justify-center">
                <Link to="/imei">IMEI Intel</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-center">
                <Link to="/patterns">Crime Patterns</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="text-xs justify-center text-primary border-primary/40">
                <Link to="/requisition">ADRIP Requisition</Link>
              </Button>
            </div>
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

      {/* MODAL 1: TRANSIT HUB CLUSTERING INSPECTOR (MODULE 8.1) */}
      {inspectAlert === "trafficking" && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border-2 border-red-500/70 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-border pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold uppercase">
                  Human Trafficking Network Isolation
                </span>
                <h3 className="text-base font-bold text-foreground mt-1">
                  Transit Hub Corridor Cluster Detected
                </h3>
              </div>
              <button onClick={() => setInspectAlert(null)} className="text-muted-foreground hover:text-foreground text-xs font-mono">
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Algorithms detected high-frequency short-duration local calls co-located with inter-state rail bookings from
              Delhi Anand Vihar Terminal to Kolkata Howrah. 3 separate phones shared identical booking agent IPs.
            </p>

            <div className="h-48 bg-background/80 rounded-xl border border-border/60 flex items-center justify-center p-2 relative">
              <svg className="w-full h-full" viewBox="0 0 400 180">
                {/* 3 Source Phones */}
                <circle cx="60" cy="50" r="14" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x="60" y="54" textAnchor="middle" fill="#f8fafc" fontSize="8" fontFamily="monospace">PHN-01</text>
                <circle cx="60" cy="90" r="14" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x="60" y="94" textAnchor="middle" fill="#f8fafc" fontSize="8" fontFamily="monospace">PHN-02</text>
                <circle cx="60" cy="130" r="14" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x="60" y="134" textAnchor="middle" fill="#f8fafc" fontSize="8" fontFamily="monospace">PHN-03</text>

                {/* Edges to Hub */}
                <line x1="74" y1="50" x2="190" y2="90" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="74" y1="90" x2="190" y2="90" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="74" y1="130" x2="190" y2="90" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Transit Hub Node */}
                <circle cx="200" cy="90" r="22" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
                <text x="200" y="88" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace">TRANSIT HUB</text>
                <text x="200" y="98" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">Paharganj Hotel</text>

                {/* Corridor to Kolkata */}
                <line x1="222" y1="90" x2="320" y2="90" stroke="#ef4444" strokeWidth="2" />
                <circle cx="335" cy="90" r="16" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x="335" y="94" textAnchor="middle" fill="#f8fafc" fontSize="8" fontFamily="monospace">KOLKATA</text>
              </svg>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setInspectAlert(null)}>
                Close
              </Button>
              <Button size="sm" asChild className="bg-primary">
                <Link to="/investigation">Trace Full Network in Workspace</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SEXTORTION ATTACK RING INSPECTOR (MODULE 8.2) */}
      {inspectAlert === "sextortion" && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border-2 border-rose-500/70 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-border pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full font-bold uppercase">
                  Organized Sextortion & Grooming Syndicate
                </span>
                <h3 className="text-base font-bold text-foreground mt-1">
                  Multi-Burner Simultaneous Harassment Cluster
                </h3>
              </div>
              <button onClick={() => setInspectAlert(null)} className="text-muted-foreground hover:text-foreground text-xs font-mono">
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Attack graph isolates 8 burner numbers hailing from an identical subnet (103.211.x.x) and single hardware IMEI
              chassis, executing synchronized extortion pings against victim within a 4-hour attack envelope.
            </p>

            <div className="h-48 bg-background/80 rounded-xl border border-border/60 flex items-center justify-center p-2 relative">
              <svg className="w-full h-full" viewBox="0 0 400 180">
                {/* 8 Attackers surrounding 1 victim */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * 2 * Math.PI;
                  const x = 200 + 75 * Math.cos(angle);
                  const y = 90 + 65 * Math.sin(angle);
                  return (
                    <g key={i}>
                      <line x1={x} y1={y} x2="200" y2="90" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" />
                      <circle cx={x} cy={y} r="10" fill="#1e293b" stroke="#f43f5e" strokeWidth="1.5" />
                      <text x={x} y={y + 3} textAnchor="middle" fill="#fda4af" fontSize="6" fontFamily="monospace">
                        #{i + 1}
                      </text>
                    </g>
                  );
                })}

                {/* Central Victim Node */}
                <circle cx="200" cy="90" r="24" fill="#0f172a" stroke="#ffffff" strokeWidth="2.5" />
                <text x="200" y="88" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  TARGET
                </text>
                <text x="200" y="98" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                  VICTIM-F-001
                </text>
              </svg>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setInspectAlert(null)}>
                Close
              </Button>
              <Button size="sm" asChild className="bg-rose-600 hover:bg-rose-700 text-white">
                <Link to="/imei">Inspect Hardware Chassis in IMEI Intel</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
