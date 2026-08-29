import os
import sys

# Allow running directly or via module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

def extract_fir_text(filepath: str) -> dict:
    """
    Ingests a raw FIR .txt file and extracts metadata and details.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"FIR file not found: {filepath}")
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Basic parsing logic based on known FIR format
    lines = content.split('\n')
    fir_number = ""
    date = ""
    subject = ""
    details_lines = []
    in_details = False
    
    for line in lines:
        if line.startswith("FIR NUMBER:"):
            fir_number = line.replace("FIR NUMBER:", "").strip()
        elif line.startswith("DATE:"):
            date = line.replace("DATE:", "").strip()
        elif line.startswith("SUBJECT:"):
            subject = line.replace("SUBJECT:", "").strip()
        elif line.startswith("DETAILS:"):
            in_details = True
        elif in_details:
            details_lines.append(line.strip())
            
    details = " ".join(details_lines).strip()
    
    return {
        "fir_number": fir_number,
        "date": date,
        "subject": subject,
        "details": details
    }
