# Replace Mock Data with Zustand Local Storage State

We will replace the static mock data in `netra-ai/frontend/src/data/mock.ts` with a real global state manager (Zustand + local storage). We'll track the "active case" so that the graph and dashboard reflect real data.

## User Review Required

- **Zustand Usage**: We will introduce `zustand` to manage state. We will define an `activeCaseId` to manage the isolation of entities per case.
- **Entity Extraction**: `upload.tsx` is currently based on file uploads. We'll add a simple mock extraction logic (or prompt the user for actual text) that generates real entities inside the Zustand store for the `activeCaseId`.

## Proposed Changes

### State Management (`src/store.ts`)
- [NEW] `src/store.ts` will define a Zustand store with interfaces for `cases`, `entities`, `relationships`, `supportingRecords`, `insights`, and `activeCaseId`. We will also add actions like `createCase`, `addEntities`, `addRelationships`, `setActiveCaseId`, etc. We'll use `zustand/middleware` for `persist` so state survives reloads.

### Data Model updates
- Modify global variables in `mock.ts` to be initial seed data in the Zustand store *or* remove them altogether in favor of an empty state that users fill out. We will remove the direct imports in components.

### Component Updates
- `dashboard.tsx`: Pull from `useStore(state => state.cases)`. Use `activeCaseId`.
- `investigation.tsx`: Pull entities and relationships belonging to `activeCaseId`.
- `cases.new.tsx`: Dispatch `createCase` to the store.
- `upload.tsx`: Read `activeCaseId`. On "Analyze", create some simulated entities / relationships in the store for the current active case.
- Update `HolographicGraph.tsx`, `NetworkGraph.tsx`, `TimelineList.tsx`, etc., to receive data as props or read directly from the store.

## Verification Plan

- Create a new case in the UI and verify it appears in the Cases list.
- Select the case, upload mock files, and run analysis.
- Verify that entities and relationships are added to that specific case and visible in the Investigation graph.
- Verify isolation (create another case, check that it's empty).
