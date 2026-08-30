import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { NetworkGraph } from "@/components/graph/NetworkGraph";
import {
  DEFAULT_FILTERS,
  FiltersPanel,
  type GraphFilters,
} from "@/components/investigation/FiltersPanel";
import { EntityDetailsPanel } from "@/components/investigation/EntityDetailsPanel";
import { InsightsPanel } from "@/components/investigation/InsightsPanel";
import { SupportingRecordsDialog } from "@/components/investigation/SupportingRecordsDialog";
import { entities, relationships } from "@/data/mock";

export const Route = createFileRoute("/investigation")({
  head: () => ({
    meta: [
      { title: "Investigation Workspace — NEXUS" },
      {
        name: "description",
        content:
          "Interactive relationship network of fictional entities: filter, select nodes and trace every link back to a supporting demo record.",
      },
      { property: "og:title", content: "Investigation Workspace — NEXUS" },
      {
        property: "og:description",
        content: "Explore a fictional entity relationship graph with filters and entity details.",
      },
    ],
  }),
  component: InvestigationPage,
});

function InvestigationPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<GraphFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; ids: string[]; context?: string }>({
    open: false,
    ids: [],
  });

  const visibleEntities = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return entities.filter(
      (e) =>
        filters.entityTypes.includes(e.type) &&
        (q === "" || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)),
    );
  }, [filters]);

  const visibleRelationships = useMemo(() => {
    const ids = new Set(visibleEntities.map((e) => e.id));
    return relationships.filter((r) => {
      if (!ids.has(r.source) || !ids.has(r.target)) return false;
      if (!filters.relationshipTypes.includes(r.type)) return false;
      if (filters.from && r.date < filters.from) return false;
      if (filters.to && r.date > filters.to) return false;
      return true;
    });
  }, [visibleEntities, filters]);

  const selected = visibleEntities.find((e) => e.id === selectedId) ?? null;

  const openRecords = (ids: string[], context: string) =>
    setDialog({ open: true, ids: Array.from(new Set(ids)), context });

  return (
    <AppLayout
      title="Investigation Workspace"
      subtitle="Operation Meridian · CASE-2041 · fictional demo network"
      fullBleed
    >
      <div className="grid h-[calc(100vh-8.5rem)] grid-cols-[280px_minmax(0,1fr)_360px]">
        <FiltersPanel filters={filters} onChange={setFilters} />

        <div className="flex min-w-0 flex-col gap-4 overflow-y-auto p-4">
          <div className="h-[640px] shrink-0">
            <NetworkGraph
              entities={visibleEntities}
              relationships={visibleRelationships}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <InsightsPanel onViewRecords={openRecords} />
        </div>

        <EntityDetailsPanel
          entity={selected}
          relationships={visibleRelationships}
          onSelect={setSelectedId}
          onViewRecords={openRecords}
          onViewTimeline={() => navigate({ to: "/timeline" })}
          onExpand={() => {
            setFilters(DEFAULT_FILTERS);
            toast.info("Connections expanded", {
              description: "All filters cleared to reveal the full demo neighbourhood.",
            });
          }}
        />
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
