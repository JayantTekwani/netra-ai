import { Link } from "@tanstack/react-router";
import { CalendarDays, Share2, Users, ArrowRight, Trash2 } from "lucide-react";
import type { InvestigationCase } from "@/data/types";
import { PriorityBadge, StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/store";
import { toast } from "sonner";

export function CaseCard({ item }: { item: InvestigationCase }) {
  // Use getState() directly for action functions — subscribing to them via
  // useStore() causes infinite re-renders because function refs change on every update.
  const setActiveCaseId = (id: string) => useStore.getState().setActiveCaseId(id);

  return (
    <article className="panel flex flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-muted-foreground">{item.id}</div>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">{item.name}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={item.status} />
          <PriorityBadge priority={item.priority} />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>

      <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="font-mono text-xs">{item.createdAt}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span className="font-mono text-xs">{item.entityCount || 0} entities</span>
        </div>
        <div className="flex items-center gap-2">
          <Share2 className="size-4 text-muted-foreground" />
          <span className="font-mono text-xs">{item.relationshipCount || 0} links</span>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">Lead: {item.lead}</span>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Delete Case"
              >
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Investigation Case</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <span className="font-semibold text-foreground">"{item.name}"</span> ({item.id})? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    useStore.getState().deleteCase(item.id);
                    toast.success(`Case ${item.id} deleted successfully`);
                  }}
                >
                  Delete Case
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button asChild size="sm" onClick={() => setActiveCaseId(item.id)}>
            <Link to="/investigation">
              Open Investigation <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
