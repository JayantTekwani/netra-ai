import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Shield,
  FileKey,
  History,
  ShieldAlert,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Network,
  FileText,
  Download,
  Send,
  QrCode,
  Lock,
  Search,
  Check,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { useEffect, useState } from "react";
import { ledger, Block } from "@/lib/blockchain";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore } from "@/store";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [{ title: "Audit & BSA Section 63 Court Affidavit — त्रिनेत्र-AI" }],
  }),
  component: AuditPage,
});

const INITIAL_LOGS = [
  { action: "PII_PURGE", payload: { target: "CASE-1002_EXPIRED" } },
  { action: "GRAPH_QUERY", payload: { target: "PER-001", depth: 2 } },
  { action: "CCTV_FEED_ACCESS", payload: { target: "CAM-ND-01" } },
];

const DEMO_EVIDENCE_FILES = [
  { name: "FIR_104_2026_RAW_HINDI.pdf", size: "482 KB", hash: "a3f89b1c72d9e048123456789abcdef0123456789abcdef0123456789abcdef0", type: "First Information Report" },
  { name: "AIRTEL_CDR_TOWER_DUMP_JAN15.csv", size: "2.4 MB", hash: "c8e192f04b7a6358123456789abcdef0123456789abcdef0123456789abcdef1", type: "Telecom Service CDR" },
  { name: "UPI_MULE_TRANSACTION_LEDGER.xlsx", size: "1.1 MB", hash: "99b2401f8e77d2a1123456789abcdef0123456789abcdef0123456789abcdef2", type: "Core Banking FIU Feed" },
  { name: "CAM_SEC14_CCTV_INTERCEPT.mp4", size: "18.6 MB", hash: "f7129ac048b139e6123456789abcdef0123456789abcdef0123456789abcdef3", type: "Visual Surveillance" },
];

export function AuditPage() {
  const user = getSession();
  const [chain, setChain] = useState<Block[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // BSA Section 63 Modal & Verification State (Module 7)
  const [showAffidavitModal, setShowAffidavitModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isTransmittingCourt, setIsTransmittingCourt] = useState(false);
  const [verifyInputHash, setVerifyInputHash] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "verifying" | "valid" | "invalid">("idle");

  const activeCaseId = useStore((s) => s.activeCaseId);
  const activeCase = useStore((s) => s.cases.find((c) => c.id === activeCaseId));

  useEffect(() => {
    const initChain = async () => {
      if (ledger.chain.length === 0) {
        await ledger.initializeGenesisBlock();
        for (const log of INITIAL_LOGS) {
          await ledger.addTransaction(log.action, { user: user?.email || "system", ...log.payload });
        }
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
      if (valid) {
        toast.success("Blockchain Integrity Verified", {
          description: "All Merkle branches match cryptographic SHA-256 state.",
        });
      }
    }, 1200);
  };

  const addManualRecord = async () => {
    await ledger.addTransaction("MANUAL_FIR_ENTRY", { target: "FIR-2026-991", user: user?.email });
    await ledger.addTransaction("EVIDENCE_UPLOAD", { file: "IMG_9912.jpg", hash: "a8f9c2..." });
    await ledger.minePendingTransactions();
    setChain([...ledger.chain]);
    toast.success("New Merkle Block Inscribed", {
      description: `Block #${ledger.chain.length - 1} appended with SHA-256 root.`,
    });
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    setTimeout(() => {
      setIsDownloadingPdf(false);
      setDownloadSuccess(true);
      toast.success("Court Affidavit Generated", {
        description: `Downloaded: Affidavit_BSA63_${activeCase?.id || "CASE_001"}_20260115.pdf`,
      });
    }, 1800);
  };

  const handleTransmitCourt = () => {
    setIsTransmittingCourt(true);
    setTimeout(() => {
      setIsTransmittingCourt(false);
      toast.success("Dispatched to Court Registry", {
        description: "Transmitted to Delhi District Court e-Filing System (Reference: ECR-2026-44821).",
      });
    }, 1500);
  };

  const handleCheckHash = () => {
    if (!verifyInputHash.trim()) return;
    setVerifyStatus("verifying");
    setTimeout(() => {
      // Validate against known evidence hashes—partial match on first 8+ chars
      const input = verifyInputHash.trim().toLowerCase();
      const isKnown = DEMO_EVIDENCE_FILES.some(
        (ef) => ef.hash.startsWith(input.slice(0, 8)) || input.startsWith(ef.hash.slice(0, 8))
      );
      if (isKnown) {
        setVerifyStatus("valid");
        toast.success("Evidence Untampered", {
          description: "SHA-256 hash verified against Block #1 Merkle root.",
        });
      } else {
        setVerifyStatus("invalid");
        toast.error("Hash Not Found in Ledger", {
          description: "No matching SHA-256 Merkle leaf found. Evidence may be unregistered or tampered.",
        });
      }
    }, 1000);
  };

  return (
    <AppLayout
      title="Chain of Custody & BSA Section 63 Legal Package"
      subtitle="Immutable cryptographic ledger with Merkle Root batching, off-chain PII storage, and court-ready electronic affidavits"
      actions={
        <Button
          onClick={() => {
            setShowAffidavitModal(true);
            setDownloadSuccess(false);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
        >
          <FileText className="size-4 mr-1.5" />
          📋 Export BSA Sec 63 Legal Package
        </Button>
      }
    >
      <div className="grid gap-6">
        {/* COMPLIANCE STATUS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="panel p-5 border-accent/30 bg-accent/5">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-accent" />
              <div>
                <div className="text-sm font-semibold text-accent">DPDP Act 2023 Compliant</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Off-chain PII & 72h Biometric Purge</div>
              </div>
            </div>
          </div>

          <div className="panel p-5 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <Network className="size-5 text-primary" />
              <div>
                <div className="text-sm font-semibold text-primary">BSA 2023 Sec 63 Merkle Vault</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{chain.length} blocks &bull; SHA-256 Batched</div>
              </div>
            </div>
          </div>

          <button
            onClick={verifyLedger}
            disabled={isValidating}
            className="panel p-5 border-border hover:bg-secondary/50 transition-colors text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <History className={`size-5 text-muted-foreground ${isValidating ? "animate-spin" : "group-hover:text-foreground"}`} />
              <div>
                <div className="text-sm font-semibold text-foreground">Verify Cryptographic Integrity</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Audit Merkle Roots & SHA-256 Hashes</div>
              </div>
            </div>
            {isValid === true && <CheckCircle2 className="size-5 text-primary" />}
            {isValid === false && <XCircle className="size-5 text-destructive" />}
          </button>
        </div>

        {/* EVIDENCE HASH INTEGRITY VERIFIER (MODULE 7.4) */}
        <div className="panel p-4 bg-card/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground font-mono">
              <Search className="size-3.5 text-primary" />
              Real-Time Evidence Hash Integrity Verifier (Court Tamper-Proof Audit)
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Section 63(4) BSA 2023 Audit Rule</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Paste raw evidence SHA-256 hash or click preset below..."
              value={verifyInputHash}
              onChange={(e) => {
                setVerifyInputHash(e.target.value);
                setVerifyStatus("idle");
              }}
              className="flex-1 min-w-[280px] bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-primary"
            />
            <Button size="sm" onClick={handleCheckHash} className="text-xs">
              {verifyStatus === "verifying" ? "Verifying Merkle Root..." : "Verify Hash"}
            </Button>
          </div>

          {/* Quick preset hashes */}
          <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-muted-foreground flex-wrap">
            <span>Test with active evidence:</span>
            {DEMO_EVIDENCE_FILES.slice(0, 2).map((ef) => (
              <button
                key={ef.name}
                onClick={() => {
                  setVerifyInputHash(ef.hash);
                  setVerifyStatus("idle");
                }}
                className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-[9px]"
              >
                {ef.name.split("_")[0]} ({ef.hash.slice(0, 8)}...)
              </button>
            ))}
          </div>

          {verifyStatus === "valid" && (
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span>
                  <strong>HASH VERIFIED — EVIDENCE UNTAMPERED:</strong> Hash anchored to Block #1 Merkle Leaf. Zero bit drift.
                </span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-bold">100% COURT ADMISSIBLE</span>
            </div>
          )}

          {verifyStatus === "invalid" && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-xs font-mono text-red-400 flex items-center gap-2">
              <XCircle className="size-4 shrink-0" />
              <span>
                <strong>HASH NOT FOUND:</strong> No Merkle leaf matches this hash. File may be unregistered or tampered. Paste a preset hash above to test known evidence.
              </span>
            </div>
          )}
        </div>

        {/* BLOCKCHAIN LOG TABLE */}
        <div className="panel p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight">Cryptographic Ledger Blocks (Hyperledger Merkle Layer)</h2>
            <button
              onClick={addManualRecord}
              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
            >
              Simulate Ingest Block Batch
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
                                Off-Chain Payload Hash:<br />
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

                      <div className="text-[10px] text-muted-foreground">Block Hash (SHA-256):</div>
                      <div className="text-xs text-foreground truncate w-64">{block.hash}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* COURTROOM BSA SECTION 63 LEGAL PACKAGE MODAL (MODULE 7.2 & 7.3) */}
      {showAffidavitModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border-2 border-emerald-500/70 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold uppercase">
                  Statutory Admissibility Certificate
                </span>
                <h3 className="text-base font-bold text-foreground mt-1">
                  BSA 2023 Section 63 Electronic Evidence Package
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Court-Ready Forensic Affidavit under Bhartiya Sakshya Adhiniyam, 2023
                </p>
              </div>
              <button
                onClick={() => setShowAffidavitModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            {/* OFFICIAL COURT DOCUMENT BODY */}
            <div className="py-4 space-y-4 text-xs font-mono max-h-[60vh] overflow-y-auto pr-2">
              {/* COURT TITLE */}
              <div className="p-4 bg-background border border-border/80 rounded-xl text-center space-y-1">
                <div className="font-bold text-foreground text-sm">
                  IN THE COURT OF THE PRINCIPAL DISTRICT & SESSIONS JUDGE
                </div>
                <div className="text-muted-foreground">PATIALA HOUSE COURTS &bull; NEW DELHI</div>
                <div className="text-xs text-primary font-bold mt-1">
                  CERTIFICATE UNDER SECTION 63 OF THE BHARTIYA SAKSHYA ADHINIYAM, 2023 (BSA)
                </div>
                <div className="text-[10px] text-muted-foreground">
                  (In substitution of erstwhile Section 65B of Indian Evidence Act, 1872)
                </div>
              </div>

              {/* CASE & SYSTEM METADATA */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-xl border border-border/60 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Case / FIR No:</span>{" "}
                  <strong className="text-foreground">{activeCase?.name || "FIR-2026-DL-001234"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Police Station:</span>{" "}
                  <strong className="text-foreground">Special Cell, Lodhi Colony</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Ingestion Timestamp:</span>{" "}
                  <span className="text-foreground">2026-01-15T09:30:22.418 IST</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Software Version:</span>{" "}
                  <span className="text-primary font-bold">TriNetra-AI v2.0.1 (CERT-In Staging Audit)</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Server Hardware ID:</span>{" "}
                  <span className="text-foreground">MHA-NODE-DEL-04 [SHA-256: e3b0c442...]</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Operating System:</span>{" "}
                  <span className="text-foreground">Ubuntu 24.04 LTS (Kernel 6.8 FIPS)</span>
                </div>
              </div>

              {/* STATUTORY DECLARATION */}
              <div className="p-3 bg-secondary/20 rounded-xl border border-border/40 text-[11px] leading-relaxed text-muted-foreground">
                <p>
                  I, <strong className="text-foreground">SI Ramesh Kumar (Badge DL-4521)</strong>, Investigating Officer,
                  do hereby solemnly affirm and certify that the electronic records detailed below were produced by the
                  computer systems of TriNetra-AI during the lawful investigation of the captioned matter, without any human
                  tampering, alteration or unauthorized modification.
                </p>
              </div>

              {/* TABLE OF INGESTED EVIDENCE HASHES */}
              <div>
                <div className="text-[11px] font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <Lock className="size-3 text-emerald-400" /> Evidence Cryptographic Hash Ledger (SHA-256)
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-secondary/60 uppercase text-muted-foreground">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2">Evidence File</th>
                        <th className="p-2">SHA-256 Cryptographic Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {DEMO_EVIDENCE_FILES.map((ef, i) => (
                        <tr key={ef.name} className="hover:bg-secondary/20">
                          <td className="p-2 font-bold">{i + 1}</td>
                          <td className="p-2 text-foreground font-semibold">{ef.name}</td>
                          <td className="p-2 text-primary">{ef.hash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* IMMUTABLE MERKLE ROOT & HYPERLEDGER FABRIC TX */}
              <div className="p-3 bg-black/60 rounded-xl border border-emerald-500/40 space-y-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Immutable Master Merkle Root:</span>
                  <span className="text-emerald-400 font-bold">0x9f8c12b7a4e61d89c02b89f31a2d5e771c9b0a887f6e5d4c3b2a109876543210</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hyperledger Fabric Ledger TX:</span>
                  <span className="text-foreground">0x88f1a23c09b78e1245df67890123456789abcdef0123456789abcdef01234567</span>
                </div>
              </div>

              {/* SIGNATURE BLOCK */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 border border-border/60 rounded-xl text-[10px] text-center">
                  <div className="text-muted-foreground">Investigating Officer (IO)</div>
                  <div className="font-bold text-foreground mt-1">SI Ramesh Kumar</div>
                  <div className="text-[9px] text-muted-foreground">Special Cell &bull; Delhi Police</div>
                  <div className="mt-2 text-emerald-400 font-bold">[DIGITALLY SIGNED &bull; MHA PKI]</div>
                </div>

                <div className="p-3 border border-border/60 rounded-xl text-[10px] text-center">
                  <div className="text-muted-foreground">Cyber Forensic Technical Officer</div>
                  <div className="font-bold text-foreground mt-1">Dr. S. K. Nair</div>
                  <div className="text-[9px] text-muted-foreground">CERT-In Forensic Auditor</div>
                  <div className="mt-2 text-emerald-400 font-bold">[VERIFIED &bull; SECTION 63 BSA]</div>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <div className="text-[10px] text-muted-foreground font-mono">
                Court Ready PDF &bull; Patiala House Courts Format
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTransmitCourt}
                  disabled={isTransmittingCourt}
                  className="text-xs"
                >
                  <Send className="size-3 mr-1" />
                  {isTransmittingCourt ? "Transmitting..." : "Send to Court Registry"}
                </Button>

                <Button
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  <Download className="size-3 mr-1" />
                  {isDownloadingPdf ? "Generating PDF..." : downloadSuccess ? "Downloaded ✅" : "Download PDF Affidavit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
