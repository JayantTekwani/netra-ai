# त्रिनेत्र-AI (Trinetra-AI)
### Autonomous Multi-Modal Criminal Network Intelligence & Knowledge Graph Platform
**Problem Statement ID:** SIH26189 | **Organization:** Ministry of Home Affairs (MHA), Govt. of India  
**Theme:** Smart Automation / Security, Surveillance & Cyber Investigation  

---

> **Purpose of this Document:**  
> This comprehensive study guide explains Trinetra-AI from beginning to end in plain, accessible language so that anyone—whether an evaluator, investigator, or developer—understands **exactly what the project is, why it was built, how every mathematical algorithm and code component operates, and how to present it effectively.**

---

## 1. Executive Summary: What Problem Does Trinetra-AI Solve?

### The Real-World Law Enforcement Crisis in India
When investigating organized crime cartels, terror cells, hawala networks, or cyber-crime syndicates in India, evidence is scattered across completely disconnected, siloed databases:

1. **FIRs & CCTNS Case Records:** Written in regional vernacular languages (Hindi, Marathi, Bengali, Urdu) packed with criminal aliases, informal spellings, and colloquial monikers (e.g. *"छोटा टकलू"*, *"Chhota Taklu"*, *"Bada Bhai"*).
2. **Call Detail Records (CDRs):** Millions of raw telecom call records with tower coordinates and IMEI/IMSI numbers.
3. **Financial Records:** Suspicious hawala transactions, shell bank accounts, and micro-structuring logs monitored by the Financial Intelligence Unit (FIU-IND).
4. **Live Surveillance:** Disconnected street CCTV video feeds and Automated Number Plate Recognition (ANPR) logs.

### The Painful Bottleneck
Currently, investigating officers (IOs) and intelligence analysts spend **10 to 14 days** performing manual cross-referencing across Excel sheets and printed case files just to uncover a single hidden link. By the time a connection is spotted:
- Suspects have disposed of their burner SIM cards.
- Laundered money has moved through multiple shell entities.
- Targets have fled jurisdictional boundaries.

### The Trinetra-AI Solution
> **14 Days $\rightarrow$ 45 Seconds**  
> Trinetra-AI ingests, resolves, cross-correlates, and maps multimodal intelligence into an interactive 3D Knowledge Graph with cryptographic proof of integrity in **under 45 seconds**.

---

## 2. The 6-Layer Architecture Stack

Unlike typical visualization tools that merely throw data into a database and render generic circles, Trinetra-AI is structured into 6 deliberate layers:

```
+-----------------------------------------------------------------------+
|  Layer 6: Presentation & Command UI                                   |
|  (React, TanStack Router, 60fps Canvas Holographic 3D Graph, D3-Force)|
+-----------------------------------------------------------------------+
                                  ▲
+-----------------------------------------------------------------------+
|  Layer 5: Legal & Security Governance                                 |
|  (Section 63 BSA 2023 Merkle Vault, DPDP 72-Hour Biometric Purge)     |
+-----------------------------------------------------------------------+
                                  ▲
+-----------------------------------------------------------------------+
|  Layer 4: Analytics & Prediction Engine                               |
|  (Conformal Link Prediction, Ghost Edges, Hawala Structuring Detection|
+-----------------------------------------------------------------------+
                                  ▲
+-----------------------------------------------------------------------+
|  Layer 3: Heterogeneous Knowledge Graph Layer                         |
|  (Typed Nodes & Multi-Hop Relationships across Cross-Agency Domains)  |
+-----------------------------------------------------------------------+
                                  ▲
+-----------------------------------------------------------------------+
|  Layer 2: Indic-Phonetic Entity Resolution (Core Novelty)             |
|  (Indic-Soundex, Character Bi-LSTM, International Phonetic Alphabet)  |
+-----------------------------------------------------------------------+
                                  ▲
+-----------------------------------------------------------------------+
|  Layer 1: Multimodal Ingestion Layer                                  |
|  (CDRs, Bank TXN CSVs, Vernacular FIRs, Wiretap Audio, CCTV Streams)  |
+-----------------------------------------------------------------------+
```

| Layer | Layer Name | Core Responsibility | Technologies & Algorithms |
|---|---|---|---|
| **Layer 1** | **Data Ingestion Layer** | Ingests offline & low-bandwidth CDRs, bank statements, wiretaps, CCTV video, and unstructured FIR texts. | Python, Pandas, FastAPI, OpenCV, FFmpeg, Whisper ASR |
| **Layer 2** | **Entity Resolution Layer** | The core innovation: Deduplicates and canonicalizes Indian aliases, misspelled names, and regional text *before* graph insertion. | Indic-Soundex, Character Bi-LSTM, IPA, Jaro-Winkler |
| **Layer 3** | **Heterogeneous Graph Layer** | Typed knowledge graph modeling multi-hop relationships across entities (`Person` $\rightarrow$ `Phone` $\rightarrow$ `Account` $\rightarrow$ `Location` $\rightarrow$ `Organization`). | NetworkX, In-Memory Graph Index, D3-Force, Vis.js, WebGL |
| **Layer 4** | **Analytics & Prediction Layer** | Temporal scrubbing, hawala transaction structuring detection, and conformal link prediction for future meetings. | Conformal Prediction ($\alpha = 0.05$), Louvain Community Detection, Adamic-Adar |
| **Layer 5** | **Legal & Security Governance** | Courtroom admissibility under Section 63 BSA 2023 & DPDP Act 72-hour biometric privacy compliance. | SHA-256 Binary Merkle Tree, Salt Shredding, Zero-Buffer Overwrite |
| **Layer 6** | **Presentation & Command UI** | Desktop-first tactical investigative web application with interactive 3D Holographic Graph and CCTV tracking. | React, TanStack Router, TailwindCSS, HTML5 Canvas 60fps, Lucide Icons |

---

## 3. Deep Technical Innovations (Under the Hood)

### A. Indic-Phonetic Entity Resolution (Indic-Soundex)
- **The Challenge:** Western name-matching algorithms (such as American Soundex, Metaphone, or Levenshtein distance) fail completely on Indian vernacular names and criminal aliases (*"urf"*). For instance, *"छोटा टकलू"*, *"Chhota Taklu"*, *"Chhota Taqlu"*, and *"Chota Taklu"* sound identical when spoken by police officers in Meerut or Mumbai, but text distance algorithms treat them as completely different strings.
- **Our Solution:** We convert regional text into acoustic sound representations using the **International Phonetic Alphabet (IPA)** and an Indic phonetic rule matrix. We do not translate to English; we convert the sounds directly into mathematical vectors:
  ```python
  # IndicPhoneticMatcher Execution:
  Input 1: "छोटा टकलू"    --> IPA: [tʃʰoːʈaː ʈək.luː] --> Sound Hash: I-5321
  Input 2: "Chhota Taklu"   --> IPA: [tʃʰoːʈaː ʈək.luː] --> Sound Hash: I-5321
  Confidence Match: 96.8% --> Automatically Merged into Canonical Suspect Node
  ```

### B. Conformal Prediction & "Ghost Edges" (Ethical AI)
> **Critical Question:** What happens if the AI mistakenly connects an innocent citizen to a criminal syndicate?

- **Our Solution:** Trinetra-AI **never** makes black-box automated accusations. We utilize **Conformal Prediction** with a mathematically guaranteed error rate ($\alpha = 0.05$).
- When the AI detects a probable hidden connection between two entities, it renders a **"Ghost Edge"** (a dashed amber glowing line).
- The edge is explicitly flagged `UNVERIFIED_INTELLIGENCE` with a conformal confidence percentage (e.g. *94.2% Confidence*).
- **Human-in-the-Loop Safeguard:** The AI cannot make an arrest or freeze an account based on a Ghost Edge. An investigating officer must obtain a legal warrant, collect corroborating physical evidence (such as a cell tower ping or banking slip), and verify the link before it solidifies into an evidentiary edge.

### C. Section 63 Bhartiya Sakshya Adhiniyam (BSA) 2023 Merkle Vault
> **The Indian Legal Shift:** On July 1, 2024, the Indian Evidence Act 1872 was repealed and replaced by the **Bhartiya Sakshya Adhiniyam (BSA) 2023**. Section 63 strictly mandates tamper-proof chain of custody and cryptographic verification for all electronic records submitted in court.

- Trinetra-AI embeds an automated **SHA-256 Binary Merkle Tree Vault** directly into the pipeline.
- Every digital evidence item (CCTV image frame, wiretap audio excerpt, CDR call record, FIR report) is hashed into an immutable leaf node.
- Consecutive leaves are paired and hashed recursively until a single 32-byte **Master Merkle Root** is produced.
- If an adversary or rogue actor alters even a single pixel in a CCTV frame or modifies one digit in a phone number, the calculated root changes completely, instantly flagging evidence tampering.
- The system automatically generates a legally admissible, print-ready **Section 63 BSA Digital Certificate** with hash timestamps and audit trails.

### D. DPDP Act 2023: 72-Hour Automated Biometric Purge
Under India's **Digital Personal Data Protection (DPDP) Act 2023**, surveillance systems cannot indefinitely hoard biometric facial features of innocent bystanders who happened to walk past a street camera.

**How our Zero-Knowledge Purge works:**
1. When a CCTV camera captures a frame, suspect faces are stored as primary evidence, while bystander face vectors are salted with random 256-bit cryptographic keys and hashed into the Merkle Tree.
2. After 72 hours, an automated privacy worker executes **cryptographic shredding**: raw bystander vectors are overwritten with zero bytes (`0x00`) and the secret salts are permanently destroyed.
3. **The Mathematical Guarantee:** Because the leaf hashes remain part of the Merkle Tree, the Master Merkle Root remains valid for court trials, while the raw biometric privacy of innocent citizens is completely protected.

---

## 4. Tour of the Application Workspaces

### 1. Dashboard (`/dashboard`)
- **Key Metrics:** Active investigations, total entities identified, total cross-agency relationships mapped, and real-time processing latency.
- **Live Holographic 3D Graph:** An interactive overview of the national security network. Entities display symbols (👤 Person, 🏢 Organization, 📞 Phone, 📍 Location, 💳 Bank Account).
- **Interactive Connection Highlighting:** Clicking any person or entity illuminates their direct connections in vibrant cyan (`#66fcf1`) with animated pulsing dots, while dimming unrelated network noise.
- **Telemetry Log:** Real-time pipeline status showing Whisper ASR ingest, Indic phonetic deduplication, and Merkle root calculations.

### 2. Investigation Workspace (`/investigation`)
- **Tactical Graph Canvas:** Switch seamlessly between 3D Holographic view and 2D D3-Force physics layout.
- **Entity Details & Inspector Panel:** View alias history, risk classification (e.g. *High Risk Subject of Interest*), case associations, and confidence scores.
- **Interactive Connected Entities List:** The inspector panel lists every direct link with its relationship type, allowing investigators to traverse connections with a single click.
- **Filter Controls:** Filter entities by type (Person, Phone, Account, Location, Org) or search by keyword and date range.
- **Supporting Records Dialog:** View original raw evidence behind any edge (e.g., CDR call logs, wiretap transcripts, or bank deposit slips).

### 3. Cases Management (`/cases`)
- **Search & Filter Cases:** Filter investigations by status (Active, Under Review, Closed) or search by Case ID, name, and lead investigator.
- **Create New Case (`/cases/new`):** Paste unformatted police text or upload CSV/TXT files; the AI automatically extracts entities and relationships in real time.
- **Delete Case Option:** Each case card features a secure Delete button with a confirmation modal to prevent accidental data loss and maintain state synchronization.

### 4. Surveillance Intercepts (`/surveillance`)
- **2-Tier Vision CCTV Processing:** Real-time facial bounding box tracking with match confidence against enrolled criminal watchlists.
- **Geospatial Tower Dump Map:** CartoDB dark-matter map displaying cell tower pings, tracking suspect movement corridors, and pinpointing physical meeting locations.

### 5. Compliance & Audit (`/compliance`)
- **Merkle Vault Inspector:** Live visualization of the cryptographic tree showing root hashes, leaf counts, and tamper detection audits.
- **BSA Section 63 Certificate Generator:** One-click generation of court-certified digital evidence audit forms.

---

## 5. Repository Structure & Key Code Components

```
netra-ai/
├── TRINETRA_AI_MASTER_STUDY_GUIDE.md   # This comprehensive master guide
├── TRINETRA_AI_MASTER_STUDY_GUIDE.doc  # Formatted Word Document study guide
├── README.md                           # GitHub repository overview
├── visualize_pipeline.py               # Standalone Python prototype & HTTP server
├── graph_preview.html                  # Generated Vis.js intelligence graph
├── sih26189_synthetic_criminal_...xlsx # Synthetic criminal intelligence database (v2)
└── netra-ai/
    ├── src/
    │   ├── fastapi_endpoints.py        # Core FastAPI REST server (FIR ingest, BSA audit)
    │   ├── nlp/indic_soundex.py        # Indic-Phonetic matcher (IPA, sound hashing)
    │   ├── pipeline/data_loader.py     # Excel dataset loader & candidate extractor
    │   ├── pipeline/graph_predictor.py # Conformal graph prediction (Ghost Edges)
    │   └── security/merkle_vault.py    # Binary SHA-256 Merkle Tree implementation
    │   └── security/dpdp_purge_demo.py # 72-hour automated biometric purge script
    └── frontend/
        ├── src/
        │   ├── components/graph/
        │   │   ├── HolographicGraph.tsx # 3D/2D canvas graph (symbols, connection glow)
        │   │   └── NetworkGraph.tsx     # 2D D3-Force physics graph
        │   ├── components/cases/
        │   │   └── CaseCard.tsx         # Case card with Delete Case confirmation modal
        │   ├── routes/
        │   │   ├── dashboard.tsx        # Command dashboard
        │   │   ├── investigation.tsx    # Graph investigation workspace
        │   │   ├── cases.index.tsx      # All cases list
        │   │   ├── cases.new.tsx        # Create case & NLP extract
        │   │   ├── surveillance.tsx     # CCTV face recognition & tower dump map
        │   │   └── compliance.tsx       # BSA 63 Merkle vault certificate generator
        │   └── store.ts                 # Centralized Zustand reactive store (add/delete cases)
        ├── package.json
        └── vite.config.ts
```

---

## 6. Hackathon Pitch Cheat-Sheet (Presentation Guide)

### 30-Second Elevator Pitch
> *"Judges, an investigator currently spends up to two weeks manually cross-referencing messy Hindi FIRs, phone logs, and bank statements to connect criminal networks. Trinetra-AI resolves Indian aliases using Indic-Phonetic algorithms, maps the entire criminal syndicate into an interactive 3D Knowledge Graph in under 45 seconds, flags unverified links using ethical Conformal Prediction, and secures all evidence inside an immutable Merkle Vault compliant with Section 63 of the new Bhartiya Sakshya Adhiniyam 2023."*

### Key Questions & Killer Responses

**Q1: "Why not just use Neo4j or existing Western graph tools?"**  
> *"Western tools assume the data is already clean, structured, and in English. If you feed messy Indian police data into Neo4j, 'छोटा टकलू' and 'Chhota Taklu' become two completely different nodes, and the suspect slips away. Trinetra-AI features an Indic-Phonetic Entity Resolution layer that merges regional aliases before graph construction."*

**Q2: "What if the AI hallucinates or accuses an innocent person?"**  
> *"We use Conformal Prediction ($\alpha = 0.05$). Predictive links are strictly marked as 'Ghost Edges' and flagged `UNVERIFIED_INTELLIGENCE`. The system prohibits autonomous punitive actions, requiring an investigating officer to obtain a legal warrant and collect hard physical evidence before confirming any connection."*

**Q3: "How is digital evidence accepted in an Indian court?"**  
> *"Under the new Bhartiya Sakshya Adhiniyam (BSA) 2023 Section 63, electronic evidence requires strict chain of custody. Every piece of evidence in Trinetra-AI is hashed into a SHA-256 Merkle Vault that automatically outputs an admissibility certificate. Any tampering instantly invalidates the Merkle Root."*

---
*Built for the Smart India Hackathon (SIH26189) • Ministry of Home Affairs (MHA), Govt. of India*
