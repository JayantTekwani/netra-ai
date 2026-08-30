# Netra-AI Cryptographic Merkle Vault & Section 63 BSA Suite

Production-grade code base implementing mathematical integrity under **Section 63 of the Bharatiya Sakshya Adhiniyam (BSA), 2023** and strict privacy sanitization under the **Digital Personal Data Protection (DPDP) Act, 2023**.

## Quick Execution Guide

Run the following commands in VS Code Terminal:

```powershell
# Navigate to workspace
cd C:\Users\HP\.gemini\antigravity\scratch\netra_evidence_vault

# 1. Run Merkle Vault Core
python merkle_vault.py

# 2. Run DPDP 72-Hour Purge Lifecycle Demo
python dpdp_purge_demo.py

# 3. Run Automated Unit Tests
python -m unittest test_merkle_vault.py

# 4. Launch Section 63 BSA Certificate
Start-Process bsa_certificate.html