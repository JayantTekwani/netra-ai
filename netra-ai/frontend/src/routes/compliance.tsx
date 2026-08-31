import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Shield, FileKey, History, ShieldAlert, Link as LinkIcon, CheckCircle2, XCircle } from "lucide-react";
import { getSession } from "@/lib/session";
import { useEffect, useState } from "react";
import { ledger, Block } from "@/lib/blockchain";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [{ title: "Audit & Access Log — नेत्र-AI" }],
  }),
  component: AuditPage,
});

const INITIAL_LOGS = [
  { action: "PII_PURGE", target: "CASE-1002_EXPIRED", detail: "DPDP compliance purge executed." },
  { action: "GRAPH_QUERY", target: "PER-001", detail: "Expanded 2-hop neighborhood." },
  { action: "CCTV_FEED_ACCESS", target: "CAM-ND-01", detail: "Accessed simulated feed outside assigned jurisdiction." },
  { action: "ENTITY_RESOLUTION", target: "REC_BATCH_99", detail: "Merged 3 records into PER-001 (Confidence: 96%)." },
];

function AuditPage() {
  const user = getSession();
  const [chain, setChain] = useState<Block[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Initialize blockchain and mine genesis + initial mock logs
    const initChain = async () => {
      if (ledger.chain.length === 0) {
        await ledger.initializeGenesisBlock();
        for (const log of INITIAL_LOGS) {
          await ledger.addBlock({ user: user?.email || "system", ...log });
        }
      }
      setChain([...ledger.chain]);
    };
    initChain();
  }, []);

  const verifyLedger = async () => {
    setIsValidating(true);
    setIsValid(null);
    // Artificial delay to simulate heavy cryptographic verification
    setTimeout(async () => {
      const valid = await ledger.isChainValid();
      setIsValid(valid);
      setIsValidating(false);
    }, 1500);
  };

  const addManualRecord = async () => {
    await ledger.addBlock({
      user: user?.email,
      action: "MANUAL_FIR_ENTRY",
      target: "FIR-2026-991",
      detail: "Manual upload of physical evidence record."
    });
    setChain([...ledger.chain]);
  };

  return (
    <AppLayout title="Chain of Custody & Audit" subtitle="Immutable cryptographic ledger of all queries, ML operations, and data interactions.">
      <div className="grid gap-6">
        
        {/* COMPLIANCE STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="panel p-5 border-accent/30 bg-accent/5">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-accent" />
              <div>
                <div className="text-sm font-semibold text-accent">DPDP Act Compliant</div>
                <div className="text-xs text-muted-foreground mt-0.5">Auto-redaction active</div>
              </div>
            </div>
          </div>
          <div className="panel p-5 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <FileKey className="size-5 text-primary" />
              <div>
                <div className="text-sm font-semibold text-primary">SHA-256 Ledger</div>
                <div className="text-xs text-muted-foreground mt-0.5">{chain.length} blocks secured</div>
              </div>
            </div>
          </div>
          <button onClick={verifyLedger} disabled={isValidating} className="panel p-5 border-border hover:bg-secondary/50 transition-colors text-left flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <History className={`size-5 text-muted-foreground ${isValidating ? 'animate-spin' : 'group-hover:text-foreground'}`} />
              <div>
                <div className="text-sm font-semibold text-foreground">Verify Integrity</div>
                <div className="text-xs text-muted-foreground mt-0.5">Run cryptographic check</div>
              </div>
            </div>
            {isValid === true && <CheckCircle2 className="size-5 text-primary" />}
            {isValid === false && <XCircle className="size-5 text-destructive" />}
          </button>
        </div>

        {/* BLOCKCHAIN LOG */}
        <div className="panel p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight">Cryptographic Ledger</h2>
            <button onClick={addManualRecord} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
              Inject Test Record
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Block</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                  <th className="px-5 py-3 font-medium">Payload / Action</th>
                  <th className="px-5 py-3 font-medium">Block Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chain.map((block) => {
                  const payload = JSON.parse(block.data);
                  return (
                    <tr key={block.index} className="hover:bg-secondary/20 transition-colors font-mono">
                      <td className="px-5 py-4 text-xs">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="size-3 text-muted-foreground" />
                          #{block.index}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-muted-foreground text-xs">
                        {new Date(block.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">{payload.action || payload.event}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs">{payload.detail || payload.details}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[10px] text-accent/80 truncate w-48">Prev: {block.previousHash}</div>
                        <div className="text-xs text-primary truncate w-48">Hash: {block.hash}</div>
                      </td>
                    </tr>
                  );
                })}
                {chain.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                      Initializing genesis block...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
