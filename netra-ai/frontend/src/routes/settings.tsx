import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getSession } from "@/lib/session";

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
    <AppLayout title="Settings" subtitle="Prototype preferences — nothing here is persisted">
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
          <h2 className="text-sm font-semibold tracking-tight">Data Sources (prototype)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The interface reads from a local mock data layer. Backend, graph database and
            extraction pipeline endpoints will be configured here in a later phase.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { name: "Mock data layer", status: "Connected" },
              { name: "Graph database", status: "Not configured" },
              { name: "Extraction pipeline", status: "Not configured" },
            ].map((s) => (
              <div key={s.name} className="rounded-md border border-border bg-surface-raised p-4">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{s.status}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
