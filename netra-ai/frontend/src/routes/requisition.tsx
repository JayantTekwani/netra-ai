import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  FileText,
  ShieldCheck,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Radio,
  FileKey,
  Smartphone,
  QrCode,
  Lock,
  ArrowRight,
  Server,
  Zap,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/requisition")({
  head: () => ({
    meta: [
      { title: "ADRIP — Automated CDR Requisition Pipeline — त्रिनेत्र-AI" },
      {
        name: "description",
        content: "Automated Digital Requisition & Ingestion Pipeline: Section 94 BNSS 2023 digital warranting & 5-minute CDR ingestion.",
      },
    ],
  }),
  component: RequisitionPipelinePage,
});

type PipelineStep = 1 | 2 | 3 | 4 | 5;

export function RequisitionPipelinePage() {
  const [currentStep, setCurrentStep] = useState<PipelineStep>(1);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    caseNo: "FIR/2026/DL/001234",
    targetNumber: "+91-9876543210",
    ioName: "SI Ramesh Kumar",
    ioBadge: "DL-4521",
    telco: "Airtel / C-DOT Nodal Gateway",
    dateRange: "2026-01-01 to 2026-01-30",
    authorizedBy: "DCP Crime Branch, Delhi Police",
    legalSection: "Section 94 BNSS 2023",
  });

  // SP e-Sign State
  const [spApproved, setSpApproved] = useState(false);

  // Countdown timer for 5-minute CDR delivery
  const [countdown, setCountdown] = useState(300); // 5m exactly

  useEffect(() => {
    let interval: any = null;
    if (currentStep === 4 && countdown > 0) {
      interval = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, countdown]);

  const handleStartPipeline = () => {
    setPipelineRunning(true);
    setCurrentStep(2);
    toast.info("Requisition Dispatched", {
      description: "Encrypted payload sent to SP/DCP MHA authorization terminal.",
    });
  };

  const handleSpApproval = () => {
    setSpApproved(true);
    setCurrentStep(3);
    toast.success("SP PKI Authorization Verified", {
      description: "Digital Aadhaar e-Sign token verified. Pushing payload to C-DOT CMS gateway.",
    });

    // Auto-advance to Step 4 after gateway ping
    setTimeout(() => {
      setCurrentStep(4);
      setCountdown(300);
      toast.info("C-DOT Gateway Handshake Accepted", {
        description: "Airtel lawful intercept automated extraction server streaming encrypted payload.",
      });
    }, 2000);
  };

  const handleSkipDelivery = () => {
    setCurrentStep(5);
    toast.success("Encrypted CDR Received (1,247 Records)", {
      description: "SHA-256 Merkle leaf automatically inscribed under Section 63 BSA 2023.",
    });
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <AppLayout
      title="Automated Digital Requisition & Ingestion Pipeline (ADRIP)"
      subtitle="Section 94 BNSS 2023 digital lawful intercept requisition: Transforming 14-day manual paperwork into 5-minute automated ingestion"
    >
      {/* EXPLANATORY HERO BANNER */}
      <div className="mb-6 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary text-primary-foreground uppercase">
                BNSS 2023 Sec 94 &bull; C-DOT CMS Gateway
              </span>
              <span className="text-xs font-mono text-muted-foreground">REPLACING 14-DAY MANUAL PAPERWORK</span>
            </div>
            <h2 className="text-base font-bold text-foreground mt-1.5">
              The Real Law Enforcement CDR Bottleneck: Solved
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Standard student software assumes clean CDR CSV files magically exist. In actual Indian policing, requisitioning
              CDRs requires physical letters, manual SP signatures, and liaison emails to telecom nodal officers—taking 7 to 14 days.
              <strong className="text-foreground"> TriNetra ADRIP</strong> digitizes the entire chain-of-custody workflow into a{" "}
              <strong className="text-primary font-mono">5-minute automated pipeline</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowEmergencyModal(true)}
              className="bg-red-600 hover:bg-red-700 text-xs font-semibold shadow-md"
            >
              <Zap className="size-3.5 mr-1.5 animate-pulse" />
              🚨 Emergency Override (Sec 94-EM)
            </Button>
          </div>
        </div>
      </div>

      {/* 5-STEP PIPELINE STEPPER */}
      <div className="mb-6 bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
        <div className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground mb-4">
          Automated Requisition Workflow Architecture
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {/* Step 1 */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              currentStep === 1
                ? "bg-primary/20 border-primary shadow-md ring-1 ring-primary/60"
                : currentStep > 1
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-secondary/30 border-border/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold">STEP 01</span>
              {currentStep > 1 ? <CheckCircle2 className="size-4 text-emerald-400" /> : <FileText className="size-4" />}
            </div>
            <div className="font-bold text-xs text-foreground">IO One-Click Draft</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Auto-Draft Sec 94 BNSS</div>
          </div>

          {/* Step 2 */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              currentStep === 2
                ? "bg-primary/20 border-primary shadow-md ring-1 ring-primary/60"
                : currentStep > 2
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-secondary/30 border-border/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold">STEP 02</span>
              {currentStep > 2 ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Smartphone className="size-4" />}
            </div>
            <div className="font-bold text-xs text-foreground">SP/DCP Mobile e-Sign</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">MHA PKI / Aadhaar Token</div>
          </div>

          {/* Step 3 */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              currentStep === 3
                ? "bg-primary/20 border-primary shadow-md ring-1 ring-primary/60"
                : currentStep > 3
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-secondary/30 border-border/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold">STEP 03</span>
              {currentStep > 3 ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Radio className="size-4" />}
            </div>
            <div className="font-bold text-xs text-foreground">C-DOT Gateway Hook</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Central Monitoring System API</div>
          </div>

          {/* Step 4 */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              currentStep === 4
                ? "bg-primary/20 border-primary shadow-md ring-1 ring-primary/60"
                : currentStep > 4
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-secondary/30 border-border/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold">STEP 04</span>
              {currentStep > 4 ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Lock className="size-4" />}
            </div>
            <div className="font-bold text-xs text-foreground">Encrypted TSP Stream</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">&lt; 5-Min AES-256 Ingestion</div>
          </div>

          {/* Step 5 */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              currentStep === 5
                ? "bg-emerald-500/20 border-emerald-500 shadow-md ring-1 ring-emerald-500/60"
                : "bg-secondary/30 border-border/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold">STEP 05</span>
              {currentStep === 5 ? <CheckCircle2 className="size-4 text-emerald-400" /> : <FileKey className="size-4" />}
            </div>
            <div className="font-bold text-xs text-foreground">BSA Sec 63 Auto-Vault</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">SHA-256 Merkle Ledger</div>
          </div>
        </div>
      </div>

      {/* WORKSPACE ROW: DIGITAL FORM (LEFT) vs. SP APPROVAL SIMULATOR (RIGHT) */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* LEFT COLUMN: SECTION 94 BNSS FORM (col-span-12 lg:col-span-7) */}
        <div className="col-span-12 lg:col-span-7 bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Section 94 BNSS 2023 Digital Requisition Requisition Form
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Statutory Notice for Production of Call Detail Records (CDR/IPDR) & Tower Dump
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 bg-primary/10 text-primary rounded border border-primary/30 font-bold">
              BNSS COMPLIANT
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-muted-foreground text-[10px] uppercase">FIR Number & Station</label>
              <input
                type="text"
                value={formData.caseNo}
                onChange={(e) => setFormData({ ...formData, caseNo: e.target.value })}
                className="w-full mt-1 bg-background border border-border rounded-lg p-2 font-bold text-foreground text-xs"
              />
            </div>

            <div>
              <label className="text-muted-foreground text-[10px] uppercase">Target MSISDN (Phone)</label>
              <input
                type="text"
                value={formData.targetNumber}
                onChange={(e) => setFormData({ ...formData, targetNumber: e.target.value })}
                className="w-full mt-1 bg-background border border-border rounded-lg p-2 font-bold text-red-400 text-xs"
              />
            </div>

            <div>
              <label className="text-muted-foreground text-[10px] uppercase">Requesting Officer (IO)</label>
              <input
                type="text"
                value={formData.ioName}
                readOnly
                className="w-full mt-1 bg-secondary/40 border border-border rounded-lg p-2 text-foreground text-xs"
              />
            </div>

            <div>
              <label className="text-muted-foreground text-[10px] uppercase">IO Badge ID</label>
              <input
                type="text"
                value={formData.ioBadge}
                readOnly
                className="w-full mt-1 bg-secondary/40 border border-border rounded-lg p-2 text-foreground text-xs"
              />
            </div>

            <div>
              <label className="text-muted-foreground text-[10px] uppercase">Nodal Telco / Gateway</label>
              <input
                type="text"
                value={formData.telco}
                readOnly
                className="w-full mt-1 bg-secondary/40 border border-border rounded-lg p-2 text-foreground text-xs"
              />
            </div>

            <div>
              <label className="text-muted-foreground text-[10px] uppercase">CDR Window Requested</label>
              <input
                type="text"
                value={formData.dateRange}
                readOnly
                className="w-full mt-1 bg-secondary/40 border border-border rounded-lg p-2 text-foreground text-xs"
              />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData({
                  caseNo: "FIR/2026/DEL/004812",
                  targetNumber: "+91-9823456781",
                  ioName: "Insp. Vikramaditya Singh",
                  ioBadge: "DL-1092",
                  telco: "Reliance Jio / C-DOT Nodal Gateway",
                  dateRange: "2026-01-05 to 2026-01-20",
                  authorizedBy: "SP Cyber Crime Division",
                  legalSection: "Section 94 BNSS 2023",
                });
                toast.success("Auto-filled from Active Case Dossier");
              }}
              className="text-xs"
            >
              <RefreshCw className="size-3 mr-1.5" />
              One-Click Auto-Fill from Active Case
            </Button>

            <Button
              onClick={handleStartPipeline}
              disabled={currentStep !== 1}
              className="bg-primary hover:bg-primary/90 text-xs font-semibold"
            >
              <Send className="size-3.5 mr-1.5" />
              Submit for SP Authorization &rarr;
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: SP MOBILE APPROVAL MOCKUP & TSP GATEWAY (col-span-12 lg:col-span-5) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* SP SMARTPHONE AUTHORIZATION CARD */}
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-primary" />
                <h3 className="text-xs font-bold tracking-tight">SP/DCP MHA Authorization Mobile Terminal</h3>
              </div>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="bg-secondary/30 rounded-xl p-4 border border-border/60">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-5 text-primary" />
                </div>
                <div className="text-xs font-mono flex-1">
                  <div className="font-bold text-foreground">MHA e-Sign Request #REQ-0941</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Target: {formData.targetNumber} &bull; Case: {formData.caseNo}
                  </div>
                  <div className="text-[10px] text-amber-400 mt-1 font-semibold">
                    Legal Mandate: {formData.legalSection}
                  </div>
                </div>
              </div>

              {/* ACTION / E-SIGN STAMP */}
              <div className="mt-4 pt-3 border-t border-border/40">
                {!spApproved ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSpApproval}
                      disabled={currentStep !== 2}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <CheckCircle2 className="size-3.5 mr-1.5" />
                      Approve via MHA PKI Token
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentStep !== 2}
                      className="text-xs text-red-400"
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-between text-xs font-mono text-emerald-400">
                    <div className="flex items-center gap-2">
                      <QrCode className="size-6 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold">
                          {emergencyActive ? "Emergency Override — Post-Facto SP Required" : "Aadhaar e-Sign Applied"}
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          {emergencyActive
                            ? "⚠️ Sec 94-EM Active · SP must ratify within 24h"
                            : "PKI: 0x98A1...F4C2 · NIST Sec 63"}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      emergencyActive
                        ? "bg-red-500/20 text-red-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {emergencyActive ? "OVERRIDE" : "AUTHORIZED"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CDR DELIVERY COUNTDOWN OR FINISH */}
            {currentStep === 4 && (
              <div className="mt-4 p-4 rounded-xl border border-primary/50 bg-primary/10">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-primary font-bold flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 animate-spin" />
                    TSP Delivery in Progress (C-DOT Ingestion)
                  </span>
                  <span className="font-bold text-foreground text-sm">{formatCountdown(countdown)}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${((300 - countdown) / 300) * 100}%` }}
                    className="bg-primary h-full transition-all duration-1000"
                  ></div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Stream: Airtel Nodal Hub &bull; AES-256 CBC
                  </span>
                  <Button size="sm" variant="outline" onClick={handleSkipDelivery} className="h-6 text-[10px]">
                    Fast-Forward to Ingestion &rarr;
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="mt-4 p-4 rounded-xl border border-emerald-500/60 bg-emerald-500/10 text-emerald-400">
                <div className="flex items-center gap-2 text-xs font-bold font-mono">
                  <CheckCircle2 className="size-4" />
                  <span>CDR Ingested & Vaulted in 3m 41s!</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                  1,247 raw call records streamed directly into active case graph. Merkle Leaf:{" "}
                  <span className="text-foreground">0x4a8b...19c2</span>. Court-ready under BSA Section 63.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HISTORICAL REQUISITION LOGS TABLE */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-3">
          Historical Requisition Audit Ledger (C-DOT / CMS)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="text-[10px] uppercase bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="p-2.5 rounded-l">Requisition ID</th>
                <th className="p-2.5">Case / FIR</th>
                <th className="p-2.5">Target Number</th>
                <th className="p-2.5">Telco Gateway</th>
                <th className="p-2.5">Delivery Time</th>
                <th className="p-2.5">Records</th>
                <th className="p-2.5 text-right rounded-r">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr className="hover:bg-secondary/20 transition-colors">
                <td className="p-2.5 font-bold text-foreground">REQ-2026-001</td>
                <td className="p-2.5 text-muted-foreground">FIR/2026/DL/001234</td>
                <td className="p-2.5 text-primary">+91-9876543210</td>
                <td className="p-2.5">Airtel Nodal</td>
                <td className="p-2.5 text-emerald-400 font-bold">3m 12s</td>
                <td className="p-2.5">847 records</td>
                <td className="p-2.5 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                    COMPLETED &bull; SEC 63 VAULTED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-secondary/20 transition-colors">
                <td className="p-2.5 font-bold text-foreground">REQ-2026-002</td>
                <td className="p-2.5 text-muted-foreground">FIR/2026/DL/001234</td>
                <td className="p-2.5 text-primary">+91-9823456781</td>
                <td className="p-2.5">Reliance Jio</td>
                <td className="p-2.5 text-amber-400">Pending SP (14m ago)</td>
                <td className="p-2.5">&mdash;</td>
                <td className="p-2.5 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                    AWAITING MHA TOKEN
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-secondary/20 transition-colors">
                <td className="p-2.5 font-bold text-foreground">REQ-2026-003</td>
                <td className="p-2.5 text-muted-foreground">FIR/2026/DEL/000921</td>
                <td className="p-2.5 text-primary">+91-9312345678</td>
                <td className="p-2.5">Vodafone Idea (Vi)</td>
                <td className="p-2.5 text-red-400 font-bold">48s (EMERGENCY)</td>
                <td className="p-2.5">2,110 records</td>
                <td className="p-2.5 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                    POST-FACTO SP COMPLIANCE (21h left)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* EMERGENCY REQUISITION MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border-2 border-red-500/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="size-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-400">
                  Life-Threatening Emergency Requisition Override (Section 94-EM)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Authorized strictly for active hostage, child abduction, or imminent cyber extortion threats.
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs text-muted-foreground">
              <p>
                This protocol invokes direct 24-hour instant tower dump & CDR pull prior to formal SP sign-off.
                In accordance with MHA SOP, a <strong className="text-foreground">mandatory post-facto authorization</strong> must be
                registered by the SP within 24 hours.
              </p>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 font-mono text-[11px]">
                ⚠️ Statutory Timer: 23 hours 59 minutes countdown initialized upon trigger.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowEmergencyModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                onClick={() => {
                  setShowEmergencyModal(false);
                  setEmergencyActive(true);
                  setSpApproved(true); // Emergency overrides SP approval requirement
                  setCurrentStep(4);
                  setCountdown(300);
                  toast.success("🚨 Emergency Override Triggered", {
                    description: "Instant 24-hour lawful intercept feed initiated. Post-facto compliance ticket opened.",
                  });
                }}
              >
                Confirm Emergency Activation
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
