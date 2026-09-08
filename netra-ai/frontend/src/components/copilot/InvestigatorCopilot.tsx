import { useState, useRef, useEffect } from "react";
import { useStore } from "@/store";
import { useNavigate } from "@tanstack/react-router";
import {
  queryInvestigatorCopilot,
  type CopilotResponse,
  type CopilotEntityLink,
} from "@/lib/investigatorCopilotEngine";
import { SupportingRecordsDialog } from "@/components/investigation/SupportingRecordsDialog";
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  FileText,
  Shield,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Maximize2,
  Minimize2,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  content: string;
  entities?: CopilotEntityLink[];
  evidenceRecordIds?: string[];
  evidenceLabel?: string;
  timestamp: string;
  suggestedFollowups?: string[];
}

const QUICK_PROMPTS = [
  "Who is the key entity?",
  "Why was this entity flagged?",
  "Show supporting evidence",
  "Find common connections",
  "Summarize the case",
];

export function InvestigatorCopilot({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const storeState = useStore();
  const activeCaseId = storeState.activeCaseId;
  const activeCase = storeState.cases.find((c) => c.id === activeCaseId);

  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-1",
      sender: "copilot",
      content:
        `Investigator Copilot active for **${activeCase?.name || activeCaseId} (${activeCaseId})**.\n\n` +
        `I am grounded strictly in the synthetic case dossier (calls, financial ledgers, tower co-locations, and FIR extracts). Ask any question about suspects, evidence links, or timeline reconstruction.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedFollowups: QUICK_PROMPTS,
    },
  ]);

  // Supporting records modal state
  const [evidenceModal, setEvidenceModal] = useState<{
    open: boolean;
    recordIds: string[];
    context: string;
  }>({
    open: false,
    recordIds: [],
    context: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isThinking]);

  // When active case changes, add a case switch notification message
  const prevCaseRef = useRef(activeCaseId);
  useEffect(() => {
    if (prevCaseRef.current !== activeCaseId) {
      prevCaseRef.current = activeCaseId;
      setMessages((prev) => [
        ...prev,
        {
          id: `case-switch-${Date.now()}`,
          sender: "copilot",
          content: `Switched case context to **${activeCase?.name || activeCaseId} (${activeCaseId})**. All subsequent analysis is grounded in this case dossier.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestedFollowups: QUICK_PROMPTS,
        },
      ]);
    }
  }, [activeCaseId, activeCase?.name]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? inputQuery).trim();
    if (!text || isThinking) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsThinking(true);

    // Simulated short analytical latency for realistic analytical feel (350ms)
    setTimeout(() => {
      const response: CopilotResponse = queryInvestigatorCopilot(text, storeState);

      const copilotMsg: ChatMessage = {
        id: `cpl-${Date.now()}`,
        sender: "copilot",
        content: response.answer,
        entities: response.entities,
        evidenceRecordIds: response.evidence?.recordIds,
        evidenceLabel: response.evidence?.label,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedFollowups: response.suggestedFollowups || QUICK_PROMPTS.slice(0, 3),
      };

      setMessages((prev) => [...prev, copilotMsg]);
      setIsThinking(false);
    }, 350);
  };

  const handleEntityClick = (entity: CopilotEntityLink) => {
    // Navigate to Investigation graph with query parameter or focus
    navigate({ to: "/investigation" });
    onClose();
  };

  const handleViewEvidence = (recordIds: string[], label?: string) => {
    setEvidenceModal({
      open: true,
      recordIds,
      context: label ?? `Evidence records for active inquiry`,
    });
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "copilot",
        content: `Conversation reset. Analysis re-centered on **${activeCase?.name || activeCaseId} (${activeCaseId})**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedFollowups: QUICK_PROMPTS,
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Slide-over Side Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full sm:w-[480px] max-w-[100vw] flex-col bg-background/95 backdrop-blur-xl border-l border-border/80 shadow-2xl transition-all duration-300">
        {/* Top Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border/70 bg-card/80 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-xs">
              <Bot className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">त्रिनेत्र Copilot</span>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 text-[10px] font-mono px-1.5 py-0"
                >
                  INVESTIGATOR AI
                </Badge>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground truncate max-w-[240px]">
                Case: <strong className="text-foreground">{activeCase?.name || activeCaseId}</strong> ({activeCaseId})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Clear conversation"
            >
              <RotateCcw className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Close Copilot"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Mandatory AI Limitation Label (Requirement 5) */}
        <div className="shrink-0 bg-secondary/50 border-b border-border/60 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5 text-foreground/80 font-medium">
            <Shield className="size-3 text-primary" />
            AI-generated analysis &bull; Investigator verification required
          </span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            Synthetic Case Grounding
          </span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-xs font-sans leading-relaxed shadow-xs ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground font-medium rounded-tr-none"
                    : "bg-card border border-border/70 text-foreground rounded-tl-none space-y-2.5"
                }`}
              >
                {/* Message Content */}
                <div className="whitespace-pre-wrap">
                  {msg.content.split("\n").map((line, i) => {
                    if (line.startsWith("• ")) {
                      return (
                        <div key={i} className="flex items-start gap-1.5 my-1 pl-1">
                          <span className="text-primary font-bold">•</span>
                          <span>{line.replace("• ", "")}</span>
                        </div>
                      );
                    }
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <div key={i} className="font-bold text-foreground text-xs mt-2 mb-1">
                          {line.replace(/\*\*/g, "")}
                        </div>
                      );
                    }
                    return <div key={i}>{line}</div>;
                  })}
                </div>

                {/* Clickable Entities Badge Row (Requirement 4) */}
                {msg.entities && msg.entities.length > 0 && (
                  <div className="pt-2 border-t border-border/50 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-mono text-muted-foreground mr-1">
                      Entities:
                    </span>
                    {msg.entities.map((ent) => (
                      <button
                        key={ent.id}
                        onClick={() => handleEntityClick(ent)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-secondary hover:bg-primary/20 text-foreground border border-border/60 hover:border-primary/40 transition-colors cursor-pointer"
                        title={`Click to inspect ${ent.name} in graph`}
                      >
                        <span className="font-bold">{ent.name}</span>
                        <span className="text-[9px] text-muted-foreground">({ent.id})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Evidence Action Button (Requirement 4) */}
                {msg.evidenceRecordIds && msg.evidenceRecordIds.length > 0 && (
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleViewEvidence(msg.evidenceRecordIds!, msg.evidenceLabel)
                      }
                      className="h-7 px-2.5 text-[11px] font-mono gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shadow-xs"
                    >
                      <FileText className="size-3.5" />
                      <span>{msg.evidenceLabel || `View Evidence (${msg.evidenceRecordIds.length} Records)`}</span>
                    </Button>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      BSA Sec 63 Validated
                    </span>
                  </div>
                )}
              </div>

              <span className="text-[10px] font-mono text-muted-foreground mt-1 px-1">
                {msg.timestamp}
              </span>

              {/* Followup suggestions below copilot message */}
              {msg.sender === "copilot" && msg.suggestedFollowups && (
                <div className="flex flex-wrap gap-1 mt-1.5 max-w-[92%]">
                  {msg.suggestedFollowups.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/70 hover:bg-primary/20 text-muted-foreground hover:text-foreground border border-border/50 transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-card p-3 rounded-xl border border-border/60 max-w-[280px]">
              <div className="size-2 rounded-full bg-primary animate-ping" />
              <span>Analyzing case knowledge graph...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompts Bar (Requirement 4) */}
        <div className="shrink-0 border-t border-border/60 bg-muted/30 px-3 py-2">
          <div className="text-[10px] font-mono text-muted-foreground mb-1.5 flex items-center gap-1">
            <Sparkles className="size-3 text-primary" />
            <span>Suggested Investigator Queries:</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-background hover:bg-primary/15 text-foreground border border-border/70 hover:border-primary/40 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="shrink-0 border-t border-border/70 bg-card p-3 flex flex-col gap-1.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about suspects, calls, evidence, dates..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputQuery.trim() || isThinking}
              className="h-8 px-3 font-mono text-xs gap-1.5"
            >
              <Send className="size-3.5" />
              <span className="hidden sm:inline">Ask</span>
            </Button>
          </form>

          {/* Unobtrusive Disclaimers */}
          <div className="text-[9px] font-mono text-muted-foreground/75 text-center leading-tight">
            Prototype AI copilot grounded exclusively in synthetic case files. Does not interface with live CCTNS, ICJS, or telco networks.
          </div>
        </div>
      </div>

      {/* Supporting Evidence Dialog Integration */}
      <SupportingRecordsDialog
        open={evidenceModal.open}
        onOpenChange={(open) => setEvidenceModal((prev) => ({ ...prev, open }))}
        recordIds={evidenceModal.recordIds}
        context={evidenceModal.context}
      />
    </>
  );
}

/**
 * Floating Launcher Button for the Copilot
 */
export function CopilotFloatingButton({ onClick }: { onClick: () => void }) {
  const activeCaseId = useStore((s) => s.activeCaseId);

  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
      title="Open Investigator Copilot"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-green-500" />
      </span>
      <Bot className="size-4" />
      <span>AI Copilot</span>
      <span className="text-[10px] opacity-80 font-normal hidden sm:inline">
        ({activeCaseId})
      </span>
    </button>
  );
}
