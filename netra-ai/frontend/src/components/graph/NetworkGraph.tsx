import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from "d3-force";
import { Minus, Plus, Crosshair } from "lucide-react";
import type { Entity, Relationship } from "@/data/types";
import { ENTITY_TYPE_META } from "@/data/mock";
import { ENTITY_ICONS } from "./HolographicGraph";

interface Node extends SimulationNodeDatum {
  id: string;
  entity: Entity;
}

const WIDTH = 1200;
const HEIGHT = 760;

export function NetworkGraph({
  entities,
  relationships,
  selectedId,
  onSelect,
}: {
  entities: Entity[];
  relationships: Relationship[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const key = useMemo(
    () => entities.map((e) => e.id).join("|") + "#" + relationships.map((r) => r.id).join("|"),
    [entities, relationships],
  );

  useEffect(() => {
    const nodes: Node[] = entities.map((e) => ({ id: e.id, entity: e }));
    const links = relationships
      .filter((r) => nodes.some((n) => n.id === r.source) && nodes.some((n) => n.id === r.target))
      .map((r) => ({ source: r.source, target: r.target }));

    const sim = forceSimulation(nodes)
      .force("charge", forceManyBody().strength(-620))
      .force(
        "link",
        forceLink(links)
          .id((d) => (d as Node).id)
          .distance(150)
          .strength(0.5),
      )
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collide", forceCollide(58))
      .stop();

    sim.tick(320);
    const next: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => (next[n.id] = { x: n.x ?? WIDTH / 2, y: n.y ?? HEIGHT / 2 }));
    setPositions(next);
  }, [key, entities, relationships]);

  const neighbours = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const set = new Set<string>([selectedId]);
    relationships.forEach((r) => {
      if (r.source === selectedId) set.add(r.target);
      if (r.target === selectedId) set.add(r.source);
    });
    return set;
  }, [selectedId, relationships]);

  const dim = (id: string) => selectedId !== null && !neighbours.has(id);

  // Cursor-anchored zoom on a native non-passive listener (React's onWheel is passive).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleX;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setTransform((t) => {
        const next = Math.min(2.6, Math.max(0.4, t.k * Math.exp(-dy * 0.0015)));
        const ratio = next / t.k;
        return {
          k: next,
          x: px - (px - t.x) * ratio,
          y: py - (py - t.y) * ratio,
        };
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);



  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-surface">
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="relative h-full w-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onMouseDown={(e) => {
          dragRef.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
        }}
        onMouseMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          setTransform((t) => ({ ...t, x: d.tx + (e.clientX - d.x), y: d.ty + (e.clientY - d.y) }));
        }}
        onMouseUp={() => (dragRef.current = null)}
        onMouseLeave={() => (dragRef.current = null)}
        onClick={(e) => {
          if (e.target === svgRef.current) onSelect(null);
        }}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="26"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-strong)" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="26"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)" />
          </marker>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {relationships.map((r) => {
            const a = positions[r.source];
            const b = positions[r.target];
            if (!a || !b) return null;
            const active =
              selectedId !== null && (r.source === selectedId || r.target === selectedId);
            const faded = selectedId !== null && !active;
            return (
              <g key={r.id} opacity={faded ? 0.08 : 1} className="transition-opacity duration-300">
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={r.is_ghost ? "#F59E0B" : (active ? "var(--primary)" : "var(--border-strong)")}
                  strokeWidth={active ? 2.5 : 1.2}
                  strokeDasharray={r.is_ghost ? "5,5" : undefined}
                  markerEnd={active ? "url(#arrow-active)" : "url(#arrow)"}
                  filter={active ? "url(#glow)" : undefined}
                  className="transition-all duration-300"
                />
                {(active || transform.k > 1.15) && (
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2 - 6}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize={9}
                    fill="var(--muted-foreground)"
                  >
                    {r.label}
                  </text>
                )}
              </g>
            );
          })}

          {entities.map((e) => {
            const p = positions[e.id];
            if (!p) return null;
            const meta = ENTITY_TYPE_META[e.type];
            const selected = e.id === selectedId;
            const isNeighbour = selectedId !== null && neighbours.has(e.id) && e.id !== selectedId;
            const faded = dim(e.id);
            const r = e.type === "person" ? 26 : 21;
            return (
              <g
                key={e.id}
                transform={`translate(${p.x},${p.y})`}
                opacity={faded ? 0.08 : 1}
                className="cursor-pointer transition-opacity duration-300"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onSelect(e.id);
                }}
                onMouseEnter={() => setHovered(e.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {selected && (
                  <circle r={r + 8} fill="none" stroke="var(--primary)" strokeWidth={2} opacity={0.5} className="animate-pulse" filter="url(#glow)" />
                )}
                <circle
                  r={hovered === e.id ? r + 3 : r}
                  fill={`color-mix(in oklab, ${meta.color} 22%, var(--surface))`}
                  stroke={selected || isNeighbour ? "var(--primary)" : meta.color}
                  strokeWidth={selected ? 3 : (isNeighbour ? 2 : 1.6)}
                  className="transition-all duration-300"
                  filter={selected || isNeighbour ? "url(#glow)" : undefined}
                />
                <text
                  textAnchor="middle"
                  y={5}
                  fontSize={13}
                  className="pointer-events-none select-none"
                >
                  {ENTITY_ICONS[e.type] || meta.short}
                </text>
                <text
                  textAnchor="middle"
                  y={r + 16}
                  fontSize={11}
                  className="pointer-events-none"
                  fill="var(--foreground)"
                >
                  {e.name.length > 22 ? e.name.slice(0, 21) + "…" : e.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-md border border-border bg-surface-raised p-1">
        <button
          className="rounded p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={() => setTransform((t) => ({ ...t, k: Math.min(2.6, t.k * 1.2) }))}
          aria-label="Zoom in"
        >
          <Plus className="size-4" />
        </button>
        <button
          className="rounded p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={() => setTransform((t) => ({ ...t, k: Math.max(0.4, t.k / 1.2) }))}
          aria-label="Zoom out"
        >
          <Minus className="size-4" />
        </button>
        <button
          className="rounded p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={() => setTransform({ k: 1, x: 0, y: 0 })}
          aria-label="Reset view"
        >
          <Crosshair className="size-4" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-md border border-border bg-surface-raised/90 px-3 py-2 backdrop-blur">
        {Object.entries(ENTITY_TYPE_META).map(([k, m]) => (
          <div key={k} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: m.color, boxShadow: `0 0 0 3px color-mix(in oklab, ${m.color} 22%, transparent)` }}
            />
            {m.label}
          </div>
        ))}
      </div>

      <div className="absolute left-4 top-4 rounded-md border border-border bg-surface-raised/90 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur">
        {entities.length} entities · {relationships.length} relationships · zoom{" "}
        {transform.k.toFixed(2)}x
      </div>
    </div>
  );
}
