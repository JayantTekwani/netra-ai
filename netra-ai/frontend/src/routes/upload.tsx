import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Cpu, CheckCircle2, Share2, ArrowRight, FileText } from "lucide-react";
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
          "Ingest case text, call detail records and financial statements into active case graph.",
      },
      { property: "og:title", content: "Upload & Ingest Data — त्रिनेत्र-AI Platform" },
    ],
  }),
  component: UploadPage,
});

type Bucket = "fir" | "cdr" | "txn";

function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<Record<Bucket, UploadedFile[]>>({
    fir: [],
    cdr: [],
    txn: [],
  });
  const [rawInputText, setRawInputText] = useState("");
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);

  const activeCaseId = useStore((s) => s.activeCaseId);
  const activeCase = useStore((s) => s.cases.find((c) => c.id === activeCaseId));
  // Actions: use getState() at call-time — never subscribe to function refs
  const addExtractedDataForCase = (caseId: string, extracted: any) => useStore.getState().addExtractedDataForCase(caseId, extracted);
  
  const [resultCounts, setResultCounts] = useState({ e: 0, r: 0, rec: 0, c: 0 });

  const totalFiles = files.fir.length + files.cdr.length + files.txn.length;

  const add = (b: Bucket) => (added: UploadedFile[]) =>
    setFiles((f) => ({
      ...f,
      [b]: [...f[b], ...added.filter((a) => !f[b].some((x) => x.name === a.name))],
    }));
  const remove = (b: Bucket) => (name: string) =>
    setFiles((f) => ({ ...f, [b]: f[b].filter((x) => x.name !== name) }));

  // Read a File as text using FileReader
  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string ?? "");
      reader.onerror = reject;
      reader.readAsText(file);
    });

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

    // Attempt FastAPI backend call
    try {
      await axios.post("http://localhost:8000/api/ingest/fir", {
        case_id: activeCaseId,
        raw_text: rawInputText.trim() || `Uploaded: ${allFiles.map(f => f.name).join(", ")}`,
        source_document: "web_upload"
      }, { timeout: 1500 });
    } catch (e) {
      console.log("Backend offline — using local extractor.");
    }

    setProgress(30);

    // Read all uploaded file contents
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

    // Run extraction: one pass per file + one pass for raw text input
    let totalEntities = 0, totalRelationships = 0, totalInsights = 0;

    // Process each file separately so the extractor knows the filename for type detection
    for (const fc of fileContents) {
      const extracted = extractEntitiesFromText(fc.content, activeCaseId, fc.name);
      addExtractedDataForCase(activeCaseId, extracted);
      totalEntities += extracted.entities.length;
      totalRelationships += extracted.relationships.length;
      totalInsights += extracted.insights.length;
    }

    // Also process the raw text box if filled
    if (rawInputText.trim()) {
      const extracted = extractEntitiesFromText(rawInputText.trim(), activeCaseId, "raw_input.txt");
      addExtractedDataForCase(activeCaseId, extracted);
      totalEntities += extracted.entities.length;
      totalRelationships += extracted.relationships.length;
      totalInsights += extracted.insights.length;
    }

    // If no files AND no raw text resulted in anything — shouldn't happen now
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
      <div className="mb-6 panel p-5">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="size-5 text-primary" />
          <Label htmlFor="rawText" className="text-base font-semibold">
            Raw Text / Statement / FIR Notes (Instant Analysis Input)
          </Label>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Type or paste any investigative notes or statement text here (e.g. <em>"Rahul Sharma transferred ₹50,000 to Amit Verma in Jaipur"</em>). The NLP engine will dynamically extract entities specifically for <strong>{activeCase?.name || activeCaseId}</strong>.
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
                  <li
                    key={s}
                    className={active ? "text-foreground" : "text-muted-foreground/60"}
                  >
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
