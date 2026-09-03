import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Cpu, CheckCircle2, Share2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { UploadZone, type UploadedFile } from "@/components/upload/UploadZone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { entities, relationships, supportingRecords } from "@/data/mock";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Data — त्रिनेत्र-AI Investigation Platform" },
      {
        name: "description",
        content:
          "Upload demo case documents, call detail records and financial records, then simulate an extraction run in the त्रिनेत्र-AI prototype.",
      },
      { property: "og:title", content: "Upload Data — त्रिनेत्र-AI Investigation Platform" },
      {
        property: "og:description",
        content: "Simulated ingestion of FIR, CDR and transaction files for demo analysis.",
      },
    ],
  }),
  component: UploadPage,
});

type Bucket = "fir" | "cdr" | "txn";

function UploadPage() {
  const [files, setFiles] = useState<Record<Bucket, UploadedFile[]>>({
    fir: [],
    cdr: [],
    txn: [],
  });
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);

  const total = files.fir.length + files.cdr.length + files.txn.length;

  const add = (b: Bucket) => (added: UploadedFile[]) =>
    setFiles((f) => ({
      ...f,
      [b]: [...f[b], ...added.filter((a) => !f[b].some((x) => x.name === a.name))],
    }));
  const remove = (b: Bucket) => (name: string) =>
    setFiles((f) => ({ ...f, [b]: f[b].filter((x) => x.name !== name) }));

  const analyze = () => {
    setPhase("processing");
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setPhase("done");
          toast.success("Analysis complete (mock)", {
            description: "Demo entities and relationships are ready in the workspace.",
          });
          return 100;
        }
        return p + 8;
      });
    }, 160);
  };

  const STAGES = [
    "Parsing uploaded documents",
    "Extracting entities (NLP stub)",
    "Resolving duplicates",
    "Building relationship graph",
  ];

  return (
    <AppLayout
      title="Upload Data"
      subtitle="Ingest demo records for entity and relationship extraction"
      actions={
        <Button onClick={analyze} disabled={phase === "processing"} size="lg">
          <Cpu className="size-4" />
          {phase === "processing" ? "Analyzing…" : "Analyze Case"}
        </Button>
      }
    >
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
                {total === 0
                  ? "No files staged — you can still run the demo analysis on the sample dataset."
                  : `${total} file${total === 1 ? "" : "s"} staged for the simulated extraction run.`}
              </p>
            </div>
            <Button onClick={analyze}>
              <Cpu className="size-4" /> Analyze Case
            </Button>
          </div>
        )}

        {phase === "processing" && (
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Processing (simulated)</h2>
            <Progress value={progress} className="mt-4" />
            <ul className="mt-4 space-y-2 text-sm">
              {STAGES.map((s, i) => {
                const active = progress > i * 25;
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
                { label: "Entities extracted", value: entities.length },
                { label: "Relationships built", value: relationships.length },
                { label: "Records indexed", value: supportingRecords.length },
                { label: "Clusters detected", value: 3 },
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
