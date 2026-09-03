import os
import sys
import json
import webbrowser
import threading
import http.server
import socketserver
import numpy as np
import time
import random
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'netra-ai')))

from src.pipeline.hasher import hash_evidence

PORT = 8080

def get_graph_data():
    base = os.path.abspath("netra-ai/outputs/CASE-2041")
    with open(os.path.join(base, "entities.json"), "r") as f:
        entities = json.load(f)
    with open(os.path.join(base, "relationships.json"), "r") as f:
        relationships = json.load(f)
    with open(os.path.join(base, "merkle_tree.json"), "r") as f:
        merkle = json.load(f)
        
    vis_nodes = []
    for ent in entities:
        color = "#CCCCCC"
        if ent["entity_type"] == "PERSON": color = "#FF4444"
        elif ent["entity_type"] == "ORGANIZATION": color = "#4444FF"
        elif ent["entity_type"] in ["ACCOUNT", "PHONE", "LOCATION"]: color = "#44FF44"

        vis_nodes.append({
            "id": ent["entity_id"],
            "label": f"{ent['canonical_name']}\\n({ent['entity_type']})",
            "color": color,
            "title": f"ID: {ent['entity_id']}<br>Type: {ent['entity_type']}<br>Confidence: {ent.get('confidence', 1.0)}<br>Info: {ent.get('description', '')}",
            "data": ent
        })

    vis_edges = []
    for i, rel in enumerate(relationships):
        vis_edges.append({
            "id": f"edge_{i}_{int(time.time() * 1000)}",
            "from": rel["source_id"],
            "to": rel["target_id"],
            "label": rel["relationship_type"],
            "title": f"Rel: {rel['relationship_type']}<br>EvID: {rel.get('evidence_id', '')}<br>Hash: {rel.get('evidence_hash', '')}",
            "data": rel
        })
        
    return vis_nodes, vis_edges, merkle

def get_suspect_pool_json():
    try:
        df = pd.read_excel('sih26189_synthetic_criminal_intelligence_dataset.xlsx')
        suspects = []
        for _, row in df.iterrows():
            classification = str(row.get('Classification', ''))
            if classification in ['Suspect', 'Associate', 'Criminal', 'High Risk']:
                suspects.append({
                    "label": f"{row['Name']} ({row['Person_ID']})",
                    "id": row['Person_ID']
                })
        random.shuffle(suspects)
        if len(suspects) == 0:
            raise ValueError("No suspects found in Excel.")
        return json.dumps(suspects)
    except Exception as e:
        print(f"[-] Failed to load Excel database: {e}")
        return json.dumps([
            {"label": "Rahul Sharma (PER-001)", "id": "PER-001"},
            {"label": "Vikram Patel (PER-004)", "id": "PER-004"}
        ])

def generate_html():
    nodes, edges, merkle = get_graph_data()
    suspect_pool_json = get_suspect_pool_json()
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>त्रिनेत्र-AI Target Explorer & Test Bench</title>
        <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js"></script>
        <style>
            body {{ font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #0b0c10; color: #c5c6c7; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }}
            #header {{ background-color: #1f2833; padding: 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #45a29e; }}
            #merkle-banner {{ background-color: #0b1a0b; color: #66fcf1; border: 1px solid #66fcf1; padding: 8px 15px; border-radius: 4px; font-family: monospace; font-size: 12px; box-shadow: 0 0 10px rgba(102,252,241,0.2); transition: all 0.3s; }}
            
            #tabs {{ display: flex; background: #111; padding-left: 10px; border-bottom: 1px solid #1f2833; }}
            .tab {{ padding: 12px 20px; cursor: pointer; color: #888; border-bottom: 3px solid transparent; font-weight: bold; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }}
            .tab.active {{ color: #66fcf1; border-bottom: 3px solid #66fcf1; }}
            
            #main-container {{ display: flex; flex: 1; overflow: hidden; position: relative; }}
            
            .view-panel {{ display: none; width: 100%; height: 100%; }}
            .view-panel.active {{ display: flex; }}
            
            /* GRAPH VIEW */
            #graph-container {{ flex: 1; border-right: 1px solid #1f2833; background-image: radial-gradient(#1f2833 1px, transparent 1px); background-size: 20px 20px; }}
            #inspector {{ width: 350px; background-color: #121212; padding: 20px; overflow-y: auto; border-left: 1px solid #1f2833; }}
            
            /* CCTV VIEW */
            #cctv-main {{ flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #050505; position: relative; }}
            #telemetry-log {{ width: 450px; background-color: #0a0a0a; border-left: 2px solid #45a29e; padding: 15px; overflow-y: hidden; font-family: monospace; font-size: 12px; color: #45a29e; box-shadow: inset 0 0 20px rgba(0,0,0,0.8); display: flex; flex-direction: column; }}
            
            .cctv-frame-wrapper {{ position: relative; width: 800px; height: 450px; background: #000; border: 2px solid #333; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(0,0,0,0.5); }}
            .cctv-video {{ position: absolute; width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) saturate(0.9) sepia(0.1) hue-rotate(180deg); opacity: 0.9; }}
            #overlay-canvas {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; pointer-events: none; }}
            
            /* Tactical Scanlines */
            .scanlines {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%; pointer-events: none; z-index: 5; }}
            .cctv-overlay-text {{ position: absolute; top: 15px; left: 15px; color: #66fcf1; font-family: monospace; font-size: 12px; text-shadow: 0 0 5px #66fcf1; pointer-events: none; z-index: 20; line-height: 1.4; }}
            .cctv-rec {{ position: absolute; top: 15px; right: 20px; color: #ff3333; font-family: monospace; font-weight: bold; font-size: 16px; animation: blink 1s step-end infinite; text-shadow: 0 0 5px #ff3333; pointer-events: none; z-index: 20; }}
            #model-status {{ position: absolute; bottom: 15px; left: 15px; color: #facc15; font-family: monospace; font-size: 12px; font-weight: bold; z-index: 20; }}
            
            .btn-group {{ margin-top: 20px; display: flex; gap: 15px; align-items: center; justify-content: center; }}
            .btn {{ padding: 12px 25px; background-color: transparent; color: #66fcf1; border: 1px solid #66fcf1; border-radius: 2px; cursor: pointer; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; transition: 0.2s; font-family: monospace; box-shadow: 0 0 10px rgba(102,252,241,0.2); }}
            .btn:hover {{ background-color: #66fcf1; color: #0b0c10; box-shadow: 0 0 20px rgba(102,252,241,0.6); }}
            
            #enrollment-panel {{ margin-top: 15px; padding: 15px; border: 1px solid #45a29e; background: #111; display: flex; gap: 10px; align-items: center; border-radius: 4px; box-shadow: 0 0 10px rgba(102,252,241,0.1); }}
            .input-box {{ padding: 10px; background: #000; border: 1px solid #333; color: #fff; font-family: monospace; }}
            .input-file {{ color: #888; font-family: monospace; font-size: 11px; }}
            
            /* Inspector Styling */
            h2 {{ margin-top: 0; color: #fff; font-size: 16px; border-bottom: 1px solid #333; padding-bottom: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; }}
            .prop-row {{ margin-bottom: 10px; font-size: 12px; font-family: monospace; }}
            .prop-label {{ font-weight: bold; color: #888; display: block; margin-bottom: 3px; }}
            .prop-value {{ color: #66fcf1; word-break: break-all; background: #050505; padding: 6px; border-radius: 2px; border: 1px solid #1f2833; }}
            .badge {{ display: inline-block; padding: 4px 8px; border-radius: 2px; font-size: 11px; font-weight: bold; margin-bottom: 15px; font-family: monospace; letter-spacing: 1px; }}
            .badge-PERSON {{ background-color: #FF4444; color: #111; }}
            .badge-ORGANIZATION {{ background-color: #4444FF; color: #fff; }}
            .badge-ACCOUNT, .badge-PHONE, .badge-LOCATION {{ background-color: #44FF44; color: #111; }}
            
            @keyframes blink {{ 50% {{ opacity: 0; }} }}
            
            /* Terminal Log Entries */
            #log-content {{ flex: 1; overflow-y: auto; display: flex; flex-direction: column; justify-content: flex-end; }}
            .log-entry {{ margin-bottom: 6px; line-height: 1.4; animation: slideIn 0.3s ease-out; }}
            @keyframes slideIn {{ from {{ opacity: 0; transform: translateX(10px); }} to {{ opacity: 1; transform: translateX(0); }} }}
            .log-time {{ color: #888; }}
            .log-action {{ color: #fff; }}
            .log-highlight {{ color: #ff3333; font-weight: bold; }}
            .log-amber {{ color: #f59e0b; font-weight: bold; }}
            .log-success {{ color: #44ff44; font-weight: bold; }}
            .log-coord {{ color: #22d3ee; }}
            .log-empty {{ color: #555; font-style: italic; }}
            
            /* SIH Hackathon Features */
            #federated-ui {{ font-family: monospace; font-size: 11px; display: flex; gap: 10px; align-items: center; }}
            .fed-node {{ background: #004d40; color: #66fcf1; padding: 4px 8px; border-radius: 2px; border: 1px solid #66fcf1; box-shadow: 0 0 5px rgba(102,252,241,0.3); }}
            
            #timeline-controls {{ position: absolute; bottom: 0; left: 0; width: 100%; background: #111; border-top: 1px solid #1f2833; padding: 10px 20px; display: flex; align-items: center; gap: 15px; z-index: 100; box-sizing: border-box; }}
            #timeline-slider {{ flex: 1; accent-color: #66fcf1; cursor: pointer; }}
            .timeline-label {{ color: #888; font-family: monospace; font-size: 12px; font-weight: bold; }}
            
            .btn-wiretap {{ border-color: #ec4899; color: #ec4899; background: #111; }}
            .btn-wiretap:hover {{ background-color: #ec4899; color: #fff; box-shadow: 0 0 20px rgba(236,72,153,0.6); }}
            
            .btn-predict {{ border-color: #facc15; color: #facc15; background: #111; }}
            .btn-predict:hover {{ background-color: #facc15; color: #111; box-shadow: 0 0 20px rgba(250,204,21,0.6); }}
            
            #audio-modal {{ display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #111; border: 1px solid #ec4899; padding: 25px; z-index: 200; box-shadow: 0 0 30px rgba(236,72,153,0.4); text-align: center; border-radius: 4px; }}
            
        </style>
    </head>
    <body>
        <div id="header">
            <div>
                <h1 style="margin: 0; font-size: 18px; color: #66fcf1; font-family: monospace; letter-spacing: 2px; text-transform: uppercase;">SentinelBharat OS // त्रिनेत्र-AI</h1>
                <div style="font-size: 11px; color: #888; margin-top: 4px; font-family: monospace; letter-spacing: 1px;">INTELLIGENCE OPERATIONS PROTOTYPE // CASE-2041</div>
            </div>
            <div id="federated-ui">
                <span style="color:#888;">FEDERATED SYNC:</span>
                <span class="fed-node">&#x1F512; DELHI POLICE [ZKP]</span>
                <span class="fed-node">&#x1F512; MUMBAI ATS [ZKP]</span>
                <span class="fed-node" style="background:#1a202c; border-color:#333; color:#555;">&#x1F512; INTERPOL [OFFLINE]</span>
            </div>
            <div id="merkle-banner">
                &#x1F512; INTEGRITY SECURED | ROOT: <span id="merkle-root-display">{merkle.get('root', 'N/A')[:20]}...</span>
            </div>
        </div>
        
        <div id="tabs">
            <div class="tab active" onclick="switchTab('graph')">Knowledge Graph</div>
            <div class="tab" onclick="switchTab('cctv')">Live Recon: Target Tracking</div>
        </div>

        <div id="main-container">
            <!-- GRAPH VIEW -->
            <div id="graph-view" class="view-panel active">
                <div id="graph-container"></div>
                
                <div style="position: absolute; top: 15px; left: 15px; z-index: 100; display: flex; gap: 10px;">
                    <button class="btn btn-wiretap" onclick="ingestWiretap()">[ INGEST WIRETAP AUDIO ]</button>
                    <button class="btn btn-predict" onclick="runGraphAI()">[ RUN PREDICTIVE GRAPH AI ]</button>
                </div>
                
                <div id="audio-modal">
                    <div style="color: #ec4899; font-weight: bold; margin-bottom: 15px; font-family: monospace; font-size: 14px; letter-spacing: 2px;">[ INTERCEPTING COMM SIGNAL ]</div>
                    <div id="audio-wave" style="font-family: monospace; color: #fff; margin-bottom: 15px; font-size: 18px; letter-spacing: 5px;">||| | || |||| | ||| |</div>
                    <div style="color: #888; font-size: 12px; font-family: monospace;">Running Whisper Inference on Edge...</div>
                </div>

                <div id="timeline-controls">
                    <span class="timeline-label">TIME SCRUB:</span>
                    <input type="range" id="timeline-slider" min="0" max="100" value="100" oninput="updateTimeline()">
                    <span class="timeline-label" id="timeline-date">LIVE</span>
                </div>

                <div id="inspector">
                    <h2>Graph Inspector</h2>
                    <div id="inspector-content">
                        <p style="color: #666; font-size: 12px; font-style: italic;">Select a node or edge to view cryptographic details.</p>
                    </div>
                </div>
            </div>
            
            <!-- CCTV VIEW -->
            <div id="cctv-view" class="view-panel">
                <div id="cctv-main">
                    <div class="cctv-frame-wrapper">
                        <!-- Running on local video for the demo -->
                        <video id="video-feed" class="cctv-video" crossorigin="anonymous" autoplay loop muted playsinline>
                            <source src="cctv_delhi.mp4" type="video/mp4">
                        </video>
                        <canvas id="overlay-canvas"></canvas>
                        <div class="scanlines"></div>
                        <div class="cctv-overlay-text">
                            CAM-01: LIVE FEED<br>
                            SYS: ONLINE // BIOMETRIC ACTIVE<br>
                            <span id="live-time"></span>
                        </div>
                        <div class="cctv-rec">● REC</div>
                        <div id="model-status">Loading Deep Face Recognition Weights...</div>
                    </div>
                    
                    <div class="btn-group">
                        <button class="btn" onclick="toggleWebcam()">[ TOGGLE WEBCAM ]</button>
                        <button class="btn" id="btn-capture" onclick="captureAndSync()">[ CAPTURE & SYNC TO GRAPH ]</button>
                    </div>
                    
                    <div id="enrollment-panel">
                        <span style="color: #66fcf1; font-weight: bold; font-family: monospace; font-size: 12px;">ENROLL TARGET:</span>
                        <input type="file" id="enroll-image" class="input-file" accept="image/*">
                        <input type="text" id="enroll-name" class="input-box" placeholder="Name (e.g. PER-011)">
                        <button class="btn" onclick="enrollTarget()" style="padding: 8px 15px; font-size: 11px;">[ COMPUTE DESCRIPTOR ]</button>
                    </div>
                </div>
                
                <div id="telemetry-log">
                    <div style="border-bottom: 1px solid #45a29e; padding-bottom: 10px; margin-bottom: 15px; font-weight: bold; color: #fff; text-transform: uppercase; letter-spacing: 2px;">Real-Time Telemetry</div>
                    <div id="log-content"></div>
                </div>
            </div>
        </div>

        <script>
            // Live clock
            setInterval(() => {{
                const d = new Date();
                document.getElementById('live-time').innerText = d.toISOString().replace('T', ' ').substring(0, 19) + 'Z';
            }}, 1000);

            function addLog(message, type = 'normal') {{
                const d = new Date();
                const timeStr = d.toTimeString().split(' ')[0];
                const content = document.getElementById('log-content');
                
                let className = 'log-action';
                if(type === 'alert') className = 'log-highlight';
                if(type === 'amber') className = 'log-amber';
                if(type === 'success') className = 'log-success';
                if(type === 'coord') className = 'log-coord';
                if(type === 'empty') className = 'log-empty';
                
                content.innerHTML += `<div class="log-entry"><span class="log-time">[${{timeStr}}]</span> <span class="${{className}}">${{message}}</span></div>`;
                
                // Throttle max 12 logs
                while (content.children.length > 12) {{
                    content.removeChild(content.firstChild);
                }}
                content.scrollTop = content.scrollHeight;
            }}

            // Embedded Initial Data
            const nodes = new vis.DataSet({json.dumps(nodes)});
            const edges = new vis.DataSet({json.dumps(edges)});

            const container = document.getElementById('graph-container');
            const data = {{ nodes: nodes, edges: edges }};
            const options = {{
                nodes: {{ shape: 'dot', size: 25, font: {{ color: '#c5c6c7', size: 12, face: 'monospace' }}, borderWidth: 2, borderColor: '#45a29e', shadow: true }},
                edges: {{ width: 1.5, color: {{ color: '#45a29e', highlight: '#66fcf1' }}, font: {{ color: '#888', size: 10, align: 'middle', face: 'monospace' }}, arrows: 'to', smooth: {{ type: 'continuous' }} }},
                physics: {{ solver: 'forceAtlas2Based', forceAtlas2Based: {{ gravitationalConstant: -100, centralGravity: 0.01, springLength: 150 }} }},
                interaction: {{ hover: true }}
            }};

            const network = new vis.Network(container, data, options);
            const inspectorContent = document.getElementById('inspector-content');

            network.on("selectNode", function (params) {{
                if(params.nodes.length > 0) {{
                    const nodeId = params.nodes[0];
                    const nodeData = nodes.get(nodeId).data;
                    if(!nodeData) return;
                    
                    let html = `<span class="badge badge-${{nodeData.entity_type}}">${{nodeData.entity_type}}</span>`;
                    html += `<div class="prop-row"><span class="prop-label">Entity ID:</span><div class="prop-value">${{nodeData.entity_id}}</div></div>`;
                    html += `<div class="prop-row"><span class="prop-label">Canonical Name:</span><div class="prop-value">${{nodeData.canonical_name}}</div></div>`;
                    
                    if(nodeData.description) {{
                        html += `<div class="prop-row"><span class="prop-label">Profile / Intel:</span><div class="prop-value" style="white-space: pre-wrap;">${{nodeData.description}}</div></div>`;
                    }}
                    
                    inspectorContent.innerHTML = html;
                }}
            }});

            network.on("selectEdge", function (params) {{
                if(params.edges.length > 0 && params.nodes.length === 0) {{
                    const edgeId = params.edges[0];
                    const edgeData = edges.get(edgeId).data;
                    if(!edgeData) return;
                    
                    let html = `<div style="margin-bottom:15px; font-weight:bold; color:#66fcf1;">&#x2194; Relationship Edge</div>`;
                    html += `<div class="prop-row"><span class="prop-label">Type:</span><div class="prop-value" style="color:#fff">${{edgeData.relationship_type}}</div></div>`;
                    html += `<div class="prop-row"><span class="prop-label">Source ID:</span><div class="prop-value">${{edgeData.source_id}}</div></div>`;
                    html += `<div class="prop-row"><span class="prop-label">Target ID:</span><div class="prop-value">${{edgeData.target_id}}</div></div>`;
                    html += `<div class="prop-row"><span class="prop-label">Evidence ID:</span><div class="prop-value">${{edgeData.evidence_id || 'N/A'}}</div></div>`;
                    html += `<div class="prop-row"><span class="prop-label">Cryptographic Hash:</span><div class="prop-value" style="color:#4CAF50; font-size:10px;">${{edgeData.evidence_hash || 'N/A'}}</div></div>`;
                    
                    inspectorContent.innerHTML = html;
                }}
            }});

            network.on("deselectNode", function (params) {{
                if(params.edges.length === 0) inspectorContent.innerHTML = '<p style="color: #666; font-size: 12px; font-style: italic;">Select a node or edge to view cryptographic details.</p>';
            }});
            network.on("deselectEdge", function (params) {{
                if(params.nodes.length === 0) inspectorContent.innerHTML = '<p style="color: #666; font-size: 12px; font-style: italic;">Select a node or edge to view cryptographic details.</p>';
            }});

            // --- HACKATHON FEATURES: JS LOGIC ---
            
            // 1. Time-Machine Slider (Temporal Graph)
            function updateTimeline() {{
                const slider = document.getElementById('timeline-slider');
                const val = parseInt(slider.value);
                
                let edgeTimestamps = edges.get().map(e => new Date(e.data?.timestamp || Date.now()).getTime());
                let minTime = Math.min(...edgeTimestamps);
                let maxTime = Math.max(...edgeTimestamps);
                if(minTime === maxTime || !isFinite(minTime)) {{ minTime = Date.now() - 86400000; maxTime = Date.now(); }}
                
                const currentTime = minTime + ((maxTime - minTime) * (val / 100));
                document.getElementById('timeline-date').innerText = new Date(currentTime).toISOString().replace('T', ' ').substring(0, 19);
                
                const allEdges = edges.get();
                const visibleEdgeIds = allEdges.filter(e => {{
                    const et = new Date(e.data?.timestamp || Date.now()).getTime();
                    return et <= currentTime;
                }}).map(e => e.id);
                
                const visibleEdgesObj = allEdges.map(e => ({{ id: e.id, hidden: !visibleEdgeIds.includes(e.id) }}));
                edges.update(visibleEdgesObj);
            }}

            // 2. Audio Wiretap Ingestion
            async function ingestWiretap() {{
                const modal = document.getElementById('audio-modal');
                modal.style.display = 'block';
                let waveInt = setInterval(() => {{
                    document.getElementById('audio-wave').innerText = Array(20).fill(0).map(()=>Math.random()>0.5?'|':' ').join('');
                }}, 50);
                
                try {{
                    const res = await fetch('/api/wiretap', {{ method: 'POST' }});
                    const data = await res.json();
                    
                    clearInterval(waveInt);
                    modal.style.display = 'none';
                    
                    if(data.success) {{
                        document.getElementById('merkle-root-display').innerText = `${{data.newRoot.substring(0,20)}}...`;
                        document.getElementById('merkle-banner').style.backgroundColor = '#004d40';
                        setTimeout(() => {{ document.getElementById('merkle-banner').style.backgroundColor = '#0b1a0b'; }}, 1000);
                        
                        data.nodes.forEach(n => {{
                            if(!nodes.get(n.entity_id)) {{
                                let color = "#44FF44";
                                if (n.entity_type === "PERSON") color = "#FF4444";
                                nodes.add({{ id: n.entity_id, label: `${{n.canonical_name}}\\n(${{n.entity_type}})`, color: color, data: n }});
                            }}
                        }});
                        const newEdgeIds = [];
                        data.edges.forEach(e => {{
                            const eid = `edge_${{Date.now()}}_${{Math.random()}}`;
                            newEdgeIds.push(eid);
                            edges.add({{
                                id: eid, from: e.source_id, to: e.target_id, label: e.relationship_type,
                                data: e, color: {{color: '#ec4899', highlight: '#f472b6'}}, font: {{color: '#ec4899', size: 12, strokeWidth: 0, bold: true}}
                            }});
                        }});
                        network.selectEdges(newEdgeIds);
                    }}
                }} catch(e) {{
                    clearInterval(waveInt);
                    modal.style.display = 'none';
                    alert("Wiretap server unreachable.");
                }}
            }}
            
            // 3. Predictive Graph AI
            async function runGraphAI() {{
                try {{
                    const res = await fetch('/api/predict_links', {{ method: 'POST' }});
                    const data = await res.json();
                    if(data.success) {{
                        const newEdgeIds = [];
                        data.edges.forEach(e => {{
                            const eid = `edge_${{Date.now()}}_${{Math.random()}}`;
                            newEdgeIds.push(eid);
                            edges.add({{
                                id: eid, from: e.source_id, to: e.target_id, label: e.relationship_type,
                                data: e, dashes: true, width: 2, color: {{color: 'rgba(250,204,21,0.8)', highlight: '#facc15'}}, font: {{color: '#facc15', size: 12, strokeWidth: 0}}
                            }});
                        }});
                        network.selectEdges(newEdgeIds);
                    }}
                }} catch(e) {{
                    alert("Graph AI server unreachable.");
                }}
            }}

            // Tab Switching
            function switchTab(tabId) {{
                document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.view-panel').forEach(el => el.classList.remove('active'));
                
                if (tabId === 'graph') {{
                    document.getElementById('graph-view').classList.add('active');
                    document.querySelectorAll('.tab')[0].classList.add('active');
                }} else {{
                    document.getElementById('cctv-view').classList.add('active');
                    document.querySelectorAll('.tab')[1].classList.add('active');
                    if(!modelsLoaded) initFaceDetection();
                }}
            }}
            
            // --- BIOMETRIC FACE RECOGNITION ---
            let modelsLoaded = false;
            let currentFaces = [];
            let enrolledDescriptors = [];
            let faceMatcher = null;
            
            let useWebcam = false;
            let webcamStream = null;

            // Tracking Pools
            let assignedTrackMap = new Map();
            let nextTrackId = 0;
            
            const NAME_POOL = [
                'Aryan Verma', 'Rohit Mehra', 'Sneha Iyer', 'Manoj Tiwari', 
                'Simran Kaur', 'Deepak Joshi', 'Ananya Sen', 'Tariq Khan', 
                'Kavita Das', 'Sunil Gupta', 'Rohan Bhatia', 'Pooja Reddy',
                'Nikhil Jain', 'Ishaan Malhotra', 'Diya Kapoor'
            ];
            
            const SUSPECT_POOL = {{suspect_pool_json}};
            
            let usedNames = new Set();
            let assignedSuspects = new Set();
            
            // Suspect Interval Logic
            let pedestrianCount = 0;
            let targetPedestriansBeforeCriminal = Math.floor(Math.random() * 5 + 6); // 6 to 10

            async function toggleWebcam() {{
                const video = document.getElementById('video-feed');
                if (!useWebcam) {{
                    try {{
                        webcamStream = await navigator.mediaDevices.getUserMedia({{ video: true }});
                        video.src = '';
                        video.srcObject = webcamStream;
                        useWebcam = true;
                        addLog('Switched to live webcam feed', 'success');
                    }} catch (e) {{
                        addLog('Webcam access denied', 'alert');
                    }}
                }} else {{
                    if(webcamStream) webcamStream.getTracks().forEach(t => t.stop());
                    video.srcObject = null;
                    video.src = "cctv_delhi.mp4";
                    useWebcam = false;
                    addLog('Switched to local MP4 CCTV feed', 'normal');
                }}
            }}
            
            async function enrollTarget() {{
                if(!modelsLoaded) {{ addLog("MODELS NOT READY.", "alert"); return; }}
                const fileInput = document.getElementById('enroll-image');
                const nameInput = document.getElementById('enroll-name');
                if(!fileInput.files.length) {{ addLog("NO IMAGE", "alert"); return; }}
                if(!nameInput.value.trim()) {{ addLog("NO NAME", "alert"); return; }}
                
                const file = fileInput.files[0];
                const targetName = nameInput.value.trim();
                
                const img = await faceapi.bufferToImage(file);
                const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptor();
                    
                if (!detection) {{ addLog(`ENROLLMENT FAILED`, "alert"); return; }}
                enrolledDescriptors.push(new faceapi.LabeledFaceDescriptors(targetName, [detection.descriptor]));
                faceMatcher = new faceapi.FaceMatcher(enrolledDescriptors, 0.55);
                addLog(`SECURED FOR ${{targetName}}`, "success");
            }}
            
            let lastLogTime = 0;

            async function initFaceDetection() {{
                if (modelsLoaded) return;
                addLog('Loading SSD MobileNet, Landmark, and Recognition weights...');
                
                const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
                await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                
                modelsLoaded = true;
                document.getElementById('model-status').style.display = 'none';
                addLog('Tracking initialized.', 'success');
                
                const video = document.getElementById('video-feed');
                const canvas = document.getElementById('overlay-canvas');
                
                video.addEventListener('play', () => {{
                    const displaySize = {{ width: video.clientWidth || 800, height: video.clientHeight || 450 }};
                    faceapi.matchDimensions(canvas, displaySize);
                    
                    setInterval(async () => {{
                        if (video.paused || video.ended) return;
                        
                        const detectorOptions = new faceapi.SsdMobilenetv1Options({{ minConfidence: 0.15 }});
                        
                        let detections = await faceapi.detectAllFaces(video, detectorOptions).withFaceLandmarks().withFaceDescriptors();
                        
                        const dims = {{ width: video.clientWidth, height: video.clientHeight }};
                        faceapi.matchDimensions(canvas, dims);
                        let resizedDetections = faceapi.resizeResults(detections, dims);
                        
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height); // ALWAYS clear canvas - No Ghost Boxes!
                        
                        if (resizedDetections.length === 0) return; // Empty road -> exit
                        
                        // Filter by height (lowered to 15px because 144p video has very small intrinsic face tensors)
                        resizedDetections = resizedDetections.filter(d => d.detection.box.height >= 15);
                        
                        assignedTrackMap.forEach(t => t.activeThisFrame = false);
                        
                        resizedDetections.forEach(d => {{
                            const cx = d.detection.box.x + d.detection.box.width / 2;
                            const cy = d.detection.box.y + d.detection.box.height / 2;
                            
                            let bestDist = Infinity;
                            let bestTrackId = -1;
                            
                            for (let [id, t] of assignedTrackMap.entries()) {{
                                if (t.activeThisFrame) continue;
                                const dist = Math.hypot(t.cx - cx, t.cy - cy);
                                if (dist < 80 && dist < bestDist) {{
                                    bestDist = dist;
                                    bestTrackId = id;
                                }}
                            }}
                            
                            let track;
                            if (bestTrackId !== -1) {{
                                track = assignedTrackMap.get(bestTrackId);
                                track.cx = cx;
                                track.cy = cy;
                                track.box = d.detection.box;
                                track.activeThisFrame = true;
                            }} else {{
                                // NEW PERSON DETECTED
                                let role = 'neutral';
                                let label = '';
                                let matchConf = (Math.random() * 7 + 86).toFixed(1); // 86-93%
                                let age = Math.floor(Math.random() * 40 + 20);
                                let isSuspect = false;
                                
                                if (pedestrianCount >= targetPedestriansBeforeCriminal) {{
                                    isSuspect = true;
                                    pedestrianCount = 0;
                                    targetPedestriansBeforeCriminal = Math.floor(Math.random() * 5 + 6); // Next criminal after 6-10 people
                                }} else {{
                                    pedestrianCount++;
                                }}
                                
                                if (isSuspect) {{
                                    const availableSuspects = SUSPECT_POOL.filter(s => !assignedSuspects.has(s.id));
                                    if (availableSuspects.length > 0) {{
                                        const s = availableSuspects[Math.floor(Math.random() * availableSuspects.length)];
                                        label = s.label;
                                        role = 'alert';
                                        assignedSuspects.add(s.id);
                                        matchConf = (Math.random() * 5 + 92).toFixed(1); // 92-97%
                                    }} else {{
                                        isSuspect = false;
                                    }}
                                }}
                                
                                if (!isSuspect) {{
                                    const availableNames = NAME_POOL.filter(n => !usedNames.has(n));
                                    if (availableNames.length > 0) {{
                                        const n = availableNames[Math.floor(Math.random() * availableNames.length)];
                                        label = `${{n}}, ${{age}}`;
                                        usedNames.add(n);
                                    }} else {{
                                        label = `Pedestrian, ${{age}}`;
                                    }}
                                }}
                                
                                track = {{
                                    id: nextTrackId++,
                                    label: label,
                                    role: role,
                                    matchConf: matchConf,
                                    cx: cx, cy: cy,
                                    box: d.detection.box,
                                    activeThisFrame: true,
                                    justCreated: true
                                }};
                                assignedTrackMap.set(track.id, track);
                            }}
                            
                            // Explicit UI Biometric Override (from manual upload)
                            if (d.descriptor && faceMatcher) {{
                                const bestMatch = faceMatcher.findBestMatch(d.descriptor);
                                if(bestMatch.label !== 'unknown' && bestMatch.label !== 'UNKNOWN' && bestMatch.distance < 0.6) {{
                                    track.label = bestMatch.label;
                                    track.role = 'alert';
                                    track.matchConf = ((1 - bestMatch.distance) * 100).toFixed(1);
                                }}
                            }}
                        }});
                        
                        // Prune dead tracks
                        for (let [id, t] of assignedTrackMap.entries()) {{
                            if (!t.activeThisFrame) {{
                                assignedTrackMap.delete(id);
                            }}
                        }}
                        
                        currentFaces = Array.from(assignedTrackMap.values());
                        
                        const now = Date.now();
                        const shouldLog = (now - lastLogTime) > 1500;
                        
                        if (shouldLog) {{
                            currentFaces.forEach(f => {{
                                if (f.role === 'alert') {{
                                    addLog(`[SUSPECT IDENTIFIED] ${{f.label}} | CONF: ${{f.matchConf}}%`, 'alert');
                                }} else if (f.justCreated) {{
                                    addLog(`TRACKING: ${{f.label}} [x:${{Math.round(f.box.x)}}]`, 'coord');
                                }}
                                f.justCreated = false;
                            }});
                            lastLogTime = now;
                        }}

                        currentFaces.forEach((f) => {{
                            const box = f.box;
                            
                            let color = '#22d3ee';
                            let bgColor = 'rgba(34, 211, 238, 0.1)';
                            let lineWidth = 1;
                            let displayTag = `[PEDESTRIAN // NO RECORD] ${{f.label}}`;
                            
                            if (f.role === 'alert') {{
                                color = '#ef4444';
                                bgColor = 'rgba(239, 68, 68, 0.2)';
                                lineWidth = 2;
                                displayTag = `[WATCHLIST MATCH] ${{f.label}} | Conf: ${{f.matchConf}}%`;
                            }}
                            
                            ctx.strokeStyle = color; 
                            ctx.lineWidth = lineWidth;
                            ctx.strokeRect(box.x, box.y, box.width, box.height);
                            ctx.fillStyle = bgColor; 
                            ctx.fillRect(box.x, box.y, box.width, box.height);
                            
                            ctx.fillStyle = color;
                            const textWidth = ctx.measureText(displayTag).width;
                            const badgeWidth = Math.max(textWidth + 10, box.width);
                            ctx.fillRect(box.x, box.y - 20, badgeWidth, 20);
                            
                            ctx.fillStyle = (f.role === 'neutral') ? '#111' : '#fff'; 
                            ctx.font = 'bold 11px monospace';
                            ctx.fillText(displayTag, box.x + 5, box.y - 6);
                        }});
                        
                    }}, 100);
                }});
            }}
            
            async function captureAndSync() {{
                if(currentFaces.length === 0) {{
                    addLog('NO ACTIVE FACES IN FRAME TO CAPTURE', 'alert');
                    return;
                }}
                
                const uniqueTargets = [...new Set(currentFaces.map(f => f.label.split(',')[0]))]; // Strip age
                
                addLog(`CAPUTRED ${{uniqueTargets.length}} UNIQUE TARGETS FOR GRAPH SYNC`, 'amber');
                
                // Flash video
                const feed = document.getElementById('cctv-view');
                feed.style.opacity = '0.5';
                setTimeout(() => {{ feed.style.opacity = '1'; }}, 150);
                
                try {{
                    const response = await fetch('/api/capture_multi', {{ 
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{ targets: uniqueTargets }})
                    }});
                    const resData = await response.json();
                    
                    if(resData.success) {{
                        addLog(`INTEGRITY SECURED: RECOMPUTED MERKLE ROOT`, 'success');
                        
                        document.getElementById('merkle-root-display').innerText = `${{resData.newRoot.substring(0,20)}}...`;
                        document.getElementById('merkle-banner').style.backgroundColor = '#004d40';
                        setTimeout(() => {{ document.getElementById('merkle-banner').style.backgroundColor = '#0b1a0b'; }}, 1000);
                        
                        resData.nodes.forEach(n => {{
                            if(!nodes.get(n.entity_id)) {{
                                let color = "#CCCCCC";
                                if (n.entity_type === "PERSON") color = "#FF4444";
                                else if (n.entity_type === "LOCATION") color = "#44FF44";
                                
                                nodes.add({{
                                    id: n.entity_id,
                                    label: `${{n.canonical_name}}\\n(${{n.entity_type}})`,
                                    color: color,
                                    title: `ID: ${{n.entity_id}}<br>Type: ${{n.entity_type}}`,
                                    data: n
                                }});
                            }}
                        }});
                        
                        const newEdgeIds = [];
                        resData.edges.forEach(e => {{
                            const eid = `edge_${{Date.now()}}_${{Math.random()}}`;
                            newEdgeIds.push(eid);
                            edges.add({{
                                id: eid,
                                from: e.source_id,
                                to: e.target_id,
                                label: e.relationship_type,
                                title: `Rel: ${{e.relationship_type}}<br>Hash: ${{e.evidence_hash}}`,
                                data: e,
                                color: {{color: '#ef4444', highlight: '#f87171'}}
                            }});
                        }});
                        
                        setTimeout(() => {{
                            switchTab('graph');
                            network.selectEdges(newEdgeIds);
                            network.focus("LOC-DEL-04", {{ scale: 1.0, animation: true }});
                        }}, 1500);
                    }}
                }} catch(e) {{
                    console.error(e);
                    addLog('SYNC FAILED: SERVER UNREACHABLE', 'alert');
                }}
            }}
        </script>
    </body>
    </html>
    """
    
    with open("graph_preview.html", "w") as f:
        f.write(html_content)

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/capture_multi':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            targets = data.get("targets", [])
            
            base = os.path.abspath("netra-ai/outputs/CASE-2041")
            
            with open(os.path.join(base, "entities.json"), "r") as f:
                entities = json.load(f)
                
            with open(os.path.join(base, "relationships.json"), "r") as f:
                relationships = json.load(f)
                
            with open(os.path.join(base, "merkle_tree.json"), "r") as f:
                merkle = json.load(f)
            
            existing_ids = {e["entity_id"] for e in entities}
            added_nodes = []
            
            parsed_targets = []
            for t in targets:
                if " (" in t and ")" in t:
                    name_part, id_part = t.split(" (", 1)
                    pid = id_part.replace(")", "")
                    parsed_targets.append({"id": pid, "name": name_part})
                else:
                    parsed_targets.append({"id": f"ID-{int(time.time()*1000)}", "name": t})
            
            if "LOC-DEL-04" not in existing_ids:
                loc_node = {"entity_id": "LOC-DEL-04", "entity_type": "LOCATION", "canonical_name": "Chawri Bazar Junction", "description": "High-density pedestrian zone"}
                entities.append(loc_node)
                added_nodes.append(loc_node)
                existing_ids.add("LOC-DEL-04")
            
            for pt in parsed_targets:
                if pt["id"] not in existing_ids:
                    node = {"entity_id": pt["id"], "entity_type": "PERSON", "canonical_name": pt["name"], "description": f"Target mapped from CCTV feed"}
                    entities.append(node)
                    added_nodes.append(node)
                    existing_ids.add(pt["id"])
            
            new_edges = []
            ts = time.strftime("%Y-%m-%dT%H:%M:%S")
            ev_id = f"EVID-CCTV-{int(time.time() % 1000)}"
            
            for pt in parsed_targets:
                edge = {
                    "source_id": pt["id"], "target_id": "LOC-DEL-04",
                    "relationship_type": "SEEN_AT", "evidence_id": ev_id, "timestamp": ts
                }
                edge["evidence_hash"] = hash_evidence(edge)
                new_edges.append(edge)
            
            if len(parsed_targets) > 1:
                primary = parsed_targets[0]["id"]
                for i in range(1, len(parsed_targets)):
                    if random.random() < 0.8:  
                        rel_type = random.choice(["MET_WITH", "ASSOCIATED_WITH"])
                        edge = {
                            "source_id": primary, "target_id": parsed_targets[i]["id"],
                            "relationship_type": rel_type, "evidence_id": ev_id, "timestamp": ts
                        }
                        edge["evidence_hash"] = hash_evidence(edge)
                        new_edges.append(edge)
            
            relationships.extend(new_edges)
            
            merkle["leaves"].extend([e["evidence_hash"] for e in new_edges])
            new_root = hash_evidence("".join(merkle["leaves"]))
            merkle["root"] = new_root
            
            with open(os.path.join(base, "entities.json"), "w") as f: json.dump(entities, f, indent=2)
            with open(os.path.join(base, "relationships.json"), "w") as f: json.dump(relationships, f, indent=2)
            with open(os.path.join(base, "merkle_tree.json"), "w") as f: json.dump(merkle, f, indent=2)
            
            response = {
                "success": True,
                "nodes": added_nodes,
                "edges": new_edges,
                "newRoot": new_root
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/api/wiretap':
            content_length = int(self.headers['Content-Length'])
            base = os.path.abspath("netra-ai/outputs/CASE-2041")
            with open(os.path.join(base, "entities.json"), "r") as f: entities = json.load(f)
            with open(os.path.join(base, "relationships.json"), "r") as f: relationships = json.load(f)
            with open(os.path.join(base, "merkle_tree.json"), "r") as f: merkle = json.load(f)
            
            time.sleep(2) # Simulate Whisper Inference Delay
            
            added_nodes = []
            existing_ids = {e["entity_id"] for e in entities}
            
            suspects = []
            try:
                df = pd.read_excel('sih26189_synthetic_criminal_intelligence_dataset.xlsx')
                for _, row in df.iterrows():
                    if str(row.get('Classification')) in ['Suspect', 'Criminal', 'Associate']:
                        suspects.append({"id": row['Person_ID'], "name": row['Name']})
            except:
                pass
                
            if suspects: random.shuffle(suspects); target = suspects[0]
            else: target = {"id": "PER-001", "name": "Rahul Sharma"}
            
            if target["id"] not in existing_ids:
                node = {"entity_id": target["id"], "entity_type": "PERSON", "canonical_name": target["name"], "description": "Extracted via Wiretap Audio OSINT"}
                entities.append(node)
                added_nodes.append(node)
                existing_ids.add(target["id"])
                
            if "PHONE-001" not in existing_ids:
                pnode = {"entity_id": "PHONE-001", "entity_type": "PHONE", "canonical_name": "+91-9876543210", "description": "Burner Device Intercepted"}
                entities.append(pnode)
                added_nodes.append(pnode)
                existing_ids.add("PHONE-001")
                
            ts = time.strftime("%Y-%m-%dT%H:%M:%S")
            ev_id = f"EVID-AUDIO-{int(time.time() % 1000)}"
            edge = {
                "source_id": target["id"], "target_id": "PHONE-001",
                "relationship_type": "VOICE_MATCH", "evidence_id": ev_id, "timestamp": ts
            }
            edge["evidence_hash"] = hash_evidence(edge)
            relationships.append(edge)
            
            merkle["leaves"].append(edge["evidence_hash"])
            new_root = hash_evidence("".join(merkle["leaves"]))
            merkle["root"] = new_root
            
            with open(os.path.join(base, "entities.json"), "w") as f: json.dump(entities, f, indent=2)
            with open(os.path.join(base, "relationships.json"), "w") as f: json.dump(relationships, f, indent=2)
            with open(os.path.join(base, "merkle_tree.json"), "w") as f: json.dump(merkle, f, indent=2)
            
            response = {"success": True, "nodes": added_nodes, "edges": [edge], "newRoot": new_root}
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/api/predict_links':
            content_length = int(self.headers['Content-Length'])
            base = os.path.abspath("netra-ai/outputs/CASE-2041")
            with open(os.path.join(base, "entities.json"), "r") as f: entities = json.load(f)
            
            persons = [e for e in entities if e["entity_type"] == "PERSON"]
            new_edges = []
            
            if len(persons) >= 2:
                for _ in range(2):
                    p1, p2 = random.sample(persons, 2)
                    new_edges.append({
                        "source_id": p1["entity_id"], "target_id": p2["entity_id"],
                        "relationship_type": "PROBABLE_ASSOCIATE",
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                        "evidence_id": "AI-PREDICTION",
                        "evidence_hash": "AI-PREDICTION-UNVERIFIED"
                    })
                    
            response = {"success": True, "edges": new_edges}
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

def serve():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    print("[*] Building unified visualization...")
    generate_html()
    
    server_thread = threading.Thread(target=serve, daemon=True)
    server_thread.start()
    
    print(f"\\n[+] Visual Verification Server live at http://localhost:{PORT}/graph_preview.html")
    
    import time
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\\n[!] Shutting down visual verification server.")
