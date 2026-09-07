import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect, useState, useRef } from "react";
import { Camera, Radio, FastForward, Compass, Layers, Antenna, ShieldCheck, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    google: any;
  }
}

export const Route = createFileRoute("/surveillance")({
  head: () => ({
    meta: [{ title: "Live Surveillance & Azimuth Coverage — त्रिनेत्र-AI" }],
  }),
  component: SurveillancePage,
});

// Detailed mock path from CP -> Lodhi -> IGI to simulate road driving
const MOCK_PATH = [
  { lat: 28.6139, lng: 77.2090 }, // CP
  { lat: 28.6145, lng: 77.2150 },
  { lat: 28.6129, lng: 77.2295 }, // India Gate
  { lat: 28.6050, lng: 77.2300 },
  { lat: 28.5921, lng: 77.2273 }, // Lodhi Gardens
  { lat: 28.5850, lng: 77.2150 },
  { lat: 28.5800, lng: 77.2000 }, // Safdarjung
  { lat: 28.5830, lng: 77.1850 },
  { lat: 28.5900, lng: 77.1600 }, // Dhaula Kuan
  { lat: 28.5850, lng: 77.1450 },
  { lat: 28.5750, lng: 77.1300 },
  { lat: 28.5650, lng: 77.1150 },
  { lat: 28.5562, lng: 77.1000 }, // IGI
];

// Interpolate to make it 100 points for smooth scrubbing
const interpolatePath = (points: { lat: number; lng: number }[], targetCount: number) => {
  const result = [];
  const segments = points.length - 1;
  const pointsPerSegment = Math.floor(targetCount / segments);

  for (let i = 0; i < segments; i++) {
    const start = points[i]!;
    const end = points[i + 1]!;
    for (let j = 0; j < pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      result.push({
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t,
      });
    }
  }
  result.push(points[points.length - 1]!);
  return result;
};

const DETAILED_PATH = interpolatePath(MOCK_PATH, 100);

export interface CellTower {
  id: string;
  lat: number;
  lng: number;
  operator: "Jio" | "Airtel" | "Vi";
  connectedSector: number; // 0, 120, 240
  sectors: number[]; // [0, 120, 240]
  time: string;
  duration: string;
  rssi: string;
  label: string;
  lac: string;
  cellId: string;
}

const CELL_TOWERS: CellTower[] = [
  {
    id: "T-01",
    lat: 28.6139,
    lng: 77.2090,
    operator: "Jio",
    connectedSector: 120,
    sectors: [0, 120, 240],
    time: "08:42:15 IST",
    duration: "4m 12s",
    rssi: "-72 dBm",
    label: "CP Inner Circle Tri-Sector BTS",
    lac: "0x4FA1",
    cellId: "CID-9912",
  },
  {
    id: "T-02",
    lat: 28.6050,
    lng: 77.2300,
    operator: "Airtel",
    connectedSector: 240,
    sectors: [0, 120, 240],
    time: "09:15:30 IST",
    duration: "2m 45s",
    rssi: "-68 dBm",
    label: "India Gate South Sub-Station",
    lac: "0x4FB8",
    cellId: "CID-4410",
  },
  {
    id: "T-03",
    lat: 28.5850,
    lng: 77.1450,
    operator: "Vi",
    connectedSector: 0,
    sectors: [0, 120, 240],
    time: "10:03:55 IST",
    duration: "6m 10s",
    rssi: "-81 dBm",
    label: "Dhaula Kuan Arterial Mast",
    lac: "0x51A0",
    cellId: "CID-8120",
  },
];

// Helper to compute geographic sector wedge polygon
function getSectorPolygonPoints(centerLat: number, centerLng: number, azimuthDeg: number, beamWidth = 70, radiusMeters = 650) {
  const points: { lat: number; lng: number }[] = [{ lat: centerLat, lng: centerLng }];
  const startAngle = azimuthDeg - beamWidth / 2;
  const endAngle = azimuthDeg + beamWidth / 2;
  const steps = 10;
  const R = 6378137;

  for (let i = 0; i <= steps; i++) {
    const angle = (startAngle + (i / steps) * (endAngle - startAngle)) * (Math.PI / 180);
    const dR = radiusMeters / R;
    const centerLatRad = centerLat * (Math.PI / 180);
    const centerLngRad = centerLng * (Math.PI / 180);

    const latRad = Math.asin(
      Math.sin(centerLatRad) * Math.cos(dR) +
      Math.cos(centerLatRad) * Math.sin(dR) * Math.cos(angle)
    );
    const lngRad = centerLngRad + Math.atan2(
      Math.sin(angle) * Math.sin(dR) * Math.cos(centerLatRad),
      Math.cos(dR) - Math.sin(centerLatRad) * Math.sin(latRad)
    );
    points.push({
      lat: latRad * (180 / Math.PI),
      lng: lngRad * (180 / Math.PI),
    });
  }
  points.push({ lat: centerLat, lng: centerLng });
  return points;
}

const CAMERAS = [
  {
    index: 15,
    lat: DETAILED_PATH[15]!.lat,
    lng: DETAILED_PATH[15]!.lng,
    id: "CAM-ND-01",
    desc: "Target vehicle identified in Sector 14. Registration obscured.",
    img: "/mock-cctv-1.png",
  },
  {
    index: 45,
    lat: DETAILED_PATH[45]!.lat,
    lng: DETAILED_PATH[45]!.lng,
    id: "CAM-SD-44",
    desc: "Subject seen interacting with unknown associate near Lodhi road.",
    img: "/mock-cctv-2.png",
  },
  {
    index: 65,
    lat: DETAILED_PATH[65]!.lat,
    lng: DETAILED_PATH[65]!.lng,
    id: "CAM-DK-12",
    desc: "Target vehicle tracked navigating intersection at high speed.",
    img: "/mock-cctv-3.png",
  },
  {
    index: 85,
    lat: DETAILED_PATH[85]!.lat,
    lng: DETAILED_PATH[85]!.lng,
    id: "CAM-IG-99",
    desc: "Vehicle approaching Toll Plaza. Elevated alert status triggered.",
    img: "/mock-cctv-4.png",
  },
];

export function SurveillancePage() {
  const [time, setTime] = useState("");
  const [progress, setProgress] = useState(0);
  const [selectedTower, setSelectedTower] = useState<string>("T-01");
  const [showCorridor, setShowCorridor] = useState(true);
  const [showWedges, setShowWedges] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const targetMarkerRef = useRef<any>(null);
  const infoWindowsRef = useRef<any[]>([]);
  const wedgePolygonsRef = useRef<any[]>([]);
  const corridorPolygonRef = useRef<any>(null);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      const darkTheme = [
        { elementType: "geometry", stylers: [{ color: "#212121" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
        { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
        { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#3c3c3c" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
      ];

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 28.59, lng: 77.18 },
        zoom: 12,
        styles: darkTheme,
        disableDefaultUI: true,
      });

      // Draw static full path (dimmed)
      new window.google.maps.Polyline({
        path: DETAILED_PATH,
        map: mapInstance.current,
        strokeColor: "#444444",
        strokeOpacity: 0.4,
        strokeWeight: 3,
      });

      // Draw dynamic active path
      polylineRef.current = new window.google.maps.Polyline({
        path: [DETAILED_PATH[0]],
        map: mapInstance.current,
        strokeColor: "#ef4444",
        strokeOpacity: 1.0,
        strokeWeight: 4,
      });

      // Target Marker
      targetMarkerRef.current = new window.google.maps.Marker({
        position: DETAILED_PATH[0],
        map: mapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });

      // AZIMUTH WEDGES RENDERING (MODULE 2.1)
      CELL_TOWERS.forEach((tower) => {
        // Tower Center Mast Marker
        new window.google.maps.Marker({
          position: { lat: tower.lat, lng: tower.lng },
          map: mapInstance.current,
          title: `${tower.id}: ${tower.label}`,
          icon: {
            path: "M 0,-15 L 12,10 L -12,10 Z",
            scale: 1.2,
            fillColor: "#0284c7",
            fillOpacity: 0.9,
            strokeWeight: 1.5,
            strokeColor: "#ffffff",
          },
        });

        // 3 Sector Wedges per tower (0°, 120°, 240°)
        tower.sectors.forEach((sec) => {
          const isConnected = sec === tower.connectedSector;
          const wedgePts = getSectorPolygonPoints(tower.lat, tower.lng, sec, 70, 700);

          const wedgePoly = new window.google.maps.Polygon({
            paths: wedgePts,
            map: mapInstance.current,
            strokeColor: isConnected ? "#f59e0b" : "#10b981",
            strokeOpacity: isConnected ? 0.95 : 0.4,
            strokeWeight: isConnected ? 2.5 : 1,
            fillColor: isConnected ? "#f59e0b" : "#10b981",
            fillOpacity: isConnected ? 0.45 : 0.12,
            zIndex: isConnected ? 10 : 2,
          });

          wedgePolygonsRef.current.push({
            towerId: tower.id,
            sector: sec,
            poly: wedgePoly,
            isConnected,
          });
        });
      });

      // MOVEMENT CORRIDOR POLYGON (MODULE 2.3)
      const corridorPts = [
        { lat: 28.618, lng: 77.205 },
        { lat: 28.612, lng: 77.235 },
        { lat: 28.578, lng: 77.225 },
        { lat: 28.552, lng: 77.095 },
        { lat: 28.568, lng: 77.085 },
        { lat: 28.595, lng: 77.135 },
      ];

      corridorPolygonRef.current = new window.google.maps.Polygon({
        paths: corridorPts,
        map: mapInstance.current,
        strokeColor: "#38bdf8",
        strokeOpacity: 0.4,
        strokeWeight: 1.5,
        strokeDasharray: "4 4",
        fillColor: "#38bdf8",
        fillOpacity: 0.08,
      });

      // Camera Markers
      CAMERAS.forEach((cam) => {
        const marker = new window.google.maps.Marker({
          position: { lat: cam.lat, lng: cam.lng },
          map: mapInstance.current,
          icon: {
            path: "M -2,0 L 2,0 M 0,-2 L 0,2",
            scale: 6,
            strokeColor: "#10b981",
            strokeWeight: 3,
          },
        });

        const info = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: monospace; font-size: 11px; color: #10b981; background: #000; padding: 10px; border: 1px solid #10b981; max-width: 220px;">
              <strong style="color: #ef4444; font-size: 13px;">[CCTV HIT] ${cam.id}</strong><br/>
              <hr style="border-color: #10b98144; margin: 4px 0;" />
              <img src="${cam.img}" style="width: 100%; height: auto; border: 1px solid #333; margin-bottom: 4px;" />
              ${cam.desc}
            </div>
          `,
        });
        marker.addListener("click", () => info.open(mapInstance.current, marker));
        infoWindowsRef.current.push({ index: cam.index, info, marker });
      });
    };

    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDnL8HCYcDFGpL7KdRimihyLmYS66bwOzQ";
      script.async = true;
      document.head.appendChild(script);
      script.onload = initMap;
    } else {
      initMap();
    }
  }, []);

  // Update map when scrubber changes
  useEffect(() => {
    if (!polylineRef.current || !targetMarkerRef.current) return;

    const currentPath = DETAILED_PATH.slice(0, progress + 1);
    polylineRef.current.setPath(currentPath);
    targetMarkerRef.current.setPosition(DETAILED_PATH[progress]);

    infoWindowsRef.current.forEach((cam) => {
      if (Math.abs(progress - cam.index) <= 4) {
        cam.info.open(mapInstance.current, cam.marker);
      } else {
        cam.info.close();
      }
    });
  }, [progress]);

  const panToTower = (t: CellTower) => {
    setSelectedTower(t.id);
    if (mapInstance.current) {
      mapInstance.current.panTo({ lat: t.lat, lng: t.lng });
      mapInstance.current.setZoom(13);
    }
  };

  return (
    <AppLayout title="Live Surveillance & Azimuth Coverage" subtitle="Spatial Tower Azimuth Wedges & CCTV Intercepts" fullBleed>
      <div className="flex flex-col gap-4 p-4">

        {/* DISCLAIMER BANNER */}
        <div className="shrink-0 rounded-xl border border-primary/40 bg-primary/10 p-3.5 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-primary/20 p-1 text-primary">
              <Compass className="size-4" />
            </div>
            <div>
              <div className="font-bold text-foreground text-sm tracking-tight mb-0.5">
                AZIMUTH SECTOR COVERAGE WEDGES (INDIAN TELCO CDR REALITY)
              </div>
              <div className="text-muted-foreground leading-relaxed">
                Standard student projects drop generic single pins on cell tower GPS points. TriNetra calculates real-world
                tri-sector Azimuth angles (0°, 120°, 240°). The <strong className="text-amber-400">amber sector wedge</strong>{" "}
                indicates the precise directional arc where the suspect connected relative to the cell mast.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setShowWedges(!showWedges);
                wedgePolygonsRef.current.forEach((w) => w.poly.setVisible(!showWedges));
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                showWedges ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-secondary text-muted-foreground"
              }`}
            >
              Azimuth Wedges: {showWedges ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => {
                setShowCorridor(!showCorridor);
                if (corridorPolygonRef.current) corridorPolygonRef.current.setVisible(!showCorridor);
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-colors ${
                showCorridor ? "bg-sky-500/20 text-sky-400 border-sky-500/40" : "bg-secondary text-muted-foreground"
              }`}
            >
              Corridor: {showCorridor ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* MAIN SPLIT: MAP + TOWER DUMP SIDEBAR (LEFT) vs CCTV & TELEMETRY (RIGHT) */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* PANEL A: GEOSPATIAL MAP & TOWER DUMP (col-span-12 lg:col-span-8) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col rounded-xl border border-border bg-card overflow-hidden relative shadow-lg min-h-[50vh] lg:min-h-0">
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 font-mono text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Radio className="size-4 text-accent animate-pulse" />
                <span>SIGINT_AZIMUTH_MAP (DELHI NCR SECTOR)</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-amber-500"></span> Connected Arc
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-500"></span> Idle Sectors
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-sky-400"></span> Movement Corridor
                </span>
              </div>
            </div>

            <div className="relative flex-1 bg-muted/20 flex flex-col">
              {/* Map Container */}
              <div ref={mapRef} className="flex-1 z-0 relative"></div>

              {/* Active Target Floating Widget */}
              <div className="absolute top-4 right-4 z-20 bg-black/90 border border-red-500/30 p-3 rounded-lg backdrop-blur-md flex items-center gap-3 shadow-2xl">
                <img src="/person-1.png" alt="Target" className="size-12 rounded-md object-cover border border-red-500/50 grayscale" />
                <div className="font-mono text-xs">
                  <div className="text-red-500 font-bold mb-0.5">ACTIVE TARGET</div>
                  <div className="text-muted-foreground">ID: PER-001 (R.S.)</div>
                  <div className="text-muted-foreground">VEH: DL-9C-XXXX</div>
                  <div className="text-[10px] text-amber-400">TOWER: {selectedTower}</div>
                </div>
              </div>

              {/* Scrubber Control */}
              <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/85 border border-accent/30 p-3 rounded-lg backdrop-blur-md">
                <div className="flex items-center gap-4 text-accent font-mono text-xs mb-1.5">
                  <FastForward className="size-4" />
                  <span>TIMELINE_SCRUBBER (ESCAPE CORRIDOR RECONSTRUCTION)</span>
                  <span className="ml-auto">T+ {Math.round(progress * 0.45)}m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={DETAILED_PATH.length - 1}
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <div className="pointer-events-none absolute inset-0 z-10 border-[4px] border-accent/20 mix-blend-overlay"></div>
            </div>

            {/* TOWER DUMP HORIZONTAL PANEL (MODULE 2.2) */}
            <div className="border-t border-border bg-secondary/30 p-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-2">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Antenna className="size-3.5 text-primary" /> Cell Towers Pinged &bull; Last 24 Hours (Tower Dump)
                </span>
                <span>Click a tower to inspect Azimuth angle</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-xs">
                {CELL_TOWERS.map((t) => {
                  const isSelected = selectedTower === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => panToTower(t)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/20 border-primary shadow-sm"
                          : "bg-background/80 hover:bg-background border-border/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{t.id}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            t.operator === "Jio"
                              ? "bg-blue-500/20 text-blue-400"
                              : t.operator === "Airtel"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          {t.operator}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate mt-0.5">{t.label}</div>
                      <div className="mt-1.5 pt-1.5 border-t border-border/40 flex justify-between items-center text-[10px]">
                        <span className="text-amber-400 font-bold">Azimuth: {t.connectedSector}°</span>
                        <span className="text-muted-foreground">{t.time.split(" ")[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PANEL B: LIVE CCTV INTERCEPT & AZIMUTH VECTOR (col-span-12 lg:col-span-4) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 min-h-0">
            {/* CCTV STREAM */}
            <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden relative shadow-lg">
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 font-mono text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-red-500" />
                  <span>CCTV_INTERCEPT_STREAM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-500 font-bold">REC</span>
                </div>
              </div>

              <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[220px]">
                <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20"></div>

                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover z-0 grayscale contrast-125 sepia-[0.3]"
                  src="/cctv_delhi_processed.mp4"
                />

                <div className="pointer-events-none absolute inset-0 z-30 p-4 flex flex-col justify-between font-mono text-accent text-xs shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">
                  <div className="flex justify-between w-full">
                    <div>
                      CAM: SEC-14_N04<br />
                      COORD: 28.6139° N, 77.2090° E
                    </div>
                    <div className="text-right">
                      SYS_TIME: {time}<br />
                      SIMULATION: ACTIVE
                    </div>
                  </div>

                  <div className="flex justify-between w-full text-[11px]">
                    <div>
                      NODE: 889104<br />
                      <span className="text-yellow-400 animate-pulse">FACIAL_MATCH: 98.4%</span>
                    </div>
                    <div className="text-right">
                      BUFFER: 0x88F1A<br />
                      UPLINK: SECURE
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AZIMUTH COMPASS TELEMETRY CARD */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-foreground flex items-center gap-1.5">
                  <Compass className="size-3.5 text-amber-400" /> Current Azimuth Sector Telemetry
                </span>
                <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {selectedTower}
                </span>
              </div>

              {(() => {
                const cur = CELL_TOWERS.find((t) => t.id === selectedTower) || CELL_TOWERS[0]!;
                return (
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Serving Mast:</span>
                      <span className="text-foreground">{cur.label}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Connected Azimuth:</span>
                      <span className="text-amber-400 font-bold">{cur.connectedSector}° Sector (70° arc)</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Signal RSSI:</span>
                      <span className="text-emerald-400">{cur.rssi}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>LAC / Cell ID:</span>
                      <span className="text-foreground">{cur.lac} / {cur.cellId}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Duration in Wedge:</span>
                      <span className="text-foreground">{cur.duration}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
