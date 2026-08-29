import os
import sys
import cv2
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.pipeline.entity_normalizer import EntityNormalizer
from src.pipeline.relationship_builder import RelationshipBuilder
from src.face_recognition.surveillance_processor import SurveillanceProcessor

def test_surveillance_processor():
    # Setup
    people_csv_path = os.path.join(os.path.dirname(__file__), '../data/people/people.csv')
    normalizer = EntityNormalizer(people_csv_path)
    processor = SurveillanceProcessor(normalizer)
    
    # Create a dummy image array that will definitely trigger the face cascade
    # For a real Haar Cascade to fire predictably, we can just load a sample face
    # or create a contrast pattern. Because creating a perfect synthetic face array is hard,
    # we'll mock the cascade's detectMultiScale temporarily for the test to ensure
    # the rest of the event formatting logic is tested reliably without needing a real JPG.
    
    import unittest.mock as mock
    processor.face_cascade = mock.MagicMock()
    processor.face_cascade.detectMultiScale.return_value = np.array([[50, 50, 100, 100]])
    
    # Dummy white image > 128 so it matches PER-001
    dummy_image = np.ones((200, 200, 3), dtype=np.uint8) * 200
    
    events = processor.process_frame(
        image_array=dummy_image,
        camera_id="CAM-01",
        location_id="LOC-001",
        timestamp="2026-08-29T18:31:22",
        evidence_id="SURV-EVID-001"
    )
    
    assert len(events) == 1
    event = events[0]
    
    assert event["event_id"] == "SURV-SURV-EVID-001-0"
    assert event["person_id"] == "PER-001"
    assert event["location_id"] == "LOC-001"
    assert event["camera_id"] == "CAM-01"
    assert event["confidence"] == 0.94
    assert event["bounding_box"] == [50, 50, 100, 100]
    assert "evidence_hash" in event
    assert len(event["evidence_hash"]) == 64
    
    # Test relationship builder integration
    builder = RelationshipBuilder(normalizer)
    edges = builder.process_surveillance_events(events)
    
    assert len(edges) == 1
    edge = edges[0]
    assert edge["source_id"] == "PER-001"
    assert edge["target_id"] == "LOC-001"
    assert edge["relationship_type"] == "SEEN_AT"
    assert edge["evidence_id"] == "SURV-EVID-001"
    assert edge["confidence"] == 0.94
    assert len(edge["evidence_hash"]) == 64
