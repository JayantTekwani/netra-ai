import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PlusCircle, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CaseCard } from "@/components/cases/CaseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store";
import type { CaseStatus } from "@/data/types";

const FILTERS: Array<{ value: CaseStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "under-review", label: "Under Review" },
  { value: "closed", label: "Closed" },
];

export const Route = createFileRoute("/cases/")({
  head: () => ({
    meta: [
      { title: "Cases — त्रिनेत्र-AI Investigation Platform" },
      {
        name: "description",
        content:
          "Browse, search and open fictional demo investigation cases with entity and relationship counts.",
      },
      { property: "og:title", content: "Cases — त्रिनेत्र-AI Investigation Platform" },
      {
        property: "og:description",
        content: "Search and open demo investigation cases in the त्रिनेत्र-AI prototype.",
      },
    ],
  }),
  component: CasesPage,
});

function CasesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CaseStatus | "all">("all");
  const cases = useStore((s) => s.cases);

  const filtered = useMemo(
    () =>
      cases.filter((c) => {
        const matchesQuery = (c.name + c.id + c.description)
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesQuery && (status === "all" || c.status === status);
      }),
    [query, status],
  );

  return (
    <AppLayout
      title="Cases"
      subtitle="All demo investigations assigned to this workspace"
      actions={
        <Button asChild>
          <Link to="/cases/new">
            <PlusCircle className="size-4" /> Create New Case
          </Link>
        </Button>
      }
    >
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search cases by name, ID or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                status === f.value
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto font-mono text-xs text-muted-foreground">
          {filtered.length} of {cases.length} cases
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-5">
        {filtered.map((c) => (
          <CaseCard key={c.id} item={c} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          No demo cases match this search.
        </p>
      )}
    </AppLayout>
  );
}
