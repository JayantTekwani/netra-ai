import { Sparkles, FileSearch } from "lucide-react";
import { insights } from "@/data/mock";
import { Button } from "@/components/ui/button";

export function InsightsPanel({
  onViewRecords,
}: {
  onViewRecords: (recordIds: string[], context: string) => void;
}) {
  return (
    <section className="panel p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-accent" />
        <h2 className="text-sm font-semibold tracking-tight">AI-Assisted Investigation Insights</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Fictional demo observations only. These are descriptive statements about the sample dataset
        and do not assess conduct, guilt or criminality of any person.
      </p>

      <ul className="mt-4 space-y-3">
        {insights.map((i) => (
          <li
            key={i.id}
            className="rounded-md border border-border bg-surface-raised p-4 transition-colors hover:border-border-strong"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium">{i.headline}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.detail}</p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {i.confidence}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 px-2 text-primary"
              onClick={() => onViewRecords(i.recordIds, i.headline)}
            >
              <FileSearch className="size-4" /> View Supporting Records
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
