import { Search, FilterX } from "lucide-react";
import type { EntityType, RelationshipType } from "@/data/types";
import { ENTITY_TYPE_META, RELATIONSHIP_TYPE_META } from "@/data/mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export interface GraphFilters {
  query: string;
  entityTypes: EntityType[];
  relationshipTypes: RelationshipType[];
  from: string;
  to: string;
}

export const DEFAULT_FILTERS: GraphFilters = {
  query: "",
  entityTypes: Object.keys(ENTITY_TYPE_META) as EntityType[],
  relationshipTypes: Object.keys(RELATIONSHIP_TYPE_META) as RelationshipType[],
  from: "",
  to: "",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-4 py-4">
      <div className="label-caps mb-3">{title}</div>
      {children}
    </div>
  );
}

export function FiltersPanel({
  filters,
  onChange,
}: {
  filters: GraphFilters;
  onChange: (f: GraphFilters) => void;
}) {
  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-border bg-surface">
      <Section title="Search Entity">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Name, number, account…"
            className="pl-9"
          />
        </div>
      </Section>

      <Section title="Entity Type">
        <div className="space-y-2.5">
          {(Object.keys(ENTITY_TYPE_META) as EntityType[]).map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-3 text-sm">
              <Checkbox
                checked={filters.entityTypes.includes(t)}
                onCheckedChange={() =>
                  onChange({ ...filters, entityTypes: toggle(filters.entityTypes, t) })
                }
              />
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: ENTITY_TYPE_META[t].color }}
              />
              {ENTITY_TYPE_META[t].label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Relationship Type">
        <div className="space-y-2.5">
          {(Object.keys(RELATIONSHIP_TYPE_META) as RelationshipType[]).map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-3 text-sm">
              <Checkbox
                checked={filters.relationshipTypes.includes(t)}
                onCheckedChange={() =>
                  onChange({
                    ...filters,
                    relationshipTypes: toggle(filters.relationshipTypes, t),
                  })
                }
              />
              {RELATIONSHIP_TYPE_META[t].label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Date Range">
        <div className="space-y-2">
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => onChange({ ...filters, from: e.target.value })}
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => onChange({ ...filters, to: e.target.value })}
          />
        </div>
      </Section>

      <div className="p-4">
        <Button variant="outline" className="w-full" onClick={() => onChange(DEFAULT_FILTERS)}>
          <FilterX className="size-4" /> Clear Filters
        </Button>
      </div>
    </div>
  );
}
