import pandas as pd
import json
import os
import math
from neo4j import GraphDatabase

def clean_amount(val):
    val = str(val).upper().replace('₹', '').replace(',', '').strip()
    if val == 'UNKNOWN' or not val:
        return 0.0
    if 'L' in val: # Handle 2.40L (Lakhs)
        return float(val.replace('L', '')) * 100000
    return float(val)

class DatasetLoader:
    """
    Responsible for loading the Excel/JSON datasets and holding the state
    for the FastAPI endpoints.
    """
    
    def __init__(self, excel_path: str):
        self.excel_path = excel_path
        self.nodes = []
        self.edges = []
        # Fallback handling in case neo4j is not available
        try:
            self.neo4j_driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))
        except Exception:
            self.neo4j_driver = None
        self.load_data()
        if self.neo4j_driver:
            try:
                self.push_to_neo4j()
            except Exception as e:
                print(f"Failed to push to Neo4j: {e}")
        
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
                
            # Load Hawala transactions
            txn_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "transactions", "transactions.csv")
            if os.path.exists(txn_path):
                try:
                    txn_df = pd.read_csv(txn_path)
                    account_nodes = set()
                    for _, row in txn_df.iterrows():
                        sender = str(row['sender_account'])
                        receiver = str(row['receiver_account'])
                        
                        if sender not in account_nodes:
                            self.nodes.append({"id": sender, "label": sender, "type": "ACCOUNT"})
                            account_nodes.add(sender)
                        if receiver not in account_nodes:
                            self.nodes.append({"id": receiver, "label": receiver, "type": "ACCOUNT"})
                            account_nodes.add(receiver)
                            
                        self.edges.append({
                            "source": sender,
                            "target": receiver,
                            "type": "TRANSFERRED_TO",
                            "amount": clean_amount(row.get('amount', 0)),
                            "timestamp": str(row.get('transaction_date', row.get('timestamp', '')))
                        })
                    print(f"Loaded {len(txn_df)} Hawala transactions.")
                except Exception as e:
                    print(f"Error loading transactions: {e}")
            else:
                print(f"Transactions file not found at {txn_path}")
                        
            print(f"Loaded {len(self.nodes)} nodes and {len(self.edges)} base edges.")
        except Exception as e:
            print(f"Error loading dataset: {e}")
            
    def push_to_neo4j(self):
        """Pushes nodes and edges to Neo4j database."""
        if not self.neo4j_driver:
            return
            
        with self.neo4j_driver.session() as session:
            # Clear existing data for idempotency during dev
            session.run("MATCH (n) DETACH DELETE n")
            
            for node in self.nodes:
                if node['type'] == 'PERSON':
                    session.run(
                        "CREATE (n:PERSON {id: $id, label: $label, name: $name, city: $city})",
                        id=node['id'], label=node['label'], name=node.get('Name', ''), city=node.get('City', '')
                    )
                elif node['type'] == 'ACCOUNT':
                    session.run(
                        "CREATE (n:ACCOUNT {id: $id, label: $label})",
                        id=node['id'], label=node['label']
                    )
            
            for edge in self.edges:
                if edge['type'] == 'TRANSFERRED_TO':
                    session.run(
                        "MATCH (a {id: $source}), (b {id: $target}) "
                        "CREATE (a)-[r:TRANSFERRED_TO {amount: $amount, timestamp: $timestamp}]->(b)",
                        source=edge['source'], target=edge['target'], amount=edge.get('amount', 0), timestamp=edge.get('timestamp', '')
                    )
        print("Data pushed to Neo4j successfully.")
            
    def get_candidates(self):
        return self.nodes
        
    def get_graph(self):
        return {"nodes": self.nodes, "edges": self.edges}
