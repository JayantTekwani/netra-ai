import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { HolographicGraph } from "@/components/graph/HolographicGraph";
import {
  DEFAULT_FILTERS,
  FiltersPanel,
  type GraphFilters,
} from "@/components/investigation/FiltersPanel";
import { InsightsPanel } from "@/components/investigation/InsightsPanel";
import { SupportingRecordsDialog } from "@/components/investigation/SupportingRecordsDialog";
import { useStore } from "@/store";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/investigation")({
  head: () => ({
    meta: [
      { title: "Investigation Workspace & Temporal Replay — त्रिनेत्र-AI" },
      {
        name: "description",
        content:
          "Interactive relationship network with 30-day temporal graph replay, kingpin disruption modeling, and pre/post arrest structural delta.",
      },
      { property: "og:title", content: "Investigation Workspace — त्रिनेत्र-AI" },
    ],
  }),
  component: InvestigationPage,
});

export function InvestigationPage() {
  const [filters, setFilters] = useState<GraphFilters>(DEFAULT_FILTERS);
  const [dialog, setDialog] = useState<{ open: boolean; ids: string[]; context?: string }>({
    open: false,
    ids: [],
  });

  // Temporal Replay State (Module 5)
  const [timelineDay, setTimelineDay] = useState<number>(14); // default Day 14 (pre-arrest)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showDeltaPanel, setShowDeltaPanel] = useState<boolean>(false);

  const activeCaseId = useStore((s) => s.activeCaseId);
  const allEntities = useStore((s) => s.entities);
  const allRelationships = useStore((s) => s.relationships);
  const activeCase = useStore((s) => s.cases.find((c) => c.id === activeCaseId));

  // Playback timer effect
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimelineDay((prev) => {
          if (prev >= 30) {
            setIsPlaying(false);
            return 30;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  // Phase computation
  const currentPhase =
    timelineDay < 11
      ? { name: "Phase 1: Central Kingpin Coordination", desc: "PER-001 (Rahul Sharma) directs primary cells", color: "text-primary" }
      : timelineDay <= 15
      ? { name: "Phase 2: Kingpin Arrest & Communications Dark", desc: "Jan 15 Arrest: PER-001 goes dark, edges severed", color: "text-red-400" }
      : { name: "Phase 3: Lieutenant Command Reorganization", desc: "PER-002 & PER-003 establish emergent links to seize control", color: "text-amber-400" };

  // Filter entities and relationships dynamically based on temporal day
  const visibleEntities = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return allEntities
      .filter(
        (e) =>
          e.caseIds.includes(activeCaseId || "") &&
          filters.entityTypes.includes(e.type) &&
          (q === "" || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
      )
      .map((e) => {
        // Phase 2 (Day >= 11): comms dark; Day >= 15: formally arrested
        if (e.id === "PER-001" && timelineDay >= 15) {
          return { ...e, name: `${e.name} [ARRESTED - INACTIVE]` };
        }
        if (e.id === "PER-001" && timelineDay >= 11) {
          return { ...e, name: `${e.name} [COMMS DARK]` };
        }
        return e;
      });
  }, [filters, allEntities, activeCaseId, timelineDay]);

  const visibleRelationships = useMemo(() => {
    const ids = new Set(visibleEntities.map((e) => e.id));
    const baseRels = allRelationships.filter((r) => {
      if (!ids.has(r.source) || !ids.has(r.target)) return false;
      if (!filters.relationshipTypes.includes(r.type)) return false;

      // Temporal gating
      // Phase 2 starts at Day 11 — PER-001 communications go dark from Day 11 onwards
      // (arrest culminates at Jan 15, but comms surveillance-blocked from Day 11)
      if (timelineDay >= 11 && (r.source === "PER-001" || r.target === "PER-001")) {
        return false;
      }
      return true;
    });

    // In Phase 3 (Day > 15), synthesize emergent lieutenant takeover coordination links
    if (timelineDay > 15 && ids.has("PER-002") && ids.has("PER-003")) {
      baseRels.push({
        id: "EMERGENT_LT_01",
        source: "PER-002",
        target: "PER-003",
        type: "COMMUNICATED_WITH",
        date: "2026-01-16",
        recordId: "REC-EMERGENT-01",
      });
    }

    return baseRels;
  }, [visibleEntities, filters, allRelationships, timelineDay]);

  const openRecords = (ids: string[], context: string) =>
    setDialog({ open: true, ids: Array.from(new Set(ids)), context });

  return (
    <AppLayout
      title="Investigation Workspace"
      subtitle={activeCase ? `${activeCase.name} · ${activeCase.id}` : "No case selected"}
      fullBleed
    >
      <div className="grid h-[calc(100vh-8.5rem)] grid-cols-[280px_minmax(0,1fr)]">
        <FiltersPanel filters={filters} onChange={setFilters} />

        <div className="flex min-w-0 flex-col overflow-y-auto relative p-4 gap-4">
          {/* HOLOGRAPHIC GRAPH CONTAINER WITH FLOATING TEMPORAL DOCK */}
          <div className="h-[640px] shrink-0 relative rounded-2xl overflow-hidden border border-border/60 bg-background/50 flex flex-col">
            {/* Top Graph Overlay Ribbon */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md border border-border/80 px-3.5 py-1.5 rounded-full flex items-center gap-3 text-xs font-mono pointer-events-auto">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-foreground">
                  Temporal Graph State: <span className="text-primary font-bold">Jan {timelineDay < 10 ? `0${timelineDay}` : timelineDay}, 2026</span>
                </span>
                <span className="text-muted-foreground">|</span>
                <span className={`text-[11px] font-semibold ${currentPhase.color}`}>
                  {currentPhase.name}
                </span>
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeltaPanel(!showDeltaPanel)}
                  className="bg-black/80 backdrop-blur-md text-xs font-mono font-bold border-border/80 text-primary hover:text-primary"
                >
                  <TrendingUp className="size-3.5 mr-1.5" />
                  {showDeltaPanel ? "Hide Pre/Post Delta" : "Pre/Post Arrest Delta"}
                </Button>
              </div>
            </div>

            {/* PRE/POST ARREST DELTA FLOATING PANEL (MODULE 5.3) */}
            {showDeltaPanel && (
              <div className="absolute top-16 right-4 z-30 w-80 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                    <Activity className="size-3.5 text-primary" />
                    Pre/Post Incident Network Delta
                  </div>
                  <button onClick={() => setShowDeltaPanel(false)} className="text-muted-foreground hover:text-foreground text-xs font-mono">
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center p-2 rounded bg-secondary/30">
                    <span className="text-muted-foreground">Active Hub Nodes:</span>
                    <span className="flex items-center gap-1 font-bold text-red-400">
                      12 &rarr; 10 <ArrowDownRight className="size-3 text-red-400" />
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-secondary/30">
                    <span className="text-muted-foreground">Kingpin Centrality (PER-001):</span>
                    <span className="flex items-center gap-1 font-bold text-red-400">
                      Degree 8 &rarr; 0 (Arrested)
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-secondary/30">
                    <span className="text-muted-foreground">Lieutenant Spike (PER-002):</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      Degree 2 &rarr; 5 (+150%) <ArrowUpRight className="size-3 text-emerald-400" />
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-secondary/30">
                    <span className="text-muted-foreground">Emergent Coordination Links:</span>
                    <span className="font-bold text-amber-400">+7 new edges</span>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-secondary/30">
                    <span className="text-muted-foreground">Communication Surge:</span>
                    <span className="font-bold text-emerald-400">+340% on PER-002</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                  Evidence: Disruption of primary kingpin triggered horizontal operational migration.
                </div>
              </div>
            )}

            {/* The 3D Canvas Graph */}
            <div className="flex-1 relative">
              <HolographicGraph entities={visibleEntities} relationships={visibleRelationships} />
            </div>

            {/* FLOATING TEMPORAL PLAYBACK DOCK (MODULE 5.1 & 5.4) */}
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/90 backdrop-blur-md border border-border/80 rounded-2xl p-3.5 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Playback Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (timelineDay >= 30) setTimelineDay(1);
                      setIsPlaying(!isPlaying);
                    }}
                    className="h-8 text-xs font-mono font-bold bg-secondary hover:bg-secondary/80 text-foreground"
                  >
                    {isPlaying ? <Pause className="size-3.5 mr-1 text-amber-400" /> : <Play className="size-3.5 mr-1 text-primary" />}
                    {isPlaying ? "Pause" : "Play Evolution"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsPlaying(false);
                      setTimelineDay(1);
                    }}
                    className="h-8 text-xs font-mono text-muted-foreground hover:text-foreground"
                    title="Reset to Day 1"
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>

                  {/* Speed buttons */}
                  <div className="flex items-center rounded-lg border border-border bg-secondary/30 p-0.5 text-[10px] font-mono">
                    {[1, 2, 5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          playbackSpeed === speed ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day display badge */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <Calendar className="size-3.5 text-primary" />
                  <span>
                    Viewing: <strong className="text-foreground">Jan {timelineDay < 10 ? `0${timelineDay}` : timelineDay}, 2026</strong>
                  </span>
                  <span className="text-muted-foreground text-[10px]">(Day {timelineDay} of 30)</span>
                </div>
              </div>

              {/* Slider with Kingpin Arrest Marker (MODULE 5.4) */}
              <div className="mt-2.5 relative pt-1">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={timelineDay}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setTimelineDay(parseInt(e.target.value));
                  }}
                  className="w-full accent-primary cursor-pointer"
                />

                {/* Vertical Red Marker at Day 15 (Jan 15 Arrest Event) */}
                <div
                  style={{ left: `${((15 - 1) / 29) * 100}%` }}
                  className="absolute top-0 bottom-1 w-1 bg-red-500 rounded-full pointer-events-none shadow-[0_0_8px_#ef4444]"
                ></div>

                <div
                  style={{ left: `${((15 - 1) / 29) * 100}%` }}
                  className="absolute -top-4 -translate-x-1/2 text-[9px] font-mono font-bold text-red-400 bg-red-500/20 px-1.5 py-0.2 rounded border border-red-500/50 whitespace-nowrap pointer-events-none"
                >
                  🔴 Jan 15 Arrest Event
                </div>
              </div>

              {/* Phase description footer */}
              <div className="mt-1.5 flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                <span>Phase 1: Coordination (Days 1–10)</span>
                <span className="text-red-400 font-bold">Phase 2: Comms Dark → Arrest (Days 11–15)</span>
                <span>Phase 3: Lt. Takeover (Days 16–30)</span>
              </div>
            </div>
          </div>

          <InsightsPanel onViewRecords={openRecords} />
        </div>
      </div>

      <SupportingRecordsDialog
        open={dialog.open}
        recordIds={dialog.ids}
        context={dialog.context}
        onOpenChange={(v) => setDialog((d) => ({ ...d, open: v }))}
      />
    </AppLayout>
  );
}
