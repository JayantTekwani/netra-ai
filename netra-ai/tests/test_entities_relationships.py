import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.pipeline.entity_normalizer import EntityNormalizer
from src.pipeline.relationship_builder import RelationshipBuilder

def test_entity_normalizer():
    people_csv_path = os.path.join(os.path.dirname(__file__), '../data/people/people.csv')
    normalizer = EntityNormalizer(people_csv_path)
    
    # Test known person
    res_person = normalizer.normalize("Rahul Sharma")
    assert res_person["entity_id"] == "PER-001"
    assert res_person["entity_type"] == "PERSON"
    assert res_person["confidence"] == 1.0
    
    # Test known org
    res_org = normalizer.normalize("Meridian Traders", "ORGANIZATION")
    # "Meridian Traders" wasn't explicitly in people.csv but ORG-001 is mapped to Rahul.
    # Oh wait, people.csv just has ORG-001. So "Meridian Traders" will fall back to UNKNOWN or we need to normalize it.
    # Actually, people.csv has "organization: ORG-001", not "Meridian Traders". 
    # Let's test ORG-001 explicitly.
    res_org = normalizer.normalize("ORG-001")
    assert res_org["entity_id"] == "ORG-001"
    assert res_org["entity_type"] == "ORGANIZATION"
    assert res_org["confidence"] == 1.0

    # Test bank account regex fallback
    res_acc = normalizer.normalize("ACC-001")
    assert res_acc["entity_id"] == "ACC-001"
    assert res_acc["entity_type"] == "ACCOUNT"
    assert res_acc["confidence"] == 1.0
    
    # Test unknown person
    res_unknown = normalizer.normalize("John Doe", "PERSON")
    assert res_unknown["entity_id"].startswith("UNKNOWN-")
    assert res_unknown["confidence"] == 0.5

def test_relationship_builder():
    people_csv_path = os.path.join(os.path.dirname(__file__), '../data/people/people.csv')
    normalizer = EntityNormalizer(people_csv_path)
    builder = RelationshipBuilder(normalizer)
    
    # Dummy CDR event
    cdr_events = [{
        "evidence_id": "CDR-999",
        "source_phone": "PH-001",
        "target_phone": "PH-002",
        "timestamp": "2026-08-29T10:30:00",
        "duration": 240
    }]
    
    cdr_edges = builder.process_cdr_events(cdr_events)
    assert len(cdr_edges) == 1
    edge = cdr_edges[0]
    
    assert edge["source_id"] == "PH-001"
    assert edge["target_id"] == "PH-002"
    assert edge["relationship_type"] == "COMMUNICATED_WITH"
    assert edge["evidence_id"] == "CDR-999"
    assert "evidence_hash" in edge
    assert len(edge["evidence_hash"]) == 64
    
    # Dummy NLP Relationship
    nlp_rels = [{
        "evidence_id": "FIR-999",
        "source": "Rahul Sharma",
        "target": "Amit Kumar",
        "relationship": "ASSOCIATED_WITH"
    }]
    
    nlp_edges = builder.process_nlp_relationships(nlp_rels)
    assert len(nlp_edges) == 1
    n_edge = nlp_edges[0]
    
    # It should correctly map names to PER-001 and PER-002
    assert n_edge["source_id"] == "PER-001"
    assert n_edge["target_id"] == "PER-002"
    assert n_edge["relationship_type"] == "ASSOCIATED_WITH"
    assert n_edge["evidence_id"] == "FIR-999"
    assert len(n_edge["evidence_hash"]) == 64
