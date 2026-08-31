import { Phone, Banknote, MapPin, FileText, Link2, FileSearch } from "lucide-react";
import type { RelationshipType, TimelineEvent } from "@/data/types";
import { entityById } from "@/data/mock";
import { Button } from "@/components/ui/button";

const ICONS: Record<RelationshipType, typeof Phone> = {
  call: Phone,
  transaction: Banknote,
  location: MapPin,
  mention: FileText,
  association: Link2,
};

const COLORS: Record<RelationshipType, string> = {
  call: "border-accent bg-accent/5 text-accent",
  transaction: "border-accent bg-accent/5 text-accent",
  location: "border-accent bg-accent/5 text-accent",
  mention: "border-muted-foreground bg-muted-foreground/5 text-muted-foreground",
  association: "border-muted-foreground bg-muted-foreground/5 text-muted-foreground",
};

const DOT_COLORS: Record<RelationshipType, string> = {
  call: "bg-accent",
  transaction: "bg-accent",
  location: "bg-accent",
  mention: "bg-muted-foreground",
  association: "bg-muted-foreground",
};

export function TimelineList({
  events,
  onViewRecord,
}: {
  events: TimelineEvent[];
  onViewRecord: (recordIds: string[], context: string) => void;
}) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {sorted.map((e) => {
        const Icon = ICONS[e.type];
        const colorCls = COLORS[e.type];
        const dotCls = DOT_COLORS[e.type];
        return (
          <li key={e.id} className="relative">
            <span className={`absolute -left-[33px] top-3 flex size-4 items-center justify-center rounded-full border border-background bg-background`}>
              <span className={`size-2.5 rounded-full ${dotCls} shadow-[0_0_0_2px_var(--background)]`} />
            </span>
            <div className={`panel p-4 transition-colors hover:border-border-strong border-l-4 ${colorCls.split(' ')[0]}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex size-8 items-center justify-center rounded-md ${colorCls.split(' ')[1]}`}>
                    <Icon className={`size-4 ${colorCls.split(' ')[2]}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{e.title}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {e.entityIds.map((id) => (
                        <span
                          key={id}
                          className="rounded border border-border bg-surface-raised px-2 py-0.5 text-[11px]"
                        >
                          {entityById(id)?.name ?? id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`mt-2 px-2 ${colorCls.split(' ')[2]}`}
                    onClick={() => onViewRecord([e.recordId], e.title)}
                  >
                    <FileSearch className="size-4 mr-1" /> {e.recordId}
                  </Button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
