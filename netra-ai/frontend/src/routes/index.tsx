import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Lock, Mail, ArrowRight, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS — Investigation Intelligence Platform" },
      {
        name: "description",
        content:
          "NEXUS prototype sign-in: an investigation intelligence platform for exploring relationships across fictional demo case data.",
      },
      { property: "og:title", content: "NEXUS — Investigation Intelligence Platform" },
      {
        property: "og:description",
        content: "Prototype sign-in for the NEXUS criminal network analysis demo.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-50" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
      />

      <div className="relative grid w-full max-w-5xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
              <ShieldCheck className="size-7 text-primary" />
            </div>
            <div>
              <div className="font-mono text-4xl font-semibold tracking-[0.28em]">NEXUS</div>
              <div className="mt-1 text-sm uppercase tracking-[0.22em] text-muted-foreground">
                Investigation Intelligence Platform
              </div>
            </div>
          </div>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">
            Explore relationships between entities extracted from case documents, call records,
            financial records and location data — in a single analytical workspace.
          </p>
          
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-background border border-border z-10">
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
            <div className="panel p-4 border-border bg-surface-raised relative overflow-hidden">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Investigator Today</div>
              <ul className="space-y-1.5 text-xs text-muted-foreground/80 font-mono">
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" /> 5 disconnected systems</li>
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" /> Manual cross-referencing</li>
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" /> 3 days per suspect</li>
              </ul>
            </div>
            <div className="panel p-4 border-border bg-accent/10 relative overflow-hidden">
              <div className="text-[10px] uppercase font-bold tracking-wider text-accent mb-2">With NEXUS</div>
              <ul className="space-y-1.5 text-xs font-medium font-mono text-accent/80">
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> 1 unified search</li>
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Auto-linked evidence</li>
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Answers in minutes</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-md border border-border bg-surface/70 px-4 py-3 text-xs text-muted-foreground max-w-md">
            Prototype (SIH26189). Fictional demo data only — no real records, no real persons.
          </div>
        </div>

        <div className="panel w-full max-w-md justify-self-end p-8 flex flex-col items-center text-center">
          <div className="relative size-32 mb-6">
            <div className={`absolute inset-0 rounded-full border-2 transition-colors duration-500 ${loading ? 'border-accent' : 'border-border'}`}></div>
            {loading && <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-20"></div>}
            <div className="absolute inset-2 rounded-full border border-dashed border-muted-foreground/30" style={{ animation: 'spin 12s linear infinite' }}></div>
            <div className="absolute inset-0 flex items-center justify-center bg-surface-raised rounded-full z-10">
              <ScanFace className={`size-12 transition-colors duration-500 ${loading ? 'text-accent' : 'text-muted-foreground'}`} />
            </div>
            {loading && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-accent/80 z-20 rounded-full shadow-[0_0_10px_var(--color-accent)]" style={{ animation: 'scan 2s ease-in-out infinite alternate' }}></div>
            )}
          </div>
          
          <h1 className="text-lg font-semibold tracking-tight">
            {loading ? "Authenticating Identity..." : "Restricted Area"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground h-10">
            {loading ? "Matching cranial features against clearance database. Please remain still." : "Level 5 clearance required. Initiate biometric facial scan to proceed."}
          </p>

          <Button 
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setSession({ name: "Investigator", email: "biometric@nexus" });
                navigate({ to: "/dashboard" });
              }, 2500);
            }} 
            className="mt-6 w-full group relative overflow-hidden" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">Scanning <span className="animate-pulse">...</span></span>
            ) : (
              <span className="flex items-center gap-2">Initiate Scan <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" /></span>
            )}
          </Button>
          
          <div className="mt-6 flex justify-between w-full text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-t border-border pt-4">
            <span>Terminal: NX-94</span>
            <span className={loading ? "text-accent animate-pulse" : ""}>Status: {loading ? "Active" : "Locked"}</span>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
