import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Eye, Target, MapPin, RadioTower } from "lucide-react";

const CARDS = [
  { id: 1, title: "Target Acquired", desc: "Suspect identified at location Alpha. Awaiting clearance.", icon: Target, bg: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=800&auto=format&fit=crop", path: "/investigation" },
  { id: 2, title: "Surveillance Active", desc: "Drone footage confirming movement along the corridor.", icon: Eye, bg: "https://images.unsplash.com/photo-1549420658-2ebbc61d4b68?q=80&w=800&auto=format&fit=crop", path: "/surveillance" },
  { id: 3, title: "Location Tracking", desc: "GPS ping intercepted from secondary burner device.", icon: MapPin, bg: "https://images.unsplash.com/photo-1508614999368-9260051292e5?q=80&w=800&auto=format&fit=crop", path: "/timeline" },
  { id: 4, title: "Signal Intercept", desc: "Encrypted comms detected in the vicinity. Decrypting...", icon: RadioTower, bg: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop", path: "/upload" },
  { id: 5, title: "Legal Compliance", desc: "Verify Section 63 BSA audit trails and Merkle hashes.", icon: Sparkles, bg: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop", path: "/compliance" },
];

export function ParallaxCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollX(containerRef.current.scrollLeft);
    }
  };

  return (
    <section className="col-span-1 lg:col-span-3 mt-6 mb-16">
      <div className="flex items-center gap-2 mb-4 px-2">
        <Sparkles className="size-5 text-accent" />
        <h2 className="text-lg font-bold tracking-tight">Field Operations (Parallax Swiper)</h2>
      </div>
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
        {CARDS.map((card, index) => {
          // Calculate parallax offset based on raw scrollX
          // Adjust -0.4 for parallax speed difference
          const offset = (scrollX - (index * 300)) * -0.4;
          
          return (
            <Link 
              key={card.id}
              to={card.path as any}
              className="relative block shrink-0 w-[85vw] md:w-[600px] h-[450px] rounded-2xl overflow-hidden snap-center shadow-lg border border-border group hover:ring-2 hover:ring-primary transition-all"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-none"
                style={{ 
                  backgroundImage: `url(${card.bg})`,
                  transform: `translateX(${offset}px) scale(1.3)`,
                  opacity: 0.7,
                  willChange: 'transform'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="bg-primary/20 p-3 rounded-full w-fit mb-4 backdrop-blur-md border border-primary/50">
                    <card.icon className="size-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">{card.title}</h3>
                <p className="text-white/80 font-medium leading-relaxed">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
