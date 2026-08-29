import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.pipeline.hasher import add_hash_to_event
from src.pipeline.entity_normalizer import EntityNormalizer

class RelationshipBuilder:
    def __init__(self, normalizer: EntityNormalizer):
        self.normalizer = normalizer
        
    def _build_edge(self, source_raw: str, target_raw: str, rel_type: str, evidence_id: str, source_type=None, target_type=None) -> dict:
        src_node = self.normalizer.normalize(source_raw, source_type)
        tgt_node = self.normalizer.normalize(target_raw, target_type)
        
        edge = {
            "source_id": src_node["entity_id"],
            "target_id": tgt_node["entity_id"],
            "relationship_type": rel_type,
            "evidence_id": evidence_id
        }
        return add_hash_to_event(edge)

    def process_cdr_events(self, cdr_events: list) -> list:
        edges = []
        for event in cdr_events:
            edge = self._build_edge(
                source_raw=event["source_phone"],
                target_raw=event["target_phone"],
                rel_type="COMMUNICATED_WITH",
                evidence_id=event["evidence_id"],
                source_type="PHONE",
                target_type="PHONE"
            )
            # Carry over additional properties if needed
            edge["duration"] = event.get("duration")
            edge["timestamp"] = event.get("timestamp")
            edges.append(edge)
        return edges

    def process_transaction_events(self, txn_events: list) -> list:
        edges = []
        for event in txn_events:
            edge = self._build_edge(
                source_raw=event["sender_account"],
                target_raw=event["receiver_account"],
                rel_type="TRANSFERRED_FUNDS_TO",
                evidence_id=event["evidence_id"],
                source_type="ACCOUNT",
                target_type="ACCOUNT"
            )
            edge["amount"] = event.get("amount")
            edge["timestamp"] = event.get("timestamp")
            edges.append(edge)
        return edges

    def process_nlp_relationships(self, nlp_relationships: list) -> list:
        edges = []
        for rel in nlp_relationships:
            edge = self._build_edge(
                source_raw=rel["source"],
                target_raw=rel["target"],
                rel_type=rel["relationship"],
                evidence_id=rel["evidence_id"]
            )
            edges.append(edge)
        return edges

    def process_surveillance_events(self, surv_events: list) -> list:
        edges = []
        for event in surv_events:
            edge = self._build_edge(
                source_raw=event["person_id"],
                target_raw=event["location_id"],
                rel_type="SEEN_AT",
                evidence_id=event["evidence_id"],
                source_type="PERSON",
                target_type="LOCATION"
            )
            edge["confidence"] = event.get("confidence")
            edge["timestamp"] = event.get("timestamp")
            edges.append(edge)
        return edges
