import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Shield,
  FileKey,
  History,
  ShieldAlert,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Network,
  FileText,
  Download,
  Send,
  QrCode,
  Lock,
  Search,
  Check,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { useEffect, useState } from "react";
import { ledger, Block } from "@/lib/blockchain";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore } from "@/store";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [{ title: "Audit & BSA Section 63 Court Affidavit — त्रिनेत्र-AI" }],
  }),
  component: AuditPage,
});

const INITIAL_LOGS = [
  { action: "PII_PURGE", payload: { target: "CASE-1002_EXPIRED" } },
  { action: "GRAPH_QUERY", payload: { target: "PER-001", depth: 2 } },
  { action: "CCTV_FEED_ACCESS", payload: { target: "CAM-ND-01" } },
];

const DEMO_EVIDENCE_FILES = [
  { name: "FIR_104_2026_RAW_HINDI.pdf", size: "482 KB", hash: "a3f89b1c72d9e048123456789abcdef0123456789abcdef0123456789abcdef0", type: "First Information Report" },
  { name: "AIRTEL_CDR_TOWER_DUMP_JAN15.csv", size: "2.4 MB", hash: "c8e192f04b7a6358123456789abcdef0123456789abcdef0123456789abcdef1", type: "Telecom Service CDR" },
  { name: "UPI_MULE_TRANSACTION_LEDGER.xlsx", size: "1.1 MB", hash: "99b2401f8e77d2a1123456789abcdef0123456789abcdef0123456789abcdef2", type: "Core Banking FIU Feed" },
  { name: "CAM_SEC14_CCTV_INTERCEPT.mp4", size: "18.6 MB", hash: "f7129ac048b139e6123456789abcdef0123456789abcdef0123456789abcdef3", type: "Visual Surveillance" },
];

export function AuditPage() {
  const user = getSession();
  const [chain, setChain] = useState<Block[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // BSA Section 63 Modal & Verification State (Module 7)
  const [showAffidavitModal, setShowAffidavitModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isTransmittingCourt, setIsTransmittingCourt] = useState(false);
  const [verifyInputHash, setVerifyInputHash] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "verifying" | "valid" | "invalid">("idle");
  const [modalTab, setModalTab] = useState<"partA" | "partB" | "metadata" | "annexures">("partA");

  const activeCaseId = useStore((s) => s.activeCaseId);
  const activeCase = useStore((s) => s.cases.find((c) => c.id === activeCaseId));

  useEffect(() => {
    const initChain = async () => {
      if (ledger.chain.length === 0) {
        await ledger.initializeGenesisBlock();
        for (const log of INITIAL_LOGS) {
          await ledger.addTransaction(log.action, { user: user?.email || "system", ...log.payload });
        }
        await ledger.minePendingTransactions();
      }
      setChain([...ledger.chain]);
    };
    initChain();
  }, []);

  const verifyLedger = async () => {
    setIsValidating(true);
    setIsValid(null);
    setTimeout(async () => {
      const valid = await ledger.isChainValid();
      setIsValid(valid);
      setIsValidating(false);
      if (valid) {
        toast.success("Blockchain Integrity Verified", {
          description: "All Merkle branches match cryptographic SHA-256 state.",
        });
      }
    }, 1200);
  };

  const addManualRecord = async () => {
    await ledger.addTransaction("MANUAL_FIR_ENTRY", { target: "FIR-2026-991", user: user?.email });
    await ledger.addTransaction("EVIDENCE_UPLOAD", { file: "IMG_9912.jpg", hash: "a8f9c2..." });
    await ledger.minePendingTransactions();
    setChain([...ledger.chain]);
    toast.success("New Merkle Block Inscribed", {
      description: `Block #${ledger.chain.length - 1} appended with SHA-256 root.`,
    });
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentW = pageW - margin * 2;

      // Fix Case ID Inconsistency (Requirement 12)
      const caseName = activeCase?.name || "Operation Meridian";
      const caseId = activeCase?.id || "CASE-2041";
      const reportDate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";

      // Reusable Header (Requirement 3, 19, 21)
      const drawHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text("TRINETRA-AI  —  INTELLIGENCE & DIGITAL FORENSICS PLATFORM", pageW / 2, 9.5, { align: "center" });

        doc.setFontSize(7.5);
        doc.setTextColor(185, 28, 28);
        doc.text("DEMONSTRATION / PROTOTYPE — NOT A COURT-FILED DOCUMENT", pageW / 2, 14, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text("DEMONSTRATION ENVIRONMENT  |  SMART INDIA HACKATHON PROTOTYPE", pageW / 2, 17.5, { align: "center" });

        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(margin, 19.5, pageW - margin, 19.5);
      };

      // Reusable Footer (Requirement 3, 12, 27)
      const drawFooter = (pageNum: number, totalPages: number) => {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(margin, pageH - 12, pageW - margin, pageH - 12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `TriNetra-AI v2.0.1  |  Operation / Case: ${caseName}  |  Internal Case ID: ${caseId}  |  Format aligned with BSA 2023 Sec 63(4)(c) Schedule`,
          margin,
          pageH - 7.5
        );
        doc.text(`Page ${pageNum} of ${totalPages}`, pageW - margin, pageH - 7.5, { align: "right" });

        doc.setFontSize(6.5);
        doc.setTextColor(185, 28, 28);
        doc.text("DEMONSTRATION / PROTOTYPE — NOT A COURT-FILED DOCUMENT", pageW / 2, pageH - 3.5, { align: "center" });
      };

      // 8 Source Checkbox Options (Requirement 5 & 9)
      const colW = contentW / 4;
      const row1 = [
        { label: "Computer / Storage Media", checked: true },
        { label: "DVR", checked: false },
        { label: "Mobile", checked: false },
        { label: "Flash Drive", checked: false },
      ];
      const row2 = [
        { label: "CD/DVD", checked: false },
        { label: "Server", checked: true },
        { label: "Cloud", checked: false },
        { label: "Other", checked: false },
      ];

      const drawCheckboxes = (items: typeof row1, yPos: number) => {
        items.forEach((item, idx) => {
          const xPos = margin + idx * colW;
          doc.rect(xPos, yPos - 2.5, 3, 3);
          if (item.checked) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(15, 23, 42);
            doc.text("X", xPos + 0.6, yPos);
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(item.label, xPos + 4.5, yPos);
        });
      };

      // =========================================================================
      // PAGE 1: STATUTORY SCHEDULE — PART A (To be filled by the Party)
      // =========================================================================
      drawHeader();
      let y = 24.5;

      // Legal format compliance notice (Requirement 27)
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Format aligned with the Schedule under Section 63(4)(c) of the Bharatiya Sakshya Adhiniyam, 2023.", pageW / 2, y, { align: "center" });
      y += 5.5;

      // Statutory Schedule Header (Verbatim - Requirement 4)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("THE SCHEDULE", pageW / 2, y, { align: "center" });
      y += 4.5;
      doc.setFontSize(9.5);
      doc.text("[See section 63(4)(c)]", pageW / 2, y, { align: "center" });
      y += 5;
      doc.setFontSize(10.5);
      doc.text("CERTIFICATE", pageW / 2, y, { align: "center" });
      y += 5.5;
      doc.setFontSize(10);
      doc.text("PART A", pageW / 2, y, { align: "center" });
      y += 4.5;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text("(To be filled by the Party)", pageW / 2, y, { align: "center" });
      y += 6;

      // Party Affirmation (Verbatim statutory wording - Requirement 5)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const partyAffirmation = "I, SI Ramesh Kumar [DEMO / FICTIONAL DATA], Son/daughter/spouse of Sh. K. S. Kumar residing/employed at Special Cell, Lodhi Colony, New Delhi do hereby solemnly affirm and sincerely state and submit as follows:—";
      const splitPartyAffirmation = doc.splitTextToSize(partyAffirmation, contentW);
      doc.text(splitPartyAffirmation, margin, y);
      y += splitPartyAffirmation.length * 4.2 + 2.5;

      // Device / Digital Record Source intro (Verbatim statutory wording - Requirement 5)
      const partySourceIntro = "I have produced electronic record/output of the digital record taken from the following device/digital record source (tick mark):—";
      const splitPartySourceIntro = doc.splitTextToSize(partySourceIntro, contentW);
      doc.text(splitPartySourceIntro, margin, y);
      y += splitPartySourceIntro.length * 4.2 + 2.5;

      // Source options (All 8 statutory options - Requirement 5)
      drawCheckboxes(row1, y);
      y += 4.5;
      drawCheckboxes(row2, y);
      y += 5.5;

      // Statutory Device Fields (Verbatim - Requirement 5)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Other: ________________________________________", margin, y);
      y += 4.5;
      doc.text("Make & Model: Supermicro / Intel Xeon Scalable 4th Gen [DEMO]", margin, y);
      doc.text("Color: Metallic Silver / Black", margin + 115, y);
      y += 4.5;
      doc.text("Serial Number: SM-NODE-DL-994218 [DEMO / FICTIONAL DATA]", margin, y);
      y += 4.5;
      doc.text("IMEI/UIN/UID/MAC/Cloud ID: MAC: 48:21:0B:33:E4:19 / UID: MHA-ND-DEL-04 (as applicable)", margin, y);
      y += 4.5;
      const otherInfo = "and any other relevant information, if any, about the device/digital record: Standalone Evidence Ingestion Vault & HSM Node, kernel 6.8 FIPS verified (specify).";
      const splitOtherInfo = doc.splitTextToSize(otherInfo, contentW);
      doc.text(splitOtherInfo, margin, y);
      y += splitOtherInfo.length * 4.2 + 3;

      // Statutory Control / Operation Declaration (Verbatim - Requirement 6)
      const controlDeclaration = "The digital device or the digital record source was under the lawful control for regularly creating, storing or processing information for the purposes of carrying out regular activities and during this period, the computer or the communication device was working properly and the relevant information was regularly fed into the computer during the ordinary course of business. If the computer/digital device at any point of time was not working properly or out of operation, then it has not affected the electronic/digital record or its accuracy. The digital device or the source of the digital record is:—";
      const splitControlDecl = doc.splitTextToSize(controlDeclaration, contentW);
      doc.text(splitControlDecl, margin, y);
      y += splitControlDecl.length * 4.2 + 2.5;

      // Statutory Control Options (Requirement 6)
      const controlOptions = [
        { label: "Owned", checked: false },
        { label: "Maintained", checked: true },
        { label: "Managed", checked: false },
        { label: "Operated", checked: true },
      ];
      controlOptions.forEach((opt, idx) => {
        const xPos = margin + idx * (contentW / 4);
        doc.rect(xPos, y - 2.5, 3, 3);
        if (opt.checked) {
          doc.setFont("helvetica", "bold");
          doc.text("X", xPos + 0.6, y);
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(opt.label, xPos + 4.5, y);
      });
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("by me (select as applicable).", margin, y);
      y += 5.5;

      // Statutory Hash Section (Verbatim - Requirement 7)
      const hashStatement = "I state that the HASH value/s of the electronic/digital record/s is a3f89b1c72d9e048... [Itemized in Annexure A], obtained through the following algorithm:—";
      const splitHashStatement = doc.splitTextToSize(hashStatement, contentW);
      doc.text(splitHashStatement, margin, y);
      y += splitHashStatement.length * 4.2 + 2.5;

      // All 4 Statutory Hash Options (Requirement 7)
      doc.rect(margin, y - 2.5, 3, 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("SHA1:", margin + 4.5, y);

      doc.rect(margin + 50, y - 2.5, 3, 3);
      doc.setFont("helvetica", "bold");
      doc.text("X", margin + 50.6, y);
      doc.setFont("helvetica", "normal");
      doc.text("SHA256: a3f89b1c72d9e048... (Itemized report enclosed)", margin + 54.5, y);
      y += 4.5;

      doc.rect(margin, y - 2.5, 3, 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("MD5:", margin + 4.5, y);

      doc.rect(margin + 50, y - 2.5, 3, 3);
      doc.setFont("helvetica", "normal");
      doc.text("Other __________________ (Legally acceptable standard)", margin + 54.5, y);
      y += 5;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("(Hash report to be enclosed with the certificate)", margin, y);
      y += 6.5;

      // Statutory Signature Block (Part A - Requirement 8)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("(Name and signature)", margin, y);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Name: SI Ramesh Kumar", margin, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(185, 28, 28);
      doc.text("[DEMO DIGITAL SIGNATURE — PROTOTYPE ONLY]", margin + 70, y);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      y += 4.5;
      doc.text("Date (DD/MM/YYYY): 15/01/2026", margin, y);
      y += 4.5;
      doc.text("Time (IST): 10:30 hours (In 24 hours format)", margin, y);
      y += 4.5;
      doc.text("Place: New Delhi", margin, y);

      // =========================================================================
      // PAGE 2: STATUTORY SCHEDULE — PART B (To be filled by the Expert)
      // =========================================================================
      doc.addPage();
      drawHeader();
      y = 25;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("PART B", pageW / 2, y, { align: "center" });
      y += 5;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text("(To be filled by the Expert)", pageW / 2, y, { align: "center" });
      y += 8;

      // Verbatim Expert Affirmation (Requirement 9)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const expertAffirmation = "I, Dr. S. K. Nair [DEMO / FICTIONAL DATA], Son/daughter/spouse of Late V. Nair residing/employed at Cyber Forensic Division, CGO Complex, New Delhi do hereby solemnly affirm and sincerely state and submit as follows:—";
      const splitExpertAffirmation = doc.splitTextToSize(expertAffirmation, contentW);
      doc.text(splitExpertAffirmation, margin, y);
      y += splitExpertAffirmation.length * 4.2 + 3;

      // Verbatim Expert Source Intro (Requirement 9: notice 'are obtained')
      const expertSourceIntro = "The produced electronic record/output of the digital record are obtained from the following device/digital record source (tick mark):—";
      const splitExpertSourceIntro = doc.splitTextToSize(expertSourceIntro, contentW);
      doc.text(splitExpertSourceIntro, margin, y);
      y += splitExpertSourceIntro.length * 4.2 + 3;

      // 8 Source Checkbox Options (Requirement 9)
      drawCheckboxes(row1, y);
      y += 4.5;
      drawCheckboxes(row2, y);
      y += 6;

      // Verbatim Device Particulars (Requirement 9)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Other: ________________________________________", margin, y);
      y += 4.5;
      doc.text("Make & Model: Supermicro SuperServer / Intel Xeon Scalable 4th Gen [DEMO]", margin, y);
      doc.text("Color: Metallic Silver / Black", margin + 115, y);
      y += 4.5;
      doc.text("Serial Number: SM-NODE-DL-994218 [DEMO / FICTIONAL DATA]", margin, y);
      y += 4.5;
      doc.text("IMEI/UIN/UID/MAC/Cloud ID: MAC: 48:21:0B:33:E4:19 / UID: MHA-ND-DEL-04 (as applicable)", margin, y);
      y += 4.5;
      const expertOtherInfo = "and any other relevant information, if any, about the device/digital record: Standalone Evidence Ingestion Vault & HSM Node, verified forensic environment (specify).";
      const splitExpertOtherInfo = doc.splitTextToSize(expertOtherInfo, contentW);
      doc.text(splitExpertOtherInfo, margin, y);
      y += splitExpertOtherInfo.length * 4.2 + 5;

      // NOTE: Lawful control paragraph is NOT included in Part B (statutory fidelity - Requirement 9)

      // Verbatim Expert Hash Statement (Requirement 9)
      const expertHashStatement = "I state that the HASH value/s of the electronic/digital record/s is See Annexure A for complete itemized forensic hashes [DEMONSTRATION HASH], obtained through the following algorithm:—";
      const splitExpertHashStatement = doc.splitTextToSize(expertHashStatement, contentW);
      doc.text(splitExpertHashStatement, margin, y);
      y += splitExpertHashStatement.length * 4.2 + 3;

      // All 4 Statutory Hash Options (Requirement 9)
      doc.rect(margin, y - 2.5, 3, 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("SHA1:", margin + 4.5, y);

      doc.rect(margin + 50, y - 2.5, 3, 3);
      doc.setFont("helvetica", "bold");
      doc.text("X", margin + 50.6, y);
      doc.setFont("helvetica", "normal");
      doc.text("SHA256: Itemized forensic hash audit ledger enclosed in Annexure A", margin + 54.5, y);
      y += 4.5;

      doc.rect(margin, y - 2.5, 3, 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("MD5:", margin + 4.5, y);

      doc.rect(margin + 50, y - 2.5, 3, 3);
      doc.setFont("helvetica", "normal");
      doc.text("Other __________________ (Legally acceptable standard)", margin + 54.5, y);
      y += 5.5;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("(Hash report to be enclosed with the certificate)", margin, y);
      y += 8;

      // Statutory Signature Block (Part B - Requirement 9)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("(Name, designation and signature)", margin, y);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Name: Dr. S. K. Nair", margin, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(185, 28, 28);
      doc.text("[PROTOTYPE SIGNATURE — NOT CRYPTOGRAPHICALLY VALID]", margin + 70, y);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      y += 4.5;
      doc.text("Designation: Cyber Forensic Technical Examiner [DEMO / FICTIONAL QUALIFICATION]", margin, y);
      y += 4.5;
      doc.text("Date (DD/MM/YYYY): 15/01/2026", margin, y);
      y += 4.5;
      doc.text("Time (IST): 11:15 hours (In 24 hours format)", margin, y);
      y += 4.5;
      doc.text("Place: New Delhi", margin, y);

      // =========================================================================
      // PAGE 3: CASE & EVIDENCE IDENTIFICATION + TRINETRA-AI EVIDENCE INVENTORY
      // =========================================================================
      doc.addPage();
      drawHeader();
      y = 25;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text("CASE & EVIDENCE IDENTIFICATION", margin, y);
      y += 3.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("TriNetra-AI Administrative & Case Metadata (Supplementary Context)", margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 2, font: "helvetica", textColor: [15, 23, 42] },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: "bold", textColor: [71, 85, 105] },
          1: { cellWidth: 127 },
        },
        head: [["Administrative Parameter", "Value"]],
        body: [
          ["Operation / Case Name", `${caseName} [DEMO / FICTIONAL DATA]`],
          ["Internal Case ID", caseId],
          ["Police Station / Unit", "Special Cell, Lodhi Colony, New Delhi [DEMO]"],
          ["Investigating Officer", "SI Ramesh Kumar (Badge DL-4521) [DEMO / FICTIONAL DATA]"],
          ["Evidence Reference No.", "EV-2026-MERIDIAN-SEC63"],
          ["Certificate Reference No.", "TN-BSA63-2026-0042"],
          ["Certificate Generation Date", reportDate],
          ["Platform / Software Version", "TriNetra-AI v2.0.1 (Demonstration Build)"],
        ],
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text("TRINETRA-AI ELECTRONIC EVIDENCE INVENTORY", margin, y);
      y += 3.5;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Supplementary technical evidence metadata generated by TriNetra-AI. Not part of the statutory Schedule.", margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: "striped",
        styles: { fontSize: 7, cellPadding: 2, font: "helvetica", textColor: [15, 23, 42] },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 44 },
          2: { cellWidth: 26 },
          3: { cellWidth: 22 },
          4: { cellWidth: 24 },
          5: { cellWidth: 14, halign: "right" },
          6: { cellWidth: 24, font: "courier", fontSize: 6 },
          7: { cellWidth: 18, halign: "center" },
        },
        head: [["#", "Evidence File", "Record Type", "Source Device", "Acquisition", "Size", "SHA-256 (Prefix)", "Integrity"]],
        body: DEMO_EVIDENCE_FILES.map((ef, i) => [
          String(i + 1),
          ef.name,
          ef.type,
          i === 0 ? "Server" : i === 1 ? "Storage Media" : i === 2 ? "Server" : "Mobile / DVR",
          "2026-01-15 09:30",
          ef.size,
          ef.hash.substring(0, 16) + "...",
          "VERIFIED",
        ]),
      });

      // =========================================================================
      // PAGE 4: ANNEXURE A — HASH REPORT / EVIDENCE INTEGRITY RECORD
      // =========================================================================
      doc.addPage();
      drawHeader();
      y = 25;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("ANNEXURE A", margin, y);
      y += 4.5;
      doc.setFontSize(9.5);
      doc.text("HASH REPORT / EVIDENCE INTEGRITY RECORD", margin, y);
      y += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Enclosure to Certificate under Section 63(4)(c) of Bharatiya Sakshya Adhiniyam, 2023", margin, y);
      y += 3.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(185, 28, 28);
      doc.text("Notice: All cryptographic hash values below represent DEMONSTRATION HASH calculations for prototype ingested media.", margin, y);
      y += 4.5;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 2, font: "helvetica", overflow: "linebreak" },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 38 },
          2: { cellWidth: 16, halign: "center" },
          3: { cellWidth: 68, font: "courier", fontSize: 5.8 },
          4: { cellWidth: 22, fontSize: 6 },
          5: { cellWidth: 16, halign: "center", fontStyle: "bold", textColor: [22, 101, 52] },
          6: { cellWidth: 14, halign: "center", fontSize: 6 },
        },
        head: [["#", "Evidence ID & File", "Algorithm", "Cryptographic Hash Value", "Acquired / Verified", "Result", "Standard"]],
        body: DEMO_EVIDENCE_FILES.map((ef, i) => [
          String(i + 1),
          `EV-0${i + 1}\n${ef.name}`,
          "SHA-256",
          ef.hash,
          "15/01/26 09:30\n15/01/26 10:15",
          "VALID",
          "FIPS 180-4",
        ]),
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Verification Protocol Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, y, contentW, 26, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("TECHNICAL VERIFICATION PROTOCOL (SHA-256 INTEGRITY AUDIT)", margin + 4, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text("• Cryptographic Standard: NIST FIPS 180-4 Secure Hash Standard (256-bit message digest).", margin + 4, y + 10);
      doc.text("• Bit-Drift Verification: Bitwise comparison confirmed zero discrepancy between on-site acquisition and vault storage.", margin + 4, y + 15);
      doc.text("• Cross-Standard Hash Calculation: SHA-256 primary digest with MD5 cross-index preserved for historical records.", margin + 4, y + 20);

      // =========================================================================
      // PAGE 5: ANNEXURE B — TRINETRA-AI TECHNICAL AUDIT TRAIL (Hyperledger Fabric)
      // =========================================================================
      doc.addPage();
      drawHeader();
      y = 25;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("ANNEXURE B", margin, y);
      y += 4.5;
      doc.setFontSize(9.5);
      doc.text("TRINETRA-AI TECHNICAL AUDIT TRAIL", margin, y);
      y += 4;
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("(Hyperledger Fabric Cryptographic Ledger)", margin, y);
      y += 5;

      // MANDATORY STATUTORY DISCLAIMER (Verbatim - Requirement 16)
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(252, 165, 165);
      doc.rect(margin, y, contentW, 14, "FD");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(153, 27, 27);
      const bDisclaimer = "“Technical audit-trail information generated by the TriNetra-AI platform. This section is supplementary to the statutory certificate and is not itself a requirement of Section 63 of the Bharatiya Sakshya Adhiniyam, 2023.”";
      const splitBDisclaimer = doc.splitTextToSize(bDisclaimer, contentW - 6);
      doc.text(splitBDisclaimer, margin + 3, y + 5);
      y += 18;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 2, font: "helvetica", overflow: "linebreak" },
        headStyles: { fillColor: [40, 10, 80], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 16, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 32, fontSize: 6 },
          2: { cellWidth: 64, font: "courier", fontSize: 5.5 },
          3: { cellWidth: 48, font: "courier", fontSize: 5.5 },
          4: { cellWidth: 22, fontSize: 6 },
        },
        head: [["Block", "Timestamp (IST)", "Merkle Root (SHA-256)", "Block Hash (SHA-256)", "Status"]],
        body: chain.map((block) => [
          `#${block.index}`,
          new Date(block.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          block.merkleRoot,
          block.hash,
          "INSCRIBED",
        ]),
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, contentW, 24, "F");
      doc.setFont("courier", "normal");
      doc.setFontSize(7);
      doc.setTextColor(74, 222, 128);
      doc.text("IMMUTABLE MASTER MERKLE ROOT (DEMONSTRATION STATE):", margin + 4, y + 6);
      doc.text("0x9f8c12b7a4e61d89c02b89f31a2d5e771c9b0a887f6e5d4c3b2a109876543210", margin + 4, y + 11);
      doc.setTextColor(147, 197, 253);
      doc.text("HYPERLEDGER FABRIC TRANSACTION ID REFERENCE:", margin + 4, y + 17);
      doc.text("0x88f1a23c09b78e1245df67890123456789abcdef0123456789abcdef01234567", margin + 4, y + 22);

      // =========================================================================
      // PAGE 6: ANNEXURE C — TRINETRA-AI FORENSIC / ANALYTICAL OUTPUT
      // =========================================================================
      doc.addPage();
      drawHeader();
      y = 25;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("ANNEXURE C", margin, y);
      y += 4.5;
      doc.setFontSize(9.5);
      doc.text("TRINETRA-AI FORENSIC / ANALYTICAL OUTPUT", margin, y);
      y += 4;
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("(Multi-Source AI Correlation & Chain of Custody Pipeline)", margin, y);
      y += 5;

      // MANDATORY DISCLAIMER (Verbatim - Requirement 17)
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(252, 165, 165);
      doc.rect(margin, y, contentW, 14, "FD");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(153, 27, 27);
      const cDisclaimer = "“Supplementary analytical output generated by the TriNetra-AI platform. This section is supplementary to the statutory certificate and is not a statutory requirement under Section 63 BSA, 2023.”";
      const splitCDisclaimer = doc.splitTextToSize(cDisclaimer, contentW - 6);
      doc.text(splitCDisclaimer, margin + 3, y + 5);
      y += 18;

      const panels = [
        {
          title: "1. TELECOM & TOWER DUMP SPATIAL CORRELATION",
          text: "Parsed 2,418 call detail records (CDRs) from Airtel tower dump. Cross-referenced target IMEI hops across Lodhi Colony and Connaught Place base transceiver stations (BTS), establishing co-location probability score of 94.7%.",
        },
        {
          title: "2. FINANCIAL GRAPH ANALYTICS & LAYERED MULE CLUSTER",
          text: "Analyzed high-velocity UPI transaction batches across 5 intermediate accounts. Centrality scoring identified key intermediary node with betweenness centrality of 0.84, confirming structured layering pattern.",
        },
        {
          title: "3. MULTI-CASE NLP INTELLIGENCE EXTRACTION",
          text: "Extracted 12 named entities (aliases, bank accounts, vehicle license plates) from unorganized FIRs. High-confidence link found connecting active suspect to 2 previous pending investigations.",
        },
      ];

      panels.forEach((p) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, contentW, 20, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text(p.title, margin + 3, y + 4.5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(51, 65, 85);
        const splitPText = doc.splitTextToSize(p.text, contentW - 6);
        doc.text(splitPText, margin + 3, y + 9);
        y += 23;
      });

      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("CHAIN OF CUSTODY INTEGRITY TIMELINE", margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: "plain",
        styles: { fontSize: 7, cellPadding: 1.5, font: "helvetica" },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: "bold", textColor: [30, 41, 59] },
          1: { cellWidth: 40, fontStyle: "bold", textColor: [15, 23, 42] },
          2: { cellWidth: 110, textColor: [71, 85, 105] },
        },
        body: [
          ["15/01/2026 09:30 IST", "Evidence Seizure & Hashing", "On-site cryptographic SHA-256 acquisition conducted."],
          ["15/01/2026 09:42 IST", "Vault Ingestion & Storage", "Off-chain encrypted storage with zero bit-drift validation."],
          ["15/01/2026 10:15 IST", "Blockchain Inscription", "Block #1 inscribed with SHA-256 Merkle root in local Fabric ledger."],
          ["15/01/2026 11:30 IST", "Statutory Export", "Section 63 BSA Schedule affidavit generated in demonstration mode."],
        ],
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.rect(margin, y, contentW, 20, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(185, 28, 28);
      doc.text("[PROTOTYPE DEMONSTRATION RECORD — NOT A COURT-FILED DOCUMENT]", pageW / 2, y + 6, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text("Format aligned with the Schedule under Section 63(4)(c) of the Bharatiya Sakshya Adhiniyam, 2023.", pageW / 2, y + 11, { align: "center" });
      doc.text("TriNetra-AI Platform v2.0.1  •  Smart India Hackathon Demonstration Build", pageW / 2, y + 15, { align: "center" });

      // Apply Footers across all 6 pages
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages);
      }

      // Save PDF
      const safeCaseId = caseId.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `BSA_Sec63_Affidavit_${safeCaseId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);

      setIsDownloadingPdf(false);
      setDownloadSuccess(true);
      toast.success("Section 63 Legal Affidavit Downloaded", {
        description: `${filename} saved. Format aligned with statutory Schedule.`,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      setIsDownloadingPdf(false);
      toast.error("PDF Generation Failed", {
        description: "Check console for details.",
      });
    }
  };

  const handleTransmitCourt = () => {
    setIsTransmittingCourt(true);
    setTimeout(() => {
      setIsTransmittingCourt(false);
      toast.success("Dispatched to Prototype Registry", {
        description: "[DEMO DISPATCH] Transmitted to Prototype Court Registry Interface (Ref: ECR-2026-44821).",
      });
    }, 1500);
  };

  const handleCheckHash = () => {
    if (!verifyInputHash.trim()) return;
    setVerifyStatus("verifying");
    setTimeout(() => {
      // Validate against known evidence hashes—partial match on first 8+ chars
      const input = verifyInputHash.trim().toLowerCase();
      const isKnown = DEMO_EVIDENCE_FILES.some(
        (ef) => ef.hash.startsWith(input.slice(0, 8)) || input.startsWith(ef.hash.slice(0, 8))
      );
      if (isKnown) {
        setVerifyStatus("valid");
        toast.success("Evidence Untampered", {
          description: "SHA-256 hash verified against Block #1 Merkle root.",
        });
      } else {
        setVerifyStatus("invalid");
        toast.error("Hash Not Found in Ledger", {
          description: "No matching SHA-256 Merkle leaf found. Evidence may be unregistered or tampered.",
        });
      }
    }, 1000);
  };

  return (
    <AppLayout
      title="Chain of Custody & BSA Section 63 Legal Package"
      subtitle="Immutable cryptographic ledger with Merkle Root batching, off-chain PII storage, and court-ready electronic affidavits"
      actions={
        <Button
          onClick={() => {
            setShowAffidavitModal(true);
            setDownloadSuccess(false);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
        >
          <FileText className="size-4 mr-1.5" />
          📋 Export BSA Sec 63 Legal Package
        </Button>
      }
    >
      <div className="grid gap-6">
        {/* COMPLIANCE STATUS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="panel p-5 border-accent/30 bg-accent/5">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-accent" />
              <div>
                <div className="text-sm font-semibold text-accent">DPDP Act 2023 Compliant</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Off-chain PII & 72h Biometric Purge</div>
              </div>
            </div>
          </div>

          <div className="panel p-5 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <Network className="size-5 text-primary" />
              <div>
                <div className="text-sm font-semibold text-primary">BSA 2023 Sec 63 Merkle Vault</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{chain.length} blocks &bull; SHA-256 Batched</div>
              </div>
            </div>
          </div>

          <button
            onClick={verifyLedger}
            disabled={isValidating}
            className="panel p-5 border-border hover:bg-secondary/50 transition-colors text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <History className={`size-5 text-muted-foreground ${isValidating ? "animate-spin" : "group-hover:text-foreground"}`} />
              <div>
                <div className="text-sm font-semibold text-foreground">Verify Cryptographic Integrity</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Audit Merkle Roots & SHA-256 Hashes</div>
              </div>
            </div>
            {isValid === true && <CheckCircle2 className="size-5 text-primary" />}
            {isValid === false && <XCircle className="size-5 text-destructive" />}
          </button>
        </div>

        {/* EVIDENCE HASH INTEGRITY VERIFIER (MODULE 7.4) */}
        <div className="panel p-4 bg-card/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground font-mono">
              <Search className="size-3.5 text-primary" />
              Real-Time Evidence Hash Integrity Verifier (Court Tamper-Proof Audit)
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Section 63(4) BSA 2023 Audit Rule</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Paste raw evidence SHA-256 hash or click preset below..."
              value={verifyInputHash}
              onChange={(e) => {
                setVerifyInputHash(e.target.value);
                setVerifyStatus("idle");
              }}
              className="flex-1 min-w-[280px] bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-primary"
            />
            <Button size="sm" onClick={handleCheckHash} className="text-xs">
              {verifyStatus === "verifying" ? "Verifying Merkle Root..." : "Verify Hash"}
            </Button>
          </div>

          {/* Quick preset hashes */}
          <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-muted-foreground flex-wrap">
            <span>Test with active evidence:</span>
            {DEMO_EVIDENCE_FILES.slice(0, 2).map((ef) => (
              <button
                key={ef.name}
                onClick={() => {
                  setVerifyInputHash(ef.hash);
                  setVerifyStatus("idle");
                }}
                className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-foreground border border-border/60 text-[9px]"
              >
                {ef.name.split("_")[0]} ({ef.hash.slice(0, 8)}...)
              </button>
            ))}
          </div>

          {verifyStatus === "valid" && (
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span>
                  <strong>HASH VERIFIED — EVIDENCE UNTAMPERED:</strong> Hash anchored to Block #1 Merkle Leaf. Zero bit drift.
                </span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-bold">HASH VERIFIED — NO BIT DRIFT (DEMO)</span>
            </div>
          )}

          {verifyStatus === "invalid" && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-xs font-mono text-red-400 flex items-center gap-2">
              <XCircle className="size-4 shrink-0" />
              <span>
                <strong>HASH NOT FOUND:</strong> No Merkle leaf matches this hash. File may be unregistered or tampered. Paste a preset hash above to test known evidence.
              </span>
            </div>
          )}
        </div>

        {/* BLOCKCHAIN LOG TABLE */}
        <div className="panel p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight">Cryptographic Ledger Blocks (Hyperledger Merkle Layer)</h2>
            <button
              onClick={addManualRecord}
              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
            >
              Simulate Ingest Block Batch
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/30 text-[10px] tracking-wider uppercase text-muted-foreground font-mono">
                <tr>
                  <th className="px-5 py-3 font-medium">Block</th>
                  <th className="px-5 py-3 font-medium">Transactions (Merkle Batch)</th>
                  <th className="px-5 py-3 font-medium">Merkle Root & Block Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chain.map((block) => (
                  <tr key={block.index} className="hover:bg-secondary/20 transition-colors font-mono group">
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <LinkIcon className="size-3 text-muted-foreground" />
                        Block #{block.index}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(block.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      {block.transactions.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Genesis Block</span>
                      ) : (
                        <div className="space-y-3">
                          {block.transactions.map((tx) => (
                            <div key={tx.id} className="border-l-2 border-primary/30 pl-3">
                              <div className="text-xs font-semibold text-foreground">{tx.action}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 truncate w-48">
                                Off-Chain Payload Hash:<br />
                                <span className="text-accent">{tx.offChainPayloadHash.substring(0, 32)}...</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="text-[10px] text-muted-foreground">Merkle Root:</div>
                      <div className="text-xs text-primary truncate w-64 mb-2">{block.merkleRoot}</div>

                      <div className="text-[10px] text-muted-foreground">Block Hash (SHA-256):</div>
                      <div className="text-xs text-foreground truncate w-64">{block.hash}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* COURTROOM BSA SECTION 63 LEGAL PACKAGE MODAL */}
      {showAffidavitModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border-2 border-emerald-500/70 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 text-foreground">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 bg-red-500/20 text-red-400 rounded-full font-bold uppercase">
                    DEMONSTRATION / PROTOTYPE — NOT A COURT-FILED DOCUMENT
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/30">
                    BSA 2023 Sec 63(4)(c) Aligned
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground mt-1.5">
                  Section 63 BSA Electronic Evidence Certificate Package
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Statutory Schedule [See section 63(4)(c)] with TriNetra-AI Supplementary Forensic Annexures
                </p>
              </div>
              <button
                onClick={() => setShowAffidavitModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-2 border-b border-border pt-3 pb-2 text-xs font-mono">
              <button
                onClick={() => setModalTab("partA")}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  modalTab === "partA"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                Part A (Party)
              </button>
              <button
                onClick={() => setModalTab("partB")}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  modalTab === "partB"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                Part B (Expert)
              </button>
              <button
                onClick={() => setModalTab("metadata")}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  modalTab === "metadata"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                Case & Inventory
              </button>
              <button
                onClick={() => setModalTab("annexures")}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  modalTab === "annexures"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                Technical Annexures (A, B, C)
              </button>
            </div>

            {/* MODAL CONTENT BODY */}
            <div className="py-4 space-y-4 text-xs font-mono max-h-[60vh] overflow-y-auto pr-2">
              {/* TAB 1: PART A (PARTY) */}
              {modalTab === "partA" && (
                <div className="space-y-3">
                  <div className="p-3 bg-secondary/30 border border-border/80 rounded-xl text-center space-y-0.5">
                    <div className="font-bold text-foreground text-xs uppercase tracking-wider">THE SCHEDULE</div>
                    <div className="text-[11px] text-muted-foreground font-semibold">[See section 63(4)(c)]</div>
                    <div className="text-xs font-bold text-foreground">CERTIFICATE</div>
                    <div className="text-xs font-bold text-primary">PART A</div>
                    <div className="text-[10px] text-muted-foreground italic">(To be filled by the Party)</div>
                  </div>

                  <div className="p-3 bg-secondary/20 rounded-xl border border-border/40 leading-relaxed text-muted-foreground text-[11px]">
                    <p>
                      I, <strong className="text-foreground">SI Ramesh Kumar [DEMO / FICTIONAL DATA]</strong>, Son/daughter/spouse of{" "}
                      <strong className="text-foreground">Sh. K. S. Kumar</strong> residing/employed at{" "}
                      <strong className="text-foreground">Special Cell, Lodhi Colony, New Delhi</strong> do hereby solemnly affirm and
                      sincerely state and submit as follows:—
                    </p>
                    <p className="mt-2 text-foreground font-semibold">
                      I have produced electronic record/output of the digital record taken from the following device/digital record source (tick mark):—
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 font-mono text-[10px]">
                      <div className="flex items-center gap-1.5 text-foreground"><Check className="size-3.5 text-primary" /> Computer / Storage Media</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> DVR</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> Mobile</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> Flash Drive</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> CD/DVD</div>
                      <div className="flex items-center gap-1.5 text-foreground"><Check className="size-3.5 text-primary" /> Server</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> Cloud</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> Other</div>
                    </div>
                  </div>

                  {/* STATUTORY DEVICE DETAILS */}
                  <div className="p-3 bg-secondary/20 rounded-xl border border-border/40 space-y-1.5 text-[10px]">
                    <div><span className="text-muted-foreground">Other:</span> ________________________________________</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Make & Model:</span> <span className="text-foreground font-semibold">Supermicro / Intel Xeon Scalable [DEMO]</span></div>
                      <div><span className="text-muted-foreground">Color:</span> <span className="text-foreground">Silver / Black</span></div>
                    </div>
                    <div><span className="text-muted-foreground">Serial Number:</span> <span className="text-foreground">SM-NODE-DL-994218 [DEMO / FICTIONAL DATA]</span></div>
                    <div><span className="text-muted-foreground">IMEI/UIN/UID/MAC/Cloud ID:</span> <span className="text-foreground">MAC: 48:21:0B:33:E4:19 / UID: MHA-ND-DEL-04 (as applicable)</span></div>
                    <div><span className="text-muted-foreground">and any other relevant information, if any, about the device/digital record:</span> <span className="text-foreground">Standalone Evidence Ingestion Vault & HSM Node, kernel 6.8 FIPS verified (specify).</span></div>
                  </div>

                  {/* STATUTORY LAWFUL CONTROL DECLARATION */}
                  <div className="p-3 bg-secondary/30 rounded-xl border border-border/60 text-[10px] leading-relaxed">
                    <p className="text-foreground">
                      The digital device or the digital record source was under the lawful control for regularly creating, storing or processing information for the purposes of carrying out regular activities and during this period, the computer or the communication device was working properly and the relevant information was regularly fed into the computer during the ordinary course of business. If the computer/digital device at any point of time was not working properly or out of operation, then it has not affected the electronic/digital record or its accuracy. The digital device or the source of the digital record is:—
                    </p>
                    <div className="flex gap-4 mt-2 font-mono">
                      <div className="flex items-center gap-1 text-muted-foreground"><span className="inline-block size-3 border border-border rounded-sm" /> Owned</div>
                      <div className="flex items-center gap-1 text-primary font-bold"><Check className="size-3 text-primary" /> Maintained</div>
                      <div className="flex items-center gap-1 text-muted-foreground"><span className="inline-block size-3 border border-border rounded-sm" /> Managed</div>
                      <div className="flex items-center gap-1 text-primary font-bold"><Check className="size-3 text-primary" /> Operated</div>
                    </div>
                    <p className="mt-1 text-muted-foreground">by me (select as applicable).</p>
                  </div>

                  {/* STATUTORY HASH DECLARATION */}
                  <div className="p-3 bg-secondary/20 rounded-xl border border-border/40 text-[10px] space-y-1.5">
                    <p className="text-foreground">
                      I state that the HASH value/s of the electronic/digital record/s is <span className="text-primary font-bold">a3f89b1c72d9e048... [Itemized in Annexure A]</span>, obtained through the following algorithm:—
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3 border border-border rounded-sm" /> SHA1:</div>
                      <div className="flex items-center gap-1.5 text-foreground font-bold"><Check className="size-3 text-primary" /> SHA256: <span className="text-primary font-mono text-[9px]">a3f89b1c72d9e048...</span></div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3 border border-border rounded-sm" /> MD5:</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3 border border-border rounded-sm" /> Other __________________ (Legally acceptable standard)</div>
                    </div>
                    <div className="text-muted-foreground italic text-[9px] mt-1">(Hash report to be enclosed with the certificate)</div>
                  </div>

                  {/* SIGNATURE BLOCK */}
                  <div className="p-3 border border-border/60 rounded-xl text-[10px] space-y-1 bg-secondary/10">
                    <div className="font-bold text-foreground">(Name and signature)</div>
                    <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-semibold">SI Ramesh Kumar</span> <span className="text-red-400 font-bold ml-3">[DEMO DIGITAL SIGNATURE — PROTOTYPE ONLY]</span></div>
                    <div><span className="text-muted-foreground">Date (DD/MM/YYYY):</span> <span className="text-foreground">15/01/2026</span></div>
                    <div><span className="text-muted-foreground">Time (IST):</span> <span className="text-foreground">10:30 hours (In 24 hours format)</span></div>
                    <div><span className="text-muted-foreground">Place:</span> <span className="text-foreground">New Delhi</span></div>
                  </div>
                </div>
              )}

              {/* TAB 2: PART B (EXPERT) */}
              {modalTab === "partB" && (
                <div className="space-y-3">
                  <div className="p-3 bg-secondary/30 border border-border/80 rounded-xl text-center space-y-0.5">
                    <div className="text-xs font-bold text-primary">PART B</div>
                    <div className="text-[10px] text-muted-foreground italic">(To be filled by the Expert)</div>
                  </div>

                  <div className="p-3 bg-secondary/20 rounded-xl border border-border/40 leading-relaxed text-muted-foreground text-[11px]">
                    <p>
                      I, <strong className="text-foreground">Dr. S. K. Nair [DEMO / FICTIONAL DATA]</strong>, Son/daughter/spouse of{" "}
                      <strong className="text-foreground">Late V. Nair</strong> residing/employed at{" "}
                      <strong className="text-foreground">Cyber Forensic Division, CGO Complex, New Delhi</strong> do hereby solemnly affirm and
                      sincerely state and submit as follows:—
                    </p>
                    <p className="mt-2 text-foreground font-semibold">
                      The produced electronic record/output of the digital record are obtained from the following device/digital record source (tick mark):—
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 font-mono text-[10px]">
                      <div className="flex items-center gap-1.5 text-foreground"><Check className="size-3.5 text-primary" /> Computer / Storage Media</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> DVR</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> Mobile</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> Flash Drive</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> CD/DVD</div>
                      <div className="flex items-center gap-1.5 text-foreground"><Check className="size-3.5 text-primary" /> Server</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> Cloud</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3.5 border border-border rounded-sm" /> Other</div>
                    </div>
                  </div>

                  {/* STATUTORY DEVICE DETAILS */}
                  <div className="p-3 bg-secondary/20 rounded-xl border border-border/40 space-y-1.5 text-[10px]">
                    <div><span className="text-muted-foreground">Other:</span> ________________________________________</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Make & Model:</span> <span className="text-foreground font-semibold">Supermicro SuperServer / Intel Xeon [DEMO]</span></div>
                      <div><span className="text-muted-foreground">Color:</span> <span className="text-foreground">Metallic Silver / Black</span></div>
                    </div>
                    <div><span className="text-muted-foreground">Serial Number:</span> <span className="text-foreground">SM-NODE-DL-994218 [DEMO / FICTIONAL DATA]</span></div>
                    <div><span className="text-muted-foreground">IMEI/UIN/UID/MAC/Cloud ID:</span> <span className="text-foreground">MAC: 48:21:0B:33:E4:19 / UID: MHA-ND-DEL-04 (as applicable)</span></div>
                    <div><span className="text-muted-foreground">and any other relevant information, if any, about the device/digital record:</span> <span className="text-foreground">Standalone Evidence Ingestion Vault & HSM Node, verified forensic environment (specify).</span></div>
                  </div>

                  {/* STATUTORY HASH DECLARATION */}
                  <div className="p-3 bg-secondary/20 rounded-xl border border-border/40 text-[10px] space-y-1.5">
                    <p className="text-foreground">
                      I state that the HASH value/s of the electronic/digital record/s is <span className="text-primary font-bold">See Annexure A for complete itemized forensic hashes [DEMONSTRATION HASH]</span>, obtained through the following algorithm:—
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3 border border-border rounded-sm" /> SHA1:</div>
                      <div className="flex items-center gap-1.5 text-foreground font-bold"><Check className="size-3 text-primary" /> SHA256: <span className="text-primary font-mono text-[9px]">Itemized forensic hash audit ledger enclosed in Annexure A</span></div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3 border border-border rounded-sm" /> MD5:</div>
                      <div className="flex items-center gap-1.5 text-muted-foreground"><span className="inline-block size-3 border border-border rounded-sm" /> Other __________________ (Legally acceptable standard)</div>
                    </div>
                    <div className="text-muted-foreground italic text-[9px] mt-1">(Hash report to be enclosed with the certificate)</div>
                  </div>

                  {/* SIGNATURE BLOCK */}
                  <div className="p-3 border border-border/60 rounded-xl text-[10px] space-y-1 bg-secondary/10">
                    <div className="font-bold text-foreground">(Name, designation and signature)</div>
                    <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-semibold">Dr. S. K. Nair</span> <span className="text-red-400 font-bold ml-3">[PROTOTYPE SIGNATURE — NOT CRYPTOGRAPHICALLY VALID]</span></div>
                    <div><span className="text-muted-foreground">Designation:</span> <span className="text-foreground">Cyber Forensic Technical Examiner [DEMO / FICTIONAL QUALIFICATION]</span></div>
                    <div><span className="text-muted-foreground">Date (DD/MM/YYYY):</span> <span className="text-foreground">15/01/2026</span></div>
                    <div><span className="text-muted-foreground">Time (IST):</span> <span className="text-foreground">11:15 hours (In 24 hours format)</span></div>
                    <div><span className="text-muted-foreground">Place:</span> <span className="text-foreground">New Delhi</span></div>
                  </div>
                </div>
              )}

              {/* TAB 3: CASE & INVENTORY */}
              {modalTab === "metadata" && (
                <div className="space-y-4">
                  <div>
                    <div className="font-bold text-foreground text-xs mb-1">CASE & EVIDENCE IDENTIFICATION (TriNetra-AI Administrative Context)</div>
                    <div className="grid grid-cols-2 gap-2.5 p-3 bg-secondary/30 rounded-xl border border-border/60 text-[10px]">
                      <div><span className="text-muted-foreground">Operation / Case Name:</span> <strong className="text-foreground">{activeCase?.name || "Operation Meridian"} [DEMO]</strong></div>
                      <div><span className="text-muted-foreground">Internal Case ID:</span> <strong className="text-foreground">{activeCase?.id || "CASE-2041"}</strong></div>
                      <div><span className="text-muted-foreground">Police Station / Unit:</span> <span className="text-foreground">Special Cell, Lodhi Colony, New Delhi [DEMO]</span></div>
                      <div><span className="text-muted-foreground">Investigating Officer:</span> <span className="text-foreground">SI Ramesh Kumar (Badge DL-4521) [DEMO]</span></div>
                      <div><span className="text-muted-foreground">Evidence Ref No:</span> <span className="text-foreground font-mono">EV-2026-MERIDIAN-SEC63</span></div>
                      <div><span className="text-muted-foreground">Certificate Ref No:</span> <span className="text-foreground font-mono">TN-BSA63-2026-0042</span></div>
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-foreground text-xs mb-1">TRINETRA-AI ELECTRONIC EVIDENCE INVENTORY</div>
                    <p className="text-[10px] text-muted-foreground mb-2 italic">Supplementary technical evidence metadata generated by TriNetra-AI. Not part of the statutory Schedule.</p>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-[10px] text-left">
                        <thead className="bg-secondary/60 uppercase text-muted-foreground">
                          <tr>
                            <th className="p-2">#</th>
                            <th className="p-2">Evidence File</th>
                            <th className="p-2">Record Type</th>
                            <th className="p-2">Size</th>
                            <th className="p-2">SHA-256 (Prefix)</th>
                            <th className="p-2">Integrity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {DEMO_EVIDENCE_FILES.map((ef, i) => (
                            <tr key={ef.name} className="hover:bg-secondary/20">
                              <td className="p-2 font-bold">{i + 1}</td>
                              <td className="p-2 text-foreground font-semibold">{ef.name}</td>
                              <td className="p-2 text-muted-foreground">{ef.type}</td>
                              <td className="p-2 text-muted-foreground">{ef.size}</td>
                              <td className="p-2 font-mono text-primary">{ef.hash.substring(0, 16)}...</td>
                              <td className="p-2 text-emerald-400 font-bold">VERIFIED</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TECHNICAL ANNEXURES */}
              {modalTab === "annexures" && (
                <div className="space-y-4">
                  {/* ANNEXURE A */}
                  <div>
                    <div className="font-bold text-foreground text-xs mb-1">ANNEXURE A — HASH REPORT / EVIDENCE INTEGRITY RECORD</div>
                    <p className="text-[10px] text-muted-foreground mb-2 italic">Notice: All hashes below represent DEMONSTRATION HASH calculations for prototype ingested media.</p>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-[9px] text-left">
                        <thead className="bg-secondary/60 uppercase text-muted-foreground">
                          <tr>
                            <th className="p-2">Item</th>
                            <th className="p-2">Algorithm</th>
                            <th className="p-2">Cryptographic SHA-256 Hash</th>
                            <th className="p-2">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono">
                          {DEMO_EVIDENCE_FILES.map((ef, i) => (
                            <tr key={ef.name} className="hover:bg-secondary/20">
                              <td className="p-2 text-foreground font-bold">{ef.name}</td>
                              <td className="p-2 text-muted-foreground">SHA-256</td>
                              <td className="p-2 text-primary">{ef.hash}</td>
                              <td className="p-2 text-emerald-400 font-bold">VALID</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ANNEXURE B */}
                  <div className="p-3 bg-secondary/20 rounded-xl border border-border/40 space-y-2 text-[10px]">
                    <div className="font-bold text-foreground text-xs">ANNEXURE B — TRINETRA-AI TECHNICAL AUDIT TRAIL (Hyperledger Fabric)</div>
                    <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 italic text-[9px] leading-relaxed">
                      “Technical audit-trail information generated by the TriNetra-AI platform. This section is supplementary to the statutory certificate and is not itself a requirement of Section 63 of the Bharatiya Sakshya Adhiniyam, 2023.”
                    </div>
                    <div className="flex justify-between font-mono pt-1">
                      <span className="text-muted-foreground">Immutable Master Merkle Root:</span>
                      <span className="text-emerald-400 font-bold">0x9f8c12b7a4e61d89c02b89f31a2d5e771c9b0a887f6e5d4c3b2a109876543210</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-muted-foreground">Hyperledger Fabric Ledger TX:</span>
                      <span className="text-foreground">0x88f1a23c09b78e1245df67890123456789abcdef0123456789abcdef01234567</span>
                    </div>
                  </div>

                  {/* ANNEXURE C */}
                  <div className="p-3 bg-secondary/20 rounded-xl border border-border/40 space-y-2 text-[10px]">
                    <div className="font-bold text-foreground text-xs">ANNEXURE C — TRINETRA-AI FORENSIC / ANALYTICAL OUTPUT</div>
                    <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 italic text-[9px] leading-relaxed">
                      “Supplementary analytical output generated by the TriNetra-AI platform. This section is supplementary to the statutory certificate and is not a statutory requirement under Section 63 BSA, 2023.”
                    </div>
                    <div className="text-muted-foreground leading-relaxed">
                      Includes multi-source entity extraction, CDR base-station trajectory calculation, and cross-case criminal network correlation.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <div className="text-[10px] text-muted-foreground font-mono">
                Format aligned with BSA 2023 Sec 63(4)(c) Schedule • 6-Page Legal PDF
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTransmitCourt}
                  disabled={isTransmittingCourt}
                  className="text-xs"
                >
                  <Send className="size-3 mr-1" />
                  {isTransmittingCourt ? "Transmitting..." : "Send to Court Registry (Demo)"}
                </Button>

                <Button
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  <Download className="size-3 mr-1" />
                  {isDownloadingPdf ? "Generating PDF..." : downloadSuccess ? "Downloaded ✅" : "Download PDF Affidavit (6-Page)"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
