import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Entity, Relationship } from "@/data/types";
import { ENTITY_TYPE_META } from "@/data/mock";

/** Seeded deterministic random (string seed → float [0,1)) */
function seededRng(seed: string) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(33, h) ^ seed.charCodeAt(i)) >>> 0;
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

interface HoloNode {
  id: string;
  name: string;
  type: string;
  color: string;
  flagged: boolean;
  x: number; y: number; z: number; // world-space
}

interface HoloEdge { a: string; b: string; t: number; speed: number; dir: number; }

const MAX_NODES = 200;
const MAX_EDGES = 400;
const FOCAL = 520;

export const ENTITY_ICONS: Record<string, string> = {
  person: "👤",
  phone: "📞",
  account: "💳",
  location: "📍",
  organization: "🏢",
};

export function HolographicGraph({
  entities,
  relationships,
}: {
  entities: Entity[];
  relationships: Relationship[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeFilterRef = useRef("");
  const [activeFilter, setActiveFilter] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);
  const [is2D, setIs2D] = useState(false);
  const [selectedNode, setSelectedNode] = useState<HoloNode | null>(null);
  const selectedNodeRef = useRef<HoloNode | null>(null);
  selectedNodeRef.current = selectedNode;
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  activeFilterRef.current = activeFilter;

  // Build node/edge lists once when entities/relationships change
  const { holoNodes, holoEdges, nodeMap } = useMemo(() => {
    const capped = entities.slice(0, MAX_NODES);
    const rng = seededRng(capped.map(e => e.id).join(""));
    const nodes: HoloNode[] = capped.map(e => {
      const u = rng(), v = rng(), rr = 180 * Math.cbrt(rng());
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(2 * v - 1);
      return {
        id: e.id, name: e.name, type: e.type,
        color: ENTITY_TYPE_META[e.type]?.color ?? "#888",
        flagged: e.type === "person" && rng() > 0.78,
        x: rr * Math.sin(phi) * Math.cos(theta),
        y: rr * Math.sin(phi) * Math.sin(theta),
        z: rr * Math.cos(phi),
      };
    });
    const nodeIds = new Set(nodes.map(n => n.id));
    const validRels = relationships.filter(r => nodeIds.has(r.source) && nodeIds.has(r.target));
    const edges: HoloEdge[] = validRels.slice(0, MAX_EDGES).map(r => ({
      a: r.source, b: r.target,
      t: rng(), speed: 0.002 + rng() * 0.003, dir: rng() > 0.5 ? 1 : -1,
    }));
    const map = new Map(nodes.map(n => [n.id, n]));
    return { holoNodes: nodes, holoEdges: edges, nodeMap: map };
  }, [entities, relationships]);

  // Adjacency map for fast neighbor lookups
  const neighborMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of holoEdges) {
      if (!map.has(edge.a)) map.set(edge.a, new Set());
      if (!map.has(edge.b)) map.set(edge.b, new Set());
      map.get(edge.a)!.add(edge.b);
      map.get(edge.b)!.add(edge.a);
    }
    return map;
  }, [holoEdges]);
  const neighborMapRef = useRef(neighborMap);
  neighborMapRef.current = neighborMap;

  // Update stat counters (after memo)
  useEffect(() => {
    setNodeCount(holoNodes.length);
    setEdgeCount(holoEdges.length);
  }, [holoNodes, holoEdges]);

  // Resolve CSS variable colours once
  const resolveColor = useCallback((varOrHex: string): string => {
    if (!varOrHex.startsWith("var(")) return varOrHex;
    const prop = varOrHex.slice(4, -1).trim();
    if (typeof document !== "undefined") {
      const v = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
      return v || "#888";
    }
    return "#888";
  }, []);

  // Canvas render loop — only runs once per mount, reads everything via refs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false })!;
    let animId: number;
    let rotX = -0.2, rotY = 0.42;
    let velX = 0, velY = 0;
    let zMult = 1;
    let zoom = 1;
    let currentAutoRotate = true;
    let currentIs2D = false;
    let isDragging = false;
    let lastMX = 0, lastMY = 0;
    let focusTarget: { rotY: number; rotX: number } | null = null;
    let focusZoom: number | null = null;

    // Local mutable copies (edges need t updated each frame)
    const edges = holoEdges.map(e => ({ ...e }));

    // Resolve entity colours once (CSS vars need document)
    const resolvedColors = new Map<string, string>();
    holoNodes.forEach(n => {
      if (!resolvedColors.has(n.color)) {
        resolvedColors.set(n.color, resolveColor(n.color));
      }
    });

    // Projected screen positions (updated every frame)
    const projected: Array<{ sx: number; sy: number; scale: number; z: number }> =
      new Array(holoNodes.length).fill(null).map(() => ({ sx: 0, sy: 0, scale: 1, z: 0 }));

    function project(n: HoloNode, w: number, h: number, idx: number) {
      const ez = n.z * zMult;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const x1 = n.x * cosY - ez * sinY;
      const z1 = n.x * sinY + ez * cosY;
      const y1 = n.y;
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;
      const scale = (FOCAL / (FOCAL - z2)) * zoom;
      projected[idx] = { sx: w / 2 + x1 * scale, sy: h / 2 + y2 * scale, scale, z: z2 };
    }

    function getAccentColor() {
      return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#3B82F6";
    }
    function getMutedColor() {
      return getComputedStyle(document.documentElement).getPropertyValue("--muted-foreground").trim() || "#6B7280";
    }

    function render() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;

      // Resize canvas if needed
      if (canvas!.width !== w * dpr || canvas!.height !== h * dpr) {
        canvas!.width = w * dpr;
        canvas!.height = h * dpr;
        ctx.scale(dpr, dpr);
      }

      // Background
      const isDark = !document.documentElement.getAttribute("data-theme")?.includes("light");
      ctx.fillStyle = isDark ? "#0A0B0D" : "#F8F6F0";
      ctx.fillRect(0, 0, w, h);

      // Project all nodes
      for (let i = 0; i < holoNodes.length; i++) project(holoNodes[i]!, w, h, i);

      const filter = activeFilterRef.current.toLowerCase();
      const accentColor = getAccentColor();
      const mutedColor = getMutedColor();
      const edgeColor = isDark ? "rgba(100,120,160,0.35)" : "rgba(80,100,140,0.3)";

      const selNode = selectedNodeRef.current;
      const neighbors = selNode ? (neighborMapRef.current.get(selNode.id) ?? new Set<string>()) : null;

      // Draw edges
      for (const edge of edges) {
        const ai = holoNodes.findIndex(n => n.id === edge.a);
        const bi = holoNodes.findIndex(n => n.id === edge.b);
        if (ai < 0 || bi < 0) continue;
        const pa = projected[ai]!;
        const pb = projected[bi]!;

        const isConnectedToSelected = selNode ? (edge.a === selNode.id || edge.b === selNode.id) : false;

        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);

        if (selNode) {
          if (isConnectedToSelected) {
            // Highlighted connection to selected person/entity
            ctx.strokeStyle = "#66fcf1";
            ctx.lineWidth = 2.4;
            ctx.shadowColor = "rgba(102, 252, 241, 0.85)";
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            // Dim unconnected edges
            ctx.strokeStyle = isDark ? "rgba(100,120,160,0.06)" : "rgba(80,100,140,0.06)";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        } else {
          ctx.strokeStyle = edgeColor;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Flowing dot
        edge.t += edge.speed * edge.dir * (isConnectedToSelected ? 1.6 : 1);
        if (edge.t > 1) edge.t = 0;
        if (edge.t < 0) edge.t = 1;
        const dx = pa.sx + (pb.sx - pa.sx) * edge.t;
        const dy = pa.sy + (pb.sy - pa.sy) * edge.t;

        if (!selNode || isConnectedToSelected) {
          ctx.beginPath();
          ctx.arc(dx, dy, isConnectedToSelected ? 2.5 : 1.4, 0, Math.PI * 2);
          ctx.fillStyle = isConnectedToSelected ? "#66fcf1" : accentColor;
          ctx.globalAlpha = isConnectedToSelected ? 1 : 0.8;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Sort nodes back-to-front
      const order = holoNodes.map((_, i) => i).sort((a, b) => projected[a]!.z - projected[b]!.z);

      // Draw nodes
      for (const idx of order) {
        const n = holoNodes[idx]!;
        const p = projected[idx]!;
        const color = resolvedColors.get(n.color) ?? "#888";
        const isSelected = selNode?.id === n.id;
        const isNeighbor = selNode ? (neighbors?.has(n.id) ?? false) : false;
        const isFocused = isSelected || isNeighbor;

        const baseR = (n.flagged ? 11 : 9.5) * Math.max(0.45, Math.min(1.4, p.scale));
        const matched = !filter || n.name.toLowerCase().includes(filter);

        let alpha = matched ? 1 : 0.08;
        if (selNode && !isFocused) {
          alpha = alpha * 0.15; // Dim unconnected entities when an entity is selected
        }

        ctx.globalAlpha = alpha;

        // Glow for selected or flagged
        if ((isSelected || (n.flagged && matched)) && alpha > 0.3) {
          ctx.shadowColor = isSelected ? "#66fcf1" : accentColor;
          ctx.shadowBlur = isSelected ? 18 : 12;
        }

        // Node disc badge (replaces plain blue 3D ball)
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, baseR, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? "rgba(16, 20, 28, 0.9)" : "rgba(255, 255, 255, 0.94)";
        ctx.fill();

        ctx.strokeStyle = isSelected ? "#66fcf1" : (isNeighbor ? "rgba(102, 252, 241, 0.85)" : color);
        ctx.lineWidth = isSelected ? 2.8 : (isNeighbor ? 2.0 : 1.4);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Entity Symbol / Icon
        const icon = ENTITY_ICONS[n.type] ?? "●";
        const iconSize = Math.max(9, Math.round(baseR * 1.15));
        ctx.font = `${iconSize}px -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, p.sx, p.sy);

        // Highlight ring around selected node
        if (isSelected) {
          ctx.strokeStyle = "#66fcf1";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, baseR + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Label
        ctx.globalAlpha = alpha * Math.max(0.4, Math.min(1, p.scale));
        ctx.fillStyle = isSelected ? "#66fcf1" : (isNeighbor ? "#ffffff" : (isDark ? "#9CA3AF" : "#6B6858"));
        ctx.font = isSelected ? "bold 10px 'JetBrains Mono', monospace" : "9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(n.name.length > 18 ? n.name.slice(0, 17) + "…" : n.name, p.sx, p.sy + baseR + 6);

        ctx.globalAlpha = 1;
      }

      // HUD
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.35)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${nodeCount} entities · ${edgeCount} links`, 16, h - 16);
      ctx.textAlign = "right";
      ctx.fillText("✥ drag · scroll to zoom · click node", w - 16, h - 16);
    }

    function loop() {
      const targetZMult = currentIs2D ? 0.001 : 1.0;
      zMult += (targetZMult - zMult) * 0.08;

      if (!isDragging && focusTarget) {
        rotY += (focusTarget.rotY - rotY) * 0.08;
        rotX += (focusTarget.rotX - rotX) * 0.08;
        zoom += ((focusZoom ?? 1.6) - zoom) * 0.08;
        if (Math.abs(focusTarget.rotY - rotY) < 0.002 && Math.abs(focusTarget.rotX - rotX) < 0.002) focusTarget = null;
      } else if (!isDragging && (Math.abs(velX) > 0.0002 || Math.abs(velY) > 0.0002)) {
        rotY += velY; rotX += velX;
        rotX = Math.max(-1.3, Math.min(1.3, rotX));
        velX *= 0.94; velY *= 0.94;
      } else if (!isDragging && currentAutoRotate) {
        rotY += 0.0026;
      }
      render();
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);

    // --- Event handlers ---
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true; currentAutoRotate = false; setAutoRotate(false); focusTarget = null;
      lastMX = e.clientX; lastMY = e.clientY; velX = 0; velY = 0;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      velY = (e.clientX - lastMX) * 0.0055;
      velX = (e.clientY - lastMY) * 0.0055;
      rotY += velY; rotX += velX;
      rotX = Math.max(-1.3, Math.min(1.3, rotX));
      lastMX = e.clientX; lastMY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };

    const onClick = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let closest: HoloNode | null = null;
      let closestDist = 24;
      holoNodes.forEach((n, i) => {
        const p = projected[i]!;
        const d = Math.hypot(p.sx - mx, p.sy - my);
        if (d < closestDist) { closest = n; closestDist = d; }
      });
      const next = closest ? (selectedNodeRef.current?.id === closest.id ? null : closest) : null;
      setSelectedNode(next);
      selectedNodeRef.current = next;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom += (e.deltaY < 0 ? 0.08 : -0.08);
      zoom = Math.max(0.4, Math.min(2.8, zoom));
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("wheel", onWheel as EventListener, { passive: false });

    // Expose imperative controls
    (window as any).__holoReset = () => { rotX = -0.2; rotY = 0.42; zoom = 1; velX = 0; velY = 0; focusTarget = null; };
    (window as any).__holoToggleAuto = () => { currentAutoRotate = !currentAutoRotate; setAutoRotate(currentAutoRotate); };
    (window as any).__holoTo2D = () => { currentIs2D = true; focusTarget = { rotY: 0, rotX: 0 }; currentAutoRotate = false; setAutoRotate(false); };
    (window as any).__holoFrom2D = () => { currentIs2D = false; };

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("wheel", onWheel as EventListener);
      delete (window as any).__holoReset;
      delete (window as any).__holoToggleAuto;
      delete (window as any).__holoTo2D;
      delete (window as any).__holoFrom2D;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holoNodes, holoEdges, nodeCount, edgeCount, resolveColor]);

  return (
    <div className="holo-screen" style={{
      position: "relative", height: "100%", width: "100%",
      borderRadius: "var(--radius-lg)", overflow: "hidden",
      background: "radial-gradient(ellipse at 50% 25%, #14161B, #0A0B0D 65%)",
      boxShadow: "0 40px 100px -30px var(--shadow), inset 0 1px 0 rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      {/* Topbar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "var(--muted-foreground)", pointerEvents: "none" }}>
        <span>INVESTIGATION WORKSPACE</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--sage)" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--sage)", boxShadow: "0 0 8px var(--sage)", animation: "holoBlink 1.6s ease-in-out infinite", display: "inline-block" }} />
          LIVE · drag to rotate
        </span>
      </div>

      {/* Search */}
      <div style={{ position: "absolute", top: 48, left: 16, zIndex: 15 }}>
        <input
          style={{ width: 175, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--foreground)", fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, padding: "7px 11px", borderRadius: 8, outline: "none" }}
          placeholder="Search entity..."
          value={activeFilter}
          onChange={e => setActiveFilter(e.target.value)}
        />
      </div>

      {/* Controls */}
      <div style={{ position: "absolute", top: 14, right: 16, zIndex: 15, display: "flex", gap: 6 }}>
        {[
          { label: "2D", title: "Toggle 2D/3D", active: is2D, onClick: () => { const next = !is2D; setIs2D(next); if (next) (window as any).__holoTo2D?.(); else { (window as any).__holoFrom2D?.(); } } },
          { label: "⟳", title: "Toggle auto-rotate", active: autoRotate, onClick: () => (window as any).__holoToggleAuto?.() },
          { label: "⤾", title: "Reset view", active: false, onClick: () => (window as any).__holoReset?.() },
        ].map(btn => (
          <button key={btn.label} title={btn.title} onClick={btn.onClick} style={{ width: 30, height: 30, borderRadius: 7, background: btn.active ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)", border: btn.active ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.12)", color: btn.active ? "var(--accent)" : "var(--muted-foreground)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Canvas — single element for ALL rendering */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "grab", display: "block" }}
      />

      {/* Selected node side panel */}
      {selectedNode && (
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 250, background: "rgba(16,17,20,0.85)", backdropFilter: "blur(18px)", borderLeft: "1px solid rgba(255,255,255,0.08)", padding: "52px 18px 18px", zIndex: 20, overflowY: "auto" }}>
          <button onClick={() => { setSelectedNode(null); selectedNodeRef.current = null; }} style={{ position: "absolute", top: 16, right: 16, width: 24, height: 24, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 11 }}>✕</button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{ENTITY_ICONS[selectedNode.type] || "●"}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#66fcf1", letterSpacing: "0.04em" }}>{selectedNode.type.toUpperCase()}{selectedNode.flagged ? " · FLAGGED" : ""}</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: "var(--foreground)", marginBottom: 16 }}>{selectedNode.name}</div>
          {[["ID", selectedNode.id], ["TYPE", selectedNode.type], ["CONNECTIONS", relationships.filter(r => r.source === selectedNode.id || r.target === selectedNode.id).length + " links"], ["CONFIDENCE", "98%"]].map(([label, val]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: 12, color: "var(--foreground)" }}>
              <span style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>{label}</span>
              <span>{val}</span>
            </div>
          ))}

          {/* Connected Entities List */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#66fcf1", letterSpacing: "0.05em", marginBottom: 8, textTransform: "uppercase" }}>
              Direct Connections ({relationships.filter(r => r.source === selectedNode.id || r.target === selectedNode.id).length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 190, overflowY: "auto" }}>
              {relationships
                .filter(r => r.source === selectedNode.id || r.target === selectedNode.id)
                .slice(0, 20)
                .map(r => {
                  const otherId = r.source === selectedNode.id ? r.target : r.source;
                  const other = nodeMap.get(otherId);
                  if (!other) return null;
                  return (
                    <div
                      key={r.id}
                      onClick={() => { setSelectedNode(other); selectedNodeRef.current = other; }}
                      style={{ padding: "6px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}
                    >
                      <span>{ENTITY_ICONS[other.type] || "●"}</span>
                      <span style={{ color: "var(--foreground)", fontWeight: 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{other.name}</span>
                      <span style={{ color: "var(--muted-foreground)", fontSize: 9, textTransform: "uppercase", fontFamily: "'JetBrains Mono',monospace" }}>{r.type || other.type}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes holoBlink { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>
    </div>
  );
}
