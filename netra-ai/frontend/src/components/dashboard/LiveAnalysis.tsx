import { useState } from "react";
import { Activity, Zap } from "lucide-react";
import { Entity, Relationship } from "@/data/types";
import { buildGraph, calculateEigenvectorCentrality } from "@/lib/algorithms";
import { Button } from "@/components/ui/button";

export function LiveAnalysis({ entities, relationships }: { entities: Entity[], relationships: Relationship[] }) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<{id: string, label: string, score: number}[] | null>(null);
  const [timeMs, setTimeMs] = useState(0);

  const runAnalysis = () => {
    setIsCalculating(true);
    setResults(null);
    const start = performance.now();
    
    // Slight timeout to let UI update and show "calculating..."
    setTimeout(() => {
      const graph = buildGraph(relationships);
      const centrality = calculateEigenvectorCentrality(graph);
      
      const sorted = Object.entries(centrality)
        .map(([id, score]) => ({
          id,
          score,
          label: entities.find(e => e.id === id)?.label || id
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // top 5 targets
        
      setResults(sorted);
      setTimeMs(Math.round(performance.now() - start));
      setIsCalculating(false);
    }, 400);
  };

  return (
    <section className="panel col-span-1 lg:col-span-3 p-5 border-accent/20 bg-accent/5">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Zap className="size-4 text-accent" />
            Live Mathematical Threat Engine
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Calculates Eigenvector Centrality in real-time across {relationships.length} edges to identify high-value operational nodes.
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={isCalculating} variant="outline" className="text-xs bg-accent/10 hover:bg-accent/20 text-accent border-accent/30">
          {isCalculating ? "Computing..." : "Run Power Iteration"}
        </Button>
      </div>
      
      <div className="mt-4">
        {isCalculating && (
          <div className="py-8 text-center text-xs font-mono text-muted-foreground animate-pulse">
            Constructing adjacency matrix...
          </div>
        )}
        
        {results && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-[10px] uppercase text-accent font-mono mb-2">Analysis Complete • {timeMs}ms</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {results.map((res, i) => (
                <div key={res.id} className="bg-background rounded-md border border-border p-3">
                  <div className="text-[10px] text-muted-foreground mb-1 uppercase font-mono">Rank {i + 1}</div>
                  <div className="font-semibold text-sm truncate">{res.label}</div>
                  <div className="text-xs text-accent mt-2 font-mono">Score: {res.score.toFixed(4)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!results && !isCalculating && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Awaiting execution...
          </div>
        )}
      </div>
    </section>
  );
}
