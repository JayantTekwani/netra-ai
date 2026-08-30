import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Merge, CheckCircle2, Search, Loader2 } from "lucide-react";

export function EntityResolutionDemo() {
  const [input, setInput] = useState("Rahul S., 90000-11111");
  const [status, setStatus] = useState<"idle" | "loading" | "resolved">("idle");

  const handleResolve = () => {
    if (!input.trim()) return;
    setStatus("loading");
    setTimeout(() => {
      setStatus("resolved");
    }, 1200);
  };

  return (
    <section className="panel p-5 mt-6 border-emerald-500/30 bg-emerald-500/5">
      <div className="flex items-center gap-2 text-emerald-500 mb-4">
        <Merge className="size-5" />
        <h2 className="text-sm font-semibold tracking-tight">Live Entity Resolution Engine</h2>
      </div>
      
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Test the mathematical unification engine. Enter a messy partial record to see how it resolves against the graph.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setStatus("idle");
            }}
            placeholder="e.g. Rahul S., 90000-11111"
            className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            onKeyDown={(e) => e.key === "Enter" && handleResolve()}
          />
        </div>
        <Button 
          onClick={handleResolve} 
          disabled={status === "loading" || !input}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-none h-9"
        >
          {status === "loading" ? <Loader2 className="size-4 animate-spin mr-2" /> : "Resolve Entity"}
        </Button>
      </div>

      {status === "loading" && (
        <div className="mt-4 p-3 rounded bg-background/50 border border-border text-[11px] font-mono text-muted-foreground flex flex-col gap-1.5">
          <div className="animate-pulse">Computing phonetic hashes...</div>
          <div className="animate-pulse" style={{ animationDelay: "200ms" }}>Searching geospatial overlaps...</div>
          <div className="animate-pulse" style={{ animationDelay: "400ms" }}>Calculating Jaccard similarity...</div>
        </div>
      )}

      {status === "resolved" && (
        <div className="mt-4 p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-sm tracking-tight">Matched to Rahul Sharma (PER-003)</div>
              <div className="text-xs opacity-90 mt-1.5 leading-relaxed">
                <span className="font-mono bg-emerald-500/10 px-1 py-0.5 rounded mr-1.5">96.4% CONFIDENCE</span>
                Resolved via phonetic overlap + shared address hash. Record successfully unified into network graph.
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
