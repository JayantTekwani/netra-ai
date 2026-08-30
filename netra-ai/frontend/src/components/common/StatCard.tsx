import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent/15 text-accent ring-accent/30"
      : tone === "success"
        ? "bg-success/15 text-success ring-success/30"
        : "bg-primary/15 text-primary ring-primary/30";

  return (
    <div className="panel group relative overflow-hidden p-5 transition-colors duration-200 hover:border-border-strong">
      <div className="flex items-start justify-between">
        <div>
          <div className="label-caps">{label}</div>
          <div className="mt-2 font-mono text-3xl font-semibold tracking-tight">{value}</div>
          {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
        <div className={`flex size-10 items-center justify-center rounded-md ring-1 ${toneClass}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
