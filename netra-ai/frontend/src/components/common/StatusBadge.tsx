import type { CasePriority, CaseStatus } from "@/data/types";

const STATUS: Record<CaseStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-success/15 text-success ring-success/30" },
  "under-review": { label: "Under Review", cls: "bg-accent/15 text-accent ring-accent/30" },
  closed: { label: "Closed", cls: "bg-muted text-muted-foreground ring-border" },
};

const PRIORITY: Record<CasePriority, string> = {
  low: "bg-muted text-muted-foreground ring-border",
  medium: "bg-primary/12 text-primary ring-primary/30",
  high: "bg-accent/15 text-accent ring-accent/30",
  critical: "bg-destructive/15 text-destructive ring-destructive/30",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const s = STATUS[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: CasePriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ring-1 ${PRIORITY[priority]}`}
    >
      {priority}
    </span>
  );
}
