import hashlib
import json
from typing import Dict, Any

def hash_evidence(data: Any) -> str:
    """
    Computes a SHA-256 hash of the evidence data to preserve cryptographic chain-of-custody.
    """
    if isinstance(data, dict) or isinstance(data, list):
        data_str = json.dumps(data, sort_keys=True)
    else:
        data_str = str(data)
    
    return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

def add_hash_to_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Adds a cryptographic hash to an event dictionary based on its existing contents.
    """
    event['evidence_hash'] = hash_evidence(event)
    return event
