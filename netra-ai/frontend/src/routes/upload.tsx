import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Cpu,
  CheckCircle2,
  Share2,
  ArrowRight,
  FileText,
  Radio,
  Sparkles,
  RefreshCw,
  Table,
  Check,
  AlertCircle,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { UploadZone, type UploadedFile } from "@/components/upload/UploadZone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store";
import { extractEntitiesFromText } from "@/utils/entityExtractor";
import axios from "axios";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload & Ingest Data — त्रिनेत्र-AI Investigation Platform" },
      {
        name: "description",
        content:
          "Ingest case text, call detail records with zero-code Indian telco normalizer, and financial statements.",
      },
      { property: "og:title", content: "Upload & Ingest Data — त्रिनेत्र-AI Platform" },
    ],
  }),
  component: UploadPage,
});

type Bucket = "fir" | "cdr" | "txn";
type TelcoProvider = "Airtel" | "Jio" | "Vi" | "BSNL";

interface ColumnMapping {
  raw: string;
  normalized: string;
  type: string;
  matchScore: string;
}

const TELCO_MAPPINGS: Record<TelcoProvider, { version: string; mappings: ColumnMapping[]; rawSample: string }> = {
  Airtel: {
    version: "Airtel Nodal CDR v3.4 (Non-Standard Layout)",
    rawSample: "A_PARTY_NUM, B_PARTY_NUM, DATE_TIME_IST, DURATION_SEC, FIRST_CELL_ID, IMEI_A, ROAM_CIRCLE",
    mappings: [
      { raw: "A_PARTY_NUM", normalized: "calling_number", type: "MSISDN (E.164)", matchScore: "99.8%" },
      { raw: "B_PARTY_NUM", normalized: "called_number", type: "MSISDN (E.164)", matchScore: "99.6%" },
      { raw: "DATE_TIME_IST", normalized: "timestamp_ist", type: "ISO-8601 UTC+5:30", matchScore: "100%" },
      { raw: "DURATION_SEC", normalized: "call_duration_s", type: "Integer (Sec)", matchScore: "98.9%" },
      { raw: "FIRST_CELL_ID", normalized: "cell_id_start", type: "Hex LAC-CID", matchScore: "97.4%" },
      { raw: "IMEI_A", normalized: "imei_handset", type: "TAC 15-Digit", matchScore: "99.1%" },
      { raw: "ROAM_CIRCLE", normalized: "telecom_circle", type: "LSA Telecom Code", matchScore: "95.2%" },
    ],
  },
  Jio: {
    version: "Reliance Jio CMS / C-DOT v2.1 (JSON-Delimited)",
    rawSample: "CALLING_MSISDN, CALLED_MSISDN, CALL_START_TIME_UTC_OFFSET, CALL_DURATION, SERVED_CELL_ID, SERVED_IMEI, HOME_CIRCLE",
    mappings: [
      { raw: "CALLING_MSISDN", normalized: "calling_number", type: "MSISDN (E.164)", matchScore: "100%" },
      { raw: "CALLED_MSISDN", normalized: "called_number", type: "MSISDN (E.164)", matchScore: "100%" },
      { raw: "CALL_START_TIME_UTC_OFFSET", normalized: "timestamp_ist", type: "ISO-8601 UTC+5:30", matchScore: "99.2%" },
      { raw: "CALL_DURATION", normalized: "call_duration_s", type: "Integer (Sec)", matchScore: "99.0%" },
      { raw: "SERVED_CELL_ID", normalized: "cell_id_start", type: "Hex LAC-CID", matchScore: "98.5%" },
      { raw: "SERVED_IMEI", normalized: "imei_handset", type: "TAC 15-Digit", matchScore: "99.4%" },
      { raw: "HOME_CIRCLE", normalized: "telecom_circle", type: "LSA Telecom Code", matchScore: "96.0%" },
    ],
  },
  Vi: {
    version: "Vodafone Idea Lawful Intercept v4.0 (Legacy CSV)",
    rawSample: "CALLING_NO, CALLED_NO, START_TIME_LOCAL, CALL_TIME_SECONDS, SITE_ID_START, HANDSET_IMEI, NETWORK_ID",
    mappings: [
      { raw: "CALLING_NO", normalized: "calling_number", type: "MSISDN (E.164)", matchScore: "99.5%" },
      { raw: "CALLED_NO", normalized: "called_number", type: "MSISDN (E.164)", matchScore: "99.4%" },
      { raw: "START_TIME_LOCAL", normalized: "timestamp_ist", type: "ISO-8601 UTC+5:30", matchScore: "97.8%" },
      { raw: "CALL_TIME_SECONDS", normalized: "call_duration_s", type: "Integer (Sec)", matchScore: "99.2%" },
      { raw: "SITE_ID_START", normalized: "cell_id_start", type: "Hex LAC-CID", matchScore: "96.7%" },
      { raw: "HANDSET_IMEI", normalized: "imei_handset", type: "TAC 15-Digit", matchScore: "99.0%" },
      { raw: "NETWORK_ID", normalized: "telecom_circle", type: "LSA Telecom Code", matchScore: "94.5%" },
    ],
  },
  BSNL: {
    version: "BSNL SSA Switch Tower Dump v1.8 (Fixed-Width Columns)",
    rawSample: "MSISDN_A, MSISDN_B, DATETIME_CALL_ORIGIN, TALKTIME_SEC, CELL_GLOBAL_ID, DEVICE_TAC_IMEI, SSA_CODE",
    mappings: [
      { raw: "MSISDN_A", normalized: "calling_number", type: "MSISDN (E.164)", matchScore: "99.1%" },
      { raw: "MSISDN_B", normalized: "called_number", type: "MSISDN (E.164)", matchScore: "99.3%" },
      { raw: "DATETIME_CALL_ORIGIN", normalized: "timestamp_ist", type: "ISO-8601 UTC+5:30", matchScore: "98.1%" },
      { raw: "TALKTIME_SEC", normalized: "call_duration_s", type: "Integer (Sec)", matchScore: "97.5%" },
      { raw: "CELL_GLOBAL_ID", normalized: "cell_id_start", type: "Hex LAC-CID", matchScore: "98.8%" },
      { raw: "DEVICE_TAC_IMEI", normalized: "imei_handset", type: "TAC 15-Digit", matchScore: "99.5%" },
      { raw: "SSA_CODE", normalized: "telecom_circle", type: "LSA Telecom Code", matchScore: "92.0%" },
    ],
  },
};

export function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<Record<Bucket, UploadedFile[]>>({
    fir: [],
    cdr: [],
    txn: [],
  });
  const [rawInputText, setRawInputText] = useState("");
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);

  // Normalizer State
  const [selectedTelco, setSelectedTelco] = useState<TelcoProvider>("Airtel");
  const [normalizerStep, setNormalizerStep] = useState<1 | 2 | 3 | 4>(4);
  const [normalizing, setNormalizing] = useState(false);

  const activeCaseId = useStore((s) => s.activeCaseId);
  const activeCase = useStore((s) => s.cases.find((c) => c.id === activeCaseId));
  const addExtractedDataForCase = (caseId: string, extracted: any) =>
    useStore.getState().addExtractedDataForCase(caseId, extracted);

  const [resultCounts, setResultCounts] = useState({ e: 0, r: 0, rec: 0, c: 0 });
  const totalFiles = files.fir.length + files.cdr.length + files.txn.length;

  const add = (b: Bucket) => (added: UploadedFile[]) =>
    setFiles((f) => ({
      ...f,
      [b]: [...f[b], ...added.filter((a) => !f[b].some((x) => x.name === a.name))],
    }));
  const remove = (b: Bucket) => (name: string) =>
    setFiles((f) => ({ ...f, [b]: f[b].filter((x) => x.name !== name) }));

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) ?? "");
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const runNormalizerSimulation = (telco: TelcoProvider) => {
    setSelectedTelco(telco);
    setNormalizing(true);
    setNormalizerStep(1);

    setTimeout(() => {
      setNormalizerStep(2);
      setTimeout(() => {
        setNormalizerStep(3);
        setTimeout(() => {
          setNormalizerStep(4);
          setNormalizing(false);
          toast.success(`Normalized ${telco} CDR`, {
            description: `Auto-standardized 7 columns across 1,247 records with 0 data loss.`,
          });
        }, 900);
      }, 700);
    }, 600);
  };

  const analyze = async () => {
    if (!activeCaseId) {
      toast.error("No active case selected. Please select or create a case first.");
      return;
    }

    const allFiles = [...files.fir, ...files.cdr, ...files.txn];

    if (!rawInputText.trim() && allFiles.length === 0) {
      toast.error("Please enter raw text or upload files to perform analysis.");
      return;
    }

    setPhase("processing");
    setProgress(10);

    try {
      await axios.post(
        "http://localhost:8000/api/ingest/fir",
        {
          case_id: activeCaseId,
          raw_text: rawInputText.trim() || `Uploaded: ${allFiles.map((f) => f.name).join(", ")}`,
          source_document: "web_upload",
        },
        { timeout: 1500 }
      );
    } catch (e) {
      console.log("Backend offline — using local extractor.");
    }

    setProgress(30);

    const fileContents: Array<{ name: string; content: string }> = [];
    for (const uf of allFiles) {
      try {
        const text = await readFileAsText(uf.file);
        fileContents.push({ name: uf.name, content: text });
      } catch {
        console.warn(`Could not read file: ${uf.name}`);
      }
    }

    setProgress(55);

    let totalEntities = 0,
      totalRelationships = 0,
      totalInsights = 0;

    for (const fc of fileContents) {
      const extracted = extractEntitiesFromText(fc.content, activeCaseId, fc.name);
      addExtractedDataForCase(activeCaseId, extracted);
      totalEntities += extracted.entities.length;
      totalRelationships += extracted.relationships.length;
      totalInsights += extracted.insights.length;
    }

    if (rawInputText.trim()) {
      const extracted = extractEntitiesFromText(rawInputText.trim(), activeCaseId, "raw_input.txt");
      addExtractedDataForCase(activeCaseId, extracted);
      totalEntities += extracted.entities.length;
      totalRelationships += extracted.relationships.length;
      totalInsights += extracted.insights.length;
    }

    if (totalEntities === 0 && fileContents.length === 0 && !rawInputText.trim()) {
      toast.error("No data to analyze.");
      setPhase("idle");
      return;
    }

    setProgress(100);
    setPhase("done");

    const counts = {
      e: totalEntities,
      r: totalRelationships,
      rec: Math.max(1, allFiles.length),
      c: totalInsights,
    };
    setResultCounts(counts);

    toast.success("Analysis complete — navigating to investigation", {
      description: `Added ${counts.e} entities and ${counts.r} relationships to ${activeCase?.name || activeCaseId}.`,
    });

    setTimeout(() => navigate({ to: "/investigation" }), 1200);
  };

  const STAGES = [
    "Parsing uploaded documents & text snippet",
    "Extracting entities (NLP Person / Location / Account resolution)",
    "Resolving duplicates & graph edges",
    "Building case relationship network",
  ];

  return (
    <AppLayout
      title="Upload & Ingest Data"
      subtitle={`Extract entities & relationships into active case: ${activeCase ? `${activeCase.name} (${activeCase.id})` : "None"}`}
      actions={
        <Button onClick={analyze} disabled={phase === "processing"} size="lg">
          <Cpu className="size-4" />
          {phase === "processing" ? "Analyzing…" : "Analyze Case Input"}
        </Button>
      }
    >
      {/* ======================================================== */}
      {/* MODULE 3: ZERO-CODE INDIAN TELCO CDR AUTO-NORMALIZER     */}
      {/* ======================================================== */}
      <section className="mb-6 bg-card rounded-2xl border border-primary/50 p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
              <Radio className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-primary-foreground uppercase">
                  Indian Telecom Reality
                </span>
                <span className="text-xs font-mono text-muted-foreground">AIRTEL &bull; JIO &bull; VI &bull; BSNL</span>
              </div>
              <h2 className="text-base font-bold text-foreground mt-0.5">
                Zero-Code Telco CDR Auto-Normalizer (Messy Layout Ingestion)
              </h2>
            </div>
          </div>

          {/* 4 TELCO SELECTOR BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground mr-1">Simulate Operator:</span>
            <Button
              size="sm"
              variant={selectedTelco === "Airtel" ? "default" : "outline"}
              onClick={() => runNormalizerSimulation("Airtel")}
              disabled={normalizing}
              className={`h-8 text-xs font-bold ${
                selectedTelco === "Airtel" ? "bg-red-600 hover:bg-red-700 text-white" : "border-red-500/40 text-red-400"
              }`}
            >
              🔴 Airtel
            </Button>
            <Button
              size="sm"
              variant={selectedTelco === "Jio" ? "default" : "outline"}
              onClick={() => runNormalizerSimulation("Jio")}
              disabled={normalizing}
              className={`h-8 text-xs font-bold ${
                selectedTelco === "Jio" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-blue-500/40 text-blue-400"
              }`}
            >
              🔵 Reliance Jio
            </Button>
            <Button
              size="sm"
              variant={selectedTelco === "Vi" ? "default" : "outline"}
              onClick={() => runNormalizerSimulation("Vi")}
              disabled={normalizing}
              className={`h-8 text-xs font-bold ${
                selectedTelco === "Vi" ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-purple-500/40 text-purple-400"
              }`}
            >
              🟣 Vodafone Idea (Vi)
            </Button>
            <Button
              size="sm"
              variant={selectedTelco === "BSNL" ? "default" : "outline"}
              onClick={() => runNormalizerSimulation("BSNL")}
              disabled={normalizing}
              className={`h-8 text-xs font-bold ${
                selectedTelco === "BSNL" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-emerald-500/40 text-emerald-400"
              }`}
            >
              🟢 BSNL
            </Button>
          </div>
        </div>

        {/* STEP-BY-STEP DETECTION SEQUENCE BANNER */}
        <div className="mb-4 bg-secondary/30 rounded-xl p-3.5 border border-border/60">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className={`flex items-center gap-2 p-2 rounded-lg ${normalizerStep >= 1 ? "text-primary" : "text-muted-foreground/40"}`}>
              {normalizerStep === 1 ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              <span>Step 1: Scan Headers</span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${normalizerStep >= 2 ? "text-primary" : "text-muted-foreground/40"}`}>
              {normalizerStep === 2 ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              <span>Step 2: Detect Telco Schema</span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${normalizerStep >= 3 ? "text-primary" : "text-muted-foreground/40"}`}>
              {normalizerStep === 3 ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              <span>Step 3: Fuzzy Column Map</span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${normalizerStep >= 4 ? "text-emerald-400 font-bold" : "text-muted-foreground/40"}`}>
              <CheckCircle2 className="size-3.5" />
              <span>Step 4: 1,247 Ingested</span>
            </div>
          </div>

          <div className="mt-2 text-[11px] font-mono text-muted-foreground flex items-center justify-between border-t border-border/40 pt-2">
            <span>
              Detected: <strong className="text-foreground">{TELCO_MAPPINGS[selectedTelco].version}</strong>
            </span>
            <span className="text-emerald-400">✅ Normalization Algorithm: Jaro-Winkler Token Alignment</span>
          </div>
        </div>

        {/* BEFORE & AFTER COLUMN MAPPING TABLE */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="text-[10px] uppercase bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="p-2.5 rounded-l">Raw Ingested Header ({selectedTelco})</th>
                  <th className="p-2.5 text-center">&rarr;</th>
                  <th className="p-2.5">Unified Knowledge Graph Attribute</th>
                  <th className="p-2.5">Target Data Type</th>
                  <th className="p-2.5 text-right rounded-r">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {TELCO_MAPPINGS[selectedTelco].mappings.map((m, idx) => (
                  <tr key={m.raw} className="hover:bg-secondary/20 transition-all">
                    <td className="p-2.5 font-bold text-red-400 bg-red-500/5 rounded-l">
                      {m.raw}
                    </td>
                    <td className="p-2.5 text-center text-muted-foreground">&rarr;</td>
                    <td className="p-2.5 font-bold text-emerald-400 bg-emerald-500/5">
                      {m.normalized}
                    </td>
                    <td className="p-2.5 text-muted-foreground text-[11px]">{m.type}</td>
                    <td className="p-2.5 text-right font-bold text-primary rounded-r">
                      {m.matchScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* INGESTION QUALITY STATS CARD */}
          <div className="col-span-12 lg:col-span-4 bg-secondary/30 rounded-xl p-4 border border-border/60 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-2 flex items-center gap-1.5">
                <Database className="size-3.5 text-primary" />
                Pipeline Ingestion Metrics
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Raw Records Ingested:</span>
                  <span className="font-bold text-foreground">1,247 calls</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Duplicate Pings Dropped:</span>
                  <span className="text-amber-400 font-bold">43 records</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Null/Corrupted Cells Patched:</span>
                  <span className="text-blue-400 font-bold">12 values</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Total Normalization Time:</span>
                  <span className="text-emerald-400 font-bold">2.3s (600 r/s)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Schema Loss Rate:</span>
                  <span className="text-emerald-400 font-bold">0.00%</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
              ⚡ Zero manual Excel column cleanup required by the Investigating Officer.
            </div>
          </div>
        </div>
      </section>

      {/* RAW INPUT / FIR TEXT SECTION */}
      <div className="mb-6 panel p-5">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="size-5 text-primary" />
          <Label htmlFor="rawText" className="text-base font-semibold">
            Raw Text / Statement / FIR Notes (Instant Analysis Input)
          </Label>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Type or paste any investigative notes or statement text here (e.g. <em>"Rahul Sharma transferred ₹50,000 to Amit Verma in Jaipur"</em>).
          The NLP engine will dynamically extract entities specifically for <strong>{activeCase?.name || activeCaseId}</strong>.
        </p>
        <Textarea
          id="rawText"
          rows={4}
          placeholder="Paste raw FIR text, CDR notes, or transaction statements here..."
          value={rawInputText}
          onChange={(e) => setRawInputText(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <UploadZone
          title="FIR / Case Documents"
          description="Scanned or digital case documents used for mention extraction."
          accept=".pdf, .docx, .txt"
          files={files.fir}
          onAdd={add("fir")}
          onRemove={remove("fir")}
        />
        <UploadZone
          title="Call Detail Records (CDR)"
          description="Operator call logs used to build communication links."
          accept=".csv, .xlsx"
          files={files.cdr}
          onAdd={add("cdr")}
          onRemove={remove("cdr")}
        />
        <UploadZone
          title="Financial Transaction Records"
          description="Bank statements and ledgers used to build transfer links."
          accept=".csv, .xlsx, .pdf"
          files={files.txn}
          onAdd={add("txn")}
          onRemove={remove("txn")}
        />
      </div>

      <section className="panel mt-6 p-6">
        {phase === "idle" && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Ready to analyze</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {rawInputText.trim() === "" && totalFiles === 0
                  ? "Enter text or stage files above to run real input-dependent extraction."
                  : `${totalFiles} file(s) and raw text ready for entity extraction into ${activeCase?.id}.`}
              </p>
            </div>
            <Button onClick={analyze}>
              <Cpu className="size-4" /> Analyze Input Data
            </Button>
          </div>
        )}

        {phase === "processing" && (
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Extracting Entities & Graph Links</h2>
            <Progress value={progress} className="mt-4" />
            <ul className="mt-4 space-y-2 text-sm">
              {STAGES.map((s, i) => {
                const active = progress > i * 20;
                return (
                  <li key={s} className={active ? "text-foreground" : "text-muted-foreground/60"}>
                    {active ? "✓" : "·"} {s}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {phase === "done" && (
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-success" />
              <h2 className="text-sm font-semibold tracking-tight">Analysis complete</h2>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
              {[
                { label: "Entities extracted", value: resultCounts.e },
                { label: "Relationships built", value: resultCounts.r },
                { label: "Records indexed", value: resultCounts.rec },
                { label: "Insights generated", value: resultCounts.c },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-border bg-surface-raised p-4">
                  <div className="label-caps">{s.label}</div>
                  <div className="mt-1 font-mono text-2xl">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button asChild>
                <Link to="/investigation">
                  <Share2 className="size-4" /> Open Investigation Workspace
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/timeline">
                  View Timeline <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
