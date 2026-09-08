import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Camera,
  Radio,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Compass,
  Layers,
  Antenna,
  ShieldCheck,
  MapPin,
  AlertCircle,
  Eye,
  Video,
  Maximize2,
  ZoomIn,
  CheckCircle2,
  Share2,
  FileText,
  Sparkles,
  Info,
  ExternalLink,
  ShieldAlert,
  Car,
  ScanLine,
  Zap,
  Download,
  Copy,
  ChevronRight,
  Sliders,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

declare global {
  interface Window {
    google: any;
  }
}

export const Route = createFileRoute("/surveillance")({
  head: () => ({
    meta: [
      { title: "Tactical Surveillance & Azimuth Intercept — त्रिनेत्र-AI" },
      {
        name: "description",
        content:
          "Geospatial cell tower azimuth wedge tracking, high-definition CCTV intercept analytics, and timeline reconstruction for active criminal targets.",
      },
    ],
  }),
  component: SurveillancePage,
});

// Detailed mock path from CP -> Lodhi -> IGI to simulate suspect vehicle movement
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

// Interpolate to 100 points for ultra-smooth timeline scrubbing
const interpolatePath = (points: { lat: number; lng: number }[], targetCount: number) => {
  const result: { lat: number; lng: number }[] = [];
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
  progressRange: [number, number]; // [min, max] timeline index
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
    progressRange: [0, 32],
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
    progressRange: [33, 62],
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
    progressRange: [63, 99],
  },
];

// Helper to compute geographic sector wedge polygon
function getSectorPolygonPoints(
  centerLat: number,
  centerLng: number,
  azimuthDeg: number,
  beamWidth = 70,
  radiusMeters = 650
) {
  const points: { lat: number; lng: number }[] = [{ lat: centerLat, lng: centerLng }];
  const startAngle = azimuthDeg - beamWidth / 2;
  const endAngle = azimuthDeg + beamWidth / 2;
  const steps = 12;
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
    const lngRad =
      centerLngRad +
      Math.atan2(
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

export interface SpottedCheckpoint {
  index: number;
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  timestamp: string;
  elapsed: string;
  severity: "CRITICAL HIT" | "COVERT CONTACT" | "HIGH-SPEED FLIGHT" | "FINAL INTERCEPT";
  severityColor: "red" | "amber" | "purple" | "emerald";
  desc: string;
  tacticalNotes: string;
  img: string;
  faceMatch: string;
  plateOcr: string;
  speed: string;
  associatedTower: string;
  sectorWedge: string;
  rssi: string;
  agency: string;
  bsaHash: string;
}

const CHECKPOINTS: SpottedCheckpoint[] = [
  {
    index: 15,
    id: "CAM-ND-01",
    name: "CP Inner Circle North Radial",
    area: "Connaught Place Sector 14 Exit",
    lat: DETAILED_PATH[15]!.lat,
    lng: DETAILED_PATH[15]!.lng,
    timestamp: "08:49:12 IST",
    elapsed: "T+ 07m 00s",
    severity: "CRITICAL HIT",
    severityColor: "red",
    desc: "Target vehicle DL-9C-4122 (White Sedan) spotted breaking away from Inner Circle radial onto Baba Kharak Singh Marg. License plate coating detected to obscure optical character recognition. Facial biometrics matched driver profile with suspect Rohan Sharma (PER-001).",
    tacticalNotes: "Driver exhibited evasive lane change at pedestrian crosswalk. Solitary occupant visible.",
    img: "/mock-cctv-1.png",
    faceMatch: "98.4% Match — Rohan Sharma (PER-001)",
    plateOcr: "DL-9C-4122 [Anti-Glare Coating Detected]",
    speed: "42 km/h (Moderate City Traffic)",
    associatedTower: "T-01 (Jio BTS)",
    sectorWedge: "120° Sector (Arc 85° - 155°)",
    rssi: "-72 dBm",
    agency: "Delhi Traffic Police ITMS & NDMC Surveillance",
    bsaHash: "SHA256: 7fa8c3d4e9120ba5489f0291ccba4e6108e1a53920db1938fe7045b10283a48e",
  },
  {
    index: 45,
    id: "CAM-SD-44",
    name: "Lodhi Road & Safdarjung Arterial",
    area: "South Delhi Lodhi Corridor",
    lat: DETAILED_PATH[45]!.lat,
    lng: DETAILED_PATH[45]!.lng,
    timestamp: "09:02:40 IST",
    elapsed: "T+ 20m 25s",
    severity: "COVERT CONTACT",
    severityColor: "amber",
    desc: "Target vehicle pulled into service perimeter beside Lodhi Estate. Subject observed stepping out and engaging in an unscheduled 92-second rendezvous with an unidentified male associate (UNK-02). Handover of physical parcel and SIM handset swap suspected prior to re-entering arterial flow.",
    tacticalNotes: "Associate arrived on two-wheeler (black helmet). Physical handoff captured by street cam node 44.",
    img: "/mock-cctv-2.png",
    faceMatch: "94.2% Confirmed (Rohan Sharma) + Unk Co-actor",
    plateOcr: "DL-9C-4122 (Confirmed Rear Plate)",
    speed: "0 km/h (Stationary Rendezvous - 92s Dwell)",
    associatedTower: "T-02 (Airtel Sub-Station)",
    sectorWedge: "240° Sector (Arc 205° - 275°)",
    rssi: "-68 dBm",
    agency: "Delhi Police South District Command",
    bsaHash: "SHA256: 9b2d8e40f1a567c3098e45a1098b67f12e8430a91546738910ebca8734910245",
  },
  {
    index: 65,
    id: "CAM-DK-12",
    name: "Dhaula Kuan High-Speed Flyover",
    area: "Dhaula Kuan Central Interchange",
    lat: DETAILED_PATH[65]!.lat,
    lng: DETAILED_PATH[65]!.lng,
    timestamp: "09:11:18 IST",
    elapsed: "T+ 29m 03s",
    severity: "HIGH-SPEED FLIGHT",
    severityColor: "purple",
    desc: "Vehicle tracked at excessive velocity crossing the Dhaula Kuan central flyover ramp towards the NH-48 Airport corridor. Radars clocked 74 km/h in a 50 km/h zone. Mobile telemetry shows continuous cellular handover with high-frequency burst transmission.",
    tacticalNotes: "Target actively avoiding toll tag sensors on outer lane. Flight direction confirmed toward IGI.",
    img: "/mock-cctv-3.png",
    faceMatch: "91.8% Partial (Windscreen glare / High Velocity)",
    plateOcr: "DL-9C-4122 (ANPR Optical Match Verified)",
    speed: "74 km/h (Speeding Violation Flagged)",
    associatedTower: "T-03 (Vi Arterial Mast)",
    sectorWedge: "0° Sector (Arc 325° - 35°)",
    rssi: "-81 dBm",
    agency: "NHAI Intelligent Highway Command Node 12",
    bsaHash: "SHA256: 3c49e0a1249b567f89d023a45610ec871b2390a45e7861920384759102948756",
  },
  {
    index: 85,
    id: "CAM-IG-99",
    name: "IGI Airport T3 Toll Plaza Approach",
    area: "Indira Gandhi International Airport Express",
    lat: DETAILED_PATH[85]!.lat,
    lng: DETAILED_PATH[85]!.lng,
    timestamp: "09:20:55 IST",
    elapsed: "T+ 38m 40s",
    severity: "FINAL INTERCEPT",
    severityColor: "red",
    desc: "Target vehicle entered FASTag Lane 4 approach at IGI Terminal 3 Toll Plaza. Automated barrier lockdown sequence triggered via TriNetra alert dispatch. CISF Quick Reaction Team deployed to perimeter gate.",
    tacticalNotes: "Vehicle decelerating toward security barricade. Subject trapped in toll lane corridor.",
    img: "/mock-cctv-4.png",
    faceMatch: "99.1% High-Confidence Face Recognition Match",
    plateOcr: "DL-9C-4122 (FASTag RFID Tag #3491024)",
    speed: "32 km/h (Decelerating into Barrier Lane)",
    associatedTower: "T-03 (Vi Arterial Mast)",
    sectorWedge: "0° Sector (Arc 325° - 35°)",
    rssi: "-78 dBm",
    agency: "DIAL T3 Aviation Security Command & CISF",
    bsaHash: "SHA256: d58e234019a8475b610c92384756192837465910238475619283746519283746",
  },
];

export function SurveillancePage() {
  const [progress, setProgress] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);

  // View Layout Modes: "split" (balanced), "cinema" (CCTV priority), "map" (geospatial priority)
  const [viewMode, setViewMode] = useState<"split" | "cinema" | "map">("split");

  // Selected tower & layer toggles
  const [selectedTower, setSelectedTower] = useState<string>("T-01");
  const [showWedges, setShowWedges] = useState(true);
  const [showCorridor, setShowCorridor] = useState(true);
  const [showCheckpoints, setShowCheckpoints] = useState(true);

  // Video & Optical Filter state
  const [mediaSource, setMediaSource] = useState<"frame" | "video">("frame");
  const [visionFilter, setVisionFilter] = useState<"normal" | "ir" | "high-contrast">("normal");
  const [isFrameInspectOpen, setIsFrameInspectOpen] = useState(false);
  const [isAzimuthModalOpen, setIsAzimuthModalOpen] = useState(false);

  // Clock
  const [clockTime, setClockTime] = useState("");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const targetMarkerRef = useRef<any>(null);
  const wedgePolygonsRef = useRef<any[]>([]);
  const corridorPolygonRef = useRef<any>(null);
  const cameraMarkersRef = useRef<any[]>([]);

  // Clock tick
  useEffect(() => {
    setClockTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => setClockTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine active serving tower based on progress
  const activeTower = useMemo(() => {
    const tower = CELL_TOWERS.find(
      (t) => progress >= t.progressRange[0] && progress <= t.progressRange[1]
    );
    return tower || CELL_TOWERS[0]!;
  }, [progress]);

  // Keep selectedTower synchronized with route progress if not manually locked
  useEffect(() => {
    setSelectedTower(activeTower.id);
  }, [activeTower.id]);

  // Determine closest checkpoint
  const activeCheckpoint = useMemo(() => {
    return CHECKPOINTS.reduce((prev, curr) =>
      Math.abs(curr.index - progress) < Math.abs(prev.index - progress) ? curr : prev
    );
  }, [progress]);

  // Is target within active detection range of a checkpoint (within +/- 4 units)
  const isDirectlySpotted = useMemo(() => {
    return Math.abs(progress - activeCheckpoint.index) <= 4;
  }, [progress, activeCheckpoint.index]);

  // Dynamic simulation elapsed mission time (0 to 45 mins)
  const currentElapsedFormatted = useMemo(() => {
    const totalSeconds = Math.round((progress / 99) * (45 * 60));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `T+ ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }, [progress]);

  // Dynamic simulation IST time (08:42:00 to 09:27:00 IST)
  const currentSimulationTime = useMemo(() => {
    const baseHour = 8;
    const baseMinute = 42;
    const totalMinutes = baseMinute + Math.round((progress / 99) * 45);
    const h = baseHour + Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const s = Math.round((progress * 37) % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} IST`;
  }, [progress]);

  // Dynamic vehicle speed calculation
  const currentEstimatedSpeed = useMemo(() => {
    if (progress >= 42 && progress <= 48) return "0 km/h (Stationary)";
    if (progress > 55 && progress < 75) return "74 km/h (High Velocity)";
    if (progress >= 80) return "32 km/h (Braking)";
    return "42 km/h (Moderate City)";
  }, [progress]);

  // Auto-play simulation runner
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.floor(220 / playbackSpeed);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) {
          setIsPlaying(false);
          return 99;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  // Map Initialization
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      const darkTheme = [
        { elementType: "geometry", stylers: [{ color: "#16181d" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8a909d" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#16181d" }] },
        { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#242730" }] },
        { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#323744" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f222a" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c0d10" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
      ];

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 28.588, lng: 77.165 },
        zoom: 12,
        styles: darkTheme,
        disableDefaultUI: true,
        zoomControl: true,
      });

      // 1. Static dimmed background full trajectory
      new window.google.maps.Polyline({
        path: DETAILED_PATH,
        map: mapInstance.current,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.25,
        strokeWeight: 4,
      });

      // 2. Active dynamic route segment
      polylineRef.current = new window.google.maps.Polyline({
        path: DETAILED_PATH.slice(0, progress + 1),
        map: mapInstance.current,
        strokeColor: "#ef4444",
        strokeOpacity: 0.95,
        strokeWeight: 4.5,
      });

      // 3. Suspect Vehicle Target Marker
      targetMarkerRef.current = new window.google.maps.Marker({
        position: DETAILED_PATH[progress] || DETAILED_PATH[0],
        map: mapInstance.current,
        title: "Active Target: Rohan Sharma (DL-9C-4122)",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: "#ffffff",
        },
      });

      // 4. Movement corridor polygon
      const corridorPts = [
        { lat: 28.622, lng: 77.202 },
        { lat: 28.614, lng: 77.24 },
        { lat: 28.575, lng: 77.23 },
        { lat: 28.548, lng: 77.095 },
        { lat: 28.568, lng: 77.08 },
        { lat: 28.598, lng: 77.135 },
      ];

      corridorPolygonRef.current = new window.google.maps.Polygon({
        paths: corridorPts,
        map: mapInstance.current,
        strokeColor: "#38bdf8",
        strokeOpacity: 0.5,
        strokeWeight: 1.5,
        fillColor: "#38bdf8",
        fillOpacity: 0.05,
      });

      // 5. Azimuth Wedges & Cell Towers
      CELL_TOWERS.forEach((tower) => {
        // Mast Marker
        new window.google.maps.Marker({
          position: { lat: tower.lat, lng: tower.lng },
          map: mapInstance.current,
          title: `${tower.id}: ${tower.label}`,
          icon: {
            path: "M 0,-14 L 10,8 L -10,8 Z",
            scale: 1.1,
            fillColor: "#3b82f6",
            fillOpacity: 0.95,
            strokeWeight: 1.5,
            strokeColor: "#ffffff",
          },
        });

        // 3 Sectors per tower (0°, 120°, 240°)
        tower.sectors.forEach((sec) => {
          const isConnected = sec === tower.connectedSector;
          const wedgePts = getSectorPolygonPoints(tower.lat, tower.lng, sec, 70, 750);

          const wedgePoly = new window.google.maps.Polygon({
            paths: wedgePts,
            map: mapInstance.current,
            strokeColor: isConnected ? "#f59e0b" : "#10b981",
            strokeOpacity: isConnected ? 0.95 : 0.3,
            strokeWeight: isConnected ? 2.5 : 1,
            fillColor: isConnected ? "#f59e0b" : "#10b981",
            fillOpacity: isConnected ? 0.35 : 0.08,
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

      // 6. Camera Checkpoints
      CHECKPOINTS.forEach((cam) => {
        const marker = new window.google.maps.Marker({
          position: { lat: cam.lat, lng: cam.lng },
          map: mapInstance.current,
          title: `${cam.id} — ${cam.name}`,
          icon: {
            path: "M -4,-4 L 4,-4 L 4,4 L -4,4 Z",
            scale: 2.2,
            fillColor: "#10b981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1.5,
          },
        });

        marker.addListener("click", () => {
          setProgress(cam.index);
          toast.info(`Focused on ${cam.id} (${cam.name})`);
        });

        cameraMarkersRef.current.push({ index: cam.index, marker, id: cam.id });
      });
    };

    if (!window.google) {
      const script = document.createElement("script");
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyDnL8HCYcDFGpL7KdRimihyLmYS66bwOzQ";
      script.async = true;
      document.head.appendChild(script);
      script.onload = initMap;
    } else {
      initMap();
    }
  }, []);

  // Update map polyline & target position as scrubber moves
  useEffect(() => {
    if (!polylineRef.current || !targetMarkerRef.current) return;

    const currentPath = DETAILED_PATH.slice(0, progress + 1);
    polylineRef.current.setPath(currentPath);

    const currentPos = DETAILED_PATH[progress] || DETAILED_PATH[0]!;
    targetMarkerRef.current.setPosition(currentPos);

    // Dynamic tower wedge highlighting based on active tower
    wedgePolygonsRef.current.forEach((w) => {
      const isTowerActive = w.towerId === activeTower.id;
      if (w.isConnected) {
        w.poly.setOptions({
          strokeColor: isTowerActive ? "#f59e0b" : "#b45309",
          strokeWeight: isTowerActive ? 3 : 1.5,
          fillColor: isTowerActive ? "#f59e0b" : "#b45309",
          fillOpacity: isTowerActive ? 0.45 : 0.15,
          zIndex: isTowerActive ? 20 : 5,
        });
      }
    });

    // Pulse camera marker when near
    cameraMarkersRef.current.forEach((c) => {
      const isNear = Math.abs(progress - c.index) <= 4;
      c.marker.setIcon({
        path: isNear ? window.google?.maps.SymbolPath.CIRCLE : "M -4,-4 L 4,-4 L 4,4 L -4,4 Z",
        scale: isNear ? 7 : 2.2,
        fillColor: isNear ? "#ef4444" : "#10b981",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: isNear ? 2.5 : 1.5,
      });
    });
  }, [progress, activeTower.id]);

  // Recenter map functions
  const centerOnTarget = useCallback(() => {
    if (!mapInstance.current || !DETAILED_PATH[progress]) return;
    mapInstance.current.panTo(DETAILED_PATH[progress]);
    mapInstance.current.setZoom(14);
  }, [progress]);

  const centerOnOverview = useCallback(() => {
    if (!mapInstance.current) return;
    mapInstance.current.panTo({ lat: 28.588, lng: 77.165 });
    mapInstance.current.setZoom(12);
  }, []);

  const panToTower = useCallback((t: CellTower) => {
    setSelectedTower(t.id);
    if (mapInstance.current) {
      mapInstance.current.panTo({ lat: t.lat, lng: t.lng });
      mapInstance.current.setZoom(14);
    }
  }, []);

  // Jump to specific checkpoint
  const jumpToCheckpoint = (index: number) => {
    setProgress(index);
    const targetPoint = DETAILED_PATH[index];
    if (mapInstance.current && targetPoint) {
      mapInstance.current.panTo(targetPoint);
    }
  };

  // Step backward / forward between checkpoints
  const stepCheckpoint = (direction: "prev" | "next") => {
    if (direction === "prev") {
      const prevCams = CHECKPOINTS.filter((c) => c.index < progress);
      if (prevCams.length > 0) {
        jumpToCheckpoint(prevCams[prevCams.length - 1]!.index);
      } else {
        setProgress(0);
      }
    } else {
      const nextCams = CHECKPOINTS.filter((c) => c.index > progress);
      if (nextCams.length > 0) {
        jumpToCheckpoint(nextCams[0]!.index);
      } else {
        setProgress(99);
      }
    }
  };

  // Copy SHA-256 Hash
  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("BSA 2023 Sec 63 Hash copied to clipboard", {
      description: "Chain of custody electronic evidence ledger verified.",
    });
  };

  // Tag as evidence
  const tagAsEvidence = (cam: SpottedCheckpoint) => {
    toast.success(`Tagged ${cam.id} in Case File`, {
      description: `Checkpoint frame and telemetry attached to FIR-2041 dossier.`,
    });
  };

  return (
    <AppLayout
      title="Surveillance & Azimuth Intercept"
      subtitle="Tri-Sector BTS Azimuth Wedges • High-Definition CCTV Detections • Live Timeline Scrubbing"
      fullBleed
    >
      <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[820px] bg-background text-foreground overflow-hidden">
        {/* ========================================================= */}
        {/* 1. TOP OPERATIONAL COMMAND BAR (COMPACT & DE-CONGESTED)  */}
        {/* ========================================================= */}
        <div className="shrink-0 border-b border-border/70 bg-card/80 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          {/* Left: Active Target & Mission Status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/person-1.png"
                alt="Target"
                className="size-9 rounded-md object-cover border border-red-500/60 grayscale"
              />
              <span className="absolute -bottom-1 -right-1 size-2.5 rounded-full bg-red-500 border border-black animate-pulse" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-red-400 tracking-wider">
                  TARGET: ROHAN SHARMA (PER-001)
                </span>
                <Badge
                  variant="outline"
                  className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0 font-mono"
                >
                  HIGH ALERT
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                <span>VEH: <strong className="text-foreground">DL-9C-4122</strong> (White Sedan)</span>
                <span>&bull;</span>
                <span className="hidden sm:inline text-amber-400/90 font-medium">
                  SERVING CELL: {activeTower.id} ({activeTower.operator}) &bull; {activeTower.connectedSector}° Wedge
                </span>
              </div>
            </div>
          </div>

          {/* Right: Layer Toggles, Azimuth Reality Guide, & Layout Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Layer Toggles */}
            <div className="hidden md:flex items-center gap-1.5 bg-secondary/50 p-1 rounded-lg border border-border/50 text-[11px] font-mono">
              <button
                onClick={() => {
                  setShowWedges(!showWedges);
                  wedgePolygonsRef.current.forEach((w) => w.poly.setVisible(!showWedges));
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  showWedges
                    ? "bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Azimuth Wedges: {showWedges ? "ON" : "OFF"}
              </button>
              <button
                onClick={() => {
                  setShowCorridor(!showCorridor);
                  if (corridorPolygonRef.current) corridorPolygonRef.current.setVisible(!showCorridor);
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  showCorridor
                    ? "bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Corridor: {showCorridor ? "ON" : "OFF"}
              </button>
            </div>

            {/* Educational Modal Trigger (Replaces the ugly permanent banner) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAzimuthModalOpen(true)}
              className="h-8 text-xs font-mono border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 gap-1.5 shadow-xs"
            >
              <Compass className="size-3.5" />
              <span>Azimuth Sector Guide</span>
            </Button>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-secondary/70 p-0.5 rounded-lg border border-border/60 text-xs font-mono">
              <button
                onClick={() => setViewMode("split")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === "split"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Tactical Split View: Map and CCTV balanced"
              >
                Tactical Split
              </button>
              <button
                onClick={() => setViewMode("cinema")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === "cinema"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Cinema & Dossier Priority: Focus on footage and spotted intelligence"
              >
                CCTV Cinema
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewMode === "map"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Geospatial Focus: Full screen interactive map"
              >
                Geospatial
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MASTER MISSION TIMELINE & PLAYBACK CONTROL DECK       */}
        {/* ========================================================= */}
        <div className="shrink-0 border-b border-border/60 bg-secondary/30 px-4 py-2.5 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            {/* Playback Buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                variant={isPlaying ? "destructive" : "default"}
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 px-3 gap-1.5 font-mono text-xs font-semibold shadow-xs"
              >
                {isPlaying ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
                <span>{isPlaying ? "PAUSE" : "PLAY SIMULATION"}</span>
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => stepCheckpoint("prev")}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Jump to Previous Spotted Checkpoint"
              >
                <SkipBack className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => stepCheckpoint("next")}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Jump to Next Spotted Checkpoint"
              >
                <SkipForward className="size-3.5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setProgress(0);
                  setIsPlaying(false);
                }}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Reset Timeline to Origin (Connaught Place)"
              >
                <RotateCcw className="size-3.5" />
              </Button>

              {/* Simulation Speed */}
              <div className="flex items-center gap-0.5 ml-2 bg-background/80 p-0.5 rounded-md border border-border/60 text-[10px]">
                {([1, 2, 4] as const).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                      playbackSpeed === spd
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time mission readouts */}
            <div className="flex items-center gap-3 sm:gap-5 text-[11px] font-mono flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Elapsed:</span>
                <span className="text-foreground font-bold text-xs bg-background/80 px-2 py-0.5 rounded border border-border/50">
                  {currentElapsedFormatted}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Timecode:</span>
                <span className="text-amber-400 font-bold text-xs bg-background/80 px-2 py-0.5 rounded border border-border/50">
                  {currentSimulationTime}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Est. Speed:</span>
                <span className="text-emerald-400 font-bold text-xs bg-background/80 px-2 py-0.5 rounded border border-border/50">
                  {currentEstimatedSpeed}
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-1.5">
                <span className="text-muted-foreground">Active Wedge:</span>
                <span className="text-sky-400 font-semibold text-xs">
                  {activeTower.label.split(" ")[0]} &bull; {activeTower.connectedSector}° ({activeTower.rssi})
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Scrub Rail with Checkpoint Keyframes */}
          <div className="relative pt-2 pb-1">
            <input
              type="range"
              min="0"
              max="99"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted/60 accent-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />

            {/* Checkpoint tick markers */}
            <div className="relative w-full h-4 mt-0.5 pointer-events-none">
              {CHECKPOINTS.map((cam) => {
                const isActive = Math.abs(progress - cam.index) <= 4;
                return (
                  <button
                    key={cam.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpToCheckpoint(cam.index);
                    }}
                    style={{ left: `${cam.index}%` }}
                    className={`pointer-events-auto absolute -top-1 -translate-x-1/2 flex flex-col items-center group cursor-pointer transition-transform ${
                      isActive ? "scale-125 z-20" : "scale-100 hover:scale-110 z-10"
                    }`}
                    title={`Click to jump to ${cam.id}: ${cam.name}`}
                  >
                    <span
                      className={`size-3 rounded-full border-2 transition-all ${
                        isActive
                          ? "bg-red-500 border-white shadow-[0_0_8px_#ef4444]"
                          : "bg-emerald-500 border-background/90 group-hover:bg-emerald-400"
                      }`}
                    />
                    <span
                      className={`text-[9px] font-mono mt-0.5 whitespace-nowrap px-1 rounded transition-colors ${
                        isActive
                          ? "bg-red-500 text-white font-bold"
                          : "text-muted-foreground bg-background/80 border border-border/40 group-hover:text-foreground"
                      }`}
                    >
                      {cam.id} ({cam.elapsed.split(" ")[1]})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. MAIN WORKSPACE: GEOSPATIAL MAP vs CCTV INTELLIGENCE   */}
        {/* ========================================================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-0">
          {/* ------------------------------------------------------- */}
          {/* PANEL A: GEOSPATIAL SIGINT & AZIMUTH MAP                */}
          {/* ------------------------------------------------------- */}
          <div
            className={`flex flex-col border-r border-border/60 bg-card overflow-hidden relative transition-all duration-300 ${
              viewMode === "cinema"
                ? "col-span-12 lg:col-span-4 h-[35vh] lg:h-full"
                : viewMode === "map"
                ? "col-span-12 lg:col-span-12 h-full"
                : "col-span-12 lg:col-span-7 h-[45vh] lg:h-full"
            }`}
          >
            {/* Map Top Bar */}
            <div className="shrink-0 flex items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-1.5 font-mono text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Radio className="size-3.5 text-accent animate-pulse" />
                <span className="font-semibold text-foreground">DELHI NCR SIGINT MAP</span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  (CONN. PLACE &rarr; IGI CORRIDOR)
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <button
                  onClick={centerOnTarget}
                  className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  title="Center map on moving target vehicle"
                >
                  Follow Target
                </button>
                <button
                  onClick={centerOnOverview}
                  className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  title="Fit whole NCR route overview"
                >
                  Reset Fit
                </button>
              </div>
            </div>

            {/* Interactive Map Canvas */}
            <div className="relative flex-1 bg-muted/20 flex flex-col min-h-0">
              <div ref={mapRef} className="flex-1 z-0 relative w-full h-full" />

              {/* Floating Map Legend (Bottom-Left) */}
              <div className="absolute bottom-3 left-3 z-20 bg-black/85 border border-border/60 px-3 py-2 rounded-lg backdrop-blur-md font-mono text-[10px] space-y-1 shadow-lg pointer-events-none">
                <div className="flex items-center gap-2 text-foreground font-bold">
                  <span>MAP SYMBOLOGY</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <span className="size-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
                  <span>Serving Azimuth Wedge ({activeTower.connectedSector}°)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>Idle Mast Sectors (0° / 120° / 240°)</span>
                </div>
                <div className="flex items-center gap-2 text-red-400">
                  <span className="size-2 rounded-full bg-red-500" />
                  <span>Active Suspect Vehicle & Route</span>
                </div>
                <div className="flex items-center gap-2 text-sky-400">
                  <span className="size-2 rounded-full bg-sky-400" />
                  <span>Movement Corridor Bounds</span>
                </div>
              </div>

              {/* Floating Target Coordinates HUD (Top-Right) */}
              <div className="absolute top-3 right-3 z-20 bg-black/85 border border-red-500/40 p-2.5 rounded-lg backdrop-blur-md font-mono text-xs shadow-xl hidden sm:block">
                <div className="flex items-center gap-2 text-red-500 font-bold mb-1">
                  <Crosshair className="size-3.5 animate-spin" style={{ animationDuration: "6s" }} />
                  <span>SUSPECT GPS LOCK</span>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <div>LAT: {DETAILED_PATH[progress]?.lat.toFixed(5)}° N</div>
                  <div>LNG: {DETAILED_PATH[progress]?.lng.toFixed(5)}° E</div>
                  <div className="text-amber-400 font-bold">
                    CORRIDOR PROGRESS: {progress}% (T+ {Math.round(progress * 0.45)}m)
                  </div>
                </div>
              </div>
            </div>

            {/* Cell Tower BTS Dump Horizontal Selector (Docked cleanly at bottom of map) */}
            <div className="shrink-0 border-t border-border/60 bg-secondary/30 p-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1.5 px-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Antenna className="size-3.5 text-primary" /> Cell Towers Pinged &bull; CDR Tower Dump
                </span>
                <span className="hidden sm:inline text-[10px]">Click mast to focus on map</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 font-mono text-xs">
                {CELL_TOWERS.map((t) => {
                  const isCurrentActive = activeTower.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => panToTower(t)}
                      className={`p-2 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                        isCurrentActive
                          ? "bg-amber-500/15 border-amber-500/60 shadow-sm"
                          : "bg-background/80 hover:bg-background border-border/50 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground flex items-center gap-1">
                          {isCurrentActive && (
                            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                          )}
                          {t.id}
                        </span>
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
                      <div className="mt-1 pt-1 border-t border-border/40 flex justify-between items-center text-[10px]">
                        <span className="text-amber-400 font-bold">Wedge: {t.connectedSector}°</span>
                        <span className="text-emerald-400">{t.rssi}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* PANEL B: CCTV INTELLIGENCE HUB & SPOTTED DOSSIER        */}
          {/* ------------------------------------------------------- */}
          <div
            className={`flex flex-col bg-background overflow-hidden min-h-0 transition-all duration-300 ${
              viewMode === "cinema"
                ? "col-span-12 lg:col-span-8 h-[65vh] lg:h-full"
                : viewMode === "map"
                ? "hidden"
                : "col-span-12 lg:col-span-5 h-[55vh] lg:h-full"
            }`}
          >
            {/* Scrollable Container for Video, Dossier, and Checkpoint Rail */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin">
              {/* ------------------------------------------------- */}
              {/* CCTV PLAYER VIEWPORT CARD                         */}
              {/* ------------------------------------------------- */}
              <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-lg flex flex-col">
                {/* CCTV Header & Controls */}
                <div className="shrink-0 flex items-center justify-between border-b border-border/70 bg-muted/50 px-3.5 py-2 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <Camera className="size-4 text-red-500" />
                    <span className="font-bold text-foreground">{activeCheckpoint.id}</span>
                    <span className="text-muted-foreground hidden sm:inline">&bull;</span>
                    <span className="text-muted-foreground truncate hidden sm:inline max-w-[180px]">
                      {activeCheckpoint.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Source Switcher: Frame vs Processed Video */}
                    <div className="flex items-center bg-background/80 rounded border border-border/50 p-0.5 text-[10px]">
                      <button
                        onClick={() => setMediaSource("frame")}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          mediaSource === "frame"
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Frame
                      </button>
                      <button
                        onClick={() => setMediaSource("video")}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          mediaSource === "video"
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Stream
                      </button>
                    </div>

                    {/* Optical Filters */}
                    <div className="flex items-center bg-background/80 rounded border border-border/50 p-0.5 text-[10px]">
                      <button
                        onClick={() => setVisionFilter("normal")}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          visionFilter === "normal"
                            ? "bg-secondary text-foreground font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Normal RGB Optical Mode"
                      >
                        STD
                      </button>
                      <button
                        onClick={() => setVisionFilter("ir")}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          visionFilter === "ir"
                            ? "bg-emerald-600/30 text-emerald-400 font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Infrared Night-Vision Phosphor Filter"
                      >
                        IR
                      </button>
                      <button
                        onClick={() => setVisionFilter("high-contrast")}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          visionFilter === "high-contrast"
                            ? "bg-amber-600/30 text-amber-400 font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Edge Enhanced High-Contrast Filter"
                      >
                        ENH
                      </button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsFrameInspectOpen(true)}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      title="Inspect Frame Fullscreen"
                    >
                      <Maximize2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* CCTV Media Canvas */}
                <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden group">
                  {/* CRT Scanline & Grain Shader Overlay */}
                  <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[length:100%_4px,3px_100%] opacity-80" />

                  {/* Media Content */}
                  {mediaSource === "video" ? (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className={`absolute inset-0 h-full w-full object-cover z-0 transition-all ${
                        visionFilter === "ir"
                          ? "grayscale contrast-150 brightness-110 sepia hue-rotate-[90deg]"
                          : visionFilter === "high-contrast"
                          ? "grayscale contrast-200 brightness-95"
                          : "grayscale contrast-125 sepia-[0.2]"
                      }`}
                      src="/cctv_delhi_processed.mp4"
                    />
                  ) : (
                    <img
                      src={activeCheckpoint.img}
                      alt={activeCheckpoint.name}
                      className={`absolute inset-0 h-full w-full object-cover z-0 transition-all duration-300 ${
                        visionFilter === "ir"
                          ? "grayscale contrast-150 brightness-110 sepia hue-rotate-[90deg]"
                          : visionFilter === "high-contrast"
                          ? "grayscale contrast-200 brightness-90"
                          : "contrast-115"
                      }`}
                    />
                  )}

                  {/* Optical HUD Overlays */}
                  <div className="pointer-events-none absolute inset-0 z-20 p-3 flex flex-col justify-between font-mono text-xs shadow-[inset_0_0_60px_rgba(0,0,0,0.85)]">
                    {/* Top Row: Camera ID + Simulation Timestamp */}
                    <div className="flex justify-between items-start text-[11px] text-emerald-400">
                      <div className="bg-black/70 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-xs">
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-red-500 animate-ping" />
                          <span>{activeCheckpoint.id} &bull; {activeCheckpoint.elapsed}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {activeCheckpoint.lat.toFixed(4)}° N, {activeCheckpoint.lng.toFixed(4)}° E
                        </div>
                      </div>

                      <div className="text-right bg-black/70 px-2 py-0.5 rounded border border-emerald-500/30 backdrop-blur-xs">
                        <div className="text-emerald-400 font-bold">{activeCheckpoint.timestamp}</div>
                        <div className="text-[10px] text-yellow-400">
                          {isDirectlySpotted ? "LIVE PROXIMITY HIT" : "CORRELATED LOG"}
                        </div>
                      </div>
                    </div>

                    {/* Center: Dynamic Target Aim Reticle if near checkpoint */}
                    {isDirectlySpotted && (
                      <div className="self-center flex flex-col items-center justify-center pointer-events-none">
                        <div className="size-20 border-2 border-red-500/80 border-dashed rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: "12s" }}>
                          <div className="size-2 bg-red-500 rounded-full" />
                        </div>
                        <div className="bg-red-600/90 text-white font-bold text-[10px] px-2 py-0.5 rounded mt-1 shadow-md uppercase tracking-wider">
                          TARGET INTERCEPT CONFIRMED
                        </div>
                      </div>
                    )}

                    {/* Bottom Row: AI Recognition Diagnostics */}
                    <div className="flex justify-between items-end text-[11px]">
                      <div className="bg-black/75 px-2.5 py-1 rounded border border-yellow-500/40 backdrop-blur-xs text-yellow-400">
                        <div className="font-bold flex items-center gap-1.5">
                          <Sparkles className="size-3 text-yellow-400" />
                          <span>{activeCheckpoint.faceMatch}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          ANPR: <strong className="text-foreground">{activeCheckpoint.plateOcr}</strong>
                        </div>
                      </div>

                      <div className="text-right bg-black/75 px-2 py-1 rounded border border-emerald-500/30 backdrop-blur-xs text-muted-foreground text-[10px]">
                        <div>OPTICAL: 1080p FHD @ 30fps</div>
                        <div className="text-emerald-400 font-bold">SIGINT SECURE</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------- */}
              {/* SPOTTED AREA INTELLIGENCE DOSSIER (CLEAR & READABLE) */}
              {/* ------------------------------------------------- */}
              <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3 font-mono">
                {/* Header with Classification & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-xs px-2.5 py-0.5 font-mono font-bold ${
                        activeCheckpoint.severityColor === "red"
                          ? "bg-red-500/20 text-red-400 border-red-500/40"
                          : activeCheckpoint.severityColor === "amber"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-purple-500/20 text-purple-400 border-purple-500/40"
                      }`}
                    >
                      {activeCheckpoint.severity}
                    </Badge>
                    <span className="text-xs font-bold text-foreground">
                      {activeCheckpoint.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => tagAsEvidence(activeCheckpoint)}
                      className="h-7 text-[11px] font-mono gap-1 border-primary/40 text-primary hover:bg-primary/10"
                    >
                      <FileText className="size-3" />
                      <span>Tag Evidence</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyHash(activeCheckpoint.bsaHash)}
                      className="h-7 text-[11px] font-mono gap-1 text-muted-foreground hover:text-foreground"
                      title="Copy SHA-256 Hash"
                    >
                      <Copy className="size-3" />
                      <span>Copy Hash</span>
                    </Button>
                  </div>
                </div>

                {/* Primary Narrative Description (Large, Clean Typography) */}
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Investigative Intelligence Brief:
                  </div>
                  <p className="text-xs text-foreground font-sans leading-relaxed bg-secondary/30 p-3 rounded-lg border border-border/50">
                    {activeCheckpoint.desc}
                  </p>
                </div>

                {/* Tactical Observation Note */}
                <div className="text-[11px] bg-primary/5 border-l-2 border-primary p-2.5 rounded-r-lg font-sans text-muted-foreground leading-snug">
                  <strong className="text-primary font-mono text-[10px] uppercase block mb-0.5">
                    Surveillance Officer Notes:
                  </strong>
                  {activeCheckpoint.tacticalNotes}
                </div>

                {/* Corroborating Telemetry & Legal Audit Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground">Serving Cell Tower & Wedge:</span>
                    <span className="text-amber-400 font-bold mt-0.5 truncate">
                      {activeCheckpoint.associatedTower} &bull; {activeCheckpoint.sectorWedge}
                    </span>
                  </div>

                  <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground">Signal Strength (RSSI):</span>
                    <span className="text-emerald-400 font-bold mt-0.5">
                      {activeCheckpoint.rssi} (High Sensitivity Reception)
                    </span>
                  </div>

                  <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground">Estimated Vehicle Velocity:</span>
                    <span className="text-foreground font-bold mt-0.5">
                      {activeCheckpoint.speed}
                    </span>
                  </div>

                  <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground">Jurisdiction Agency:</span>
                    <span className="text-foreground truncate mt-0.5">
                      {activeCheckpoint.agency}
                    </span>
                  </div>
                </div>

                {/* BSA 2023 Section 63 Ledger Verification Bar */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck className="size-3.5" />
                    BSA 2023 Sec 63 Chain-of-Custody Inscribed
                  </span>
                  <span className="font-mono truncate max-w-[200px]" title={activeCheckpoint.bsaHash}>
                    {activeCheckpoint.bsaHash.slice(0, 24)}...
                  </span>
                </div>
              </div>

              {/* ------------------------------------------------- */}
              {/* CHECKPOINT RAIL / FILMSTRIP (4 SPOTTED LOCATIONS) */}
              {/* ------------------------------------------------- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <ScanLine className="size-3.5 text-primary" /> Key Spotted Intercepts Along Corridor
                  </span>
                  <span className="text-[10px]">Click card to jump</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  {CHECKPOINTS.map((cam) => {
                    const isSelected = activeCheckpoint.id === cam.id;
                    return (
                      <div
                        key={cam.id}
                        onClick={() => jumpToCheckpoint(cam.index)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all flex flex-col justify-between group ${
                          isSelected
                            ? "bg-primary/15 border-primary shadow-sm ring-1 ring-primary/40"
                            : "bg-card hover:bg-secondary/50 border-border/60"
                        }`}
                      >
                        <div className="relative aspect-video rounded overflow-hidden mb-1.5 bg-black border border-border/40">
                          <img
                            src={cam.img}
                            alt={cam.id}
                            className="size-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform"
                          />
                          <span
                            className={`absolute top-1 right-1 text-[8px] font-bold px-1 rounded ${
                              cam.severityColor === "red"
                                ? "bg-red-500 text-white"
                                : cam.severityColor === "amber"
                                ? "bg-amber-500 text-black"
                                : "bg-purple-500 text-white"
                            }`}
                          >
                            {cam.id}
                          </span>
                        </div>

                        <div className="text-[11px] font-bold text-foreground truncate">{cam.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex justify-between items-center">
                          <span>{cam.elapsed.split(" ")[1]}</span>
                          <span className="text-amber-400 font-semibold">{cam.associatedTower.split(" ")[0]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. FULLSCREEN FRAME INSPECTION MODAL                      */}
      {/* ========================================================= */}
      <Dialog open={isFrameInspectOpen} onOpenChange={setIsFrameInspectOpen}>
        <DialogContent className="max-w-4xl bg-black border-border/80 text-foreground p-4">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm flex items-center justify-between text-foreground">
              <div className="flex items-center gap-2">
                <Camera className="size-4 text-red-500" />
                <span>HIGH-RESOLUTION OPTICAL INSPECTOR &bull; {activeCheckpoint.id}</span>
              </div>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-[10px]">
                {activeCheckpoint.timestamp}
              </Badge>
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-muted-foreground">
              {activeCheckpoint.name} ({activeCheckpoint.area}) &bull; Optical Sensor: Sony Exmor HD 1080p
            </DialogDescription>
          </DialogHeader>

          <div className="relative aspect-video rounded-lg overflow-hidden border border-border/60 bg-black flex items-center justify-center">
            <img
              src={activeCheckpoint.img}
              alt={activeCheckpoint.name}
              className={`w-full h-full object-contain ${
                visionFilter === "ir"
                  ? "grayscale contrast-150 brightness-110 sepia hue-rotate-[90deg]"
                  : visionFilter === "high-contrast"
                  ? "grayscale contrast-200 brightness-90"
                  : ""
              }`}
            />
            {/* Crosshair Overlay */}
            <div className="pointer-events-none absolute inset-0 border border-emerald-500/30 flex items-center justify-center">
              <div className="size-32 border border-red-500/40 rounded-full flex items-center justify-center">
                <div className="w-full h-px bg-red-500/40" />
                <div className="h-full w-px bg-red-500/40 absolute" />
              </div>
            </div>
          </div>

          <div className="font-mono text-xs text-muted-foreground flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-border/40">
            <div>TARGET OCR: <strong className="text-foreground">{activeCheckpoint.plateOcr}</strong></div>
            <div>FACE RECOGNITION: <strong className="text-yellow-400">{activeCheckpoint.faceMatch}</strong></div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const a = document.createElement("a");
                a.href = activeCheckpoint.img;
                a.download = `${activeCheckpoint.id}_evidence_frame.png`;
                a.click();
                toast.success("Frame downloaded for evidentiary packaging");
              }}
              className="h-7 text-xs font-mono gap-1"
            >
              <Download className="size-3" />
              <span>Download Frame</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* 5. EDUCATIONAL MODAL: INDIAN TELCO AZIMUTH REALITY GUIDE  */}
      {/* ========================================================= */}
      <Dialog open={isAzimuthModalOpen} onOpenChange={setIsAzimuthModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border text-foreground p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Compass className="size-5 text-amber-400" />
              <span>Azimuth Sector Coverage Wedges (Indian Telco CDR Reality)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Why TriNetra models directional sector arcs instead of generic circular GPS pins.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs leading-relaxed font-sans mt-2">
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-foreground">
              <strong className="text-amber-400 block font-mono text-[11px] mb-1">
                The Student Project Flaw vs. Reality:
              </strong>
              Standard hackathon solutions drop single circular pins on cell tower GPS coordinates. In reality,
              no cell tower in India transmits in a generic omnidirectional 360° circle.
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider font-mono">
                How Indian Telcos (Jio, Airtel, Vi) Deploy Masts:
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                <li>
                  <strong>Tri-Sector Configuration:</strong> Cellular base transceiver stations (BTS) mount three directional panel antennas pointed at <strong>0° (Alpha / North)</strong>, <strong>120° (Beta / Southeast)</strong>, and <strong>240° (Gamma / Southwest)</strong>.
                </li>
                <li>
                  <strong>Directional Beamwidth:</strong> Each sector antenna covers an arc of approximately <strong>65° to 70°</strong> with a typical urban transmission radius of <strong>650m to 800m</strong>.
                </li>
                <li>
                  <strong>67% Search Area Elimination:</strong> When suspect CDR logs record a call or data ping on Sector 2 (120°), police investigators know the suspect was within that specific 70° directional wedge—immediately eliminating 67% of the surrounding geography!
                </li>
              </ul>
            </div>

            <div className="border-t border-border/50 pt-3 grid grid-cols-3 gap-2 font-mono text-center text-[11px]">
              <div className="p-2 rounded bg-secondary/50 border border-border/40">
                <div className="text-amber-400 font-bold">0° Sector</div>
                <div className="text-muted-foreground text-[10px]">North Orientation</div>
              </div>
              <div className="p-2 rounded bg-secondary/50 border border-border/40">
                <div className="text-amber-400 font-bold">120° Sector</div>
                <div className="text-muted-foreground text-[10px]">Southeast Arc</div>
              </div>
              <div className="p-2 rounded bg-secondary/50 border border-border/40">
                <div className="text-amber-400 font-bold">240° Sector</div>
                <div className="text-muted-foreground text-[10px]">Southwest Arc</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
