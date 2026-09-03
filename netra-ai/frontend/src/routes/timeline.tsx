import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TimelineList } from "@/components/timeline/TimelineList";
import { SupportingRecordsDialog } from "@/components/investigation/SupportingRecordsDialog";
import { RELATIONSHIP_TYPE_META, timelineEvents } from "@/data/mock";
import type { RelationshipType } from "@/data/types";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — त्रिनेत्र-AI Investigation Platform" },
      {
        name: "description",
        content:
          "Chronological view of fictional demo investigation events: calls, transfers, location hits and document mentions.",
      },
      { property: "og:title", content: "Timeline — त्रिनेत्र-AI Investigation Platform" },
      {
        property: "og:description",
        content: "Chronological demo events with references to supporting records.",
      },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  const [type, setType] = useState<RelationshipType | "all">("all");
  const [dialog, setDialog] = useState<{ open: boolean; ids: string[]; context?: string }>({
    open: false,
    ids: [],
  });

  const events = useMemo(
    () => timelineEvents.filter((e) => type === "all" || e.type === type),
    [type],
  );

  return (
    <AppLayout
      title="Timeline"
      subtitle="Chronological reconstruction of fictional demo events"
    >
      <div className="mb-6 flex gap-1 rounded-md border border-border bg-surface p-1">
        {(["all", ...Object.keys(RELATIONSHIP_TYPE_META)] as Array<RelationshipType | "all">).map(
          (t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                type === t
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? "All Events" : RELATIONSHIP_TYPE_META[t].label}
            </button>
          ),
        )}
        <div className="ml-auto self-center px-3 font-mono text-xs text-muted-foreground">
          {events.length} events
        </div>
      </div>

      <div className="max-w-4xl">
        <TimelineList
          events={events}
          onViewRecord={(ids, context) => setDialog({ open: true, ids, context })}
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
