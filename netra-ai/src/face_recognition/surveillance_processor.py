import os
import sys
import cv2
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.pipeline.hasher import add_hash_to_event
from src.pipeline.entity_normalizer import EntityNormalizer

class SurveillanceProcessor:
    def __init__(self, normalizer: EntityNormalizer):
        self.normalizer = normalizer
        # Load the built-in Haar Cascade for face detection
        cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # Simulated enrollment database mapping a mock visual signature to canonical IDs
        self.enrolled_faces = {
            "signature_1": "PER-001", # Rahul Sharma
            "signature_2": "PER-004", # Vikram Patel
        }
        
    def _mock_recognize(self, frame_region) -> dict:
        """Simulates face matching against enrolled references."""
        # For the hackathon prototype, we simulate the output of a heavy CNN
        # Just randomizing a bit for demonstration, but hardcoding for test predictability
        # if average pixel intensity > 128 -> PER-001 else PER-004
        avg = np.mean(frame_region)
        if avg > 128:
            return {"person_id": self.enrolled_faces["signature_1"], "confidence": 0.94}
        else:
            return {"person_id": self.enrolled_faces["signature_2"], "confidence": 0.88}

    def process_frame(self, image_array, camera_id: str, location_id: str, timestamp: str, evidence_id: str) -> list:
        """
        Process a single image frame (numpy array).
        Detects faces, simulates recognition, and generates surveillance events.
        """
        # Convert to grayscale for Haar cascade
        if len(image_array.shape) == 3:
            gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        else:
            gray = image_array
            
        # Ensure it's np.uint8 for OpenCV
        if gray.dtype != np.uint8:
            gray = gray.astype(np.uint8)

        # Detect faces
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=2, minSize=(10, 10))
        
        events = []
        for i, (x, y, w, h) in enumerate(faces):
            face_roi = gray[y:y+h, x:x+w]
            match_data = self._mock_recognize(face_roi)
            
            event = {
                "event_id": f"SURV-{evidence_id}-{i}",
                "evidence_id": evidence_id,
                "person_id": match_data["person_id"],
                "location_id": location_id,
                "camera_id": camera_id,
                "timestamp": timestamp,
                "confidence": match_data["confidence"],
                "bounding_box": [int(x), int(y), int(w), int(h)]
            }
            
            events.append(add_hash_to_event(event))
            
        return events
