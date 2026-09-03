import hashlib
import json
from typing import Any, Dict, List, Tuple, Union

def hash_data(data: Any) -> str:
    """
    Computes a canonical SHA-256 hex string for heterogeneous input types:
    - bytes / bytearray: direct raw binary hashing
    - dict / list: deterministic canonical JSON serialization (sorted keys, compact separators)
    - string / other: UTF-8 encoded string representation
    """
    if isinstance(data, (bytes, bytearray)):
        return hashlib.sha256(data).hexdigest()
    elif isinstance(data, (dict, list)):
        canonical_json = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
    else:
        return hashlib.sha256(str(data).encode('utf-8')).hexdigest()

def hash_pair(left_hash: str, right_hash: str) -> str:
    """Computes SHA-256 over ordered sibling hex hashes."""
    combined = left_hash + right_hash
    return hashlib.sha256(combined.encode('utf-8')).hexdigest()

class MerkleVault:
    """
    SHA-256 Binary Merkle Tree implementation with support for heterogeneous
    evidence types, odd-cardinality leaf duplication, and proof generation.
    """
    def __init__(self, raw_elements: List[Any] = None, precomputed_hashes: List[str] = None):
        if raw_elements is not None:
            self.leaves = [hash_data(elem) for elem in raw_elements]
        elif precomputed_hashes is not None:
            self.leaves = list(precomputed_hashes)
        else:
            raise ValueError("Must provide either raw_elements or precomputed_hashes.")
        
        if not self.leaves:
            raise ValueError("Cannot create a Merkle Tree from empty data.")
            
        self.layers: List[List[str]] = []
        self._build_tree()

    def _build_tree(self) -> None:
        current_layer = list(self.leaves)
        self.layers.append(current_layer)

        while len(current_layer) > 1:
            next_layer = []
            # Odd cardinality handling: duplicate trailing leaf
            if len(current_layer) % 2 == 1:
                current_layer.append(current_layer[-1])

            for i in range(0, len(current_layer), 2):
                parent = hash_pair(current_layer[i], current_layer[i+1])
                next_layer.append(parent)

            self.layers.append(next_layer)
            current_layer = next_layer

    @property
    def root(self) -> str:
        """Returns the Master SHA-256 Merkle Root."""
        return self.layers[-1][0]

    def get_proof(self, leaf_index: int) -> List[Dict[str, str]]:
        """
        Generates audit path for leaf at leaf_index.
        Returns: list of dicts [{'position': 'left'|'right', 'hash': hex_string}]
        """
        if leaf_index < 0 or leaf_index >= len(self.leaves):
            raise IndexError("Leaf index out of bounds.")

        proof = []
        index = leaf_index

        for layer in self.layers[:-1]:
            # Duplicate odd leaf in current layer if necessary for index calculation
            layer_working = list(layer)
            if len(layer_working) % 2 == 1:
                layer_working.append(layer_working[-1])

            if index % 2 == 0:
                sibling_index = index + 1
                position = "right"
            else:
                sibling_index = index - 1
                position = "left"

            proof.append({
                "position": position,
                "hash": layer_working[sibling_index]
            })
            index = index // 2

        return proof

def verify_proof(leaf_hash: str, proof: List[Dict[str, str]], expected_root: str) -> bool:
    """
    Standalone sub-millisecond proof verification against expected Merkle root.
    """
    current_hash = leaf_hash
    for step in proof:
        sibling_hash = step["hash"]
        if step["position"] == "right":
            current_hash = hash_pair(current_hash, sibling_hash)
        else:
            current_hash = hash_pair(sibling_hash, current_hash)
    return current_hash.lower() == expected_root.lower()

if __name__ == "__main__":
    print("=== त्रिनेत्र-AI Merkle Vault Initialized ===")
    sample_data = [
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR", # Binary CCTV Frame
        {"camera_id": "CAM_04", "fps": 30},     # Structured Metadata
        "ANPR Record: RJ14-CB-9901",           # String Log
        [0.124, 0.981, 0.443, 0.002],           # Vector Embedding
        "Bystander Hash #5"                    # Odd Leaf
    ]
    vault = MerkleVault(raw_elements=sample_data)
    print(f"Master Merkle Root: {vault.root}")
    
    proof = vault.get_proof(0)
    target_leaf = vault.leaves[0]
    is_valid = verify_proof(target_leaf, proof, vault.root)
    print(f"Verification of Leaf 0: {is_valid}")