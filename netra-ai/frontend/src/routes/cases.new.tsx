import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, FileText } from "lucide-react";
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
import { useStore } from "@/store";
import { extractEntitiesFromText } from "@/utils/entityExtractor";
import type { CasePriority, CaseStatus } from "@/data/types";

export const Route = createFileRoute("/cases/new")({
  head: () => ({
    meta: [
      { title: "Create Case — त्रिनेत्र-AI Investigation Platform" },
      {
        name: "description",
        content:
          "Register a new investigation case with priority, status and initial statements in त्रिनेत्र-AI.",
      },
      { property: "og:title", content: "Create Case — त्रिनेत्र-AI Platform" },
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
    initialText: "",
    date: new Date().toISOString().slice(0, 10),
    priority: "medium" as CasePriority,
    status: "active" as CaseStatus,
  });
  const [saving, setSaving] = useState(false);
  
  // Actions: use getState() at call-time — never subscribe to function refs
  const addCase = (c: any) => useStore.getState().addCase(c);
  const setActiveCaseId = (id: string) => useStore.getState().setActiveCaseId(id);
  const addExtractedDataForCase = (caseId: string, extracted: any) => useStore.getState().addExtractedDataForCase(caseId, extracted);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a case name.");
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);

      // Create new clean case
      const newCase = {
        id: form.caseId,
        name: form.name.trim(),
        description: form.description.trim() || "No description provided.",
        status: form.status,
        priority: form.priority,
        createdAt: form.date,
        entityCount: 0,
        relationshipCount: 0,
        lead: "You",
      };

      addCase(newCase);
      setActiveCaseId(form.caseId);

      if (form.initialText.trim()) {
        const extracted = extractEntitiesFromText(form.initialText, form.caseId);
        addExtractedDataForCase(form.caseId, extracted);
        toast.success(`Case created with ${extracted.entities.length} extracted entities`, {
          description: `${form.caseId} — ${form.name} is now active. Open it from Cases to investigate.`,
        });
      } else {
        toast.success("Case created successfully", {
          description: `${form.caseId} — ${form.name} is now active. Add data via Upload to populate the graph.`,
        });
      }

      navigate({ to: "/cases" });
    }, 200);
  };

  return (
    <AppLayout
      title="Create New Case"
      subtitle="Register a new investigation workspace with isolated data layer"
      actions={
        <Button variant="outline" onClick={() => navigate({ to: "/cases" })}>
          <ArrowLeft className="size-4" /> Back to Cases
        </Button>
      }
    >
      <form onSubmit={submit} className="panel max-w-3xl space-y-5 p-6">
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="name">Case Name *</Label>
            <Input
              id="name"
              required
              placeholder="e.g. Case Alpha / Jaipur Operation"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caseId">Case ID *</Label>
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
          <Label htmlFor="description">Scope / Description</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Short summary of the investigation scope…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <Label htmlFor="initialText" className="font-semibold">
              Initial Statement / Intelligence Input (Optional)
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            If provided, entities mentioned in this statement (e.g. <em>"Rahul Sharma transferred ₹50,000 to Amit Verma in Jaipur"</em>) will be extracted immediately for this case. Leave blank to start with a 0-entity clean case.
          </p>
          <Textarea
            id="initialText"
            rows={3}
            placeholder="Optional raw text snippet to extract initial entities..."
            value={form.initialText}
            onChange={(e) => setForm({ ...form, initialText: e.target.value })}
            className="font-mono text-xs"
          />
        </div>

        <div className="grid grid-cols-3 gap-5 border-t border-border pt-4">
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
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as CasePriority })}>
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
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CaseStatus })}>
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
            Data will be persisted locally to browser storage.
          </p>
          <Button type="submit" disabled={saving}>
            <Check className="size-4" /> {saving ? "Creating…" : "Create & Open Case"}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
