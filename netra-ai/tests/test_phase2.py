import os
import sys
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.cdr_processor.cdr_processor import process_cdr_file
from src.transaction_processor.transaction_processor import process_transaction_file

def test_cdr_processor():
    cdr_path = os.path.join(os.path.dirname(__file__), '../data/cdr/cdr.csv')
    events = process_cdr_file(cdr_path)
    
    assert len(events) > 0, "No CDR events were loaded."
    
    first_event = events[0]
    # Check schema
    assert "source_phone" in first_event
    assert "target_phone" in first_event
    assert "duration" in first_event
    assert "timestamp" in first_event
    assert "evidence_hash" in first_event
    assert "evidence_id" in first_event
    
    # Check hash is non-empty
    assert len(first_event["evidence_hash"]) == 64  # SHA-256 hex digest length

def test_transaction_processor():
    txn_path = os.path.join(os.path.dirname(__file__), '../data/transactions/transactions.csv')
    events = process_transaction_file(txn_path)
    
    assert len(events) > 0, "No transaction events were loaded."
    
    first_event = events[0]
    # Check schema
    assert "sender_account" in first_event
    assert "receiver_account" in first_event
    assert "amount" in first_event
    assert "timestamp" in first_event
    assert "evidence_hash" in first_event
    assert "evidence_id" in first_event
    
    # Check hash is non-empty
    assert len(first_event["evidence_hash"]) == 64
