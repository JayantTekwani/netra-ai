import { CalendarClock, GitBranch, FileSearch, MousePointerClick } from "lucide-react";
import type { Entity, Relationship } from "@/data/types";
import { ENTITY_TYPE_META, entityById, timelineEvents } from "@/data/mock";
import { Button } from "@/components/ui/button";

export function EntityDetailsPanel({
  entity,
  relationships,
  onSelect,
  onViewRecords,
  onViewTimeline,
  onExpand,
}: {
  entity: Entity | null;
  relationships: Relationship[];
  onSelect: (id: string) => void;
  onViewRecords: (recordIds: string[], context: string) => void;
  onViewTimeline: () => void;
  onExpand: () => void;
}) {
  if (!entity) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 border-l border-border bg-surface px-8 text-center">
        <MousePointerClick className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Select a node in the network to inspect its attributes, connections and supporting
          records.
        </p>
      </div>
    );
  }

  const meta = ENTITY_TYPE_META[entity.type];
  const connected = relationships.filter(
    (r) => r.source === entity.id || r.target === entity.id,
  );
  const interactions = timelineEvents
    .filter((e) => e.entityIds.includes(entity.id))
    .slice(0, 4);

  return (
    <div className="flex h-full flex-col overflow-y-auto border-l border-border bg-surface">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="label-caps">{meta.label}</span>
        </div>
        <div className="mt-4 flex gap-4">
          {entity.image && (
            <div className="size-16 shrink-0 overflow-hidden rounded-md border border-border">
              <img src={entity.image} alt={entity.name} className="h-full w-full object-cover grayscale sepia-[0.3] contrast-125 hover:grayscale-0 hover:sepia-0 transition-all" />
            </div>
          )}
          <div className="flex flex-col justify-center">
            <h2 className="text-lg font-semibold tracking-tight">{entity.name}</h2>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{entity.id}</div>
          </div>
        </div>
      </div>

      <div className="border-b border-border p-5">
        <div className="label-caps mb-3">Attributes</div>
        <dl className="space-y-2 text-sm">
          {Object.entries(entity.attributes).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-mono text-xs">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-b border-border p-5">
        <div className="flex items-center justify-between">
          <div className="label-caps">Direct Connections</div>
          <span className="font-mono text-sm text-primary">{connected.length}</span>
        </div>
        <ul className="mt-3 space-y-2">
          {connected.map((r) => {
            const otherId = r.source === entity.id ? r.target : r.source;
            const other = entityById(otherId);
            if (!other) return null;
            return (
              <li key={r.id}>
                <button
                  onClick={() => onSelect(other.id)}
                  className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-left transition-colors hover:border-border-strong hover:bg-secondary"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{other.name}</span>
                    <span
                      className="shrink-0 font-mono text-[10px]"
                      style={{ color: ENTITY_TYPE_META[other.type].color }}
                    >
                      {ENTITY_TYPE_META[other.type].short}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.label}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{r.date}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-b border-border p-5">
        <div className="label-caps mb-3">Related Cases</div>
        <div className="flex flex-wrap gap-2">
          {entity.caseIds.map((c) => (
            <span
              key={c}
              className="rounded-md border border-border bg-surface-raised px-2 py-1 font-mono text-xs"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="border-b border-border p-5">
        <div className="label-caps mb-3">Recent Interactions</div>
        {interactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No demo interactions recorded.</p>
        ) : (
          <ul className="space-y-3">
            {interactions.map((e) => (
              <li key={e.id} className="border-l-2 border-primary/40 pl-3">
                <div className="font-mono text-[10px] text-muted-foreground">
                  {new Date(e.date).toLocaleString()}
                </div>
                <div className="text-sm">{e.title}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 p-5">
        <Button variant="outline" className="w-full justify-start" onClick={onViewTimeline}>
          <CalendarClock className="size-4" /> View Timeline
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={onExpand}>
          <GitBranch className="size-4" /> Expand Connections
        </Button>
        <Button
          className="w-full justify-start"
          onClick={() =>
            onViewRecords(
              connected.flatMap((r) => r.recordIds),
              `Records referencing ${entity.name}`,
            )
          }
        >
          <FileSearch className="size-4" /> View Supporting Records
        </Button>
      </div>
    </div>
  );
}
