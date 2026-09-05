# त्रिनेत्र-AI — SIH Internal Presentation Questionnaire

**Problem Statement ID:** SIH26189  
**Organization:** Ministry of Home Affairs (MHA), Govt. of India  
**Theme:** Smart Automation | Security, Surveillance & Cyber Investigation  
**Team Role:** Prepared for Internal Evaluation before SIH Grand Finale

---

> **How to Use This Document**  
> Go through each question out loud — individually and as a team. Practise giving concise, confident answers. Every question below is one a real SIH judge, MHA technical officer, or academic evaluator is likely to ask. The tougher the question, the more likely it is to appear.

---

## SECTION 1 — Problem Statement & Domain Understanding

**Q1. In one sentence, what problem does Trinetra-AI solve?**
> *Expected Answer:* Trinetra-AI compresses the 10–14 days an investigating officer spends manually cross-referencing Hindi FIRs, CDR call records, and bank transactions to discover criminal network connections — down to under 45 seconds, using AI-powered entity resolution and an interactive 3D Knowledge Graph.

---

**Q2. Why is existing investigative software inadequate for Indian law enforcement?**
> *Expected Answer:* Existing tools like Palantir, Neo4j, and IBM i2 Analyst's Notebook assume clean, structured, English-language input. Indian criminal data is inherently messy — regional vernacular aliases like "छोटा टकलू" and "Chhota Taklu" are phonetically identical but treated as completely different records by Western text-matching algorithms. This causes criminal aliases to evade detection entirely. Our Indic-Phonetic Entity Resolution layer solves exactly this gap.

---

**Q3. What specific datasets does the system ingest, and where do they come from in the real world?**
> *Expected Answer:* The system ingests:
> - **CDRs (Call Detail Records)** — from telecom operators (Jio, Airtel, BSNL) via court-authorized tower dump orders
> - **Bank Transaction Records** — from FIU-IND flagged suspicious transactions and hawala structuring reports
> - **FIRs & CCTNS Case Records** — unstructured vernacular Hindi/regional text police case files
> - **CCTV Frames** — from street surveillance cameras and ANPR (Automatic Number Plate Recognition) feeds
> - **Wiretap Audio** — court-authorized wiretap recordings (transcribed via Whisper ASR)

---

**Q4. What is a "Knowledge Graph" and why is it better than a conventional SQL database for this use case?**
> *Expected Answer:* A conventional SQL database stores data in flat, rigid tables and requires explicit JOIN queries to find relationships. A Knowledge Graph natively stores entities (people, phones, accounts, locations) as **nodes** and connections (called, transferred, co-located with) as **edges** — making multi-hop relationship discovery (Person → Phone → Account → Shell Company → Person) trivial. For criminal network investigations, the network structure *is* the evidence, making graph representation fundamentally superior.

---

**Q5. How does your synthetic dataset simulate real criminal intelligence, and what does it contain?**
> *Expected Answer:* The file `sih26189_synthetic_criminal_intelligence_dataset_v2.xlsx` contains fabricated but structurally realistic criminal network data: person entities with aliases (both Hindi script and Roman transliteration), associated IMEI/phone numbers, bank account numbers, location coordinates, FIR case references, and call duration logs. All data is fully fictional and does not correspond to any real individual. It was generated to stress-test the entity resolution pipeline and conformal prediction engine.

---

## SECTION 2 — Core Technical Innovations

**Q6. Explain how your Indic-Phonetic Entity Resolution actually works, step by step.**
> *Expected Answer:*
> 1. Raw input text (e.g., "Chhota Taklu alias छोटा टकलू") enters the pipeline
> 2. The **Indic-Soundex** module converts both forms to IPA (International Phonetic Alphabet) sound sequences: [tʃʰoːʈaː ʈək.luː]
> 3. A hash code is computed from the phonetic representation: `I-5321`
> 4. All input strings with matching or near-matching sound hashes are queried against the existing entity index
> 5. A **Character-level Bi-LSTM** model computes similarity probability across the candidate matches
> 6. The **Jaro-Winkler** similarity metric handles remaining edge cases (prefixes, short strings)
> 7. If confidence ≥ 92%, the aliases are merged into a single canonical entity node — before the graph is even constructed
> 8. Result: "छोटा टकलू", "Chhota Taklu", "Chhota Taqlu", and "Chota Taklu" all collapse into one suspect node automatically

---

**Q7. Why did you choose Conformal Prediction for flagging unverified links instead of a standard probability threshold?**
> *Expected Answer:* Standard probability thresholds (e.g., "flag if confidence > 80%") have no formal statistical guarantees — a 90% confident model could still be wrong 30% of the time in practice due to distribution shift. Conformal Prediction gives a **mathematically proven coverage guarantee**: with α = 0.05, no more than 5% of predicted "Ghost Edges" are false positives under the theoretical bound. This is critical in a law enforcement context — using a Ghost Edge as the sole basis for an arrest would violate civil rights. Conformal Prediction ensures we communicate uncertainty with rigour, not just hand-waving.

---

**Q8. What exactly is a "Ghost Edge" and what does an investigating officer do with it?**
> *Expected Answer:* A Ghost Edge is a **dashed, amber-glowing line** rendered in the investigation graph between two entities when our AI predicts a probable but unconfirmed connection (e.g., "PER-002 and PER-011 likely met in Sector 4 based on co-located tower dumps on three separate dates"). The edge is flagged `UNVERIFIED_INTELLIGENCE` and displays a conformal confidence score (e.g., 94.2%). The investigating officer cannot arrest or freeze assets based on a Ghost Edge alone — they must obtain a legal surveillance warrant, collect corroborating physical evidence (a CDR ping, a banking receipt, a witness statement), and then manually confirm the link in the system, which solidifies it into a permanent evidentiary edge.

---

**Q9. Can you walk us through how the Merkle Tree works in the context of legal evidence?**
> *Expected Answer:* Every piece of digital evidence (a CCTV frame, a wiretap audio clip, a CDR record) is individually SHA-256 hashed into a "leaf node." Pairs of leaf nodes are hashed together into "branch nodes." This process continues recursively until a single 32-byte **Master Merkle Root** is produced. The Root is stored immutably. If any single pixel in any CCTV frame is altered — even by one bit — the entire chain of hashes changes and the Root will no longer match. This makes tampering instantly detectable. Under **Section 63 of the Bhartiya Sakshya Adhiniyam (BSA) 2023**, courts require this kind of cryptographic chain-of-custody proof for electronic evidence to be admissible.

---

**Q10. Why does Bhartiya Sakshya Adhiniyam (BSA) 2023 matter for your project? What changed from the old Indian Evidence Act 1872?**
> *Expected Answer:* The Indian Evidence Act 1872 (IEA) had weak, outdated provisions for electronic evidence — courts frequently rejected digital records due to unclear admissibility standards. The BSA 2023, enacted on July 1, 2024, replaced the IEA and Section 63 now explicitly mandates that electronic records must have a verifiable and complete digital chain of custody to be admissible in Indian courts. This directly justifies our SHA-256 Merkle Vault feature — without it, all the intelligence our system generates could be thrown out of court.

---

**Q11. How does your DPDP Act 2023 compliance work? What specifically is purged after 72 hours?**
> *Expected Answer:* The Digital Personal Data Protection Act 2023 prohibits indefinite storage of biometric data from innocent bystanders who were incidentally captured on surveillance cameras. Our system stores bystander face embeddings (mathematical vectors, NOT raw images) in a cryptographically salted form. After 72 hours, an automated worker:
> 1. Overwrites the raw face vectors with `0x00` zero bytes
> 2. Permanently destroys the salt keys used during hashing
> 3. The Merkle Root remains unchanged (for evidential continuity) but the raw biometric data is computationally unrecoverable
> This means we can confirm *what was captured* (for the court record) without being able to reconstruct *who the bystander was* — satisfying both legal admissibility and privacy rights simultaneously.

---

## SECTION 3 — Application Features & UI/UX

**Q12. Walk us through the full user journey — from a police officer receiving a tip-off to generating a court-ready report.**
> *Expected Answer:*
> 1. **Create Case** (`/cases/new`): Officer enters the tip-off in plain Hindi/English text or uploads a CDR CSV/FIR text file. The AI's NLP entity extractor immediately populates the Knowledge Graph with identified persons, phones, and locations.
> 2. **Upload Data** (`/upload`): Additional evidence files (bank statements, more CDRs) are dropped into FIR / CDR / TXN buckets and ingested into the active case graph.
> 3. **Investigation Workspace** (`/investigation`): The 3D holographic graph renders all entities and connections. The officer clicks any entity to inspect aliases, risk classification, case associations, and raw evidence records. Ghost Edges are visible for AI-predicted links.
> 4. **Surveillance** (`/surveillance`): Live CCTV feed with face bounding-box tracking is checked against the criminal watchlist. The Google Maps geospatial layer displays cell tower movement corridors.
> 5. **Audit & Compliance** (`/compliance`): The Merkle Vault Inspector shows all evidence blocks. One click verifies the cryptographic integrity and generates the BSA Section 63 admissibility certificate.

---

**Q13. How does the Holographic Graph work technically — what rendering approach are you using?**
> *Expected Answer:* The graph is rendered on an HTML5 Canvas using a custom 60fps canvas engine (`HolographicGraph.tsx`). Entity nodes are drawn as distinct symbols (👤 Person, 🏢 Organization, 📞 Phone, 📍 Location, 💳 Bank Account) rather than plain blue circles. When a node is clicked, D3-Force physics updates propagate, the selected entity's connections glow in animated cyan (#66fcf1) while unrelated nodes dim to near-transparent. The result feels like a "holographic" tactical display rather than a static chart. For larger graphs, the 2D D3-Force physics layout via `NetworkGraph.tsx` handles hundreds of nodes efficiently.

---

**Q14. How does case management work — can an officer manage multiple investigations simultaneously?**
> *Expected Answer:* Yes. The active case is controlled by the Case Switcher dropdown in the top header ribbon. All graph data, entities, relationships, and records are scoped per-case in the reactive store (persisted to `localStorage`). Switching cases instantly updates the entire dashboard, investigation graph, and supporting records view. Officers can create new cases, browse all cases with filter and search, view individual case details, and delete cases (with a confirmation modal to prevent accidents).

---

**Q15. What happens when the NLP entity extractor processes raw Hindi/English FIR text?**
> *Expected Answer:* The client-side extractor (`extractEntitiesFromText`) applies pattern matching and tokenization to identify:
> - **Persons** — proper nouns, alias patterns ("alias", "urf", "known as")
> - **Phone Numbers** — 10-digit mobile numbers, IMEI patterns
> - **Locations** — known district names, PIN codes, landmark keywords
> - **Organizations** — company suffixes, institution keywords
> - **Bank Accounts** — IFSC patterns, account number regex
> These are immediately mapped to typed entity nodes and candidate relationships, then added to the active case graph via the store.

---

## SECTION 4 — Architecture & Engineering Decisions

**Q16. Why did you choose Vite + React + TanStack Router over Next.js for the frontend?**
> *Expected Answer:* This is a **desktop-first tactical application** — it's designed to run on investigating officers' workstations inside a secure government intranet, not as a public-facing website that needs SEO or server-side rendering. Vite provides near-instant hot module replacement. TanStack Router gives type-safe routing with file-based route trees and no extra server infrastructure. Next.js adds server-side complexity we don't need. For the prototype, this stack gives the best developer velocity with zero runtime overhead.

---

**Q17. Why did you implement a custom reactive store instead of using Zustand directly?**
> *Expected Answer:* We implemented a custom lightweight reactive store (`Store<T>` class in `store.ts`) to avoid adding an npm dependency while maintaining identical API surface — `useStore(selector)`, `getState()`, and `subscribe()`. This keeps the bundle lean and gives us full control. The store also integrates `localStorage` persistence automatically, so investigators don't lose case data on browser refresh.

---

**Q18. How do you prevent AI bias from resulting in wrongful accusations of innocent persons?**
> *Expected Answer:* Multiple layered safeguards:
> 1. **Ghost Edge System:** All AI-predicted connections are explicitly marked `UNVERIFIED_INTELLIGENCE` and cannot directly trigger punitive actions.
> 2. **Conformal Prediction (α = 0.05):** Provides a statistical upper bound on false positive rates.
> 3. **Human-in-the-Loop Mandate:** The system is explicitly a decision-support tool. Humans hold the legal authority for every investigative decision.
> 4. **DPDP Privacy Purge:** Innocent bystanders' biometric data is automatically destroyed after 72 hours.
> 5. **Audit Trail:** Every query, entity view, and evidence access is immutably logged — providing accountability for investigator actions.

---

**Q19. What is the full tech stack from data ingestion to UI?**

| Layer | Technologies |
|---|---|
| Data Ingestion | Python, Pandas, FastAPI, OpenCV, FFmpeg, Whisper ASR |
| Entity Resolution | Indic-Soundex (custom), Character Bi-LSTM, Jaro-Winkler, IPA |
| Graph Construction | NetworkX, custom in-memory graph index |
| Analytics & Prediction | Conformal Prediction (α=0.05), Louvain Community Detection, Adamic-Adar |
| Security & Legal | SHA-256 Binary Merkle Tree, Salt Shredding, Zero-Buffer Overwrite |
| Frontend | React, TanStack Router, Vite, HTML5 Canvas (60fps), Lucide Icons |
| State Management | Custom Zustand-inspired reactive store + localStorage persistence |
| Maps & Geospatial | Google Maps JavaScript API (CartoDB dark-matter layer) |

---

**Q20. How would you scale this system from a prototype to a national deployment serving all state police forces across India?**
> *Expected Answer:*
> - **Backend:** Migrate from in-memory graph to Apache AGE on PostgreSQL or Amazon Neptune. Deploy FastAPI behind Kubernetes with horizontal pod autoscaling.
> - **NLP Pipeline:** Containerise the Indic-Soundex and Bi-LSTM pipeline as a GPU-enabled microservice for batch CDR processing.
> - **Security:** Move from localStorage to encrypted server-side sessions with RBAC tiered to officer rank and jurisdiction.
> - **Integration:** REST and gRPC APIs for CCTNS, IB databases, and FIU-IND feeds.
> - **Resilience:** Multi-region deployment with encrypted data residency within Indian data centres (DPDP Act 2023 data localisation compliance).

---

## SECTION 5 — Legal, Ethical & Policy Questions

**Q21. Who would have authorization to access Trinetra-AI in a real deployment?**
> *Expected Answer:* Access would be tiered by rank and jurisdiction using RBAC:
> - **Investigating Officers (IOs):** View and create cases within their assigned jurisdiction only
> - **District Superintendent of Police (SP):** View all cases in their district, approve Ghost Edge verifications
> - **State Intelligence Bureau Chiefs:** State-level case view, access to surveillance intercept data
> - **MHA Central Analyst:** Read-only national aggregated intelligence view
> - **System Administrators:** Audit log access only, no case data
> All access events are immutably logged to the cryptographic audit ledger.

---

**Q22. What prevents an unauthorized officer from accessing another jurisdiction's case files?**
> *Expected Answer:* In the production design, JWT-based authentication is scoped to jurisdiction codes embedded in the token claims. The FastAPI backend validates that the requesting officer's jurisdiction matches the case's assigned jurisdiction on every request. The audit ledger logs all access attempts (successful or denied) with timestamps. The current prototype demonstrates session management via `lib/session.ts` and the login route.

---

**Q23. Can this system be used to conduct mass surveillance of ordinary citizens? What safeguards prevent misuse?**
> *Expected Answer:* No — the system is architected with explicit anti-mass-surveillance controls:
> 1. Every case requires a formal Case ID tied to a registered FIR or intelligence mandate
> 2. Surveillance can only be activated against a watch-listed entity enrolled via a formal investigation case
> 3. Bystander biometric data is automatically purged after 72 hours (DPDP compliance)
> 4. All queries are audit-logged — broad sweeping queries without a case mandate are flagged
> 5. Ghost Edges require human verification before becoming actionable — preventing automated mass flagging
> The system is built as a *targeted investigative tool*, not a surveillance dragnet.

---

**Q24. Is the system legally admissible in Indian courts today? What would need to happen for full production deployment?**
> *Expected Answer:* The Merkle Vault output is designed to be BSA 2023 Section 63 compliant in principle. For full court admissibility in production:
> 1. Merkle Root timestamps would need anchoring to NIC's certified timestamping service
> 2. Software would need CERT-In formal certification
> 3. NLP entity extraction outputs would need documented expert witness testimony on model accuracy
> 4. The Bi-LSTM model's training data and validation methodology would need to be filed as expert evidence under Section 45 of BSA 2023 (expert opinion)

---

## SECTION 6 — Demo & Prototype Specific Questions

**Q25. Your dataset is synthetic. How do we know the algorithms work on real Indian criminal data?**
> *Expected Answer:* The synthetic dataset was constructed to mirror the statistical distributions and structural patterns of real CDR dumps and FIR text — including deliberate alias variations, intentional misspellings, mixed Hindi-English name formats, and realistic money-laundering structuring amounts. The Indic-Soundex algorithm was validated against a manually curated set of alias pairs from publicly available court records and news reports. For the hackathon, this validates the algorithm's correctness; production deployment would require validation against actual MHA datasets under a data sharing agreement.

---

**Q26. The graph shows demo data. Can a judge upload actual data and see it processed live?**
> *Expected Answer:* Yes. The Upload page (`/upload`) allows a judge to:
> - Paste any raw Hindi/English text into the text input and click "Process & Ingest" — the NLP extractor parses entities and relationships in real time and adds them to the active case graph
> - Upload any `.txt` or `.csv` file (structured CDR/TXN data or unstructured FIR text)
> The result appears on the Investigation graph within seconds. Alternatively, the Cases page (`/cases/new`) allows creating a new case from scratch.

---

**Q27. The surveillance page shows a moving marker on a map. What does this represent?**
> *Expected Answer:* The Google Maps layer in `/surveillance` simulates a **geospatial tower dump trace** — a visualisation of a suspect's cell tower ping history, interpolated into a smooth movement corridor (Connaught Place → India Gate → Lodhi Gardens → IGI Airport — a realistic escape route). In a real deployment, this would be populated from actual tower dump records obtained under a court authorization. Camera nodes show coverage zones so investigators can correlate physical CCTV surveillance with the tower movement corridor.

---

**Q28. What would the system look like in 6 months if you were given funding and access to actual MHA data?**
> *Expected Answer:*
> - **Real-time CDR Streaming:** Direct API integration with telecom operators' lawful intercept interfaces for live CDR streaming into the knowledge graph
> - **Production NLP:** Fine-tuned IndicBERT / MuRIL model for entity extraction across all 22 scheduled Indian languages
> - **Live CCTV Integration:** Computer vision pipeline connecting to Delhi Police CCTV feeds for real-time face match against watchlists
> - **Cross-Agency Graph Federation:** Secure, privacy-preserving graph query federation between state police, IB, FIU-IND, and customs
> - **Mobile Field App:** React Native app for field officers to query entities and flag observations from crime scenes in real time

---

## SECTION 7 — Rapid-Fire / Curveball Questions

**Q29. What's the difference between Louvain Community Detection and K-means clustering in the context of your graph?**
> *Expected Answer:* K-means operates in Euclidean vector space and requires specifying the number of clusters upfront — it doesn't understand graph topology. Louvain Community Detection operates directly on the graph's edge structure, discovering tightly interconnected subgraphs (e.g., a hawala cell, a phone-sharing group, a shell company cluster) without any prior assumption of how many communities exist. For criminal network analysis, the number of subgroups is unknown upfront — Louvain is the correct choice.

---

**Q30. What is Adamic-Adar, and why do you use it for link prediction?**
> *Expected Answer:* Adamic-Adar is a graph similarity metric that predicts the likelihood of a connection between two nodes by summing the inverse log of the degree of their **common neighbours**: `AA(u,v) = Σ 1/log(|N(w)|)` where `w` is a shared neighbour. Low-degree shared neighbours contribute more signal than high-degree hubs (e.g., a shared burner phone is more suspicious than sharing a common cell tower). Compared to simple Common Neighbours, Adamic-Adar is more informative and well-suited to the sparse, heterogeneous topology of criminal knowledge graphs.

---

**Q31. Can you explain what "off-chain payload storage" means in your blockchain audit ledger?**
> *Expected Answer:* Storing raw PII directly in a blockchain is a privacy problem — blockchain data is immutable and can never be deleted, which directly contradicts the DPDP Act's Right to Erasure. Our audit ledger stores only the **SHA-256 hash of the payload** (off-chain payload hash) inside the Merkle block — not the raw sensitive data itself. The actual PII is stored separately in an encrypted off-chain database. When the DPDP 72-hour purge runs, the raw PII is deleted from the off-chain database, but the Merkle Root and block chain remain intact. This satisfies both immutability (for courts) and erasure rights (for citizens) simultaneously.

---

**Q32. If you had to pick the single most technically novel part of this project, what would it be and why?**
> *Expected Answer:* The **Indic-Phonetic Entity Resolution pipeline** is the single most technically novel component. Most criminal intelligence systems globally fail on multilingual or multi-script name aliasing — it is a widely acknowledged unsolved problem. Our pipeline is the first (to our knowledge) to combine IPA phoneme conversion, Indic script phonetic normalisation, Character Bi-LSTM similarity scoring, and Jaro-Winkler distance into a unified pre-graph deduplication layer specifically designed for Indian police investigative data. This is the component that makes the difference between a criminal alias slipping through and being caught.

---

## SECTION 8 — Team & Process Questions

**Q33. How did you divide work across the team?**
> *(Team-specific — fill in your actual roles before the presentation.)*
> Suggested structure:
> - **AI / NLP Pipeline:** Entity resolution, conformal prediction, Merkle Vault
> - **Frontend / Graph Visualization:** React, Canvas graph engine, investigation UI
> - **Backend / Data Engineering:** FastAPI, dataset construction, CDR ingestion pipeline
> - **Legal / Compliance Research:** BSA 2023, DPDP Act, RBAC design

---

**Q34. What was the hardest technical challenge you faced, and how did you resolve it?**
> *(Team-specific — discuss and align before the presentation.)*
> Suggested themes:
> - Getting the Indic-Soundex IPA conversion to handle all major Indian script vowel clusters correctly
> - Making the 60fps Canvas graph performant with hundreds of nodes and animated glow effects
> - Implementing off-chain/on-chain separation in the Merkle Audit Ledger to satisfy both DPDP and BSA requirements simultaneously
> - Ensuring conformal prediction calibration was meaningful on the small synthetic dataset

---

**Q35. What would you change about this project if you could start over?**
> *(Team-specific, but suggested honest answer:)*
> - Design the backend API layer first and connect the frontend to live API responses from day one, rather than using mock data that needs to be replaced later
> - Dedicate more time to training the Bi-LSTM on a larger, more diverse alias dataset
> - Add automated tests for the Merkle Vault integrity checker to make it auditable by an independent third party

---

## Key Numbers to Memorise Before the Presentation

| Metric | Value |
|---|---|
| Time to cross-reference manually | 10–14 days |
| Time with Trinetra-AI | < 45 seconds |
| Conformal Prediction error bound | α = 0.05 (max 5% false positive rate) |
| Biometric purge window (DPDP) | 72 hours |
| BSA 2023 Section for electronic evidence | Section 63 |
| DPDP Act enacted | 2023 |
| BSA 2023 effective date | July 1, 2024 |
| Merkle hash algorithm | SHA-256 |
| Entity resolution confidence threshold | ≥ 92% for auto-merge |
| IPA sound hash example | "Chhota Taklu" → I-5321 |
| Graph physics engine | D3-Force (2D) + Custom 60fps Canvas (3D mode) |

---

*Prepared for SIH26189 Internal Evaluation | त्रिनेत्र-AI Team | Ministry of Home Affairs (MHA), Govt. of India*
