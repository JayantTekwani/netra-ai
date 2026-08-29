import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.fir_processor.text_extractor import extract_fir_text
from src.nlp.ner_extractor import extract_entities_and_relations

def test_fir_text_extraction():
    fir_path = os.path.join(os.path.dirname(__file__), '../data/fir/FIR-001.txt')
    metadata = extract_fir_text(fir_path)
    
    assert metadata["fir_number"] == "2026/08/29-001"
    assert metadata["date"] == "2026-08-29"
    assert metadata["subject"] == "Suspicious Activity Report"
    assert "Rahul Sharma" in metadata["details"]

def test_ner_extraction():
    # Use FIR-001 content
    text = "Rahul Sharma met Amit Kumar at Mumbai Central station. Rahul Sharma is associated with Meridian Traders."
    source_id = "FIR-001"
    
    result = extract_entities_and_relations(text, source_id)
    entities = result.get("entities", [])
    relationships = result.get("relationships", [])
    
    assert len(entities) > 0
    
    # Check if entities have hashes and correct structure
    for ent in entities:
        assert "evidence_id" in ent
        assert "entity_type" in ent
        assert "value" in ent
        assert "evidence_hash" in ent
        assert len(ent["evidence_hash"]) == 64
        
    for rel in relationships:
        assert "evidence_id" in rel
        assert "source" in rel
        assert "target" in rel
        assert "relationship" in rel
        assert "evidence_hash" in rel
        assert len(rel["evidence_hash"]) == 64
        
    # Validate specific extractions based on spaCy (these should typically be found)
    entity_values = [e["value"] for e in entities]
    assert any("Rahul Sharma" in val for val in entity_values)
    assert any("Amit Kumar" in val for val in entity_values)
    assert any("Mumbai Central" in val for val in entity_values)
    assert any("Meridian Traders" in val for val in entity_values)
