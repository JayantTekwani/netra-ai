import { createFileRoute, Link } from "@tanstack/react-router";
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

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NEXUS Investigation Platform" },
      {
        name: "description",
        content:
          "Overview of active demo cases, entities, relationships and recent investigation activity in the NEXUS prototype.",
      },
      { property: "og:title", content: "Dashboard — NEXUS Investigation Platform" },
      {
        property: "og:description",
        content: "Active cases, entity counts and recent activity across fictional demo data.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = getSession();
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
        <section className="panel col-span-2 relative h-[480px] overflow-hidden p-0">
          <HolographicGraph entities={entities} relationships={relationships} />
        </section>

        <section className="panel p-5 overflow-y-auto h-[480px]">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Automated Threat Analysis</h2>
          </div>
          <ul className="mt-4 space-y-4">
            {insights.slice(0, 4).map((insight) => (
              <li key={insight.id} className="border-l-2 border-border pl-3">
                <div className="text-sm font-medium leading-tight">
                  {insight.headline}
                </div>
                <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {insight.detail}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-5">
        <section className="panel col-span-2 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Network Composition</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Entity distribution in the loaded demo network.
          </p>
          <div className="mt-5 space-y-3">
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
          <div className="mt-4 space-y-2">
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
