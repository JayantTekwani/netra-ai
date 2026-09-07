import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Network,
  RotateCw,
  GitBranch,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  Share2,
  Code2,
  Terminal,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/patterns")({
  head: () => ({
    meta: [
      { title: "Crime Pattern Engine (Motif Search) — त्रिनेत्र-AI" },
      {
        name: "description",
        content: "Topological graph motif detector for Circular Hawala loops, Smurfing stars, and silent cut-out nodes.",
      },
    ],
  }),
  component: CrimePatternsPage,
});

type PatternType = "hawala_loop" | "smurfing_star" | "cut_out_node";

export function CrimePatternsPage() {
  const [activePattern, setActivePattern] = useState<PatternType>("hawala_loop");
  const [scanning, setScanning] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<Record<PatternType, boolean>>({
    hawala_loop: true,
    smurfing_star: false,
    cut_out_node: false,
  });
  const [nlQuery, setNlQuery] = useState("Hawala loop under 6 hours across UPI accounts");
  const [aiTranslating, setAiTranslating] = useState(false);
  const [generatedQuery, setGeneratedQuery] = useState<string | null>(null);

  const runPatternScan = (pattern: PatternType) => {
    setActivePattern(pattern);
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setHasScanned((prev) => ({ ...prev, [pattern]: true }));
      toast.success("Motif Scan Complete", {
        description: `Sub-graph structural pattern identified in active case graph.`,
      });
    }, 1800);
  };

  const handleAiTranslate = () => {
    if (!nlQuery.trim()) return;
    setAiTranslating(true);
    setGeneratedQuery(null);
    setTimeout(() => {
      setAiTranslating(false);
      if (nlQuery.toLowerCase().includes("smurf") || nlQuery.toLowerCase().includes("deposit")) {
        setActivePattern("smurfing_star");
        setHasScanned((prev) => ({ ...prev, smurfing_star: true }));
        setGeneratedQuery(
          "MATCH (src:Account)-[t:TRANSFERRED]->(dest:Account)\nWHERE t.amount < 50000 AND t.timestamp > datetime() - duration({hours: 2})\nWITH dest, count(DISTINCT src) as fan_in, sum(t.amount) as total\nWHERE fan_in >= 10\nRETURN dest, fan_in, total"
        );
      } else if (nlQuery.toLowerCase().includes("cut") || nlQuery.toLowerCase().includes("bridge")) {
        setActivePattern("cut_out_node");
        setHasScanned((prev) => ({ ...prev, cut_out_node: true }));
        setGeneratedQuery(
          "MATCH (c:Phone)\nWHERE NOT (c)-[:COMMUNICATED_WITH]-(:Kingpin)\nMATCH (g1:GangCell)-[:CONTACTED]->(c)-[:CONTACTED]->(g2:GangCell)\nWHERE g1.syndicate <> g2.syndicate\nRETURN c, g1, g2"
        );
      } else {
        setActivePattern("hawala_loop");
        setHasScanned((prev) => ({ ...prev, hawala_loop: true }));
        setGeneratedQuery(
          "MATCH path = (a:Entity)-[:TRANSFERRED*3..5]->(a)\nWHERE duration.inHours(head(nodes(path)).timestamp, last(nodes(path)).timestamp) <= 72\nRETURN path, length(path) as cycle_hops"
        );
      }
      toast.success("AI Motif Translated", {
        description: "Converted natural language intent into Cypher structural query.",
      });
    }, 1500);
  };

  return (
    <AppLayout
      title="Crime Pattern Engine (Sub-Graph Motif Search)"
      subtitle="Structural graph topology analysis: Circular Hawala loops, Smurfing stars, and silent cut-out nodes"
    >
      {/* EXPLANATORY HEADER */}
      <div className="mb-5 rounded-xl border border-primary/40 bg-primary/5 p-4 text-xs flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-primary/20 p-1 text-primary">
          <Network className="size-4" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-foreground text-sm tracking-tight mb-0.5">
            TOPOLOGICAL GRAPH PATTERN DISCOVERY (NO KEYWORD DEPENDENCY)
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Conventional police search requires knowing suspect names or phone numbers upfront. TriNetra's{" "}
            <span className="text-primary font-semibold">Graph Motif Engine</span> scans network topology for architectural
            signatures of organized financial crime and covert gang buffers regardless of individual identities.
          </p>
        </div>
      </div>

      {/* NATURAL LANGUAGE AI TRANSLATOR ROW */}
      <div className="mb-6 panel p-4 bg-card/60">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-primary uppercase font-mono">
          <Sparkles className="size-3.5" />
          🧠 AI Motif Translator (Natural Language &rarr; Graph Pattern Query)
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[280px]">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="Describe criminal pattern (e.g. Hawala loop under 6 hours, smurfing deposits...)"
              className="w-full bg-background border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-primary"
            />
          </div>
          <Button
            onClick={handleAiTranslate}
            disabled={aiTranslating}
            className="text-xs bg-primary hover:bg-primary/90"
          >
            {aiTranslating ? "Compiling Query..." : "Search Graph Motif"}
          </Button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 mt-2.5 text-[11px] text-muted-foreground flex-wrap">
          <span className="font-mono text-[10px]">Try presets:</span>
          {[
            "Hawala loop under 6 hours across UPI accounts",
            "Smurfing micro-deposits < ₹50,000 into single aggregator",
            "Silent cut-out bridge node between isolated gangs",
          ].map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setNlQuery(preset);
              }}
              className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-[10px] font-mono transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        {generatedQuery && (
          <div className="mt-3 p-3 bg-black/70 border border-primary/40 rounded-lg font-mono text-[11px] text-emerald-400">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 border-b border-white/10 pb-1">
              <span className="flex items-center gap-1">
                <Terminal className="size-3" /> Transpiled Cypher / Gremlin AST
              </span>
              <span className="text-primary font-bold">MATCH EXECUTED (0.024s)</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre">{generatedQuery}</pre>
          </div>
        )}
      </div>

      {/* 3 PRE-BUILT MOTIF CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* CARD A: HAWALA LOOP */}
        <div
          onClick={() => runPatternScan("hawala_loop")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            activePattern === "hawala_loop"
              ? "bg-primary/10 border-primary shadow-lg ring-1 ring-primary/50"
              : "bg-card hover:bg-secondary/30 border-border/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <RotateCw className="size-5" />
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
              Circular Hawala
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground mt-3">Circular Hawala Loop Detector</h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Detects money & communication flow loops matching <strong className="text-foreground">A &rarr; B &rarr; C &rarr; D &rarr; A</strong>{" "}
            completed within a 72-hour window to evade bank compliance filters.
          </p>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono text-[11px]">Complexity: O(V·E)</span>
            <Button size="sm" variant={activePattern === "hawala_loop" ? "default" : "outline"} className="h-7 text-xs">
              {scanning && activePattern === "hawala_loop" ? "Scanning..." : "Execute Scan"}
            </Button>
          </div>
        </div>

        {/* CARD B: SMURFING STAR */}
        <div
          onClick={() => runPatternScan("smurfing_star")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            activePattern === "smurfing_star"
              ? "bg-primary/10 border-primary shadow-lg ring-1 ring-primary/50"
              : "bg-card hover:bg-secondary/30 border-border/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <TrendingUp className="size-5" />
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
              Structuring Star
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground mt-3">Smurfing / Structuring Star</h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Detects <strong className="text-foreground">10+ distinct accounts</strong> making rapid micro-deposits under{" "}
            <strong className="text-foreground">&#8377;50,000</strong> into a single central aggregator account within 2 hours.
          </p>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono text-[11px]">Fan-In Motif: &ge; 10:1</span>
            <Button size="sm" variant={activePattern === "smurfing_star" ? "default" : "outline"} className="h-7 text-xs">
              {scanning && activePattern === "smurfing_star" ? "Scanning..." : "Execute Scan"}
            </Button>
          </div>
        </div>

        {/* CARD C: CUT-OUT NODE */}
        <div
          onClick={() => runPatternScan("cut_out_node")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            activePattern === "cut_out_node"
              ? "bg-primary/10 border-primary shadow-lg ring-1 ring-primary/50"
              : "bg-card hover:bg-secondary/30 border-border/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="size-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertOctagon className="size-5" />
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
              Silent Bridge
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground mt-3">Intermediary "Cut-Out" Buffer</h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Automatically isolates <strong className="text-foreground">"silent buffers"</strong>—nodes that never communicate
            directly with Target A or Kingpin, but bridge communications between two isolated syndicates.
          </p>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono text-[11px]">Betweenness Centrality</span>
            <Button size="sm" variant={activePattern === "cut_out_node" ? "default" : "outline"} className="h-7 text-xs">
              {scanning && activePattern === "cut_out_node" ? "Scanning..." : "Execute Scan"}
            </Button>
          </div>
        </div>
      </div>

      {/* SCAN RESULTS & SUB-GRAPH VISUALIZATION PANEL */}
      <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/20 text-primary uppercase">
                Active Motif Analysis
              </span>
              <span className="text-xs font-mono text-muted-foreground">CASE-2026-DEL-001</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1">
              {activePattern === "hawala_loop" && "Circular Hawala Laundering Cycle Detected"}
              {activePattern === "smurfing_star" && "Smurfing Micro-Structuring Aggregation Cluster"}
              {activePattern === "cut_out_node" && "Covert Intermediary 'Cut-Out' Phone Node Isolated"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.success("Motif Exported", {
                  description: "Tagged nodes added to primary Investigation Workspace with high evidentiary weight.",
                });
              }}
            >
              <Share2 className="size-3.5 mr-1.5" />
              Export to Investigation Workspace
            </Button>
            <Button size="sm" asChild>
              <Link to="/investigation">
                Open Full Graph <ArrowRight className="size-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* DYNAMIC SUB-GRAPH VISUALIZATION */}
        <div className="grid grid-cols-12 gap-6 items-center">
          {/* LEFT: SVG SUB-GRAPH CANVAS (col-span-12 lg:col-span-7) */}
          <div className="col-span-12 lg:col-span-7 h-80 bg-background/80 rounded-xl border border-border/60 relative flex items-center justify-center p-4 overflow-hidden">
            {scanning ? (
              <div className="flex flex-col items-center gap-3">
                <div className="size-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                <div className="text-xs font-mono text-primary animate-pulse">
                  Scanning Graph Adjacency Matrix for Sub-Graph Isomorphism...
                </div>
              </div>
            ) : (
              <svg className="w-full h-full" viewBox="0 0 500 300">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                  </marker>
                  <marker id="arrowRed" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                  </marker>
                  <marker id="arrowBlue" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                  </marker>
                </defs>

                {/* PATTERN 1: HAWALA LOOP */}
                {activePattern === "hawala_loop" && (
                  <g>
                    {/* Edges */}
                    <line x1="150" y1="80" x2="350" y2="80" stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    <line x1="350" y1="80" x2="350" y2="220" stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    <line x1="350" y1="220" x2="150" y2="220" stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#arrow)" />
                    <line x1="150" y1="220" x2="150" y2="80" stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#arrow)" />

                    {/* Nodes */}
                    {/* Node A */}
                    <g transform="translate(150, 80)">
                      <circle r="22" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                      <text textAnchor="middle" y="4" fill="#f8fafc" fontSize="9" fontWeight="bold" fontFamily="monospace">PER-001</text>
                      <text textAnchor="middle" y="-28" fill="#f59e0b" fontSize="8" fontFamily="monospace">Initiator (₹45L)</text>
                    </g>
                    {/* Node B */}
                    <g transform="translate(350, 80)">
                      <circle r="22" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                      <text textAnchor="middle" y="4" fill="#f8fafc" fontSize="9" fontWeight="bold" fontFamily="monospace">ACC-003</text>
                      <text textAnchor="middle" y="-28" fill="#94a3b8" fontSize="8" fontFamily="monospace">SBI Shell Account</text>
                    </g>
                    {/* Node C */}
                    <g transform="translate(350, 220)">
                      <circle r="22" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                      <text textAnchor="middle" y="4" fill="#f8fafc" fontSize="9" fontWeight="bold" fontFamily="monospace">ACC-007</text>
                      <text textAnchor="middle" y="34" fill="#94a3b8" fontSize="8" fontFamily="monospace">HDFC Jaipur Branch</text>
                    </g>
                    {/* Node D */}
                    <g transform="translate(150, 220)">
                      <circle r="22" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                      <text textAnchor="middle" y="4" fill="#f8fafc" fontSize="9" fontWeight="bold" fontFamily="monospace">PER-004</text>
                      <text textAnchor="middle" y="34" fill="#f59e0b" fontSize="8" fontFamily="monospace">Vikram Patel (Courier)</text>
                    </g>

                    {/* Center Stamp */}
                    <text x="250" y="150" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      ↻ 4-HOP CYCLE DETECTED
                    </text>
                    <text x="250" y="165" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                      Time Elapsed: 14h 32m
                    </text>
                  </g>
                )}

                {/* PATTERN 2: SMURFING STAR */}
                {activePattern === "smurfing_star" && (
                  <g>
                    {/* 12 Satellite Nodes pointing inwards */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i / 12) * 2 * Math.PI;
                      const x = 250 + 120 * Math.cos(angle);
                      const y = 150 + 100 * Math.sin(angle);
                      return (
                        <g key={i}>
                          <line x1={x} y1={y} x2="250" y2="150" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#arrowBlue)" />
                          <circle cx={x} cy={y} r="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                          <text x={x} y={y + 3} textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="monospace">
                            &#8377;48k
                          </text>
                        </g>
                      );
                    })}

                    {/* Central Aggregator Node */}
                    <circle cx="250" cy="150" r="32" fill="#0f172a" stroke="#3b82f6" strokeWidth="3" />
                    <text x="250" y="146" textAnchor="middle" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      ACC-MASTER-01
                    </text>
                    <text x="250" y="158" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                      Aggregator (₹5.8L)
                    </text>
                  </g>
                )}

                {/* PATTERN 3: CUT-OUT BUFFER */}
                {activePattern === "cut_out_node" && (
                  <g>
                    {/* Gang Alpha Cluster (Left) */}
                    <rect x="40" y="60" width="130" height="180" rx="12" fill="#1e293b" fillOpacity="0.4" stroke="#64748b" strokeDasharray="4 4" />
                    <text x="105" y="50" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      GANG-ALPHA (DELHI)
                    </text>
                    <circle cx="80" cy="100" r="14" fill="#334155" stroke="#94a3b8" />
                    <circle cx="130" cy="120" r="14" fill="#334155" stroke="#94a3b8" />
                    <circle cx="90" cy="180" r="14" fill="#334155" stroke="#94a3b8" />
                    <line x1="80" y1="100" x2="130" y2="120" stroke="#64748b" />
                    <line x1="130" y1="120" x2="90" y2="180" stroke="#64748b" />

                    {/* Gang Beta Cluster (Right) */}
                    <rect x="330" y="60" width="130" height="180" rx="12" fill="#1e293b" fillOpacity="0.4" stroke="#64748b" strokeDasharray="4 4" />
                    <text x="395" y="50" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      GANG-BETA (MEWAT)
                    </text>
                    <circle cx="370" cy="100" r="14" fill="#334155" stroke="#94a3b8" />
                    <circle cx="410" cy="130" r="14" fill="#334155" stroke="#94a3b8" />
                    <circle cx="360" cy="180" r="14" fill="#334155" stroke="#94a3b8" />
                    <line x1="370" y1="100" x2="410" y2="130" stroke="#64748b" />
                    <line x1="410" y1="130" x2="360" y2="180" stroke="#64748b" />

                    {/* Bridge Conduit Lines */}
                    <line x1="130" y1="120" x2="250" y2="150" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrowRed)" />
                    <line x1="250" y1="150" x2="370" y2="100" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrowRed)" />

                    {/* Central CUT-OUT Node */}
                    <circle cx="250" cy="150" r="24" fill="#0f172a" stroke="#ef4444" strokeWidth="3" />
                    <text x="250" y="146" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      PHN-009
                    </text>
                    <text x="250" y="158" textAnchor="middle" fill="#f8fafc" fontSize="7" fontFamily="monospace">
                      SILENT BUFFER
                    </text>
                  </g>
                )}
              </svg>
            )}
          </div>

          {/* RIGHT: METRICS & EVIDENTIARY AUDIT (col-span-12 lg:col-span-5) */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Pattern Match Telemetry
              </h4>

              {activePattern === "hawala_loop" && (
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Motif Topology:</span>
                    <span className="text-amber-400 font-bold">Directed Cycle C_4</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Entities in Loop:</span>
                    <span className="text-foreground">2 Persons, 2 Accounts</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Window of Completion:</span>
                    <span className="text-foreground">14h 32m (&lt; 72h limit)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Laundered Sum:</span>
                    <span className="text-emerald-400 font-bold">&#8377;45,00,000</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Hawala Confidence:</span>
                    <span className="text-primary font-bold">98.7% (Conformal &alpha;=0.05)</span>
                  </div>
                </div>
              )}

              {activePattern === "smurfing_star" && (
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Motif Topology:</span>
                    <span className="text-blue-400 font-bold">In-Degree Star K_1,12</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Source Mule Accounts:</span>
                    <span className="text-foreground">12 distinct KYC accounts</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Deposit Threshold:</span>
                    <span className="text-foreground">&lt; &#8377;50,000 each (Structuring)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Aggregation Window:</span>
                    <span className="text-foreground">1h 47m</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Smurfing Confidence:</span>
                    <span className="text-primary font-bold">94.2%</span>
                  </div>
                </div>
              )}

              {activePattern === "cut_out_node" && (
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Motif Topology:</span>
                    <span className="text-red-400 font-bold">Bridge Articulation Point</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Buffer Hardware:</span>
                    <span className="text-foreground">PHN-009 (+91-9111222333)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Isolated Syndicates:</span>
                    <span className="text-foreground">Gang-Alpha (4) &harr; Gang-Beta (6)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Direct Kingpin Contact:</span>
                    <span className="text-emerald-400 font-bold">ZERO (Air-Gapped)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Betweenness Score:</span>
                    <span className="text-primary font-bold">0.962 (Highest in Case)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-primary/5 border border-primary/30 rounded-xl text-xs text-muted-foreground">
              <div className="font-bold text-foreground mb-1">Evidentiary Admissibility (BSA 2023 Sec 63)</div>
              Topological sub-graph structures are mathematically invariant to criminal alias swapping. This graph proof
              substantiates conspiracy charges under <strong className="text-foreground">Section 61 BNS 2023</strong>.
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
