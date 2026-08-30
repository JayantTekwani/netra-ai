import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect, useState, useRef } from "react";
import { Camera, Radio, FastForward } from "lucide-react";

declare global {
  interface Window {
    google: any;
  }
}

export const Route = createFileRoute("/surveillance")({
  head: () => ({
    meta: [{ title: "Live Surveillance — NEXUS" }],
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
const interpolatePath = (points: {lat: number, lng: number}[], targetCount: number) => {
  const result = [];
  const segments = points.length - 1;
  const pointsPerSegment = Math.floor(targetCount / segments);
  
  for (let i = 0; i < segments; i++) {
    const start = points[i];
    const end = points[i + 1];
    for (let j = 0; j < pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      result.push({
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t
      });
    }
  }
  result.push(points[points.length - 1]);
  return result;
};

const DETAILED_PATH = interpolatePath(MOCK_PATH, 100);

const CAMERAS = [
  { 
    index: 15, 
    lat: DETAILED_PATH[15].lat, 
    lng: DETAILED_PATH[15].lng, 
    id: "CAM-ND-01", 
    desc: "Target vehicle DL-9C-XXXX identified crossing India Gate circle. Facial match 89%.",
    img: "https://images.unsplash.com/photo-1616421946890-55ceea4101e8?auto=format&fit=crop&w=300&q=80"
  },
  { 
    index: 45, 
    lat: DETAILED_PATH[45].lat, 
    lng: DETAILED_PATH[45].lng, 
    id: "CAM-SD-44", 
    desc: "Subject seen interacting with unknown associate near Lodhi road.",
    img: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=300&q=80"
  },
  { 
    index: 85, 
    lat: DETAILED_PATH[85].lat, 
    lng: DETAILED_PATH[85].lng, 
    id: "CAM-IG-99", 
    desc: "Vehicle approaching Terminal 3. Elevated alert status triggered.",
    img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=300&q=80"
  }
];

function SurveillancePage() {
  const [time, setTime] = useState("");
  const [progress, setProgress] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const targetMarkerRef = useRef<any>(null);
  const infoWindowsRef = useRef<any[]>([]);
  
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
        center: { lat: 28.58, lng: 77.16 },
        zoom: 12,
        styles: darkTheme,
        disableDefaultUI: true,
      });

      // Draw static full path (dimmed)
      new window.google.maps.Polyline({
        path: DETAILED_PATH,
        map: mapInstance.current,
        strokeColor: "#444444",
        strokeOpacity: 0.5,
        strokeWeight: 4,
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
          scale: 6,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        }
      });

      // Camera Markers
      CAMERAS.forEach(cam => {
        const marker = new window.google.maps.Marker({
          position: { lat: cam.lat, lng: cam.lng },
          map: mapInstance.current,
          icon: {
            path: 'M -2,0 L 2,0 M 0,-2 L 0,2', // simple crosshair/camera icon
            scale: 6,
            strokeColor: "#10b981",
            strokeWeight: 3
          }
        });
        
        const info = new window.google.maps.InfoWindow({
           content: `
            <div style="font-family: monospace; font-size: 11px; color: #10b981; background: #000; padding: 10px; border: 1px solid #10b981; max-width: 220px;">
              <strong style="color: #ef4444; font-size: 13px;">[CCTV HIT] ${cam.id}</strong><br/>
              <hr style="border-color: #10b98144; margin: 4px 0;" />
              <img src="${cam.img}" style="width: 100%; height: auto; border: 1px solid #333; margin-bottom: 4px;" />
              ${cam.desc}
            </div>
           `
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

    // Auto-open camera popups when scrubbing past them
    infoWindowsRef.current.forEach(cam => {
      if (progress === cam.index) {
        cam.info.open(mapInstance.current, cam.marker);
      }
    });
  }, [progress]);

  return (
    <AppLayout title="Live Surveillance" subtitle="Geospatial Tracking & Live Intercepts" fullBleed>
      <div className="grid h-[calc(100vh-8.5rem)] grid-cols-2 gap-4 p-4">
        
        {/* PANEL A: GEOSPATIAL MAP */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden relative shadow-lg">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-emerald-500 animate-pulse" />
              <span>SIGINT_TRACKER_V2</span>
            </div>
            <span>LOC_LOCK: ACTIVE</span>
          </div>
          
          <div className="relative flex-1 bg-muted/20 flex flex-col">
            {/* Map Container */}
            <div ref={mapRef} className="flex-1 z-0 relative"></div>
            
            {/* Scrubber Control */}
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/80 border border-emerald-500/30 p-4 rounded-lg backdrop-blur-md">
              <div className="flex items-center gap-4 text-emerald-400 font-mono text-xs mb-2">
                <FastForward className="size-4" />
                <span>TIMELINE_SCRUBBER</span>
                <span className="ml-auto">T+ {progress}m</span>
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
            
            <div className="pointer-events-none absolute inset-0 z-10 border-[4px] border-emerald-500/20 mix-blend-overlay"></div>
          </div>
        </div>

        {/* PANEL B: LIVE CCTV INTERCEPT */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden relative shadow-lg group">
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
          
          <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20"></div>
            
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 h-full w-full object-cover z-0 grayscale contrast-125 sepia-[0.3]"
              src="/cctv_delhi_processed.mp4"
            />
            
            <div className="pointer-events-none absolute inset-0 z-30 p-6 flex flex-col justify-between font-mono text-emerald-400 text-sm shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
              <div className="flex justify-between w-full">
                <div>
                  CAM: SEC-14_N04<br/>
                  COORD: 28.6139° N, 77.2090° E
                </div>
                <div className="text-right">
                  SYS_TIME: {time}<br/>
                  AI_TRACK: ACTIVE
                </div>
              </div>

              <div className="flex justify-between w-full text-xs">
                <div>
                  NODE: 889104<br/>
                  <span className="text-yellow-400 animate-pulse">FACIAL_MATCH: 98.4%</span>
                </div>
                <div className="text-right">
                  BUFFER: 0x88F1A<br/>
                  UPLINK: SECURE
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
