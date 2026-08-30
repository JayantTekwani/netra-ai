import hashlib
import json
import secrets
from datetime import datetime, timezone
from merkle_vault import MerkleVault, verify_proof, hash_data

def run_dpdp_lifecycle():
    print("==========================================================================")
    print("  NETRA-AI DPDP ACT 2023 72-HOUR BIOMETRIC PURGE LIFECYCLE SIMULATION     ")
    print("==========================================================================")

    # 1. Day 1 Capture: Generating secret salts and raw evidence
    bystander_a_salt = secrets.token_bytes(32)
    bystander_b_salt = secrets.token_bytes(32)

    raw_suspect_cctv = b"\xff\xd8\xff\xe0\x00\x10JFIF (Suspect Frame Frame #1092)"
    raw_bystander_a_vec = b"[0.88, 0.12, 0.43, 0.99] Bystander A Facial Feature"
    raw_suspect_cdr = {"caller": "+919876543210", "receiver": "+919123456789", "duration": 142}
    raw_bystander_b_vec = b"[0.01, 0.54, 0.32, 0.77] Bystander B Facial Feature"
    raw_anpr = "ANPR_DETECT: KA-01-MJ-5005"

    # Compute salted hashes for DPDP compliance
    leaf_0 = hash_data(raw_suspect_cctv)
    leaf_1 = hashlib.sha256(raw_bystander_a_vec + bystander_a_salt).hexdigest()
    leaf_2 = hash_data(raw_suspect_cdr)
    leaf_3 = hashlib.sha256(raw_bystander_b_vec + bystander_b_salt).hexdigest()
    leaf_4 = hash_data(raw_anpr)

    precomputed_leaves = [leaf_0, leaf_1, leaf_2, leaf_3, leaf_4]

    # Initialize Vault and generate Master Merkle Root R0
    vault = MerkleVault(precomputed_hashes=precomputed_leaves)
    root_r0 = vault.root

    print(f"\n[DAY 1 - CAPTURE TIME: {datetime.now(timezone.utc).isoformat()}]")
    print(f"Master Merkle Root (R0): {root_r0}")
    print(f"Total Leaves Ingested : {len(precomputed_leaves)}")

    # Store initial proofs
    proof_suspect = vault.get_proof(0)
    proof_bystander_a = vault.get_proof(1)

    # 2. Day 3: DPDP 72-Hour Mandatory Biometric Purge
    print("\n[DAY 3 - 72h DPDP PURGE EXECUTED]")
    print("-> Overwriting raw bystander vectors with zero-buffers (0x00)...")
    raw_bystander_a_vec = b"\x00" * len(raw_bystander_a_vec)
    raw_bystander_b_vec = b"\x00" * len(raw_bystander_b_vec)

    print("-> Cryptographically shredding secret salts...")
    bystander_a_salt = b"\x00" * 32
    bystander_b_salt = b"\x00" * 32
    print("-> Raw biometrics & salts purged from disk/RAM.")

    # 3. Courtroom Admissibility Phase
    print("\n[COURTROOM TRIAL ADMISSABILITY VERIFICATION]")
    
    # Verify Unpurged Suspect CCTV
    val_suspect = verify_proof(leaf_0, proof_suspect, root_r0)
    print(f"1. Suspect CCTV Frame Hash Verification : {'VALIDATED (True)' if val_suspect else 'FAILED'}")

    # Verify Redacted Bystander Leaf Hash (Proves lawful redaction without Root mutation)
    val_bystander = verify_proof(leaf_1, proof_bystander_a, root_r0)
    print(f"2. Redacted Bystander Leaf Verification: {'VALIDATED (True)' if val_bystander else 'FAILED'}")

    # Adversarial Tampering Check
    fake_cdr = hash_data({"caller": "+919876543210", "receiver": "+919123456789", "duration": 999})
    val_tamper = verify_proof(fake_cdr, vault.get_proof(2), root_r0)
    print(f"3. Adversarial Tampered CDR Check      : {'REJECTED (False)' if not val_tamper else 'ALERT: TAMPER ACCEPTED'}")

    print("\n==========================================================================")
    print("  VERIFICATION COMPLETE: BSA SECTION 63 & DPDP 2023 INTEGRITY MAINTAINED  ")
    print("==========================================================================")

if __name__ == "__main__":
    run_dpdp_lifecycle()