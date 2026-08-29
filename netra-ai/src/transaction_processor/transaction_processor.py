import pandas as pd
import json
import os
import sys

# Allow running directly or via module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.pipeline.hasher import add_hash_to_event

def process_transaction_file(filepath: str) -> list:
    """
    Reads a transaction CSV file and returns a list of structured ledger events.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Transaction file not found: {filepath}")
        
    df = pd.read_csv(filepath)
    events = []
    
    for _, row in df.iterrows():
        # Standardize fields
        event = {
            "evidence_id": row.get("transaction_id", ""),
            "sender_account": row.get("sender_account", ""),
            "receiver_account": row.get("receiver_account", ""),
            "timestamp": row.get("timestamp", ""),
            "amount": float(row.get("amount", 0.0))
        }
        
        # Add cryptographic hash
        event = add_hash_to_event(event)
        events.append(event)
        
    return events

if __name__ == "__main__":
    # Test block
    filepath = "../../data/transactions/transactions.csv"
    if os.path.exists(filepath):
        res = process_transaction_file(filepath)
        print(json.dumps(res, indent=2))
