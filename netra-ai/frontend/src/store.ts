import { useStore } from 'zustand';
import { useState, useEffect } from 'react';
import type { InvestigationCase, Entity, Relationship, SupportingRecord, Insight, TimelineEvent, ActivityItem } from './data/types';
import { cases as initialCases, entities as initialEntities, relationships as initialRelationships, supportingRecords as initialRecords, insights as initialInsights, timelineEvents as initialTimeline, activity as initialActivity } from './data/mock';
import type { ExtractionResult } from './utils/entityExtractor';

type Listener = () => void;

class Store<T> {
  private state: T;
  private listeners: Set<Listener> = new Set();
  
  constructor(private createState: (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T) {
    let saved = null;
    if (typeof window !== 'undefined') {
      try {
        saved = localStorage.getItem('netra_store_v3');
      } catch (e) {
        console.warn('Failed to read from localStorage:', e);
      }
    }
    
    const initialState = createState(this.set.bind(this), this.get.bind(this));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state = { ...initialState, ...parsed };
      } catch (e) {
        this.state = initialState;
      }
    } else {
      this.state = initialState;
    }
  }
  
  private get = () => this.state;
  
  private set = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextState = typeof partial === 'function' ? (partial as any)(this.state) : partial;
    this.state = { ...this.state, ...nextState };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('netra_store_v3', JSON.stringify(this.state));
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }
    }
    this.listeners.forEach(l => l());
  }
  
  public subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  public getState = () => this.state;
}

export function create<T>(createState: (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T) {
  const store = new Store(createState);
  
  const useStore = function<U>(selector: (state: T) => U = (s) => s as any): U {
    const [state, setState] = useState(() => selector(store.getState()));
    
    useEffect(() => {
      const handleStateChange = () => {
        setState(selector(store.getState()));
      };
      return store.subscribe(handleStateChange);
    }, [selector]); 
    
    return state;
  };
  useStore.getState = store.getState.bind(store);
  return useStore;
}

export interface StoreState {
  activeCaseId: string;
  cases: InvestigationCase[];
  entities: Entity[];
  relationships: Relationship[];
  supportingRecords: SupportingRecord[];
  insights: Insight[];
  timelineEvents: TimelineEvent[];
  activity: ActivityItem[];
  
  setActiveCaseId: (id: string) => void;
  addCase: (c: InvestigationCase) => void;
  addEntities: (ents: Entity[]) => void;
  addRelationships: (rels: Relationship[]) => void;
  addRecords: (recs: SupportingRecord[]) => void;
  addExtractedDataForCase: (caseId: string, extracted: ExtractionResult) => void;
  resetToDemoState: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  activeCaseId: "CASE-2041", // Default to the demo case
  cases: initialCases,
  entities: initialEntities,
  relationships: initialRelationships,
  supportingRecords: initialRecords,
  insights: initialInsights,
  timelineEvents: initialTimeline,
  activity: initialActivity,
  
  setActiveCaseId: (id) => set({ activeCaseId: id }),
  
  addCase: (c) => set((state) => ({
    cases: [c, ...state.cases.filter((existing) => existing.id !== c.id)],
    activeCaseId: c.id,
    activity: [
      { id: `AC-${Date.now()}`, actor: "You", action: "created new case", target: c.name, at: "Just now" },
      ...state.activity,
    ]
  })),

  addEntities: (ents) => set((state) => ({
    entities: [...state.entities, ...ents.filter(newE => !state.entities.some(e => e.id === newE.id))]
  })),

  addRelationships: (rels) => set((state) => ({
    relationships: [...state.relationships, ...rels.filter(newR => !state.relationships.some(r => r.id === newR.id))]
  })),

  addRecords: (recs) => set((state) => ({
    supportingRecords: [...state.supportingRecords, ...recs.filter(newRec => !state.supportingRecords.some(r => r.id === newRec.id))]
  })),

  addExtractedDataForCase: (caseId, extracted) => set((state) => {
    const newEnts = extracted.entities.map(e => ({
      ...e,
      caseIds: Array.from(new Set([...(e.caseIds || []), caseId]))
    }));

    // Combine entities and ensure uniqueness
    const updatedEntities = [...state.entities];
    newEnts.forEach(ne => {
      const idx = updatedEntities.findIndex(e => e.id === ne.id);
      if (idx >= 0) {
        const existing = updatedEntities[idx];
        updatedEntities[idx] = {
          ...existing,
          caseIds: Array.from(new Set([...(existing.caseIds || []), caseId]))
        };
      } else {
        updatedEntities.push(ne);
      }
    });

    const newRels = extracted.relationships.map(r => ({ ...r, caseId }));
    const updatedRels = [...state.relationships];
    newRels.forEach(nr => {
      if (!updatedRels.some(r => r.id === nr.id)) {
        updatedRels.push(nr);
      }
    });

    const newRecords = extracted.supportingRecords.map(rec => ({ ...rec, caseId }));
    const updatedRecords = [...state.supportingRecords];
    newRecords.forEach(nrec => {
      if (!updatedRecords.some(r => r.id === nrec.id)) {
        updatedRecords.push(nrec);
      }
    });

    const newTimeline = extracted.timelineEvents.map(ev => ({ ...ev, caseId }));
    const updatedTimeline = [...state.timelineEvents];
    newTimeline.forEach(ev => {
      if (!updatedTimeline.some(t => t.id === ev.id)) {
        updatedTimeline.push(ev);
      }
    });

    const newInsights = extracted.insights.map(ins => ({ ...ins, caseId }));
    const updatedInsights = [...state.insights];
    newInsights.forEach(ins => {
      if (!updatedInsights.some(i => i.id === ins.id)) {
        updatedInsights.push(ins);
      }
    });

    // Update case counts
    const activeEntitiesForCase = updatedEntities.filter(e => e.caseIds?.includes(caseId));
    const activeRelsForCase = updatedRels.filter(r => 
      r.caseId === caseId || (activeEntitiesForCase.some(e => e.id === r.source) && activeEntitiesForCase.some(e => e.id === r.target))
    );

    const updatedCases = state.cases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          entityCount: activeEntitiesForCase.length,
          relationshipCount: activeRelsForCase.length
        };
      }
      return c;
    });

    return {
      entities: updatedEntities,
      relationships: updatedRels,
      supportingRecords: updatedRecords,
      timelineEvents: updatedTimeline,
      insights: updatedInsights,
      cases: updatedCases,
      activity: [
        { id: `AC-${Date.now()}`, actor: "You", action: `analyzed input (${extracted.entities.length} entities extracted)`, target: caseId, at: "Just now" },
        ...state.activity
      ]
    };
  }),

  resetToDemoState: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('netra_store_v3');
      } catch (err) {}
    }
    set({
      activeCaseId: "CASE-2041",
      cases: initialCases,
      entities: initialEntities,
      relationships: initialRelationships,
      supportingRecords: initialRecords,
      insights: initialInsights,
      timelineEvents: initialTimeline,
      activity: initialActivity
    });
  }
}));

// Helper Selectors for Components
export function getActiveCaseEntities(state: StoreState): Entity[] {
  const caseId = state.activeCaseId;
  return state.entities.filter((e) => e.caseIds?.includes(caseId));
}

export function getActiveCaseRelationships(state: StoreState): Relationship[] {
  const activeEntities = getActiveCaseEntities(state);
  const activeEntityIds = new Set(activeEntities.map((e) => e.id));
  const caseId = state.activeCaseId;

  return state.relationships.filter((r) => {
    if (r.caseId && r.caseId === caseId) return true;
    return activeEntityIds.has(r.source) && activeEntityIds.has(r.target);
  });
}

export function getActiveCaseTimeline(state: StoreState): TimelineEvent[] {
  const caseId = state.activeCaseId;
  const activeEntities = getActiveCaseEntities(state);
  const activeEntityIds = new Set(activeEntities.map((e) => e.id));

  return state.timelineEvents.filter((ev) => {
    if (ev.caseId && ev.caseId === caseId) return true;
    return ev.entityIds?.some((id) => activeEntityIds.has(id));
  });
}

export function getActiveCaseInsights(state: StoreState): Insight[] {
  const caseId = state.activeCaseId;
  return state.insights.filter((ins) => !ins.caseId || ins.caseId === caseId);
}

export function getActiveCaseRecords(state: StoreState): SupportingRecord[] {
  const caseId = state.activeCaseId;
  return state.supportingRecords.filter((rec) => !rec.caseId || rec.caseId === caseId);
}
