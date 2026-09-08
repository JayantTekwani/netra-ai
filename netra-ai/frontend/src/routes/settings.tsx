import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getSession } from "@/lib/session";
import { useStore } from "@/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — त्रिनेत्र-AI Investigation Platform" },
      {
        name: "description",
        content:
          "Manage demo profile details, workspace preferences and prototype data-source configuration in त्रिनेत्र-AI.",
      },
      { property: "og:title", content: "Settings — त्रिनेत्र-AI Investigation Platform" },
      {
        property: "og:description",
        content: "Profile and workspace preferences for the त्रिनेत्र-AI prototype.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const user = getSession();
  const [prefs, setPrefs] = useState({
    labels: true,
    autoExpand: false,
    insights: true,
  });

  return (
    <AppLayout title="Settings" subtitle="Workspace configuration — preferences saved locally for this session">
      <div className="grid max-w-5xl grid-cols-2 gap-5">
        <section className="panel p-6">
          <h2 className="text-sm font-semibold tracking-tight">Investigator Profile</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="n">Name</Label>
              <Input id="n" defaultValue={user?.name ?? "Demo"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e">Email</Label>
              <Input id="e" defaultValue={user?.email ?? "investigator@trinetra.ai"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u">Unit</Label>
              <Input id="u" defaultValue="Demo Analysis Unit" />
            </div>
            <Button onClick={() => toast.success("Profile saved (mock)")}>Save Changes</Button>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-sm font-semibold tracking-tight">Workspace Preferences</h2>
          <div className="mt-4 space-y-5">
            {[
              { key: "labels", label: "Always show relationship labels", desc: "Render edge labels at all zoom levels." },
              { key: "autoExpand", label: "Auto-expand neighbours", desc: "Expand one hop when a node is selected." },
              { key: "insights", label: "Show AI-assisted insights", desc: "Display fictional demo observations panel." },
            ].map((p) => (
              <div key={p.key} className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
                <Switch
                  checked={prefs[p.key as keyof typeof prefs]}
                  onCheckedChange={(v) => setPrefs({ ...prefs, [p.key]: v })}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="panel col-span-2 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Intelligence Pipeline & Data Connectors</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Current operational status of ingested pipelines, AI models, and legal compliance vaults.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                useStore.getState().resetToDemoState();
                toast.success("Demo State Reset", {
                  description: "Investigation dataset restored to pristine benchmark state for demo filming.",
                });
              }}
              className="text-xs font-mono font-semibold border-primary/30 text-primary hover:bg-primary/10"
            >
              Reset Demo Baseline
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Indic-Soundex NLP", status: "Active (bi-LSTM IPA Model)", color: "text-green-400" },
              { name: "Heterogeneous Graph", status: "Connected (D3 In-Memory)", color: "text-green-400" },
              { name: "BSA Sec 63 Vault", status: "Enforced (SHA-256 Chain)", color: "text-green-400" },
              { name: "ADRIP Telco Gateway", status: "Operational (Sec 94 BNSS)", color: "text-green-400" },
            ].map((s) => (
              <div key={s.name} className="rounded-md border border-border bg-surface-raised p-3.5">
                <div className="text-xs font-medium text-foreground">{s.name}</div>
                <div className={`mt-1 font-mono text-[11px] font-semibold ${s.color}`}>{s.status}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
