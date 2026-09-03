import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Shield, FileKey, History, ShieldAlert, Link as LinkIcon, CheckCircle2, XCircle, Network } from "lucide-react";
import { getSession } from "@/lib/session";
import { useEffect, useState } from "react";
import { ledger, Block } from "@/lib/blockchain";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [{ title: "Audit & Access Log — त्रिनेत्र-AI" }],
  }),
  component: AuditPage,
});

const INITIAL_LOGS = [
  { action: "PII_PURGE", payload: { target: "CASE-1002_EXPIRED" } },
  { action: "GRAPH_QUERY", payload: { target: "PER-001", depth: 2 } },
  { action: "CCTV_FEED_ACCESS", payload: { target: "CAM-ND-01" } },
];

function AuditPage() {
  const user = getSession();
  const [chain, setChain] = useState<Block[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const initChain = async () => {
      if (ledger.chain.length === 0) {
        await ledger.initializeGenesisBlock();
        // Add transactions to mempool
        for (const log of INITIAL_LOGS) {
          await ledger.addTransaction(log.action, { user: user?.email || "system", ...log.payload });
        }
        // Mine them into a single batch block (Merkle Tree)
        await ledger.minePendingTransactions();
      }
      setChain([...ledger.chain]);
    };
    initChain();
  }, []);

  const verifyLedger = async () => {
    setIsValidating(true);
    setIsValid(null);
    setTimeout(async () => {
      const valid = await ledger.isChainValid();
      setIsValid(valid);
      setIsValidating(false);
    }, 1500);
  };

  const addManualRecord = async () => {
    // Add multiple transactions to show batching
    await ledger.addTransaction("MANUAL_FIR_ENTRY", { target: "FIR-2026-991", user: user?.email });
    await ledger.addTransaction("EVIDENCE_UPLOAD", { file: "IMG_9912.jpg", hash: "a8f9c2..." });
    await ledger.minePendingTransactions();
    setChain([...ledger.chain]);
  };

  return (
    <AppLayout title="Chain of Custody & Audit" subtitle="Immutable cryptographic ledger with Merkle Root batching and off-chain PII storage.">
      <div className="grid gap-6">
        
        {/* COMPLIANCE STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="panel p-5 border-accent/30 bg-accent/5">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-accent" />
              <div>
                <div className="text-sm font-semibold text-accent">DPDP Act Compliant</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Off-chain PII (Right to Erasure)</div>
              </div>
            </div>
          </div>
          <div className="panel p-5 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <Network className="size-5 text-primary" />
              <div>
                <div className="text-sm font-semibold text-primary">Merkle Tree Ledger</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{chain.length} blocks • Batched Txns</div>
              </div>
            </div>
          </div>
          <button onClick={verifyLedger} disabled={isValidating} className="panel p-5 border-border hover:bg-secondary/50 transition-colors text-left flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <History className={`size-5 text-muted-foreground ${isValidating ? 'animate-spin' : 'group-hover:text-foreground'}`} />
              <div>
                <div className="text-sm font-semibold text-foreground">Verify Integrity</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Validate Merkle Roots & SHA-256</div>
              </div>
            </div>
            {isValid === true && <CheckCircle2 className="size-5 text-primary" />}
            {isValid === false && <XCircle className="size-5 text-destructive" />}
          </button>
        </div>

        {/* BLOCKCHAIN LOG */}
        <div className="panel p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight">Cryptographic Ledger Blocks</h2>
            <button onClick={addManualRecord} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
              Simulate Batch Operations
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/30 text-[10px] tracking-wider uppercase text-muted-foreground font-mono">
                <tr>
                  <th className="px-5 py-3 font-medium">Block</th>
                  <th className="px-5 py-3 font-medium">Transactions (Merkle Batch)</th>
                  <th className="px-5 py-3 font-medium">Merkle Root & Block Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chain.map((block) => (
                  <tr key={block.index} className="hover:bg-secondary/20 transition-colors font-mono group">
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <LinkIcon className="size-3 text-muted-foreground" />
                        Block #{block.index}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(block.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      {block.transactions.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Genesis Block</span>
                      ) : (
                        <div className="space-y-3">
                          {block.transactions.map((tx) => (
                            <div key={tx.id} className="border-l-2 border-primary/30 pl-3">
                              <div className="text-xs font-semibold text-foreground">{tx.action}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 truncate w-48">
                                Off-Chain Payload Hash:<br/>
                                <span className="text-accent">{tx.offChainPayloadHash.substring(0, 32)}...</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="text-[10px] text-muted-foreground">Merkle Root:</div>
                      <div className="text-xs text-primary truncate w-64 mb-2">{block.merkleRoot}</div>
                      
                      <div className="text-[10px] text-muted-foreground">Block Hash (PoW):</div>
                      <div className="text-xs text-foreground truncate w-64">{block.hash}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
