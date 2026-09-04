import type {
  Entity, Relationship, SupportingRecord, Insight,
  TimelineEvent, RelationshipType
} from "@/data/types";

export interface ExtractionResult {
  entities: Entity[];
  relationships: Relationship[];
  supportingRecords: SupportingRecord[];
  insights: Insight[];
  timelineEvents: TimelineEvent[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashStr(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(33, h) ^ s.charCodeAt(i)) >>> 0;
  return Math.abs(h).toString(36).toUpperCase().slice(0, 6);
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

const KNOWN_LOCATIONS = new Set([
  "jaipur","delhi","mumbai","bangalore","bengaluru","hyderabad","chennai","kolkata",
  "pune","ahmedabad","lucknow","surat","bhopal","patna","indore","nagpur","thane",
  "fictionpur","mockgaon","samplepur","sector 14","riverside","transit hub","lodhi",
  "connaught","igi","noida","gurgaon","gurugram","chandigarh","amritsar","agra",
]);

const ORG_KEYWORDS = new Set([
  "traders","logistics","technologies","corp","corporation","inc","ltd","limited",
  "bank","startup","firm","solutions","enterprises","pvt","private","industries",
  "imports","exports","agency","services","group","associates","holdings","capital",
]);

const SKIP_NAMES = new Set([
  "case created","user input","data analysis","call detail","operation meridian",
  "transaction record","financial record","supporting record","uploaded documents",
  "raw text","analyzed text","input snippet","extracted at","source document",
]);

// ─── CSV / TSV parser ───────────────────────────────────────────────────────

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Detect delimiter (comma or tab or pipe or semicolon)
  const firstLine = lines[0]!;
  const delim = firstLine.includes('\t') ? '\t'
    : firstLine.includes('|') ? '|'
    : firstLine.includes(';') ? ';'
    : ',';

  const headers = firstLine.split(delim).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(delim).map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length < 2) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { if (parts[idx] !== undefined) row[h] = parts[idx]!; });
    rows.push(row);
  }
  return rows;
}

// ─── CDR (Call Detail Record) CSV parser ───────────────────────────────────
// Handles columns like: caller, callee, from, to, number_a, number_b, duration, date, timestamp

function extractFromCDR(rows: Array<Record<string, string>>, caseId: string, recId: string, dateStr: string, entitiesMap: Map<string, Entity>, relationships: Relationship[]) {
  const CALLER_KEYS = ["caller","from","number_a","a_party","a party","calling","from_number","source","from_no","caller_number"];
  const CALLEE_KEYS = ["callee","to","number_b","b_party","b party","called","to_number","destination","to_no","callee_number"];
  const DATE_KEYS = ["date","timestamp","call_date","datetime","call_time","time","call_timestamp"];

  const findCol = (row: Record<string,string>, keys: string[]) =>
    keys.map(k => row[k]).find(v => v && v.trim()) ?? null;

  rows.forEach((row, i) => {
    const caller = findCol(row, CALLER_KEYS);
    const callee = findCol(row, CALLEE_KEYS);
    const date = findCol(row, DATE_KEYS) || dateStr;

    if (!caller || !callee) return;

    const cleanCaller = caller.trim().replace(/\s+/g, ' ');
    const cleanCallee = callee.trim().replace(/\s+/g, ' ');

    const callerId = `PHN-${hashStr(cleanCaller)}`;
    const calleeId = `PHN-${hashStr(cleanCallee)}`;

    if (!entitiesMap.has(callerId)) {
      entitiesMap.set(callerId, {
        id: callerId, type: "phone", name: cleanCaller,
        attributes: { Operator: "Detected Telecom", "First seen": date, "CDR File": "yes" },
        caseIds: [caseId]
      });
    }
    if (!entitiesMap.has(calleeId)) {
      entitiesMap.set(calleeId, {
        id: calleeId, type: "phone", name: cleanCallee,
        attributes: { Operator: "Detected Telecom", "First seen": date, "CDR File": "yes" },
        caseIds: [caseId]
      });
    }

    const relId = `R-${hashStr(callerId + calleeId + i)}`;
    if (!relationships.find(r => r.source === callerId && r.target === calleeId)) {
      relationships.push({
        id: relId, source: callerId, target: calleeId,
        type: "call", label: "CALLED",
        date: date.slice(0, 10), recordIds: [recId]
      });
    }
  });
}

// ─── TXN (Transaction) CSV parser ──────────────────────────────────────────
// Handles: from_account, to_account, amount, sender, receiver, date, etc.

function extractFromTXN(rows: Array<Record<string, string>>, caseId: string, recId: string, dateStr: string, entitiesMap: Map<string, Entity>, relationships: Relationship[]) {
  const FROM_KEYS = ["from_account","from","sender","payer","debtor","from_acc","account_from","from_no","sender_acc"];
  const TO_KEYS = ["to_account","to","receiver","payee","creditor","to_acc","account_to","to_no","receiver_acc"];
  const AMT_KEYS = ["amount","amt","value","transaction_amount","txn_amount","sum","transfer_amount"];
  const DATE_KEYS = ["date","txn_date","transaction_date","datetime","timestamp","time"];
  const NAME_KEYS = ["name","sender_name","receiver_name","account_holder","holder"];

  const findCol = (row: Record<string,string>, keys: string[]) =>
    keys.map(k => row[k]).find(v => v && v.trim()) ?? null;

  rows.forEach((row, i) => {
    const from = findCol(row, FROM_KEYS);
    const to = findCol(row, TO_KEYS);
    const amount = findCol(row, AMT_KEYS);
    const date = findCol(row, DATE_KEYS) || dateStr;

    if (!from || !to) return;

    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    const fromId = `ACC-${hashStr(cleanFrom)}`;
    const toId = `ACC-${hashStr(cleanTo)}`;
    const label = amount ? `TRANSFERRED ₹${amount}` : "TRANSFERRED";

    if (!entitiesMap.has(fromId)) {
      entitiesMap.set(fromId, {
        id: fromId, type: "account", name: cleanFrom,
        attributes: { Type: "Bank Account", "TXN File": "yes" },
        caseIds: [caseId]
      });
    }
    if (!entitiesMap.has(toId)) {
      entitiesMap.set(toId, {
        id: toId, type: "account", name: cleanTo,
        attributes: { Type: "Bank Account", "TXN File": "yes" },
        caseIds: [caseId]
      });
    }

    const relId = `R-${hashStr(fromId + toId + i)}`;
    if (!relationships.find(r => r.id === relId)) {
      relationships.push({
        id: relId, source: fromId, target: toId,
        type: "transaction", label,
        date: date.slice(0, 10), recordIds: [recId]
      });
    }

    // Also extract person names from name columns
    const senderName = findCol(row, NAME_KEYS);
    if (senderName) {
      const nameTrimmed = senderName.trim();
      if (/^[A-Z][a-z]+/.test(nameTrimmed)) {
        const personId = `PER-${hashStr(nameTrimmed)}`;
        if (!entitiesMap.has(personId)) {
          entitiesMap.set(personId, {
            id: personId, type: "person", name: nameTrimmed,
            attributes: { Role: "Account holder", Extracted: dateStr },
            caseIds: [caseId]
          });
        }
        relationships.push({
          id: `R-${hashStr(personId + fromId)}`,
          source: personId, target: fromId,
          type: "association", label: "HOLDS",
          date: dateStr, recordIds: [recId]
        });
      }
    }
  });
}

// ─── Generic CSV parser (when column type is unknown) ──────────────────────

function extractFromGenericCSV(rows: Array<Record<string, string>>, caseId: string, recId: string, dateStr: string, entitiesMap: Map<string, Entity>, relationships: Relationship[]) {
  const PHONE_RE = /^(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,5}[-.\s]?\d{4,5}$|^\+?91\s?\d{5}\s?\d{5}$|^\d{10}$/;
  const ACCOUNT_RE = /^(?:A\/C\s*#?\s*)?[A-Z0-9]{4,}-?[A-Z0-9]{4,}$|^\d{8,18}$/;
  const NAME_RE = /^[A-Z][a-z]+(?: [A-Z][a-z]+)+$/;
  const AMOUNT_RE = /^(?:₹|INR|USD|Rs\.?)?\s*[\d,]+(?:\.\d+)?$/;

  rows.forEach((row, i) => {
    const values = Object.values(row);
    const keys = Object.keys(row);
    const phones: string[] = [];
    const accounts: string[] = [];
    const names: string[] = [];

    values.forEach((v, vi) => {
      const val = (v || '').trim();
      if (!val || val.length < 3) return;
      const key = keys[vi] || '';

      if (PHONE_RE.test(val) || key.toLowerCase().includes('phone') || key.toLowerCase().includes('number') || key.toLowerCase().includes('mobile')) {
        phones.push(val);
      } else if (ACCOUNT_RE.test(val) || key.toLowerCase().includes('account') || key.toLowerCase().includes('acc')) {
        accounts.push(val);
      } else if (NAME_RE.test(val) && val.split(' ').length >= 2) {
        names.push(val);
      } else if (AMOUNT_RE.test(val) && (key.toLowerCase().includes('amount') || key.toLowerCase().includes('amt'))) {
        // amount found but not an entity
      }
    });

    phones.forEach(p => {
      const id = `PHN-${hashStr(p)}`;
      if (!entitiesMap.has(id)) {
        entitiesMap.set(id, { id, type: "phone", name: p, attributes: { Extracted: dateStr }, caseIds: [caseId] });
      }
    });
    accounts.forEach(a => {
      const id = `ACC-${hashStr(a)}`;
      if (!entitiesMap.has(id)) {
        entitiesMap.set(id, { id, type: "account", name: a, attributes: { Extracted: dateStr }, caseIds: [caseId] });
      }
    });
    names.forEach(n => {
      const id = `PER-${hashStr(n)}`;
      if (!entitiesMap.has(id)) {
        entitiesMap.set(id, { id, type: "person", name: n, attributes: { Extracted: dateStr }, caseIds: [caseId] });
      }
    });

    // Link phones and accounts found in same row
    const allIds = [
      ...phones.map(p => `PHN-${hashStr(p)}`),
      ...accounts.map(a => `ACC-${hashStr(a)}`),
      ...names.map(n => `PER-${hashStr(n)}`),
    ];
    for (let a = 0; a < allIds.length; a++) {
      for (let b = a + 1; b < allIds.length; b++) {
        const aId = allIds[a]!; const bId = allIds[b]!;
        const relId = `R-${hashStr(aId + bId + i)}`;
        if (!relationships.find(r => r.id === relId)) {
          const aType = aId.startsWith('PHN') ? 'phone' : aId.startsWith('ACC') ? 'account' : 'person';
          const bType = bId.startsWith('PHN') ? 'phone' : bId.startsWith('ACC') ? 'account' : 'person';
          let type: RelationshipType = "association";
          let label = "ASSOCIATED WITH";
          if (aType === 'phone' && bType === 'phone') { type = "call"; label = "CALLED"; }
          else if (aType === 'account' || bType === 'account') { type = "transaction"; label = "FINANCIAL LINK"; }
          relationships.push({ id: relId, source: aId, target: bId, type, label, date: dateStr, recordIds: [recId] });
        }
      }
    }
  });
}

// ─── Plain text extractor ───────────────────────────────────────────────────

function extractFromPlainText(text: string, caseId: string, recId: string, dateStr: string, entitiesMap: Map<string, Entity>, relationships: Relationship[]) {
  // Phones
  const phoneRe = /(?:\+?91[-.\s]?)?\b(?:\d{5}[-.\s]?\d{5}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/g;
  const phones = Array.from(new Set(text.match(phoneRe) || []));
  phones.forEach(p => {
    const id = `PHN-${hashStr(p)}`;
    if (!entitiesMap.has(id)) {
      entitiesMap.set(id, { id, type: "phone", name: p.trim(), attributes: { Extracted: dateStr }, caseIds: [caseId] });
    }
  });

  // Accounts
  const accRe = /\b(?:A\/C|Account|Acc)[\s#]*([A-Za-z0-9-]{4,})\b/gi;
  Array.from(text.matchAll(accRe)).forEach(m => {
    const id = `ACC-${hashStr(m[1]!)}`;
    if (!entitiesMap.has(id)) {
      entitiesMap.set(id, { id, type: "account", name: `A/C ${m[1]}`, attributes: { Extracted: dateStr }, caseIds: [caseId] });
    }
  });

  // Locations
  text.split(/[\s,.;:!?()\n'"]+/).forEach((w, idx, arr) => {
    const lower = w.toLowerCase();
    const prev = (arr[idx - 1] || "").toLowerCase();
    const isCtx = ["in", "at", "near", "from", "to", "location", "via"].includes(prev);
    if ((KNOWN_LOCATIONS.has(lower) || (isCtx && /^[A-Z][a-z]{2,}$/.test(w))) && w.length > 2) {
      const id = `LOC-${hashStr(w.toLowerCase())}`;
      if (!entitiesMap.has(id)) {
        entitiesMap.set(id, { id, type: "location", name: cap(w), attributes: { Detected: dateStr }, caseIds: [caseId] });
      }
    }
  });

  // Person names (two+ capitalized words)
  const personRe = /\b([A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,})+)\b/g;
  Array.from(text.matchAll(personRe)).forEach(m => {
    const name = m[1]!.trim();
    if (SKIP_NAMES.has(name.toLowerCase())) return;
    const lower = name.toLowerCase();
    const isOrg = [...ORG_KEYWORDS].some(k => lower.includes(k));
    const type = isOrg ? "organization" : "person";
    const prefix = isOrg ? "ORG" : "PER";
    const id = `${prefix}-${hashStr(name)}`;
    if (!entitiesMap.has(id)) {
      entitiesMap.set(id, {
        id, type, name,
        attributes: isOrg ? { Type: "Corporate Entity" } : { Role: "Subject identified in text", Extracted: dateStr },
        ...(type === "person" ? { image: `/person-${(Math.abs(parseInt(hashStr(name), 36)) % 5) + 1}.png` } : {}),
        caseIds: [caseId]
      });
    }
  });

  // Single-word known orgs
  const orgRe = /\b(Tesla|Apple|Google|Microsoft|Amazon|Uber|Cisco|IBM|Infosys|TCS|Wipro|Meridian|Harbour|Reliance|HDFC|ICICI|SBI|Axis)\b/g;
  Array.from(text.matchAll(orgRe)).forEach(m => {
    const id = `ORG-${hashStr(m[1]!)}`;
    if (!entitiesMap.has(id)) {
      entitiesMap.set(id, { id, type: "organization", name: m[1]!, attributes: { Type: "Commercial Entity" }, caseIds: [caseId] });
    }
  });

  // Build relationships from co-occurring entities
  const entities = Array.from(entitiesMap.values());
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const e1 = entities[i]!; const e2 = entities[j]!;
      let type: RelationshipType = "association"; let label = "ASSOCIATED WITH";
      if (e1.type === "account" || e2.type === "account") { type = "transaction"; label = "FINANCIAL LINK"; }
      else if (e1.type === "phone" && e2.type === "phone") { type = "call"; label = "CALLED"; }
      else if (e1.type === "location" || e2.type === "location") { type = "location"; label = "LOCATED AT"; }
      relationships.push({ id: `R-${hashStr(e1.id + e2.id)}`, source: e1.id, target: e2.id, type, label, date: dateStr, recordIds: [recId] });
    }
  }
}

// ─── Detect file type and dispatch ─────────────────────────────────────────

function detectAndExtract(
  content: string,
  filename: string,
  caseId: string,
  recId: string,
  dateStr: string,
  entitiesMap: Map<string, Entity>,
  relationships: Relationship[]
) {
  const nameLower = filename.toLowerCase();
  const isCDR = nameLower.includes("cdr") || nameLower.includes("call");
  const isTXN = nameLower.includes("txn") || nameLower.includes("transaction") || nameLower.includes("bank") || nameLower.includes("ledger") || nameLower.includes("financial");
  const isCSV = nameLower.endsWith(".csv") || nameLower.endsWith(".tsv") || content.includes(",") || content.includes("\t");
  const isTXT = nameLower.endsWith(".txt");
  const isFIR = nameLower.includes("fir") || nameLower.includes("case") || isTXT;

  if (isCSV && !isFIR) {
    const rows = parseCSV(content);
    if (rows.length > 0) {
      if (isCDR) {
        extractFromCDR(rows, caseId, recId, dateStr, entitiesMap, relationships);
        return;
      }
      if (isTXN) {
        extractFromTXN(rows, caseId, recId, dateStr, entitiesMap, relationships);
        return;
      }
      // Unknown CSV — check first row for CDR-like or TXN-like columns
      const headers = Object.keys(rows[0] || {}).join(" ").toLowerCase();
      if (headers.includes("caller") || headers.includes("number_a") || headers.includes("called")) {
        extractFromCDR(rows, caseId, recId, dateStr, entitiesMap, relationships);
      } else if (headers.includes("from_account") || headers.includes("amount") || headers.includes("sender")) {
        extractFromTXN(rows, caseId, recId, dateStr, entitiesMap, relationships);
      } else {
        extractFromGenericCSV(rows, caseId, recId, dateStr, entitiesMap, relationships);
      }
      return;
    }
  }

  // Fallback: plain text NLP extraction
  extractFromPlainText(content, caseId, recId, dateStr, entitiesMap, relationships);
}

// ─── Main exported function ─────────────────────────────────────────────────

export function extractEntitiesFromText(text: string, caseId: string, filename = "input.txt"): ExtractionResult {
  if (!text || !text.trim()) {
    return { entities: [], relationships: [], supportingRecords: [], insights: [], timelineEvents: [] };
  }

  const entitiesMap = new Map<string, Entity>();
  const relationships: Relationship[] = [];
  const supportingRecords: SupportingRecord[] = [];
  const timelineEvents: TimelineEvent[] = [];
  const insights: Insight[] = [];

  const timestamp = new Date().toISOString();
  const dateStr = timestamp.slice(0, 10);
  const recId = `REC-${hashStr(caseId + timestamp)}`;

  supportingRecords.push({
    id: recId, kind: "FIR",
    title: `Analyzed: ${filename}`,
    date: dateStr,
    fields: {
      "File": filename,
      "Lines": String(text.split("\n").length),
      "Extracted At": timestamp,
      "Source": "Upload Analysis"
    }
  });

  detectAndExtract(text, filename, caseId, recId, dateStr, entitiesMap, relationships);

  const extractedEntities = Array.from(entitiesMap.values());

  if (extractedEntities.length > 0) {
    insights.push({
      id: `INS-${hashStr(caseId + timestamp)}`,
      headline: `Extracted ${extractedEntities.length} entities from ${filename}`,
      detail: `Identified ${extractedEntities.map(e => e.name).slice(0, 5).join(", ")}${extractedEntities.length > 5 ? ` and ${extractedEntities.length - 5} more` : ""}. Generated ${relationships.length} relationship links.`,
      confidence: "observation",
      recordIds: [recId]
    });

    timelineEvents.push({
      id: `EV-${hashStr(timestamp)}`,
      date: timestamp,
      type: relationships[0]?.type || "mention",
      title: `Data Ingestion — ${filename}`,
      description: `Ingested ${filename} and resolved ${extractedEntities.length} entities with ${relationships.length} connections.`,
      entityIds: extractedEntities.slice(0, 3).map(e => e.id),
      recordId: recId
    });
  }

  return { entities: extractedEntities, relationships, supportingRecords, insights, timelineEvents };
}
