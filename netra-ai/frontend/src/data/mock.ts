/**
 * Centralised mock data layer for the NEXUS prototype.
 *
 * ALL data below is entirely fictional and exists only to demonstrate the
 * interface. Nothing here represents real people, records or investigations.
 *
 * Replace the exported `api` functions with real network calls later; the
 * components only ever talk to `api`, never to the raw arrays.
 */

import type {
  ActivityItem,
  Entity,
  EntityType,
  Insight,
  InvestigationCase,
  Relationship,
  RelationshipType,
  SupportingRecord,
  TimelineEvent,
} from "./types";

export const ENTITY_TYPE_META: Record<
  EntityType,
  { label: string; color: string; short: string }
> = {
  person: { label: "Person", color: "var(--entity-person)", short: "PER" },
  phone: { label: "Phone", color: "var(--entity-phone)", short: "PHN" },
  account: { label: "Bank Account", color: "var(--entity-account)", short: "ACC" },
  location: { label: "Location", color: "var(--entity-location)", short: "LOC" },
  organization: { label: "Organization", color: "var(--entity-org)", short: "ORG" },
};

export const RELATIONSHIP_TYPE_META: Record<RelationshipType, { label: string }> = {
  call: { label: "Call" },
  transaction: { label: "Transaction" },
  location: { label: "Location" },
  mention: { label: "Document Mention" },
  association: { label: "Association" },
};

export const entities: Entity[] = [
  {
    id: "PER-001",
    type: "person",
    name: "Rahul Sharma",
    attributes: { Alias: "R.S.", Age: "38", Role: "Subject of interest", City: "Fictionpur" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "PER-002",
    type: "person",
    name: "Amit Kumar",
    attributes: { Alias: "AK", Age: "44", Role: "Associate", City: "Fictionpur" },
    caseIds: ["CASE-2041", "CASE-2044"],
  },
  {
    id: "PER-003",
    type: "person",
    name: "Priya Nair",
    attributes: { Alias: "—", Age: "31", Role: "Account holder", City: "Mockgaon" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "PER-004",
    type: "person",
    name: "Vikram Sethi",
    attributes: { Alias: "V", Age: "51", Role: "Intermediary", City: "Samplepur" },
    caseIds: ["CASE-2044"],
  },
  {
    id: "PER-005",
    type: "person",
    name: "Farhan Qureshi",
    attributes: { Alias: "FQ", Age: "29", Role: "Courier (alleged)", City: "Mockgaon" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "PER-006",
    type: "person",
    name: "Neha Bansal",
    attributes: { Alias: "—", Age: "35", Role: "Witness", City: "Samplepur" },
    caseIds: ["CASE-2047"],
  },
  {
    id: "PHN-101",
    type: "phone",
    name: "+91 90000 11111",
    attributes: { Operator: "DemoTel", "First seen": "02 Jun 2026", "Call volume": "184" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "PHN-102",
    type: "phone",
    name: "+91 90000 22222",
    attributes: { Operator: "MockCell", "First seen": "11 Jun 2026", "Call volume": "96" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "PHN-103",
    type: "phone",
    name: "+91 90000 33333",
    attributes: { Operator: "DemoTel", "First seen": "23 Jun 2026", "Call volume": "61" },
    caseIds: ["CASE-2044"],
  },
  {
    id: "PHN-104",
    type: "phone",
    name: "+91 90000 44444",
    attributes: { Operator: "SampleNet", "First seen": "04 Jul 2026", "Call volume": "27" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "ACC-201",
    type: "account",
    name: "A/C 8891-0042",
    attributes: { Bank: "Fictional Bank of Demo", Branch: "Fictionpur", Balance: "₹ 4,20,000" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "ACC-202",
    type: "account",
    name: "A/C 7712-9930",
    attributes: { Bank: "Sample Cooperative", Branch: "Mockgaon", Balance: "₹ 1,08,500" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "ACC-203",
    type: "account",
    name: "A/C 5540-1177",
    attributes: { Bank: "Demo Union Bank", Branch: "Samplepur", Balance: "₹ 12,75,000" },
    caseIds: ["CASE-2044"],
  },
  {
    id: "LOC-301",
    type: "location",
    name: "Sector 14 Market",
    attributes: { City: "Fictionpur", "Tower ID": "FP-TWR-014", Hits: "37" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "LOC-302",
    type: "location",
    name: "Riverside Depot",
    attributes: { City: "Mockgaon", "Tower ID": "MG-TWR-008", Hits: "21" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "LOC-303",
    type: "location",
    name: "Transit Hub 9",
    attributes: { City: "Samplepur", "Tower ID": "SP-TWR-091", Hits: "14" },
    caseIds: ["CASE-2044"],
  },
  {
    id: "ORG-401",
    type: "organization",
    name: "Meridian Traders (Fictional)",
    attributes: { Type: "Trading firm", Registered: "2019", Directors: "2" },
    caseIds: ["CASE-2041"],
  },
  {
    id: "ORG-402",
    type: "organization",
    name: "Blue Harbour Logistics (Fictional)",
    attributes: { Type: "Logistics", Registered: "2021", Directors: "3" },
    caseIds: ["CASE-2044"],
  },
];

export const relationships: Relationship[] = [
  { id: "R01", source: "PER-001", target: "PHN-101", type: "association", label: "USES", date: "2026-06-02", recordIds: ["CDR-001"] },
  { id: "R02", source: "PER-002", target: "PHN-102", type: "association", label: "USES", date: "2026-06-11", recordIds: ["CDR-002"] },
  { id: "R03", source: "PER-004", target: "PHN-103", type: "association", label: "USES", date: "2026-06-23", recordIds: ["CDR-004"] },
  { id: "R04", source: "PER-005", target: "PHN-104", type: "association", label: "USES", date: "2026-07-04", recordIds: ["CDR-006"] },
  { id: "R05", source: "PHN-101", target: "PHN-102", type: "call", label: "CALLED", date: "2026-08-12", recordIds: ["CDR-001"] },
  { id: "R06", source: "PHN-102", target: "PHN-103", type: "call", label: "CALLED", date: "2026-08-13", recordIds: ["CDR-002"] },
  { id: "R07", source: "PHN-101", target: "PHN-104", type: "call", label: "CALLED", date: "2026-08-14", recordIds: ["CDR-003"] },
  { id: "R08", source: "PHN-104", target: "PHN-102", type: "call", label: "CALLED", date: "2026-08-15", recordIds: ["CDR-005"] },
  { id: "R09", source: "PHN-103", target: "PHN-104", type: "call", label: "CALLED", date: "2026-08-18", recordIds: ["CDR-006"] },
  { id: "R10", source: "PER-001", target: "ACC-201", type: "association", label: "HOLDS", date: "2026-05-20", recordIds: ["TXN-010"] },
  { id: "R11", source: "PER-003", target: "ACC-202", type: "association", label: "HOLDS", date: "2026-05-28", recordIds: ["TXN-011"] },
  { id: "R12", source: "PER-004", target: "ACC-203", type: "association", label: "HOLDS", date: "2026-06-01", recordIds: ["TXN-013"] },
  { id: "R13", source: "ACC-201", target: "ACC-202", type: "transaction", label: "SUSPECTED STRUCTURING", date: "2026-08-16", recordIds: ["TXN-010"], is_ghost: true, conformal_confidence: 0.94 },
  { id: "R14", source: "ACC-202", target: "ACC-203", type: "transaction", label: "SUSPECTED HAWALA", date: "2026-08-19", recordIds: ["TXN-011"], is_ghost: true, conformal_confidence: 0.98 },
  { id: "R15", source: "ACC-203", target: "ACC-201", type: "transaction", label: "ROUND TRIPPING", date: "2026-08-22", recordIds: ["TXN-012"], is_ghost: true, conformal_confidence: 0.91 },
  { id: "R16", source: "ORG-401", target: "ACC-201", type: "transaction", label: "TRANSFERRED MONEY TO", date: "2026-07-30", recordIds: ["TXN-013"] },
  { id: "R17", source: "PER-001", target: "LOC-301", type: "location", label: "LOCATED AT", date: "2026-08-12", recordIds: ["GEO-020"] },
  { id: "R18", source: "PER-002", target: "LOC-301", type: "location", label: "LOCATED AT", date: "2026-08-12", recordIds: ["GEO-020"] },
  { id: "R19", source: "PER-005", target: "LOC-302", type: "location", label: "LOCATED AT", date: "2026-08-15", recordIds: ["GEO-021"] },
  { id: "R20", source: "PER-004", target: "LOC-303", type: "location", label: "LOCATED AT", date: "2026-08-18", recordIds: ["GEO-022"] },
  { id: "R21", source: "PER-001", target: "ORG-401", type: "association", label: "ASSOCIATED WITH", date: "2026-06-05", recordIds: ["FIR-030"] },
  { id: "R22", source: "PER-004", target: "ORG-402", type: "association", label: "ASSOCIATED WITH", date: "2026-06-21", recordIds: ["FIR-031"] },
  { id: "R23", source: "ORG-401", target: "ORG-402", type: "association", label: "ASSOCIATED WITH", date: "2026-07-12", recordIds: ["FIR-031"] },
  { id: "R24", source: "PER-002", target: "ORG-401", type: "mention", label: "MENTIONED IN", date: "2026-07-02", recordIds: ["FIR-030"] },
  { id: "R25", source: "PER-003", target: "ORG-402", type: "mention", label: "MENTIONED IN", date: "2026-07-19", recordIds: ["FIR-031"] },
  { id: "R26", source: "PER-006", target: "LOC-303", type: "mention", label: "MENTIONED IN", date: "2026-07-26", recordIds: ["FIR-032"] },
  { id: "R27", source: "PER-005", target: "PER-002", type: "association", label: "ASSOCIATED WITH", date: "2026-08-01", recordIds: ["FIR-030"] },
  { id: "R28", source: "PER-003", target: "PER-001", type: "association", label: "ASSOCIATED WITH", date: "2026-08-03", recordIds: ["FIR-030"] },
];

export const supportingRecords: SupportingRecord[] = [
  { id: "CDR-001", kind: "CDR", title: "Call detail record", date: "12 Aug 2026", fields: { From: "+91 90000 11111", To: "+91 90000 22222", Duration: "4 min 12 sec", Tower: "FP-TWR-014", Source: "cdr_batch_aug.csv (mock)" } },
  { id: "CDR-002", kind: "CDR", title: "Call detail record", date: "13 Aug 2026", fields: { From: "+91 90000 22222", To: "+91 90000 33333", Duration: "1 min 47 sec", Tower: "MG-TWR-008", Source: "cdr_batch_aug.csv (mock)" } },
  { id: "CDR-003", kind: "CDR", title: "Call detail record", date: "14 Aug 2026", fields: { From: "+91 90000 11111", To: "+91 90000 44444", Duration: "9 min 03 sec", Tower: "FP-TWR-014", Source: "cdr_batch_aug.csv (mock)" } },
  { id: "CDR-005", kind: "CDR", title: "Call detail record", date: "15 Aug 2026", fields: { From: "+91 90000 44444", To: "+91 90000 22222", Duration: "2 min 20 sec", Tower: "MG-TWR-008", Source: "cdr_batch_aug.csv (mock)" } },
  { id: "CDR-004", kind: "CDR", title: "Call detail record", date: "23 Jun 2026", fields: { From: "+91 90000 33333", To: "+91 90000 11111", Duration: "6 min 40 sec", Tower: "SP-TWR-091", Source: "cdr_batch_jun.csv (mock)" } },
  { id: "CDR-006", kind: "CDR", title: "Call detail record", date: "18 Aug 2026", fields: { From: "+91 90000 33333", To: "+91 90000 44444", Duration: "3 min 08 sec", Tower: "SP-TWR-091", Source: "cdr_batch_aug.csv (mock)" } },
  { id: "TXN-010", kind: "TXN", title: "Financial transaction record", date: "16 Aug 2026", fields: { From: "A/C 8891-0042", To: "A/C 7712-9930", Amount: "₹ 2,50,000", Mode: "IMPS", Reference: "TX8891A", Source: "txn_ledger_q3.xlsx (mock)" } },
  { id: "TXN-011", kind: "TXN", title: "Financial transaction record", date: "19 Aug 2026", fields: { From: "A/C 7712-9930", To: "A/C 5540-1177", Amount: "₹ 1,80,000", Mode: "NEFT", Reference: "TX7712B", Source: "txn_ledger_q3.xlsx (mock)" } },
  { id: "TXN-012", kind: "TXN", title: "Financial transaction record", date: "22 Aug 2026", fields: { From: "A/C 5540-1177", To: "A/C 8891-0042", Amount: "₹ 95,000", Mode: "RTGS", Reference: "TX5540C", Source: "txn_ledger_q3.xlsx (mock)" } },
  { id: "TXN-013", kind: "TXN", title: "Financial transaction record", date: "30 Jul 2026", fields: { From: "Meridian Traders (Fictional)", To: "A/C 8891-0042", Amount: "₹ 6,40,000", Mode: "NEFT", Reference: "TX0401D", Source: "txn_ledger_q3.xlsx (mock)" } },
  { id: "GEO-020", kind: "GEO", title: "Tower location event", date: "12 Aug 2026", fields: { Location: "Sector 14 Market, Fictionpur", Window: "18:40 – 19:15", Devices: "2", Source: "geo_export.json (mock)" } },
  { id: "GEO-021", kind: "GEO", title: "Tower location event", date: "15 Aug 2026", fields: { Location: "Riverside Depot, Mockgaon", Window: "22:05 – 22:35", Devices: "1", Source: "geo_export.json (mock)" } },
  { id: "GEO-022", kind: "GEO", title: "Tower location event", date: "18 Aug 2026", fields: { Location: "Transit Hub 9, Samplepur", Window: "09:12 – 09:44", Devices: "1", Source: "geo_export.json (mock)" } },
  { id: "FIR-030", kind: "FIR", title: "Case document extract", date: "02 Jul 2026", fields: { Document: "FIR-2026-0417 (fictional)", Paragraph: "12", Extract: "Names appear together in a fictional statement annexure.", Source: "fir_bundle.pdf (mock)" } },
  { id: "FIR-031", kind: "FIR", title: "Case document extract", date: "19 Jul 2026", fields: { Document: "FIR-2026-0509 (fictional)", Paragraph: "4", Extract: "Two fictional firms listed under the same correspondence address.", Source: "fir_bundle.pdf (mock)" } },
  { id: "FIR-032", kind: "FIR", title: "Case document extract", date: "26 Jul 2026", fields: { Document: "FIR-2026-0509 (fictional)", Paragraph: "9", Extract: "Witness statement references a transit location.", Source: "fir_bundle.pdf (mock)" } },
];

export const cases: InvestigationCase[] = [
  { id: "CASE-2041", name: "Operation Meridian", description: "Fictional multi-entity financial and communication network spanning three demo districts.", status: "active", priority: "critical", createdAt: "2026-06-04", entityCount: 18, relationshipCount: 28, lead: "Demo" },
  { id: "CASE-2044", name: "Blue Harbour Review", description: "Fictional logistics firm review with overlapping directors and transit-hub activity.", status: "active", priority: "high", createdAt: "2026-06-22", entityCount: 11, relationshipCount: 16, lead: "Insp. M. Rao (demo)" },
  { id: "CASE-2047", name: "Sector 14 Follow-up", description: "Fictional follow-up on co-location events recorded around a demo marketplace.", status: "under-review", priority: "medium", createdAt: "2026-07-09", entityCount: 7, relationshipCount: 9, lead: "SI. K. Iyer (demo)" },
  { id: "CASE-2052", name: "Ledger Trace 09", description: "Fictional layered transfer pattern between three sample accounts.", status: "active", priority: "high", createdAt: "2026-07-28", entityCount: 9, relationshipCount: 14, lead: "Demo" },
  { id: "CASE-2019", name: "Northline Archive", description: "Fictional archived case retained for pattern comparison only.", status: "closed", priority: "low", createdAt: "2026-02-17", entityCount: 6, relationshipCount: 7, lead: "SI. R. Menon (demo)" },
  { id: "CASE-2055", name: "Transit Hub Cluster", description: "Fictional cluster analysis of devices observed at a demo transport hub.", status: "under-review", priority: "medium", createdAt: "2026-08-08", entityCount: 10, relationshipCount: 13, lead: "Insp. M. Rao (demo)" },
];

export const timelineEvents: TimelineEvent[] = [
  { id: "EV-01", date: "2026-08-12T18:42:00", type: "call", title: "Call between two subjects", description: "A 4 minute call was logged between two fictional numbers.", entityIds: ["PHN-101", "PHN-102"], recordId: "CDR-001" },
  { id: "EV-02", date: "2026-08-12T18:55:00", type: "location", title: "Co-location event", description: "Two fictional subjects registered on the same demo tower.", entityIds: ["PER-001", "PER-002", "LOC-301"], recordId: "GEO-020" },
  { id: "EV-03", date: "2026-08-13T11:20:00", type: "call", title: "Onward call", description: "Call placed to a third fictional number shortly after.", entityIds: ["PHN-102", "PHN-103"], recordId: "CDR-002" },
  { id: "EV-04", date: "2026-08-14T09:05:00", type: "call", title: "Extended call", description: "A 9 minute call was logged in the demo dataset.", entityIds: ["PHN-101", "PHN-104"], recordId: "CDR-003" },
  { id: "EV-05", date: "2026-08-15T22:10:00", type: "location", title: "Depot presence", description: "One fictional subject observed at a demo depot location.", entityIds: ["PER-005", "LOC-302"], recordId: "GEO-021" },
  { id: "EV-06", date: "2026-08-16T13:35:00", type: "transaction", title: "Transfer recorded", description: "₹ 2,50,000 moved between two fictional accounts.", entityIds: ["ACC-201", "ACC-202"], recordId: "TXN-010" },
  { id: "EV-07", date: "2026-08-18T09:30:00", type: "location", title: "Transit hub event", description: "Fictional subject registered at a demo transit hub.", entityIds: ["PER-004", "LOC-303"], recordId: "GEO-022" },
  { id: "EV-08", date: "2026-08-19T16:02:00", type: "transaction", title: "Onward transfer", description: "₹ 1,80,000 moved onward in the demo ledger.", entityIds: ["ACC-202", "ACC-203"], recordId: "TXN-011" },
  { id: "EV-09", date: "2026-08-22T10:48:00", type: "transaction", title: "Return transfer", description: "₹ 95,000 returned to the originating demo account.", entityIds: ["ACC-203", "ACC-201"], recordId: "TXN-012" },
  { id: "EV-10", date: "2026-07-19T15:00:00", type: "mention", title: "Document mention", description: "Two fictional firms mentioned in the same demo annexure.", entityIds: ["PER-003", "ORG-402"], recordId: "FIR-031" },
];

export const activity: ActivityItem[] = [
  { id: "AC-1", actor: "You", action: "opened investigation", target: "Operation Meridian", at: "12 minutes ago" },
  { id: "AC-2", actor: "Insp. M. Rao (demo)", action: "uploaded CDR batch", target: "Blue Harbour Review", at: "1 hour ago" },
  { id: "AC-3", actor: "System", action: "completed extraction run", target: "Ledger Trace 09", at: "3 hours ago" },
  { id: "AC-4", actor: "SI. K. Iyer (demo)", action: "added 4 entities", target: "Sector 14 Follow-up", at: "Yesterday" },
  { id: "AC-5", actor: "You", action: "created case", target: "Transit Hub Cluster", at: "2 days ago" },
];

export const insights: Insight[] = [
  { id: "IN-1", headline: "Multiple interactions detected between selected entities", detail: "Five call events were recorded across four fictional numbers within an eleven day window.", confidence: "observation", recordIds: ["CDR-001", "CDR-002", "CDR-003"] },
  { id: "IN-2", headline: "A possible connection path exists between two entities", detail: "Rahul Sharma connects to Vikram Sethi through two intermediate fictional nodes.", confidence: "pattern", recordIds: ["CDR-001", "CDR-002"] },
  { id: "IN-3", headline: "Several interactions occurred within the selected time period", detail: "Three demo transfers occurred between 16 and 22 Aug 2026 in a circular pattern.", confidence: "pattern", recordIds: ["TXN-010", "TXN-011", "TXN-012"] },
  { id: "IN-4", headline: "The network contains a closely connected group of entities", detail: "Four fictional entities share more connections with each other than with the rest of the demo network.", confidence: "cluster", recordIds: ["FIR-030", "GEO-020"] },
];

const delay = <T,>(value: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(value), ms));

/**
 * The single data access point used by the UI.
 * Wired to FastAPI backend on localhost:8000.
 */
export const api = {
  getCases: () => delay(cases),
  getCase: (id: string) => delay(cases.find((c) => c.id === id) ?? null),
  
  getGraph: async () => {
    try {
      const res = await fetch("http://localhost:8000/api/graph/timeline?case_id=CASE-2041&date_end=2026-08-30");
      if (!res.ok) throw new Error("Failed to fetch graph");
      const data = await res.json();
      return { entities: data.nodes, relationships: data.edges };
    } catch (e) {
      console.warn("Backend unavailable, falling back to mock graph data:", e);
      return { entities, relationships };
    }
  },

  getTimeline: () => delay(timelineEvents),
  getActivity: () => delay(activity),
  getInsights: () => delay(insights),
  
  getRecords: async (ids: string[]) => {
    try {
      if (ids.length === 1) {
        // Attempt to fetch audit data for the single record
        const res = await fetch(`http://localhost:8000/api/evidence/audit/${ids[0]}`);
        if (res.ok) {
           const audit = await res.json();
           return [{
             id: audit.record_id,
             kind: "CDR",
             title: "Sec 63 BSA Audited Record",
             date: audit.timestamp_ntp,
             fields: {
               "Merkle Root": audit.merkle_root,
               "Leaf Hash": audit.merkle_leaf_hash,
               "HW Signature": audit.hardware_signature,
               "DPDP Purged": audit.dpdp_status.purged ? "Yes" : "No"
             }
           }];
        }
      }
      return supportingRecords.filter((r) => ids.includes(r.id));
    } catch (e) {
      return supportingRecords.filter((r) => ids.includes(r.id));
    }
  },

  getStats: () =>
    delay({
      activeCases: cases.filter((c) => c.status === "active").length,
      totalCases: cases.length,
      entities: entities.length,
      relationships: relationships.length,
      records: supportingRecords.length,
    }),
};

export const entityById = (id: string) => entities.find((e) => e.id === id);
export const recordById = (id: string) => supportingRecords.find((r) => r.id === id);
