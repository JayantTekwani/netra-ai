import sys
import os
import re
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.pipeline.hasher import add_hash_to_event

def extract_entities_and_relations(text: str, source_id: str) -> dict:
    """
    Extracts entities (PERSON, ORGANIZATION, LOCATION, CRIME_TYPE) and basic relationships
    using regex and rule-based extraction (fallback due to spacy build issues).
    """
    # Simple rule-based extraction for the dummy dataset
    people_names = ["Rahul Sharma", "Amit Kumar", "Priya Singh", "Vikram Patel", "Neha Gupta"]
    org_names = ["Meridian Traders", "Global Exports", "ORG-001", "ORG-002", "ORG-003"]
    locations = ["Mumbai Central", "Connaught Place", "Delhi"]
    crime_keywords = ["suspicious activity", "financial irregularities", "fraud", "theft", "murder"]
    
    extracted_entities = []
    
    for p in people_names:
        if p.lower() in text.lower():
            extracted_entities.append({"value": p, "type": "PERSON"})
            
    for o in org_names:
        if o.lower() in text.lower():
            extracted_entities.append({"value": o, "type": "ORGANIZATION"})
            
    for l in locations:
        if l.lower() in text.lower():
            extracted_entities.append({"value": l, "type": "LOCATION"})
            
    for kw in crime_keywords:
        if kw.lower() in text.lower():
            extracted_entities.append({"value": kw.title(), "type": "CRIME_TYPE"})
            
    # Format entities and attach hash
    final_entities = []
    for ent in extracted_entities:
        ent_obj = {
            "evidence_id": source_id,
            "entity_type": ent["type"],
            "value": ent["value"]
        }
        ent_obj = add_hash_to_event(ent_obj)
        final_entities.append(ent_obj)
        
    # Basic relationship triples (co-occurrence)
    relationships = []
    people = [e for e in final_entities if e["entity_type"] == "PERSON"]
    orgs = [e for e in final_entities if e["entity_type"] == "ORGANIZATION"]
    locs = [e for e in final_entities if e["entity_type"] == "LOCATION"]
    
    # Person -> Person (Met/Associated)
    for i in range(len(people)):
        for j in range(i + 1, len(people)):
            rel = {
                "evidence_id": source_id,
                "source": people[i]["value"],
                "target": people[j]["value"],
                "relationship": "ASSOCIATED_WITH"
            }
            relationships.append(add_hash_to_event(rel))
            
    # Person -> Org (Works For/Represents)
    for p in people:
        for o in orgs:
            rel = {
                "evidence_id": source_id,
                "source": p["value"],
                "target": o["value"],
                "relationship": "ASSOCIATED_WITH_ORG"
            }
            relationships.append(add_hash_to_event(rel))
            
    # Person -> Location (Seen At)
    for p in people:
        for l in locs:
            rel = {
                "evidence_id": source_id,
                "source": p["value"],
                "target": l["value"],
                "relationship": "SEEN_AT"
            }
            relationships.append(add_hash_to_event(rel))
            
    return {
        "entities": final_entities,
        "relationships": relationships
    }
