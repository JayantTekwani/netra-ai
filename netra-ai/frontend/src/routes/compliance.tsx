import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Shield, FileKey, History, ShieldAlert } from "lucide-react";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [{ title: "Audit & Access Log — NEXUS" }],
  }),
  component: AuditPage,
});

const AUDIT_LOGS = [
  { id: "LOG-01", time: "2026-08-31 14:02:11", user: "system_cron", action: "PII_PURGE", target: "CASE-1002_EXPIRED", status: "SUCCESS", detail: "DPDP compliance purge executed." },
  { id: "LOG-02", time: "2026-08-31 14:15:22", user: "Demo (Investigator)", action: "GRAPH_QUERY", target: "PER-001", status: "SUCCESS", detail: "Expanded 2-hop neighborhood." },
  { id: "LOG-03", time: "2026-08-31 14:18:05", user: "Demo (Investigator)", action: "CCTV_FEED_ACCESS", target: "CAM-ND-01", status: "WARNING", detail: "Accessed simulated feed outside assigned jurisdiction." },
  { id: "LOG-04", time: "2026-08-31 14:22:19", user: "ML_WORKER_04", action: "ENTITY_RESOLUTION", target: "REC_BATCH_99", status: "SUCCESS", detail: "Merged 3 records into PER-001 (Confidence: 96%)." },
];

function AuditPage() {
  const user = getSession();

  const sortedLogs = [...AUDIT_LOGS].sort((a, b) => {
    if (a.status === "WARNING") return -1;
    if (b.status === "WARNING") return 1;
    return 0;
  });
  
  const visibleLogs = sortedLogs.slice(0, 3);

  return (
    <AppLayout title="Chain of Custody & Audit" subtitle="Immutable ledger of all queries, ML operations, and data purges.">
      <div className="grid gap-6">
        
        {/* COMPLIANCE STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="panel p-5 border-accent/30 bg-accent/5">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-accent" />
              <div>
                <div className="font-bold text-sm">DPDP Compliant</div>
                <div className="text-xs text-muted-foreground mt-1">Auto-purge active for cold cases.</div>
              </div>
            </div>
          </div>
          <div className="panel p-5 border-accent/30 bg-accent/5">
            <div className="flex items-center gap-3">
              <FileKey className="size-5 text-accent" />
              <div>
                <div className="font-bold text-sm">Merkle Tree Ledger</div>
                <div className="text-xs text-muted-foreground mt-1">Logs cryptographically hashed.</div>
              </div>
            </div>
          </div>
          <div className="panel p-5 border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-5 text-destructive" />
              <div>
                <div className="font-bold text-sm">Role: Investigator</div>
                <div className="text-xs text-muted-foreground mt-1">Restricted from exporting raw PII.</div>
              </div>
            </div>
          </div>
        </div>

        {/* LOG TABLE */}
        <div className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 p-4">
            <History className="size-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">System Audit Log</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised text-left">
                <th className="p-3 font-medium">Timestamp</th>
                <th className="p-3 font-medium">Actor</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Target</th>
                <th className="p-3 font-medium">Status / Detail</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log) => {
                const isWarning = log.status === "WARNING";
                return (
                  <tr key={log.id} className={`border-b border-border/60 hover:bg-surface-raised/60 ${isWarning ? "bg-destructive/10 relative" : ""}`}>
                    {isWarning && <td className="absolute left-0 top-0 bottom-0 w-1 bg-destructive animate-pulse" />}
                    <td className="p-3 font-mono text-xs text-muted-foreground">{log.time}</td>
                    <td className="p-3 font-mono text-xs">{log.user}</td>
                    <td className="p-3">
                      <span className={`${isWarning ? "bg-destructive/20 text-destructive" : "bg-secondary"} px-2 py-1 rounded-sm text-xs font-mono`}>{log.action}</span>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{log.target}</td>
                    <td className="p-3 text-xs">
                      <div className={isWarning ? "text-destructive font-bold" : "text-accent font-bold"}>{log.status}</div>
                      <div className="text-muted-foreground mt-0.5">{log.detail}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-3 text-center border-t border-border bg-surface-raised/30">
            <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
              View {AUDIT_LOGS.length - 3} older logs...
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
