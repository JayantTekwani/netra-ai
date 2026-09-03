import type { Entity, Relationship, SupportingRecord, Insight, TimelineEvent, EntityType, RelationshipType } from "@/data/types";

export interface ExtractionResult {
  entities: Entity[];
  relationships: Relationship[];
  supportingRecords: SupportingRecord[];
  insights: Insight[];
  timelineEvents: TimelineEvent[];
}

const KNOWN_LOCATIONS = [
  "jaipur", "california", "delhi", "mumbai", "bangalore", "bengaluru", "hyderabad", 
  "chennai", "kolkata", "pune", "ahmedabad", "fictionpur", "mockgaon", "samplepur", 
  "sector 14", "riverside depot", "transit hub", "lodhi", "connaught place", "igi airport"
];

const ORG_SUFFIXES = [
  "traders", "logistics", "technologies", "corp", "corporation", "inc", "ltd", 
  "limited", "bank", "startup", "firm", "solutions", "enterprises", "tesla", "google", "apple"
];

/**
 * Deterministic Entity & Relationship Extractor.
 * Given raw text input and a caseId, extracts entities (People, Phones, Accounts, Locations, Organizations)
 * and connects them into a graph structure.
 */
export function extractEntitiesFromText(text: string, caseId: string): ExtractionResult {
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
  const recId = `REC-${Math.floor(1000 + Math.random() * 9000)}`;

  // Create supporting record for raw input
  supportingRecords.push({
    id: recId,
    kind: "FIR",
    title: "Analyzed Text Input",
    date: dateStr,
    fields: {
      "Input Snippet": text.slice(0, 80) + (text.length > 80 ? "..." : ""),
      "Extracted At": timestamp,
      "Source": "User Input Analysis"
    }
  });

  // 1. Phone number extraction (\+?\d{1,3}[-.\s]?\d{4,5}[-.\s]?\d{4,5} or 10-digit numbers)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b9\d{9}\b|\b\+91\s?\d{5}\s?\d{5}\b/g;
  const phonesFound = Array.from(new Set(text.match(phoneRegex) || []));
  phonesFound.forEach((phoneStr) => {
    const cleanPhone = phoneStr.trim();
    const id = `PHN-${hashString(cleanPhone)}`;
    if (!entitiesMap.has(id)) {
      entitiesMap.set(id, {
        id,
        type: "phone",
        name: cleanPhone,
        attributes: { Operator: "Detected Telecom", "Extracted": dateStr },
        caseIds: [caseId]
      });
    }
  });

  // 2. Account / Currency amount extraction (₹ 50,000, $1.2M, A/C 8891-0042)
  const accountRegex = /\b(?:A\/C|Account|Acc|A\/c)\s*#?\s*([A-Za-z0-9-]+)\b|\b(?:₹|\$|INR|USD)\s*[\d,]+(?:\.\d+)?\b/gi;
  const accountsFound = Array.from(new Set(text.match(accountRegex) || []));
  accountsFound.forEach((accStr) => {
    const cleanAcc = accStr.trim();
    const id = `ACC-${hashString(cleanAcc)}`;
    if (!entitiesMap.has(id)) {
      entitiesMap.set(id, {
        id,
        type: "account",
        name: cleanAcc.startsWith("A/C") || cleanAcc.startsWith("Acc") ? cleanAcc : `Transfer ${cleanAcc}`,
        attributes: { Type: "Financial Instrument", Amount: cleanAcc },
        caseIds: [caseId]
      });
    }
  });

  // 3. Known / Detected Location extraction
  const words = text.split(/[\s,.;:!?()'"]+/);
  words.forEach((w, idx) => {
    const lower = w.toLowerCase();
    const prevWord = idx > 0 ? words[idx - 1].toLowerCase() : "";
    const isLocationKeyword = ["in", "at", "near", "from", "to", "location"].includes(prevWord);
    const isKnownLoc = KNOWN_LOCATIONS.includes(lower);

    if ((isKnownLoc || (isLocationKeyword && /^[A-Z][a-z]+$/.test(w))) && w.length > 2) {
      const locName = capitalize(w);
      const id = `LOC-${hashString(locName)}`;
      if (!entitiesMap.has(id)) {
        entitiesMap.set(id, {
          id,
          type: "location",
          name: locName,
          attributes: { Category: "Geographic Location", Detected: dateStr },
          caseIds: [caseId]
        });
      }
    }
  });

  // 4. Person Name extraction (Capitalized word pairs like "Rahul Sharma", "Amit Verma", "Elon Musk")
  const personRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  const personMatches = Array.from(text.matchAll(personRegex));
  personMatches.forEach((m) => {
    const nameCandidate = m[1].trim();
    const lowerName = nameCandidate.toLowerCase();
    
    // Ignore if matches known org suffixes or common stopwords
    const isOrg = ORG_SUFFIXES.some((s) => lowerName.includes(s));
    const isCommonHeader = ["Case Created", "User Input", "Data Analysis", "Operation Meridian", "Call Detail"].includes(nameCandidate);

    if (isOrg) {
      const id = `ORG-${hashString(nameCandidate)}`;
      if (!entitiesMap.has(id)) {
        entitiesMap.set(id, {
          id,
          type: "organization",
          name: nameCandidate,
          attributes: { Type: "Corporate Entity" },
          caseIds: [caseId]
        });
      }
    } else if (!isCommonHeader) {
      const id = `PER-${hashString(nameCandidate)}`;
      if (!entitiesMap.has(id)) {
        entitiesMap.set(id, {
          id,
          type: "person",
          name: nameCandidate,
          attributes: { Role: "Subject identified in text", Extracted: dateStr },
          image: `/person-${(Math.abs(hashString(nameCandidate)) % 5) + 1}.png`,
          caseIds: [caseId]
        });
      }
    }
  });

  // 5. Explicit single-word Org extraction (e.g. "Tesla", "Apple", "Google")
  const orgSingleRegex = /\b(Tesla|Apple|Google|Microsoft|Amazon|Uber|Cisco|IBM|Infosys|TCS|Wipro|Meridian|Harbour)\b/gi;
  const orgMatches = Array.from(text.matchAll(orgSingleRegex));
  orgMatches.forEach((m) => {
    const orgName = m[1].trim();
    const id = `ORG-${hashString(orgName)}`;
    if (!entitiesMap.has(id)) {
      entitiesMap.set(id, {
        id,
        type: "organization",
        name: orgName,
        attributes: { Type: "Commercial Entity" },
        caseIds: [caseId]
      });
    }
  });

  const extractedEntities = Array.from(entitiesMap.values());

  // 6. Connect extracted entities into relationships
  // If multiple entities exist, link them logically based on co-occurrence
  for (let i = 0; i < extractedEntities.length; i++) {
    for (let j = i + 1; j < extractedEntities.length; j++) {
      const e1 = extractedEntities[i];
      const e2 = extractedEntities[j];

      let relType: RelationshipType = "association";
      let label = "ASSOCIATED WITH";

      if (e1.type === "account" || e2.type === "account") {
        relType = "transaction";
        label = "FINANCIAL LINK";
      } else if (e1.type === "phone" && e2.type === "phone") {
        relType = "call";
        label = "CALLED";
      } else if (e1.type === "location" || e2.type === "location") {
        relType = "location";
        label = "LOCATED AT / OCCURRED IN";
      } else if (e1.type === "person" && e2.type === "person") {
        relType = "association";
        label = "CO-MENTIONED / ASSOCIATED";
      }

      relationships.push({
        id: `R-${hashString(e1.id + e2.id)}`,
        source: e1.id,
        target: e2.id,
        type: relType,
        label,
        date: dateStr,
        recordIds: [recId]
      });
    }
  }

  // 7. Generate case-specific Insight
  if (extractedEntities.length > 0) {
    insights.push({
      id: `INS-${hashString(caseId + timestamp)}`,
      headline: `Extracted ${extractedEntities.length} entities from input`,
      detail: `Identified ${extractedEntities.map(e => e.name).join(", ")}. Generated ${relationships.length} relationship link(s).`,
      confidence: "observation",
      recordIds: [recId]
    });

    timelineEvents.push({
      id: `EV-${hashString(timestamp)}`,
      date: timestamp,
      type: relationships[0]?.type || "mention",
      title: `Input Extraction Run`,
      description: `Ingested text snippet and resolved ${extractedEntities.length} connected entities.`,
      entityIds: extractedEntities.slice(0, 3).map(e => e.id),
      recordId: recId
    });
  }

  return {
    entities: extractedEntities,
    relationships,
    supportingRecords,
    insights,
    timelineEvents
  };
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
