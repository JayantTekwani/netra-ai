import { useEffect, useRef, useState, useMemo } from "react";
import type { Entity, Relationship } from "@/data/types";
import { ENTITY_TYPE_META } from "@/data/mock";

// Seeded random for deterministic 3D layouts
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return function() {
    h = Math.imul(741103597, h);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
}

export function HolographicGraph({
  entities,
  relationships,
}: {
  entities: Entity[];
  relationships: Relationship[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeLayerRef = useRef<HTMLDivElement>(null);
  const dustCanvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const [activeFilter, setActiveFilter] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);

  // Generate 3D layout once
  const holoNodes = useMemo(() => {
    return entities.map((e) => {
      const rand = seededRandom(e.id);
      // Spherical distribution
      const u = rand();
      const v = rand();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 180 * Math.cbrt(rand()); // Radius of sphere
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      return {
        ...e,
        x, y, z,
        color: ENTITY_TYPE_META[e.type].color,
        flagged: e.type === "person" && rand() > 0.8 // Randomly flag some for demo
      };
    });
  }, [entities]);

  const holoEdgeList = useMemo(() => relationships.map(r => [r.source, r.target]), [relationships]);
  const nodeMap = useMemo(() => new Map(holoNodes.map(n => [n.id, n])), [holoNodes]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || !nodeLayerRef.current || !dustCanvasRef.current || !tooltipRef.current) return;
    
    const scene = containerRef.current;
    const svg = svgRef.current;
    const nodeLayer = nodeLayerRef.current;
    const tooltip = tooltipRef.current;
    const dustCanvas = dustCanvasRef.current;
    const svgNS = "http://www.w3.org/2000/svg";

    // Setup elements
    svg.innerHTML = '';
    nodeLayer.innerHTML = '';
    
    const edgeEls: Record<string, SVGLineElement> = {};
    const flowEls: Record<string, { dot: SVGCircleElement; t: number; speed: number; dir: number }> = {};
    const nodeEls: Record<string, HTMLDivElement> = {};

    holoEdgeList.forEach(([a, b]) => {
      if (!a || !b || !nodeMap.has(a) || !nodeMap.has(b)) return;
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('stroke', 'var(--edge-color)');
      line.setAttribute('stroke-width', '1.1');
      svg.appendChild(line);
      edgeEls[a + '_' + b] = line;

      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('r', '1.8');
      dot.setAttribute('fill', 'var(--accent)');
      dot.setAttribute('opacity', '0.9');
      svg.appendChild(dot);
      flowEls[a + '_' + b] = { dot, t: Math.random(), speed: 0.0025 + Math.random() * 0.003, dir: Math.random() > 0.5 ? 1 : -1 };
    });

    holoNodes.forEach(n => {
      const el = document.createElement('div');
      el.className = 'holo-node3d' + (n.flagged ? ' flagged' : '');
      el.setAttribute('data-id', n.id);
      el.innerHTML = `<div class="hl">${n.name}</div>`;
      nodeLayer.appendChild(el);
      nodeEls[n.id] = el;
    });

    let rotX = -0.2, rotY = 0.42, zoom = 1;
    let velX = 0, velY = 0;
    const FOCAL = 520;
    let focusTarget: { rotY: number, rotX: number } | null = null;
    let focusZoom: number | null = null;
    let lastProjected: Record<string, any> = {};

    function project(n: any, w: number, h: number) {
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      let x = n.x * cosY - n.z * sinY;
      let z = n.x * sinY + n.z * cosY;
      let y = n.y;
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      let y2 = y * cosX - z * sinX;
      let z2 = y * sinX + z * cosX;
      const scale = (FOCAL / (FOCAL - z2)) * zoom;
      return { sx: w / 2 + x * scale, sy: h / 2 + y2 * scale, scale, z: z2 };
    }

    function pointAlong(pa: any, pb: any, t: number) {
      return { x: pa.sx + (pb.sx - pa.sx) * t, y: pa.sy + (pb.sy - pa.sy) * t };
    }

    // --- Dust Particles ---
    const ctx = dustCanvas.getContext('2d')!;
    let dustParticles: any[] = [];
    function initDust() {
      const w = scene.clientWidth, h = scene.clientHeight;
      dustCanvas.width = w; dustCanvas.height = h;
      dustParticles = Array.from({ length: 45 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        vy: -(Math.random() * 0.15 + 0.03),
        alpha: Math.random() * 0.35 + 0.05
      }));
    }
    initDust();
    const handleResize = () => initDust();
    window.addEventListener('resize', handleResize);

    function renderDust() {
      const w = dustCanvas.width, h = dustCanvas.height;
      ctx.clearRect(0, 0, w, h);
      dustParticles.forEach(p => {
        p.y += p.vy;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${p.alpha})`;
        ctx.fill();
      });
    }

    let animationId: number;
    let isDragging = false;
    let lastX = 0, lastY = 0;
    
    let currentAutoRotate = autoRotate;

    function render() {
      const w = scene.clientWidth, h = scene.clientHeight;
      svg.setAttribute('width', w.toString());
      svg.setAttribute('height', h.toString());

      const projected: Record<string, any> = {};
      holoNodes.forEach(n => { projected[n.id] = project(n, w, h); });
      lastProjected = projected;

      const sorted = Object.entries(projected).sort((a, b) => a[1].z - b[1].z);
      sorted.forEach(([id, p], idx) => {
        const n = nodeMap.get(id)!;
        const el = nodeEls[id];
        if(!el) return;
        const matchesSearch = activeFilter && !n.name.toLowerCase().includes(activeFilter.toLowerCase());
        const baseSize = n.flagged ? 15 : 13;
        const size = Math.max(7, baseSize * p.scale);
        el.style.left = p.sx + 'px';
        el.style.top = p.sy + 'px';
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.zIndex = (100 + idx).toString();
        const depthGlow = Math.max(0.25, Math.min(1, p.scale));
        el.style.background = `radial-gradient(circle at 32% 28%, #ffffff 0%, ${n.color} 28%, ${n.color} 60%, rgba(0,0,0,0.6) 100%)`;
        const flagGlow = n.flagged ? `, 0 0 ${16 * depthGlow}px 3px var(--accent-ring)` : '';
        el.style.boxShadow = `0 0 ${9 * depthGlow}px 1px ${n.color}, inset -2px -3px 4px rgba(0,0,0,0.4)${flagGlow}`;
        const lbl = el.querySelector('.hl') as HTMLElement;
        lbl.style.opacity = matchesSearch ? '0.08' : Math.max(0.35, Math.min(1, p.scale)).toString();
        el.style.opacity = matchesSearch ? '0.08' : (el.classList.contains('dim') ? '0.12' : '1');
      });

      holoEdgeList.forEach(([a, b]) => {
        const key = a + '_' + b;
        const line = edgeEls[key];
        const flow = flowEls[key];
        if (!line || !flow) return;
        
        const pa = projected[a!], pb = projected[b!];
        line.setAttribute('x1', pa.sx); line.setAttribute('y1', pa.sy);
        line.setAttribute('x2', pb.sx); line.setAttribute('y2', pb.sy);

        flow.t += flow.speed * flow.dir;
        if (flow.t > 1) flow.t = 0;
        if (flow.t < 0) flow.t = 1;
        const pt = pointAlong(pa, pb, flow.t);
        flow.dot.setAttribute('cx', pt.x.toString());
        flow.dot.setAttribute('cy', pt.y.toString());
      });
    }

    function loop() {
      if (isDragging) {
        // active drag handled in mousemove
      } else if (focusTarget) {
        rotY += (focusTarget.rotY - rotY) * 0.08;
        rotX += (focusTarget.rotX - rotX) * 0.08;
        zoom += ((focusZoom || 1.6) - zoom) * 0.08;
        if (Math.abs(focusTarget.rotY - rotY) < 0.002 && Math.abs(focusTarget.rotX - rotX) < 0.002) focusTarget = null;
      } else if (Math.abs(velX) > 0.0002 || Math.abs(velY) > 0.0002) {
        rotY += velY; rotX += velX;
        rotX = Math.max(-1.3, Math.min(1.3, rotX));
        velX *= 0.94; velY *= 0.94;
      } else if (currentAutoRotate) {
        rotY += 0.0026;
      }
      render();
      renderDust();
      animationId = requestAnimationFrame(loop);
    }
    animationId = requestAnimationFrame(loop);

    // --- Interaction Logic ---
    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.holo-node3d') || (e.target as HTMLElement).closest('.holo-side')) return;
      isDragging = true; currentAutoRotate = false; setAutoRotate(false); focusTarget = null;
      lastX = e.clientX; lastY = e.clientY;
      velX = 0; velY = 0;
      scene.classList.add('dragging');
    };
    
    const onMouseMove = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const insideScene = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (isDragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        velY = dx * 0.0055; velX = dy * 0.0055;
        rotY += velY; rotX += velX;
        rotX = Math.max(-1.3, Math.min(1.3, rotX));
        lastX = e.clientX; lastY = e.clientY;
      } else if (insideScene && !(e.target as HTMLElement).closest('.holo-side')) {
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        let closest: string | null = null, closestDist = 22;
        Object.entries(lastProjected).forEach(([id, p]) => {
          const d = Math.hypot(p.sx - mx, p.sy - my);
          if (d < closestDist) { closest = id; closestDist = d; }
        });
        if (closest) {
          const n = nodeMap.get(closest)!;
          tooltip.innerHTML = `<span class="tt-type">${n.type.toUpperCase()}${n.flagged ? ' · FLAGGED' : ''}</span>${n.name}`;
          tooltip.style.left = lastProjected[closest].sx + 'px';
          tooltip.style.top = lastProjected[closest].sy + 'px';
          tooltip.classList.add('show');
          scene.style.cursor = 'pointer';
        } else {
          tooltip.classList.remove('show');
          scene.style.cursor = 'grab';
        }
      } else {
        tooltip.classList.remove('show');
      }
    };

    const onMouseUp = () => { isDragging = false; scene.classList.remove('dragging'); };
    const onMouseLeave = () => { tooltip.classList.remove('show'); };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom += (e.deltaY < 0 ? 0.08 : -0.08);
      zoom = Math.max(0.5, Math.min(2.6, zoom));
    };

    scene.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    scene.addEventListener('mouseleave', onMouseLeave);
    scene.addEventListener('wheel', onWheel as EventListener, { passive: false });

    // Node Click Handlers inside nodeLayer
    const onNodeClick = (e: MouseEvent) => {
      const nodeEl = (e.target as HTMLElement).closest('.holo-node3d') as HTMLElement;
      if (!nodeEl) return;
      const id = nodeEl.getAttribute('data-id');
      if(!id) return;
      
      const n = nodeMap.get(id)!;
      setSelectedNode(n);
      
      const neighbors = new Set([id]);
      holoEdgeList.forEach(([a, b]) => {
        if (a === id) neighbors.add(b);
        if (b === id) neighbors.add(a);
      });
      Object.entries(nodeEls).forEach(([nid, el]) => {
        el.classList.toggle('dim', !neighbors.has(nid));
      });
      holoEdgeList.forEach(([a, b]) => {
        const line = edgeEls[a + '_' + b];
        if(line) line.style.opacity = (a === id || b === id) ? '1' : '0.08';
      });
    };
    
    const onNodeDblClick = (e: MouseEvent) => {
      const nodeEl = (e.target as HTMLElement).closest('.holo-node3d') as HTMLElement;
      if (!nodeEl) return;
      const id = nodeEl.getAttribute('data-id');
      if(!id) return;
      const n = nodeMap.get(id)!;
      const targetRotY = Math.atan2(n.x, n.z) * -1 + Math.PI;
      const targetRotX = Math.atan2(n.y, Math.hypot(n.x, n.z)) * 0.6;
      focusTarget = { rotY: targetRotY, rotX: targetRotX };
      focusZoom = 1.8;
      currentAutoRotate = false;
      setAutoRotate(false);
    };
    
    nodeLayer.addEventListener('click', onNodeClick);
    nodeLayer.addEventListener('dblclick', onNodeDblClick);
    
    // Scene dblclick to reset
    const onSceneDblClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.holo-node3d') || (e.target as HTMLElement).closest('.holo-side')) return;
      setSelectedNode(null);
      Object.values(nodeEls).forEach(el => el.classList.remove('dim'));
      Object.values(edgeEls).forEach(el => el.style.opacity = '1');
      focusTarget = { rotY: 0.42, rotX: -0.2 };
      focusZoom = 1;
    };
    scene.addEventListener('dblclick', onSceneDblClick);
    
    // Reset View Button exposed via ref/state
    (window as any).__holoReset = () => {
      focusTarget = null; focusZoom = null;
      rotX = -0.2; rotY = 0.42; zoom = 1; velX = 0; velY = 0;
    };
    
    (window as any).__holoToggleAuto = () => {
      currentAutoRotate = !currentAutoRotate;
      setAutoRotate(currentAutoRotate);
    };

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      scene.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      scene.removeEventListener('mouseleave', onMouseLeave);
      scene.removeEventListener('wheel', onWheel as EventListener);
      nodeLayer.removeEventListener('click', onNodeClick);
      nodeLayer.removeEventListener('dblclick', onNodeDblClick);
      scene.removeEventListener('dblclick', onSceneDblClick);
      delete (window as any).__holoReset;
      delete (window as any).__holoToggleAuto;
    };
  }, [holoNodes, holoEdgeList, activeFilter]);
  
  const css = `
    .holo-screen {
      position:relative; z-index:1; height:100%; width:100%;
      border-radius:var(--radius-lg); overflow:hidden;
      background:radial-gradient(ellipse at 50% 25%, #14161B, #0A0B0D 65%);
      box-shadow: 0 40px 100px -30px var(--shadow), inset 0 1px 0 rgba(255,255,255,0.08);
      border:1px solid rgba(255,255,255,0.08);
    }
    html[data-theme="light"] .holo-screen {
      background:radial-gradient(ellipse at 50% 25%, #FFFFFF, #F0EDE6 65%);
      border:1px solid var(--border);
      box-shadow: 0 20px 50px -20px var(--shadow), inset 0 1px 0 var(--surface);
    }
    
    .holo-topbar {
      position:absolute; top:0; left:0; right:0; z-index:10;
      display:flex; justify-content:space-between; align-items:center;
      padding:18px 24px; font-family:'JetBrains Mono',monospace; font-size:11px;
      color:var(--muted-foreground); pointer-events:none;
    }
    .holo-live { display:flex; align-items:center; gap:7px; color:var(--sage); }
    .holo-live .dt { width:5px; height:5px; border-radius:50%; background:var(--sage); box-shadow:0 0 8px var(--sage); animation:holoBlink 1.6s ease-in-out infinite; }
    @keyframes holoBlink { 0%,100%{opacity:1;} 50%{opacity:0.25;} }

    .holo-controls { position:absolute; top:16px; right:20px; z-index:15; display:flex; gap:8px; }

    .holo-search-wrap { position:absolute; top:52px; left:20px; z-index:15; }
    .holo-search {
      width:180px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.14);
      color:var(--foreground); font-family:'JetBrains Mono',monospace; font-size:11.5px;
      padding:8px 12px; border-radius:8px; outline:none; backdrop-filter:blur(8px);
      transition:border-color 200ms, width 200ms;
    }
    html[data-theme="light"] .holo-search {
      background:rgba(0,0,0,0.03); border:1px solid var(--border);
    }
    .holo-search::placeholder { color:var(--muted-foreground); }
    .holo-search:focus { border-color:var(--accent); width:210px; }

    .holo-tooltip {
      position:absolute; z-index:30;
      background:rgba(10,11,13,0.85); border:1px solid rgba(255,255,255,0.14);
      backdrop-filter:blur(10px); padding:9px 13px; border-radius:9px;
      font-family:'JetBrains Mono',monospace; font-size:11px; color:#F2F1EE;
      pointer-events:none; opacity:0; transform:translate(-50%, -130%);
      transition:opacity 150ms; white-space:nowrap;
    }
    html[data-theme="light"] .holo-tooltip {
      background:rgba(255,255,255,0.9); border:1px solid var(--border); color:#17160F;
    }
    .holo-tooltip.show { opacity:1; }
    .holo-tooltip .tt-type { color:var(--accent); font-size:9.5px; letter-spacing:0.03em; display:block; margin-bottom:2px; }

    #holoDust { position:absolute; inset:0; z-index:1; pointer-events:none; }
    .holo-btn {
      width:30px; height:30px; border-radius:8px;
      background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:var(--muted-foreground); font-size:13px;
      transition:background 150ms, color 150ms;
    }
    html[data-theme="light"] .holo-btn {
      background:rgba(0,0,0,0.03); border:1px solid var(--border);
    }
    .holo-btn:hover { background:rgba(255,255,255,0.1); color:var(--foreground); }
    html[data-theme="light"] .holo-btn:hover { background:rgba(0,0,0,0.08); }
    .holo-btn.active { color:var(--accent); border-color:var(--accent-ring); }

    .holo-scene { position:absolute; inset:0; cursor:grab; overflow:hidden; }
    .holo-scene.dragging { cursor:grabbing; }
    #holoSvg { position:absolute; inset:0; width:100%; height:100%; z-index:2; }
    #holoNodeLayer { position:absolute; inset:0; z-index:3; }
    .holo-node3d {
      position:absolute; top:0; left:0; border-radius:50%; cursor:pointer;
      transform:translate(-50%,-50%); transition:opacity 300ms; will-change:left, top, width, height;
    }
    .holo-node3d .hl {
      position:absolute; top:100%; left:50%; transform:translateX(-50%); margin-top:6px; white-space:nowrap;
      font-family:'JetBrains Mono',monospace; font-size:9.5px; color:#82868C; background:rgba(10,11,13,0.7);
      padding:2px 6px; border-radius:4px; pointer-events:none;
    }
    html[data-theme="light"] .holo-node3d .hl {
      background:rgba(255,255,255,0.85); color:#6B6858; border:1px solid var(--border);
    }
    
    .holo-side {
      position:absolute; top:0; right:0; bottom:0; z-index:20; width:260px;
      background:rgba(16,17,20,0.75); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px);
      border-left:1px solid rgba(255,255,255,0.08); padding:64px 20px 20px;
      transform:translateX(100%); transition:transform 350ms cubic-bezier(.2,.8,.2,1);
    }
    html[data-theme="light"] .holo-side {
      background:rgba(255,255,255,0.75); border-left:1px solid var(--border);
    }
    .holo-side.open { transform:translateX(0); }
    .holo-tag { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--accent); letter-spacing:0.04em; margin-bottom:6px; }
    .holo-name { font-family:'Fraunces',serif; font-size:19px; color:var(--foreground); margin-bottom:16px; }
    .holo-row { display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.07); font-size:12px; color:var(--foreground); }
    html[data-theme="light"] .holo-row { border-bottom:1px solid var(--border); }
    .holo-row span:first-child { color:var(--muted-foreground); font-family:'JetBrains Mono',monospace; font-size:10.5px; }
    .holo-side-close {
      position:absolute; top:18px; right:18px; width:24px; height:24px; border-radius:50%;
      border:1px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:var(--muted-foreground); font-size:12px;
    }
    html[data-theme="light"] .holo-side-close { border:1px solid var(--border); }
    .holo-side-close:hover { color:var(--foreground); border-color:var(--foreground); }

    .holo-hint {
      position:absolute; bottom:18px; left:50%; transform:translateX(-50%); z-index:10;
      font-family:'JetBrains Mono',monospace; font-size:10.5px; color:var(--muted-foreground);
      background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
      padding:7px 14px; border-radius:100px; backdrop-filter:blur(8px); pointer-events:none;
    }
    html[data-theme="light"] .holo-hint {
      background:rgba(0,0,0,0.04); border:1px solid var(--border);
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="holo-screen" id="holoScreen" ref={containerRef}>
        <div className="holo-topbar">
          <span>INVESTIGATION WORKSPACE</span>
          <span className="holo-live"><span className="dt"></span>LIVE · drag to rotate</span>
        </div>
        
        <div className="holo-search-wrap">
          <input 
            className="holo-search" 
            placeholder="Search entity..." 
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          />
        </div>
        
        <div className="holo-controls">
          <div 
            className={`holo-btn ${autoRotate ? 'active' : ''}`} 
            onClick={() => (window as any).__holoToggleAuto?.()} 
            title="Toggle auto-rotate"
          >⟳</div>
          <div 
            className="holo-btn" 
            onClick={() => (window as any).__holoReset?.()} 
            title="Reset view"
          >⤾</div>
        </div>
        
        <div className="holo-scene" id="holoScene">
          <canvas id="holoDust" ref={dustCanvasRef}></canvas>
          <svg id="holoSvg" ref={svgRef}></svg>
          <div id="holoNodeLayer" ref={nodeLayerRef}></div>
          <div className="holo-tooltip" id="holoTooltip" ref={tooltipRef}></div>
        </div>
        
        <div className={`holo-side ${selectedNode ? 'open' : ''}`} id="holoSide">
          <div 
            className="holo-side-close" 
            onClick={() => {
              setSelectedNode(null);
              if(nodeLayerRef.current) {
                Array.from(nodeLayerRef.current.children).forEach(el => el.classList.remove('dim'));
              }
              if(svgRef.current) {
                Array.from(svgRef.current.querySelectorAll('line')).forEach(el => (el as SVGElement).style.opacity = '1');
              }
            }}
          >✕</div>
          <div className="holo-tag">{selectedNode?.type.toUpperCase() ?? 'ENTITY'}</div>
          <div className="holo-name">{selectedNode?.name ?? '—'}</div>
          <div className="holo-row"><span>TYPE</span><span>{selectedNode?.type ?? '—'}</span></div>
          <div className="holo-row">
            <span>CONNECTIONS</span>
            <span>
              {selectedNode ? 
                relationships.filter(r => r.source === selectedNode.id || r.target === selectedNode.id).length 
              : '—'} direct links
            </span>
          </div>
          <div className="holo-row"><span>FIRST SEEN</span><span>{selectedNode?.attributes?.["First Seen"] ?? '—'}</span></div>
          <div className="holo-row"><span>CONFIDENCE</span><span>{selectedNode ? '98%' : '—'}</span></div>
          
          <div className="mt-8">
            <button className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium text-sm transition-opacity hover:opacity-90">
              Trace Connections
            </button>
            <button className="w-full border border-border bg-transparent text-foreground mt-2 py-2 rounded-md font-medium text-sm transition-colors hover:bg-surface-raised">
              View Raw Record
            </button>
          </div>
        </div>
        
        <div className="holo-hint">✥ drag to rotate · scroll to zoom · click a node</div>
      </div>
    </>
  );
}
