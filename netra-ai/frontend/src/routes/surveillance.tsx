import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect, useState, useRef } from "react";
import { Camera, Radio, Crosshair } from "lucide-react";

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

const MOCK_TOWERS = [
  { 
    id: "T1", lat: 28.6139, lng: 77.2090, label: "TOWER ALPHA (Connaught Place)", time: "18:02:14",
    cdr: { caller: "+91-98991-XXXXX", receiver: "+91-88264-XXXXX", duration: "00:45s", network: "Airtel India", imei: "359483084XXXXXX" }
  },
  { 
    id: "T2", lat: 28.5921, lng: 77.2273, label: "TOWER BETA (Lodhi Gardens)", time: "18:24:09",
    cdr: { caller: "+91-98991-XXXXX", receiver: "+91-99100-XXXXX", duration: "02:12s", network: "Jio", imei: "359483084XXXXXX" }
  },
  { 
    id: "T3", lat: 28.5562, lng: 77.1000, label: "TOWER GAMMA (IGI Airport)", time: "19:15:33",
    cdr: { caller: "+91-98991-XXXXX", receiver: "+971-50-XXXXXXX (UAE)", duration: "05:40s", network: "Vodafone Idea", imei: "359483084XXXXXX" }
  },
];

function SurveillancePage() {
  const [time, setTime] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mapInstance: any = null;
    let polyline: any = null;
    let animationInterval: any = null;

    const initMap = () => {
      if (!mapRef.current || !window.google) return;
      
      const darkTheme = [
        { elementType: "geometry", stylers: [{ color: "#212121" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
        { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
        { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
        { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#3c3c3c" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#181818" }] },
      ];

      mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 28.58, lng: 77.15 },
        zoom: 11,
        styles: darkTheme,
        disableDefaultUI: true,
      });

      MOCK_TOWERS.forEach(t => {
        const marker = new window.google.maps.Marker({
          position: { lat: t.lat, lng: t.lng },
          map: mapInstance,
          title: t.label,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#ef4444",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
          }
        });
        
        const info = new window.google.maps.InfoWindow({
           content: `
            <div style="font-family: monospace; font-size: 11px; color: #10b981; background: #000; padding: 12px; border: 1px solid #10b981; min-width: 200px;">
              <strong style="color: #ef4444; font-size: 13px;">[INTERCEPT] ${t.label}</strong><br/>
              <hr style="border-color: #10b98144; margin: 4px 0;" />
              TIME: ${t.time}<br/>
              NET:  ${t.cdr.network}<br/>
              IMEI: ${t.cdr.imei}<br/>
              <hr style="border-color: #10b98144; margin: 4px 0;" />
              CALL_SRC: <span style="color: #fff;">${t.cdr.caller}</span><br/>
              CALL_DST: <span style="color: #fff;">${t.cdr.receiver}</span><br/>
              DUR:  ${t.cdr.duration}<br/>
            </div>
           `
        });
        marker.addListener("click", () => info.open(mapInstance, marker));
      });

      const path = MOCK_TOWERS.map(t => ({ lat: t.lat, lng: t.lng }));
      polyline = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#ef4444",
        strokeOpacity: 0,
        strokeWeight: 3,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
          offset: '0',
          repeat: '20px'
        }],
      });
      polyline.setMap(mapInstance);

      let count = 0;
      animationInterval = window.setInterval(() => {
        count = (count + 1) % 200;
        const icons = polyline.get('icons');
        icons[0].offset = (count / 2) + 'px';
        polyline.set('icons', icons);
      }, 50);
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

    return () => {
      if (animationInterval) window.clearInterval(animationInterval);
    };
  }, []);

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
          
          <div className="relative flex-1 bg-muted/20">
            {/* Map Container */}
            <div ref={mapRef} className="absolute inset-0 z-0"></div>
            
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
            {/* Spy CRT Overlay */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20"></div>
            
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 h-full w-full object-cover z-0 grayscale contrast-125 sepia-[0.3]"
              src="/cctv_delhi_processed.mp4"
            />
            
            {/* Spy HUD Elements */}
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
