import os
import sys
import json
import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.pipeline.process_case import process_case

def test_unified_pipeline():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    case_id = "CASE-2041"
    
    # Run pipeline end-to-end
    outputs_dir = process_case(case_id, base_dir)
    
    # Check if files exist
    assert os.path.exists(os.path.join(outputs_dir, "entities.json"))
    assert os.path.exists(os.path.join(outputs_dir, "relationships.json"))
    assert os.path.exists(os.path.join(outputs_dir, "events.json"))
    assert os.path.exists(os.path.join(outputs_dir, "merkle_tree.json"))
    
    # Validate entities schema
    with open(os.path.join(outputs_dir, "entities.json"), "r") as f:
        entities = json.load(f)
        assert len(entities) > 0
        for ent in entities:
            assert "entity_id" in ent
            assert "entity_type" in ent
            assert "canonical_name" in ent
            assert "confidence" in ent
            
    # Validate relationships schema
    with open(os.path.join(outputs_dir, "relationships.json"), "r") as f:
        edges = json.load(f)
        assert len(edges) > 0
        for edge in edges:
            assert "source_id" in edge
            assert "target_id" in edge
            assert "relationship_type" in edge
            assert "evidence_id" in edge
            assert "evidence_hash" in edge
            
    # Validate events schema
    with open(os.path.join(outputs_dir, "events.json"), "r") as f:
        events = json.load(f)
        assert len(events) > 0
        for ev in events:
            assert "evidence_hash" in ev
            
    # Validate merkle tree
    with open(os.path.join(outputs_dir, "merkle_tree.json"), "r") as f:
        merkle = json.load(f)
        assert "root" in merkle
        assert "leaves" in merkle
        assert len(merkle["root"]) == 64  # SHA-256 root hash length
        assert len(merkle["leaves"]) > 0
