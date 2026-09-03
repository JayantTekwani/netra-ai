import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/cases/new")({
  head: () => ({
    meta: [
      { title: "Create Case — त्रिनेत्र-AI Investigation Platform" },
      {
        name: "description",
        content:
          "Register a new fictional demo investigation case with priority, status and description in त्रिनेत्र-AI.",
      },
      { property: "og:title", content: "Create Case — त्रिनेत्र-AI Investigation Platform" },
      {
        property: "og:description",
        content: "Register a new demo investigation case in the त्रिनेत्र-AI prototype.",
      },
    ],
  }),
  component: CreateCasePage,
});

function CreateCasePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    caseId: `CASE-${Math.floor(2060 + Math.random() * 40)}`,
    description: "",
    date: new Date().toISOString().slice(0, 10),
    priority: "medium",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Case created (mock)", {
        description: `${form.caseId} — ${form.name || "Untitled case"} was registered in the demo workspace.`,
      });
      navigate({ to: "/cases" });
    }, 700);
  };

  return (
    <AppLayout
      title="Create New Case"
      subtitle="Register a new demo investigation in the workspace"
      actions={
        <Button variant="outline" onClick={() => navigate({ to: "/cases" })}>
          <ArrowLeft className="size-4" /> Back to Cases
        </Button>
      }
    >
      <form onSubmit={submit} className="panel max-w-3xl space-y-5 p-6">
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="name">Case Name</Label>
            <Input
              id="name"
              required
              placeholder="e.g. Operation Meridian"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caseId">Case ID</Label>
            <Input
              id="caseId"
              required
              className="font-mono"
              value={form.caseId}
              onChange={(e) => setForm({ ...form, caseId: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            placeholder="Short summary of the fictional investigation scope…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">
            Mock action — no data is persisted in this prototype.
          </p>
          <Button type="submit" disabled={saving}>
            <Check className="size-4" /> {saving ? "Creating…" : "Create Case"}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
