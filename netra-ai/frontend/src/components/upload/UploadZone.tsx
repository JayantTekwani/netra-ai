import { useRef, useState } from "react";
import { UploadCloud, X, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UploadedFile {
  name: string;
  size: number;
}

export function UploadZone({
  title,
  description,
  accept,
  files,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  accept: string;
  files: UploadedFile[];
  onAdd: (files: UploadedFile[]) => void;
  onRemove: (name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list) return;
    onAdd(Array.from(list).map((f) => ({ name: f.name, size: f.size })));
  };

  return (
    <section className="panel flex flex-col p-5">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files);
        }}
        className={`mt-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed px-4 py-10 text-center transition-colors duration-200 ${
          over ? "border-primary bg-primary/5" : "border-border-strong bg-surface-raised/50"
        }`}
      >
        <UploadCloud className={`size-7 ${over ? "text-primary" : "text-muted-foreground"}`} />
        <div className="text-sm text-muted-foreground">Drag and drop files here</div>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Choose File
        </Button>
        <div className="font-mono text-[11px] text-muted-foreground">Accepted: {accept}</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handle(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li
              key={f.name}
              className="flex items-center gap-3 rounded-md border border-border bg-surface-raised px-3 py-2"
            >
              <FileCheck2 className="size-4 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{f.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {(f.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                aria-label={`Remove ${f.name}`}
                onClick={() => onRemove(f.name)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
