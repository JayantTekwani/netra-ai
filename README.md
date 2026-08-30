# Netra-AI 👁️
**SIH26189 | Ministry of Home Affairs (MHA)**  
*Theme: Smart Automation / Security & Surveillance*

Netra-AI is an intelligent, cryptographically secure Knowledge Graph designed to track organized crime syndicates by fusing multi-modal, unstructured police data (low-res CCTV, regional FIRs, telecom CDRs, and financial logs).

This is our official submission codebase for the Smart India Hackathon.

---

### Core Architecture

We defended this architecture to the MHA Grand Jury. It relies on 4 main pillars:

1. **Edge-to-Cloud CV Cascade:** 
   We run INT8-quantized SCRFD and MobileFaceNet on the edge (Jetson Nano) for zero-latency tracking. We only send the raw crops to the cloud for heavy 512-D Vision Transformer (ViT) verification. *Note: Don't try running the ViT on the edge node, it will thermally throttle.*
2. **Vernacular NLP (Indic-Soundex):** 
   Bypasses lossy English translation. We map regional scripts to an International Phonetic Alphabet (IPA) tensor space to match criminal aliases ("urf") directly on how they sound.
3. **Graph Attention Networks (GAT):** 
   Predicts "Ghost Edges" (hidden links like hawala drops). Governed by Conformal Prediction ($1 - \alpha = 0.95$) so the AI doesn't hallucinate illegal arrests.
4. **The Cryptographic Vault:** 
   Dual-custody Section 63 BSA compliance + 72-hour DPDP bystander purge using zero-knowledge Merkle proofs.

---

### Local Setup & Demo

**Prerequisites:** Python 3.10+, standard build tools. 

```bash
# Clone the repo
git clone https://github.com/JayantTekwani/netra-ai.git
cd netra-ai/netra-ai

# Setup venv (recommended)
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install deps
pip install -r requirements.txt
```

**Running the Backend API:**
```bash
# Start the FastAPI server
uvicorn src.fastapi_endpoints:app --reload --port 8000
```
API Docs will be live at: `http://localhost:8000/docs`

**Running the Crypto Vault Demo:**
```bash
cd src/security
python dpdp_purge_demo.py
```

### Repo Structure
* `netra-ai/src/fastapi_endpoints.py` - Main API router
* `netra-ai/src/pipeline/` - GAT Predictor and Data ingestion
* `netra-ai/src/nlp/` - Indic-Soundex matching logic
* `netra-ai/src/security/` - Merkle Vault & Sec 63 BSA Certificates
* `netra-ai/data/` - Synthetic JSON/CSV offline cache
* `graph_preview.html` - Static network visualization

### TODO (Pre-Finale)
- [ ] Wire up the React UI timeline slider (Frontend team is on it).
- [ ] Finalize offline fallback caching for demo laptop.
- [ ] Rehearse the 5-min pitch script.

---
*Built by Team [Name]*
