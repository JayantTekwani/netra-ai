import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  FolderSearch,
  Users,
  Share2,
  FileStack,
  UploadCloud,
  PlusCircle,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EntityResolutionDemo } from "@/components/dashboard/EntityResolutionDemo";
import { HolographicGraph } from "@/components/graph/HolographicGraph";
import { Button } from "@/components/ui/button";
import { activity, cases, entities, relationships, supportingRecords, insights } from "@/data/mock";
import { ENTITY_TYPE_META } from "@/data/mock";
import { getSession } from "@/lib/session";
import type { Entity, Relationship } from "@/data/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NEXUS Investigation Platform" },
      { name: "description", content: "Overview of active demo cases." },
      { property: "og:title", content: "Dashboard — NEXUS Investigation Platform" },
    ],
  }),
  component: DashboardPage,
});

const LIVE_INSIGHTS_POOL = [
  ...insights,
  { id: "L1", headline: "Anomalous fund transfer detected", detail: "A shell corporation transferred $1.2M through 4 intermediary banks in 12 hours.", type: "financial", confidence: 94 },
  { id: "L2", headline: "Burner phone activation surge", detail: "14 new prepaid devices activated in Sector 4 within a 30-minute window.", type: "operational", confidence: 89 },
  { id: "L3", headline: "Encrypted traffic spike", detail: "Unusual volume of TOR traffic originating from previously dormant IP range.", type: "cyber", confidence: 91 },
  { id: "L4", headline: "Cross-border travel correlation", detail: "Two subjects boarded separate flights arriving at the same destination 2 hours apart.", type: "movement", confidence: 85 },
  { id: "L5", headline: "Vehicle proximity alert", detail: "Target vehicle spotted idling near key infrastructure asset for 45 minutes.", type: "surveillance", confidence: 97 },
];

function DashboardPage() {
  const user = getSession();
  
  // Live Threat Analysis Ticker
  const [liveInsights, setLiveInsights] = useState(LIVE_INSIGHTS_POOL.slice(0, 4));
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveInsights(current => {
        const nextPool = LIVE_INSIGHTS_POOL.filter(i => !current.find(c => c.id === i.id));
        const randomNext = nextPool[Math.floor(Math.random() * nextPool.length)]!;
        return [randomNext, ...current.slice(0, 3)];
      });
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Dramatically expand the demo network graph with background noise nodes
  const { denseEntities, denseRelationships } = useMemo(() => {
    const generatedEntities: Entity[] = [...entities];
    const generatedRelationships: Relationship[] = [...relationships];
    const types: Array<keyof typeof ENTITY_TYPE_META> = ["person", "phone", "account", "location", "organization"];
    
    // Add 150 background nodes
    for (let i = 0; i < 150; i++) {
      const type = types[Math.floor(Math.random() * types.length)]!;
      generatedEntities.push({
        id: `gen-${i}`,
        type,
        name: `Unknown ${type} ${i}`,
        attributes: {},
        caseIds: ["CASE-2041"]
      });
    }

    // Add 250 connections to create a dense web
    for (let i = 0; i < 250; i++) {
      const sourceIdx = Math.floor(Math.random() * generatedEntities.length);
      const targetIdx = Math.floor(Math.random() * generatedEntities.length);
      if (sourceIdx !== targetIdx) {
        generatedRelationships.push({
          id: `gen-rel-${i}`,
          source: generatedEntities[sourceIdx]!.id,
          target: generatedEntities[targetIdx]!.id,
          type: "association",
          date: new Date().toISOString(), label: "associated", recordIds: [],
        });
      }
    }
    return { denseEntities: generatedEntities, denseRelationships: generatedRelationships };
  }, []);

  const activeCases = cases.filter((c) => c.status === "active");
  const byType = (Object.keys(ENTITY_TYPE_META) as Array<keyof typeof ENTITY_TYPE_META>).map(
    (t) => ({
      type: t,
      count: entities.filter((e) => e.type === t).length,
    }),
  );
  const max = Math.max(...byType.map((b) => b.count));

  return (
    <AppLayout
      title={`Welcome back, ${user?.name ?? "Investigator"}`}
      subtitle="Operational overview across all assigned demo investigations"
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/upload">
              <UploadCloud className="mr-2 size-4" /> Upload New Data
            </Link>
          </Button>
          <Button asChild>
            <Link to="/cases/new">
              <PlusCircle className="mr-2 size-4" /> New Case
            </Link>
          </Button>
        </>
      }
    >
      <div className="mb-6 rounded-md border-l-4 border-primary bg-primary/10 px-4 py-3 text-sm text-foreground">
        <strong className="font-semibold">NEXUS Platform</strong> — Turns messy police data (call records, FIRs, bank transfers) into one connected picture.
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Active Cases"
          value={activeCases.length}
          hint={`${cases.length} total in workspace`}
          icon={FolderSearch}
        />
        <StatCard
          label="Total Entities"
          value={entities.length}
          hint="Across the demo network"
          icon={Users}
          tone="success"
        />
        <StatCard
          label="Relationships"
          value={relationships.length}
          hint="Extracted links"
          icon={Share2}
          tone="accent"
        />
        <StatCard
          label="Supporting Records"
          value={supportingRecords.length}
          hint="CDR, TXN, FIR, GEO"
          icon={FileStack}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-5">
        <section className="panel col-span-3 p-5">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Automated Threat Analysis</h2>
          </div>
          <ul className="mt-4 grid grid-cols-4 gap-6">
            {liveInsights.map((insight) => (
              <li key={insight.id} className="border-l-2 border-border pl-3 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-sm font-medium leading-tight">
                  {insight.headline}
                </div>
                <div className="mt-2 text-xs text-muted-foreground line-clamp-3">
                  {insight.detail}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel col-span-3 relative h-[720px] overflow-hidden p-0">
          <HolographicGraph entities={denseEntities} relationships={denseRelationships} />
        </section>

        <section className="panel col-span-2 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Network Composition</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Entity distribution in the loaded demo network.
          </p>
          <div className="mt-5 space-y-4">
            {byType.map(({ type, count }) => (
              <div key={type} className="flex items-center gap-4">
                <div className="w-32 text-sm text-muted-foreground">
                  {ENTITY_TYPE_META[type].label}
                </div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / max) * 100}%`,
                      backgroundColor: ENTITY_TYPE_META[type].color,
                    }}
                  />
                </div>
                <div className="w-8 text-right font-mono text-sm">{count}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-sm font-semibold tracking-tight">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/investigation">
                <Share2 className="size-4" /> Open Investigation Workspace
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/timeline">
                <Activity className="size-4" /> Review Event Timeline
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/upload">
                <UploadCloud className="size-4" /> Upload New Data
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/cases">
                <FolderSearch className="size-4" /> Browse All Cases
              </Link>
            </Button>
          </div>
        </section>
        
        <div className="col-span-3">
          <EntityResolutionDemo />
        </div>
      </div>
    </AppLayout>
  );
}
