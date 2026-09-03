import { FileText } from "lucide-react";
import { useStore } from "@/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SupportingRecordsDialog({
  open,
  onOpenChange,
  recordIds,
  context,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recordIds: string[];
  context?: string | undefined;
}) {
  const allRecords = useStore((s) => s.supportingRecords);
  const records = recordIds
    .map((id) => allRecords.find((r) => r.id === id))
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Supporting Records</DialogTitle>
          <DialogDescription>
            {context ?? "Source records attached to this link."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No supporting records attached.</p>
          ) : (
            records.map((r) => (
              <div key={r!.id} className="rounded-md border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    <span className="font-mono text-sm">{r!.id}</span>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r!.kind}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{r!.date}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{r!.title}</div>
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border pt-3 text-sm">
                  {Object.entries(r!.fields).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-mono text-xs">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
