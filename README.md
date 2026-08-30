# Netra-AI 👁️
**SIH26189 | Ministry of Home Affairs (MHA)**  
*Theme: Smart Automation / Security & Surveillance*

An investigator currently takes up to 14 days to manually cross-reference siloed CCTNS, CDR, and FIU data to find a single criminal link. Netra-AI resolves, maps, and cryptographically secures this intelligence in **45 seconds**. 

Unlike standard "visualization tools", Netra-AI is built on a foundational **Multi-Modal Entity Resolution Engine** designed specifically for messy, unstructured, and fragmented Indian law enforcement data.

---

## 🏗️ Architecture Stack
We do not just throw data into Neo4j and call it AI. Our pipeline is structured into 6 deliberate layers:

1. **Data Ingestion Layer:** Offline/low-bandwidth parsers for CDRs, financial logs, and unstructured regional-language FIRs.
2. **Entity Resolution Layer (The Core Novelty):** We use **Indic-Phonetic Matching (bi-LSTM)** to resolve messy Indian names, aliases, and typos (e.g., "Ramesh Kumar" vs "R. Kumar" vs "छोटा टकलू") *before* they ever hit the graph. 
3. **Heterogeneous Graph Layer:** A typed knowledge graph (Person → Phone → Tower → Vehicle → Event) allowing multi-hop queries across siloed agency domains.
4. **Analytics Layer:** Temporal-geospatial fusion, Anomaly Detection (Louvain community detection for hawala structuring), and Link Prediction.
5. **Presentation Layer:** The interactive Investigation and Live Surveillance UI (Timeline Sliders, CCTV Intercepts, Ghost Edges).
6. **Security & Governance Layer:** Role-Based Access Control (RBAC), federated queries, and immutable Section 63 BSA audit trails.

---

## 🚔 The "One-Line Test": Our Ethical & Legal Layer
*What happens if our AI links an innocent person to a criminal network?*

**It doesn't.** We do not use black-box "Kingpin Scoring". We use **Conformal Prediction**. 
When our algorithm suspects a link, it generates a **"Ghost Edge"** (rendered as a dashed amber line in the UI). This signals `UNVERIFIED_INTELLIGENCE`. The system explicitly requires a **Human-in-the-Loop (Officer Verification)** to secure a warrant and gather hard corroborating evidence (like a CDR) before the edge is solidified. 

Furthermore, our system enforces strict governance:
- **Sec 63 BSA Admissibility:** Every digital evidence node is hashed into an immutable **Merkle Vault** with TPM chain-of-custody signatures.
- **DPDP Act 2023 Compliance:** Unverified biometrics undergo a simulated 72-hour automated purge, leaving only Zero-Knowledge Proofs (ZK-SNARKs).
- **Zero Bias Enforcement:** Netra-AI does **not** perform predictive policing based on ethnicity, religion, or community demographics. 

---

## 📡 Live Demo: The "Spy Movie" Surveillance
In addition to the graph investigation workspace, we have built a Live Surveillance module (`/surveillance`) that fuses:
- **Geospatial Clustering:** Plotting tower dumps on a CartoDB map to track physical meetups and travel patterns over time.
- **Live CCTV Intercepts:** Simulating real-time intelligence gathering with facial-recognition match tracking.

---

## 💻 Local Setup

**Prerequisites:** Python 3.10+, standard build tools, Node.js 20+

```bash
# Clone the repo
git clone https://github.com/JayantTekwani/netra-ai.git
cd netra-ai/netra-ai

# 1. Start the Backend API (FastAPI)
pip install -r requirements.txt
python -m uvicorn src.fastapi_endpoints:app --reload --port 8000

# 2. Start the Frontend UI (React / Vite)
cd frontend
npm install
npm run dev
```

*Frontend will be live at `http://localhost:8080`*
*Backend Docs will be live at `http://localhost:8000/docs`*

---
*Built by Team Sleeper Cells*
