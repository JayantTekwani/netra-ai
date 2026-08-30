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
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { activity, cases, entities, relationships, supportingRecords } from "@/data/mock";
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
              <UploadCloud className="size-4" /> Upload Data
            </Link>
          </Button>
          <Button asChild>
            <Link to="/cases/new">
              <PlusCircle className="size-4" /> Create New Case
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-4 gap-5">
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
        <section className="panel col-span-2 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Recent Cases</h2>
            <Link to="/cases" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="label-caps pb-2">Case</th>
                <th className="label-caps pb-2">Status</th>
                <th className="label-caps pb-2 text-right">Entities</th>
                <th className="label-caps pb-2 text-right">Links</th>
                <th className="label-caps pb-2 text-right">Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cases.slice(0, 5).map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/60 transition-colors hover:bg-surface-raised/60"
                >
                  <td className="py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{c.id}</div>
                  </td>
                  <td className="py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 text-right font-mono text-xs">{c.entityCount}</td>
                  <td className="py-3 text-right font-mono text-xs">{c.relationshipCount}</td>
                  <td className="py-3 text-right font-mono text-xs text-muted-foreground">
                    {c.createdAt}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      to="/investigation"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Open <ArrowRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel p-5">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Recent Activity</h2>
          </div>
          <ul className="mt-4 space-y-4">
            {activity.map((a) => (
              <li key={a.id} className="border-l-2 border-border pl-3">
                <div className="text-sm">
                  <span className="font-medium">{a.actor}</span>{" "}
                  <span className="text-muted-foreground">{a.action}</span>{" "}
                  <span className="font-medium">{a.target}</span>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">{a.at}</div>
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
      </div>
    </AppLayout>
  );
}
