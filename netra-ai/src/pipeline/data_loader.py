import pandas as pd
import json
import os
import math

class DatasetLoader:
    """
    Responsible for loading the Excel/JSON datasets and holding the state
    for the FastAPI endpoints.
    """
    
    def __init__(self, excel_path: str):
        self.excel_path = excel_path
        self.nodes = []
        self.edges = []
        self.load_data()
        
    def load_data(self):
        """Loads data from the Excel dataset."""
        if not os.path.exists(self.excel_path):
            print(f"Warning: Dataset not found at {self.excel_path}. Using empty graph.")
            return
            
        try:
            df = pd.read_excel(self.excel_path)
            
            # Extract distinct people as nodes
            for _, row in df.iterrows():
                # Clean up NaN values
                alias = row['Alias_Regional'] if not pd.isna(row['Alias_Regional']) else ""
                
                node = {
                    "id": str(row['Person_ID']),
                    "label": f"{row['Name']} @ {alias}" if alias else str(row['Name']),
                    "type": "PERSON",
                    "Name": str(row['Name']),
                    "Alias_Regional": alias,
                    "Risk_Score": float(row['Risk_Score']) if not pd.isna(row['Risk_Score']) else 50.0,
                    "City": str(row['City']) if not pd.isna(row['City']) else "Unknown",
                    "Classification": str(row['Classification']) if not pd.isna(row['Classification']) else "Unknown"
                }
                self.nodes.append(node)
                
            # Synthesize some basic edges based on city & classification to form a baseline graph
            # In a real scenario, this would come from the relationships.json or CDR dumps.
            for i in range(len(self.nodes)):
                for j in range(i + 1, len(self.nodes)):
                    if self.nodes[i]['City'] == self.nodes[j]['City'] and self.nodes[i]['Classification'] == self.nodes[j]['Classification']:
                        edge = {
                            "source": self.nodes[i]['id'],
                            "target": self.nodes[j]['id'],
                            "type": "KNOWN_ASSOCIATE",
                            "timestamp": "2026-05-10T00:00:00Z" # Mock historical timestamp
                        }
                        self.edges.append(edge)
                        
            print(f"Loaded {len(self.nodes)} nodes and {len(self.edges)} base edges.")
        except Exception as e:
            print(f"Error loading dataset: {e}")
            
    def get_candidates(self):
        return self.nodes
        
    def get_graph(self):
        return {"nodes": self.nodes, "edges": self.edges}
