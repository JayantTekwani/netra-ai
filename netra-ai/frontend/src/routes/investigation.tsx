import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

export const Route = createFileRoute("/investigation")({
  head: () => ({
    meta: [
      { title: "Investigation Workspace — त्रिनेत्र-AI" },
      {
        name: "description",
        content:
          "Interactive relationship network of fictional entities: filter, select nodes and trace every link back to a supporting demo record.",
      },
      { property: "og:title", content: "Investigation Workspace — त्रिनेत्र-AI" },
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
  const [dialog, setDialog] = useState<{ open: boolean; ids: string[]; context?: string }>({
    open: false,
    ids: [],
  });

  const activeCaseId = useStore((s) => s.activeCaseId);
  const allEntities = useStore((s) => s.entities);
  const allRelationships = useStore((s) => s.relationships);
  const activeCase = useStore((s) => s.cases.find(c => c.id === activeCaseId));

  const visibleEntities = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return allEntities.filter(
      (e) =>
        e.caseIds.includes(activeCaseId || "") &&
        filters.entityTypes.includes(e.type) &&
        (q === "" || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)),
    );
  }, [filters, allEntities, activeCaseId]);

  const visibleRelationships = useMemo(() => {
    const ids = new Set(visibleEntities.map((e) => e.id));
    return allRelationships.filter((r) => {
      if (!ids.has(r.source) || !ids.has(r.target)) return false;
      if (!filters.relationshipTypes.includes(r.type)) return false;
      if (filters.from && r.date < filters.from) return false;
      if (filters.to && r.date > filters.to) return false;
      return true;
    });
  }, [visibleEntities, filters]);

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
          <div className="h-[640px] shrink-0 relative">
            <HolographicGraph
              entities={visibleEntities}
              relationships={visibleRelationships}
            />
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
