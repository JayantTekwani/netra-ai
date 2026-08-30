import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
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
  const [email, setEmail] = useState("investigator@nexus.demo");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSession({ name: "Demo", email });
      navigate({ to: "/dashboard" });
    }, 600);
  };

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
            <div className="panel p-4 border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500 mb-2">Investigator Today</div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" /> 5 disconnected systems</li>
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" /> Manual cross-referencing</li>
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" /> 3 days per suspect</li>
              </ul>
            </div>
            <div className="panel p-4 border-emerald-500/30 bg-emerald-500/10 relative overflow-hidden">
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 mb-2">With NEXUS</div>
              <ul className="space-y-1.5 text-xs font-medium text-foreground">
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 1 unified search</li>
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto-linked evidence</li>
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Answers in minutes</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-md border border-border bg-surface/70 px-4 py-3 text-xs text-muted-foreground max-w-md">
            Prototype (SIH26189). Fictional demo data only — no real records, no real persons.
          </div>
        </div>

        <form onSubmit={submit} className="panel w-full max-w-md justify-self-end p-8">
          <h1 className="text-lg font-semibold tracking-tight">Authorized access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your demo investigator credentials.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? "Verifying…" : "Sign In"} <ArrowRight className="size-4" />
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Mock authentication — any credentials are accepted in this prototype.
          </p>
        </form>
      </div>
    </div>
  );
}
