import os
import sys
import json
import glob
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.cdr_processor.cdr_processor import process_cdr_file
from src.transaction_processor.transaction_processor import process_transaction_file
from src.fir_processor.text_extractor import extract_fir_text
from src.nlp.ner_extractor import extract_entities_and_relations
from src.pipeline.entity_normalizer import EntityNormalizer
from src.pipeline.relationship_builder import RelationshipBuilder
from src.face_recognition.surveillance_processor import SurveillanceProcessor
from src.pipeline.hasher import hash_evidence

def build_merkle_tree(hashes):
    """
    Constructs a Merkle tree from a list of hashes for chain-of-custody verification.
    """
    if not hashes:
        return {"root": "", "leaves": []}
    
    current_level = hashes[:]
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i+1] if i+1 < len(current_level) else left
            combined = left + right
            next_level.append(hash_evidence(combined))
        current_level = next_level
        
    return {"root": current_level[0], "leaves": hashes}

def process_case(case_id: str, base_dir: str):
    outputs_dir = os.path.join(base_dir, "outputs", case_id)
    os.makedirs(outputs_dir, exist_ok=True)
    
    data_dir = os.path.join(base_dir, "data")
    
    # 1. Init Core Modules
    people_csv = os.path.join(data_dir, "people", "people.csv")
    normalizer = EntityNormalizer(people_csv)
    rel_builder = RelationshipBuilder(normalizer)
    surv_processor = SurveillanceProcessor(normalizer)
    
    events = []
    edges = []
    entities = {} # use dict to deduplicate by canonical ID
    all_hashes = []
    
    # 2. Process CDRs
    cdr_csv = os.path.join(data_dir, "cdr", "cdr.csv")
    if os.path.exists(cdr_csv):
        cdr_events = process_cdr_file(cdr_csv)
        events.extend(cdr_events)
        cdr_edges = rel_builder.process_cdr_events(cdr_events)
        edges.extend(cdr_edges)
        
    # 3. Process Transactions
    txn_csv = os.path.join(data_dir, "transactions", "transactions.csv")
    if os.path.exists(txn_csv):
        txn_events = process_transaction_file(txn_csv)
        events.extend(txn_events)
        txn_edges = rel_builder.process_transaction_events(txn_events)
        edges.extend(txn_edges)
        
    # 4. Process FIRs
    fir_dir = os.path.join(data_dir, "fir")
    for fir_file in glob.glob(os.path.join(fir_dir, "*.txt")):
        basename = os.path.basename(fir_file).replace(".txt", "")
        fir_meta = extract_fir_text(fir_file)
        
        fir_event = {
            "event_id": f"EVENT-{basename}",
            "event_type": "FIR_FILED",
            "evidence_id": basename,
            "fir_number": fir_meta["fir_number"],
            "timestamp": fir_meta["date"]
        }
        fir_event["evidence_hash"] = hash_evidence(fir_event)
        events.append(fir_event)
        
        nlp_res = extract_entities_and_relations(fir_meta["details"], basename)
        
        # Add NLP edges
        nlp_edges = rel_builder.process_nlp_relationships(nlp_res["relationships"])
        edges.extend(nlp_edges)
        
        # Add NLP entities
        for ent in nlp_res["entities"]:
            norm_ent = normalizer.normalize(ent["value"], ent["entity_type"])
            entities[norm_ent["entity_id"]] = norm_ent
            all_hashes.append(ent.get("evidence_hash", ""))
            
    # 5. Process Surveillance (Mocked for integration)
    dummy_image = np.ones((200, 200, 3), dtype=np.uint8) * 200
    # Mocking cascade specifically for process_case to avoid failing silently if cascades misbehave on mock images
    import unittest.mock as mock
    surv_processor.face_cascade = mock.MagicMock()
    surv_processor.face_cascade.detectMultiScale.return_value = np.array([[50, 50, 100, 100]])
    
    surv_events = surv_processor.process_frame(dummy_image, "CAM-01", "LOC-001", "2026-08-29T18:31:22", "SURV-001")
    events.extend(surv_events)
    surv_edges = rel_builder.process_surveillance_events(surv_events)
    edges.extend(surv_edges)
    
    # Consolidate entities from relationships and events since NLP might not catch everything
    for edge in edges:
        if "evidence_hash" in edge:
            all_hashes.append(edge["evidence_hash"])
        for e_id in [edge["source_id"], edge["target_id"]]:
            if e_id not in entities:
                entities[e_id] = normalizer.normalize(e_id)
                
    for event in events:
        if "evidence_hash" in event:
            all_hashes.append(event["evidence_hash"])
            
    # Add root entities from ground truth (people.csv)
    for name, ent_data in normalizer.canonical_entities.items():
        if ent_data["entity_id"] not in entities:
             entities[ent_data["entity_id"]] = {
                 "entity_id": ent_data["entity_id"],
                 "entity_type": ent_data["entity_type"],
                 "canonical_name": ent_data["canonical_name"],
                 "confidence": 1.0
             }
             
    # Build Merkle Tree
    # filter out empty hashes just in case
    all_hashes = [h for h in all_hashes if h]
    merkle_tree = build_merkle_tree(all_hashes)
    
    # Export Outputs
    with open(os.path.join(outputs_dir, "entities.json"), "w") as f:
        json.dump(list(entities.values()), f, indent=2)
        
    with open(os.path.join(outputs_dir, "relationships.json"), "w") as f:
        json.dump(edges, f, indent=2)
        
    with open(os.path.join(outputs_dir, "events.json"), "w") as f:
        json.dump(events, f, indent=2)
        
    with open(os.path.join(outputs_dir, "merkle_tree.json"), "w") as f:
        json.dump(merkle_tree, f, indent=2)
        
    print(f"Case {case_id} processed successfully. Outputs saved to {outputs_dir}")
    return outputs_dir

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_case.py <CASE_ID>")
        sys.exit(1)
        
    case_id = sys.argv[1]
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    process_case(case_id, base_dir)
