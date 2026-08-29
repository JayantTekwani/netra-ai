import os
import sys
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.pipeline.hasher import add_hash_to_event

class EntityNormalizer:
    def __init__(self, people_csv_path: str):
        self.people_df = pd.read_csv(people_csv_path) if os.path.exists(people_csv_path) else pd.DataFrame()
        self.canonical_entities = {}
        self._build_index()
        
    def _build_index(self):
        """Builds lookup dictionaries based on the ground truth people.csv"""
        if self.people_df.empty:
            return
            
        for _, row in self.people_df.iterrows():
            person_id = row.get("person_id")
            name = row.get("name")
            phone = row.get("phone")
            org = row.get("organization")
            
            # Index Person
            if name and person_id:
                self.canonical_entities[name.lower()] = {"entity_id": person_id, "entity_type": "PERSON", "canonical_name": name}
                
            # Index Phone
            if phone:
                self.canonical_entities[phone.lower()] = {"entity_id": phone, "entity_type": "PHONE", "canonical_name": phone}
                
            # Index Org
            if org:
                self.canonical_entities[org.lower()] = {"entity_id": org, "entity_type": "ORGANIZATION", "canonical_name": org}
                
        # Add some static locations for demo consistency
        locations = {"mumbai central": "LOC-001", "connaught place": "LOC-002", "delhi": "LOC-003"}
        for loc_name, loc_id in locations.items():
            self.canonical_entities[loc_name] = {"entity_id": loc_id, "entity_type": "LOCATION", "canonical_name": loc_name.title()}

    def normalize(self, raw_value: str, raw_type: str = None) -> dict:
        """
        Takes a raw entity string and attempts to resolve it to a canonical ID.
        Returns a node dict with confidence scores.
        """
        val_lower = raw_value.lower().strip()
        
        # Check exact match
        if val_lower in self.canonical_entities:
            canonical = self.canonical_entities[val_lower]
            return {
                "entity_id": canonical["entity_id"],
                "entity_type": canonical["entity_type"],
                "canonical_name": canonical["canonical_name"],
                "confidence": 1.0
            }
            
        # Check if the raw value looks like a bank account (ACC-XXX) or phone (PH-XXX)
        if raw_value.startswith("ACC-"):
            return {
                "entity_id": raw_value,
                "entity_type": "ACCOUNT",
                "canonical_name": raw_value,
                "confidence": 1.0
            }
            
        if raw_value.startswith("PH-"):
            return {
                "entity_id": raw_value,
                "entity_type": "PHONE",
                "canonical_name": raw_value,
                "confidence": 1.0
            }
            
        if raw_value.startswith("ORG-"):
            return {
                "entity_id": raw_value,
                "entity_type": "ORGANIZATION",
                "canonical_name": raw_value,
                "confidence": 1.0
            }
            
        if raw_value.startswith("PER-"):
            return {
                "entity_id": raw_value,
                "entity_type": "PERSON",
                "canonical_name": raw_value,
                "confidence": 1.0
            }
            
        if raw_value.startswith("LOC-"):
            return {
                "entity_id": raw_value,
                "entity_type": "LOCATION",
                "canonical_name": raw_value,
                "confidence": 1.0
            }

        # Fallback for unknown entities
        fallback_id = f"UNKNOWN-{hash(val_lower) % 10000:04d}"
        return {
            "entity_id": fallback_id,
            "entity_type": raw_type or "UNKNOWN",
            "canonical_name": raw_value,
            "confidence": 0.5
        }
