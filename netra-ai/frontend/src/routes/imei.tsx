import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Smartphone,
  AlertTriangle,
  Users,
  Layers,
  ArrowRight,
  ShieldAlert,
  GitMerge,
  Cpu,
  Radio,
  CheckCircle2,
  Clock,
  PhoneCall,
  Search,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/imei")({
  head: () => ({
    meta: [
      { title: "IMEI & SIM Intelligence — त्रिनेत्र-AI" },
      {
        name: "description",
        content: "Hardware node stitching and burner SIM hopping analysis for criminal handset tracking.",
      },
    ],
  }),
  component: ImeiIntelligencePage,
});

interface SimRecord {
  id: string;
  msisdn: string;
  imsi: string;
  operator: "Jio" | "Airtel" | "Vi" | "BSNL";
  startDate: string;
  endDate: string;
  startDay: number;
  endDay: number;
  callCount: number;
  shared?: boolean;
}

interface ImeiHardwareNode {
  imei: string;
  tac: string;
  brand: string;
  model: string;
  status: "flagged_burner" | "suspicious" | "monitored";
  firstSeen: string;
  lastSeen: string;
  totalSims: number;
  daysWindow: number;
  targetSuspect: string;
  sims: SimRecord[];
}

const DEMO_HARDWARE_NODES: ImeiHardwareNode[] = [
  {
    imei: "358234091234567",
    tac: "35823409",
    brand: "Xiaomi",
    model: "Redmi 12 5G (Moonstone Silver)",
    status: "flagged_burner",
    firstSeen: "2026-01-01 04:12 IST",
    lastSeen: "2026-01-16 19:45 IST",
    totalSims: 6,
    daysWindow: 15,
    targetSuspect: "PER-001 (Rahul Sharma / Chhota Taklu)",
    sims: [
      { id: "S1", msisdn: "+91-9876543210", imsi: "404450123456789", operator: "Airtel", startDate: "Jan 01", endDate: "Jan 05", startDay: 1, endDay: 5, callCount: 42 },
      { id: "S2", msisdn: "+91-9823456781", imsi: "404450987654321", operator: "Jio", startDate: "Jan 05", endDate: "Jan 08", startDay: 5, endDay: 8, callCount: 19 },
      { id: "S3", msisdn: "+91-9734567892", imsi: "404450345678901", operator: "Vi", startDate: "Jan 08", endDate: "Jan 10", startDay: 8, endDay: 10, callCount: 31 },
      { id: "S4", msisdn: "+91-9645678903", imsi: "404450789012345", operator: "Jio", startDate: "Jan 10", endDate: "Jan 12", startDay: 10, endDay: 12, callCount: 11 },
      { id: "S5", msisdn: "+91-9556789014", imsi: "404450234567890", operator: "Airtel", startDate: "Jan 12", endDate: "Jan 14", startDay: 12, endDay: 14, callCount: 28 },
      { id: "S6", msisdn: "+91-9467890125", imsi: "404450678901234", operator: "BSNL", startDate: "Jan 14", endDate: "Jan 16", startDay: 14, endDay: 16, callCount: 15 },
    ],
  },
  {
    imei: "490154203237518",
    tac: "49015420",
    brand: "Samsung",
    model: "Galaxy A23 (Black)",
    status: "suspicious",
    firstSeen: "2026-01-03 11:20 IST",
    lastSeen: "2026-01-20 22:15 IST",
    totalSims: 2,
    daysWindow: 17,
    targetSuspect: "PER-004 (Vikram Patel / Hawala Courier)",
    sims: [
      { id: "SB1", msisdn: "+91-9312345678", imsi: "404450443322110", operator: "Jio", startDate: "Jan 03", endDate: "Jan 12", startDay: 3, endDay: 12, callCount: 84, shared: true },
      { id: "SB2", msisdn: "+91-9201234567", imsi: "404450556677889", operator: "Airtel", startDate: "Jan 12", endDate: "Jan 20", startDay: 12, endDay: 20, callCount: 63 },
    ],
  },
  {
    imei: "862349051283921",
    tac: "86234905",
    brand: "OnePlus",
    model: "Nord CE 3 Lite (Chromatic Gray)",
    status: "monitored",
    firstSeen: "2026-01-02 08:30 IST",
    lastSeen: "2026-01-28 14:10 IST",
    totalSims: 1,
    daysWindow: 26,
    targetSuspect: "PER-002 (Amit Verma / Financial Controller)",
    sims: [
      { id: "SC1", msisdn: "+91-9123456780", imsi: "404450889900112", operator: "Jio", startDate: "Jan 02", endDate: "Jan 28", startDay: 2, endDay: 28, callCount: 142 },
    ],
  },
  {
    imei: "354928104829103",
    tac: "35492810",
    brand: "Vivo",
    model: "Y21 (Midnight Blue)",
    status: "monitored",
    firstSeen: "2026-01-06 15:45 IST",
    lastSeen: "2026-01-29 18:00 IST",
    totalSims: 2,
    daysWindow: 23,
    targetSuspect: "PER-007 (Sunita Devi / Conduit)",
    sims: [
      { id: "SD1", msisdn: "+91-9012345679", imsi: "404450332211998", operator: "Vi", startDate: "Jan 06", endDate: "Jan 18", startDay: 6, endDay: 18, callCount: 57 },
      { id: "SD2", msisdn: "+91-8901234568", imsi: "404450778899221", operator: "Airtel", startDate: "Jan 19", endDate: "Jan 29", startDay: 19, endDay: 29, callCount: 39 },
    ],
  },
];

export function ImeiIntelligencePage() {
  const [selectedImei, setSelectedImei] = useState<string>("358234091234567");
  const [showUnifiedModal, setShowUnifiedModal] = useState<boolean>(false);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergedSuccess, setMergedSuccess] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState("");

  const activeHardware = DEMO_HARDWARE_NODES.find((h) => h.imei === selectedImei) || DEMO_HARDWARE_NODES[0]!;

  const triggerMergeAnimation = () => {
    setIsMerging(true);
    setTimeout(() => {
      setIsMerging(false);
      setMergedSuccess(true);
    }, 1200);
  };

  const filteredNodes = DEMO_HARDWARE_NODES.filter(
    (n) =>
      n.imei.includes(filterQuery) ||
      n.model.toLowerCase().includes(filterQuery.toLowerCase()) ||
      n.targetSuspect.toLowerCase().includes(filterQuery.toLowerCase()) ||
      n.sims.some((s) => s.msisdn.includes(filterQuery))
  );

  return (
    <AppLayout
      title="IMEI & SIM Hardware Intelligence"
      subtitle="Hardware stitching, burner SIM hopping detection, and physical handset identity graph"
    >
      {/* DISCLAIMER BANNER */}
      <div className="mb-5 rounded-xl border border-primary/40 bg-primary/5 p-4 text-xs flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-primary/20 p-1 text-primary">
          <Cpu className="size-4" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-foreground text-sm tracking-tight mb-0.5">
            MHA CEIR & TELCO HARDWARE REGISTRY LINKED
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Criminal operatives frequently discard SIM cards to break surveillance continuity. TriNetra's{" "}
            <span className="text-primary font-semibold">IMEI Hardware Stitching Engine</span> anchors all burner
            numbers back to the physical baseband radio / Type Allocation Code (TAC) identity, automatically
            amalgamating ephemeral identities into a single evidentiary dossier.
          </p>
        </div>
      </div>

      {/* BURNER HOPPING ALERT CARD (MODULE 1.2) */}
      <div className="mb-6 rounded-2xl border-2 border-red-500/60 bg-gradient-to-r from-red-500/15 via-red-950/20 to-transparent p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <ShieldAlert className="size-48 text-red-500" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500 text-white uppercase tracking-wider">
                  Critical Alert
                </span>
                <span className="text-xs font-mono text-muted-foreground">RULE: BURNER_HOP_THRESHOLD_EXCEEDED</span>
              </div>
              <h2 className="text-base font-bold text-foreground mt-1">
                ⚠️ Burner SIM Hopping Detected — IMEI: <span className="font-mono text-red-400">358234091234567</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                Device has cycled through <strong className="text-foreground">6 distinct SIM cards (IMSI numbers)</strong>{" "}
                within a 15-day window along the Delhi-Jaipur NCR corridor. TriNetra automated rule has unified all 6
                ephemeral numbers into target suspect profile:{" "}
                <strong className="text-primary font-mono">PER-001 (Rahul Sharma)</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setShowUnifiedModal(true);
                setMergedSuccess(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md"
            >
              <GitMerge className="size-3.5 mr-1.5" />
              View Unified Suspect Profile
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN: HARDWARE INVENTORY (col-span-12 lg:col-span-5) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Smartphone className="size-3.5 text-primary" />
              Tracked Hardware Handsets ({DEMO_HARDWARE_NODES.length})
            </h3>
            <div className="relative w-48">
              <Search className="size-3 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search IMEI / SIM..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-secondary/40 border border-border/60 rounded-md pl-8 pr-2 py-1 text-xs font-mono focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* HARDWARE NODE CARDS */}
          <div className="space-y-3">
            {filteredNodes.map((h) => {
              const isSelected = h.imei === selectedImei;
              return (
                <div
                  key={h.imei}
                  onClick={() => setSelectedImei(h.imei)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary/60 shadow-md ring-1 ring-primary/40"
                      : "bg-card hover:bg-secondary/30 border-border/60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground tracking-tight">{h.imei}</span>
                        {h.status === "flagged_burner" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/40">
                            🔥 Burner Hopping
                          </span>
                        )}
                        {h.status === "suspicious" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            ⚠️ Shared Handset
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="font-semibold text-foreground">{h.brand}</span>
                        <span>•</span>
                        <span>{h.model}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-primary">{h.totalSims} SIMs</div>
                      <div className="text-[10px] text-muted-foreground">{h.daysWindow}d window</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      Associated: <strong className="text-foreground">{h.targetSuspect.split(" ")[0]}</strong>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">TAC: {h.tac}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: HARDWARE STITCHING & SIM GRAPH (col-span-12 lg:col-span-7) */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* HARDWARE STITCHING CLUSTER (SVG VISUALIZATION) */}
          <div className="bg-card rounded-2xl border border-border/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  Hardware Stitching Cluster: <span className="font-mono text-primary">{activeHardware.imei}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Handset: {activeHardware.brand} {activeHardware.model} &bull; Target: {activeHardware.targetSuspect}
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 bg-secondary rounded-lg border border-border">
                {activeHardware.sims.length} Leaf Nodes
              </span>
            </div>

            {/* SVG RADIAL/CLUSTER GRAPH */}
            <div className="h-64 w-full bg-background/50 rounded-xl border border-border/60 flex items-center justify-center relative overflow-hidden p-2">
              <svg className="w-full h-full" viewBox="0 0 500 240">
                <defs>
                  <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Central Hardware Node */}
                <circle cx="250" cy="120" r="42" fill="url(#hubGlow)" />
                <circle cx="250" cy="120" r="28" fill="#0f172a" stroke="#00e5ff" strokeWidth="2.5" />
                <text x="250" y="116" textAnchor="middle" fill="#00e5ff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  MASTER IMEI
                </text>
                <text x="250" y="128" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                  ..{activeHardware.imei.slice(-6)}
                </text>

                {/* Satellite SIM Nodes */}
                {activeHardware.sims.map((s, idx) => {
                  const total = activeHardware.sims.length;
                  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                  const radius = 90;
                  const cx = 250 + radius * Math.cos(angle);
                  const cy = 120 + radius * Math.sin(angle);

                  const opColor =
                    s.operator === "Jio"
                      ? "#3b82f6"
                      : s.operator === "Airtel"
                      ? "#ef4444"
                      : s.operator === "Vi"
                      ? "#a855f7"
                      : "#10b981";

                  return (
                    <g key={s.id} className="transition-all hover:scale-105">
                      {/* Connecting Edge */}
                      <line
                        x1="250"
                        y1="120"
                        x2={cx}
                        y2={cy}
                        stroke={s.shared ? "#f59e0b" : "#475569"}
                        strokeWidth={s.shared ? "2.5" : "1.5"}
                        strokeDasharray={s.shared ? "3 3" : undefined}
                      />
                      {/* SIM Leaf */}
                      <circle cx={cx} cy={cy} r="18" fill="#1e293b" stroke={opColor} strokeWidth="2" />
                      <text x={cx} y={cy - 2} textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        {s.operator}
                      </text>
                      <text x={cx} y={cy + 8} textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                        ..{s.msisdn.slice(-4)}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground font-mono bg-black/60 px-2 py-1 rounded">
                Dotted Line = Handset shared across cells
              </div>
            </div>

            {/* SIM HARDWARE STITCHING TABLE */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] font-mono uppercase bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="p-2 rounded-l">MSISDN (Phone)</th>
                    <th className="p-2">IMSI</th>
                    <th className="p-2">Operator</th>
                    <th className="p-2">Active Window</th>
                    <th className="p-2 text-right rounded-r">Calls Ingested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {activeHardware.sims.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-2 font-bold text-foreground flex items-center gap-1.5">
                        <PhoneCall className="size-3 text-primary" />
                        {s.msisdn}
                        {s.shared && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded">SHARED</span>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground text-[11px]">{s.imsi}</td>
                      <td className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            s.operator === "Jio"
                              ? "bg-blue-500/20 text-blue-400"
                              : s.operator === "Airtel"
                              ? "bg-red-500/20 text-red-400"
                              : s.operator === "Vi"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {s.operator}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {s.startDate} → {s.endDate}
                      </td>
                      <td className="p-2 text-right font-bold text-foreground">{s.callCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIM ACTIVITY GANTT TIMELINE (MODULE 1.3) */}
          <div className="bg-card rounded-2xl border border-border/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  SIM Handset Activity Timeline (Gantt Reconstruction)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visualising lifecycle of SIM cards inserted into this handset over January 2026
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="size-2 rounded-full bg-red-500"></span>
                <span>Active Cycle</span>
                <span className="size-2 rounded-full bg-amber-500 ml-2"></span>
                <span>Overlapping Day (Flagged)</span>
              </div>
            </div>

            {/* GANTT BARS */}
            <div className="space-y-2.5 pt-2">
              {/* Day headers (1 to 20) */}
              <div className="flex items-center text-[10px] font-mono text-muted-foreground px-2">
                <div className="w-28 shrink-0">SIM / MSISDN</div>
                <div className="flex-1 flex justify-between">
                  <span>Jan 01</span>
                  <span>Jan 05</span>
                  <span>Jan 10</span>
                  <span>Jan 15</span>
                  <span>Jan 20</span>
                </div>
              </div>

              {activeHardware.sims.map((s, i) => {
                // Use the node's daysWindow as the span denominator (not hardcoded 20)
                const span = activeHardware.daysWindow || 20;
                const leftPercent = Math.max(0, ((s.startDay - 1) / span) * 100);
                const rawWidth = Math.max(8, ((s.endDay - s.startDay + 1) / span) * 100);
                // Clamp so bar never exceeds container bounds
                const widthPercent = Math.min(rawWidth, 100 - leftPercent);
                const isOverlapping =
                  i > 0 && activeHardware.sims[i - 1]?.endDay === s.startDay;

                return (
                  <div key={s.id} className="flex items-center gap-2 text-xs font-mono">
                    <div className="w-28 shrink-0 truncate text-[11px] font-bold text-foreground">
                      ..{s.msisdn.slice(-4)} ({s.operator})
                    </div>
                    <div className="flex-1 bg-secondary/30 h-7 rounded-lg relative overflow-hidden flex items-center px-1">
                      <div
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                        className={`absolute h-5 rounded flex items-center justify-between px-2 text-[10px] font-bold shadow-sm transition-all ${
                          isOverlapping
                            ? "bg-amber-500/80 text-black border border-amber-300"
                            : "bg-primary/80 text-primary-foreground"
                        }`}
                      >
                        <span className="truncate">{s.startDate}</span>
                        <span>{s.callCount} calls</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* UNIFIED SUSPECT DOSSIER MODAL */}
      {showUnifiedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold uppercase">
                  Hardware Identity Synthesis
                </span>
                <h3 className="text-lg font-bold text-foreground mt-1">
                  Unified Suspect Dossier: {activeHardware.targetSuspect}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Master Handset Fingerprint: <span className="font-mono text-primary">{activeHardware.imei}</span>
                </p>
              </div>
              <button
                onClick={() => setShowUnifiedModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By tracking physical RF baseband signatures across telecom service providers, TriNetra has collapsed{" "}
                <strong className="text-foreground">6 seemingly unrelated burner phone numbers</strong> into a single
                suspect node. In court proceedings, the prosecution can establish continuous device custody under{" "}
                <strong className="text-primary">BSA 2023 Section 63</strong>.
              </p>

              {/* MERGE VISUALIZATION ANIMATION */}
              <div className="bg-secondary/30 rounded-xl p-4 border border-border/60">
                <div className="text-xs font-semibold mb-3 flex items-center justify-between">
                  <span>Burner SIM Consolidation Matrix</span>
                  {!mergedSuccess ? (
                    <Button
                      size="sm"
                      onClick={triggerMergeAnimation}
                      disabled={isMerging}
                      className="text-xs bg-primary hover:bg-primary/90"
                    >
                      <GitMerge className="size-3 mr-1" />
                      {isMerging ? "Synthesizing Graph..." : "Execute Automated Synthesis"}
                    </Button>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> Unified into 1 Target Node
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {activeHardware.sims.map((s, idx) => (
                    <div
                      key={s.id}
                      style={{
                        transform: isMerging ? `translate(${idx % 2 === 0 ? "20px" : "-20px"}, -10px) scale(0.95)` : "none",
                        opacity: isMerging ? 0.7 : 1,
                        transition: "all 0.5s ease",
                      }}
                      className={`p-2.5 rounded-lg border text-xs font-mono ${
                        mergedSuccess
                          ? "bg-primary/10 border-primary/50 text-foreground"
                          : "bg-background/80 border-border/40"
                      }`}
                    >
                      <div className="text-[10px] text-muted-foreground">SIM #{idx + 1} ({s.operator})</div>
                      <div className="font-bold text-foreground mt-0.5">{s.msisdn}</div>
                      <div className="text-[9px] text-muted-foreground">{s.startDate} → {s.endDate}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-muted-foreground">
                  Case Mandate: <span className="font-mono text-foreground font-semibold">FIR-2026-DEL-001</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowUnifiedModal(false)}>
                    Close
                  </Button>
                  <Button size="sm" className="bg-primary" onClick={() => {
                    toast.success("Handset Report Queued", {
                      description: `PDF export of IMEI ${activeHardware.imei} — ${activeHardware.sims.length} SIM dossier will download shortly.`,
                    });
                    setTimeout(() => setShowUnifiedModal(false), 1200);
                  }}>
                    Export Handset Affiliated Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
