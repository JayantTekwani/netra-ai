import pandas as pd
import json
import os
import sys

# Allow running directly or via module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.pipeline.hasher import add_hash_to_event

def process_cdr_file(filepath: str) -> list:
    """
    Reads a CDR CSV file and returns a list of standardized communication events.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"CDR file not found: {filepath}")
        
    df = pd.read_csv(filepath)
    events = []
    
    for _, row in df.iterrows():
        # Standardize fields
        event = {
            "evidence_id": row.get("call_id", ""),
            "source_phone": row.get("caller", ""),
            "target_phone": row.get("receiver", ""),
            "timestamp": row.get("timestamp", ""),
            "duration": int(row.get("duration", 0))
        }
        
        # Add cryptographic hash
        event = add_hash_to_event(event)
        events.append(event)
        
    return events

if __name__ == "__main__":
    # Test block
    filepath = "../../data/cdr/cdr.csv"
    if os.path.exists(filepath):
        res = process_cdr_file(filepath)
        print(json.dumps(res, indent=2))
