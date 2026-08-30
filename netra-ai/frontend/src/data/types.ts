/**
 * NEXUS data contracts.
 *
 * These types describe the shape the UI consumes. The mock adapter in
 * `src/data/mock.ts` implements them today; a real backend (REST / Neo4j)
 * can later return the same shapes without any UI redesign.
 */

export type EntityType = "person" | "phone" | "account" | "location" | "organization";

export type RelationshipType = "call" | "transaction" | "location" | "mention" | "association";

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  /** Free-form fictional attributes rendered as a key/value list. */
  attributes: Record<string, string>;
  caseIds: string[];
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label: string;
  /** ISO date of the interaction. */
  date: string;
  recordIds: string[];
  is_ghost?: boolean;
  status?: string;
  conformal_confidence?: number;
}

export interface SupportingRecord {
  id: string;
  kind: "CDR" | "TXN" | "FIR" | "GEO";
  title: string;
  date: string;
  fields: Record<string, string>;
}

export type CaseStatus = "active" | "under-review" | "closed";
export type CasePriority = "low" | "medium" | "high" | "critical";

export interface InvestigationCase {
  id: string;
  name: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  createdAt: string;
  entityCount: number;
  relationshipCount: number;
  lead: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: RelationshipType;
  title: string;
  description: string;
  entityIds: string[];
  recordId: string;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
}

export interface Insight {
  id: string;
  headline: string;
  detail: string;
  confidence: "observation" | "pattern" | "cluster";
  recordIds: string[];
}
