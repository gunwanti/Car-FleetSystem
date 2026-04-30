import { motion } from 'motion/react';
import { Driver, Order } from '../types';
import { MapPin, Navigation, Car } from 'lucide-react';

interface MapViewProps {
  drivers: Driver[];
  orders: Order[];
}

export default function MapView({ drivers, orders }: MapViewProps) {
  // Simple simulation: map 0-1 range to visual area
  const getPos = (lat: number, lng: number) => {
    // This is a dummy projection for the SVG
    return {
      x: (lng + 180) * (800 / 360),
      y: (90 - lat) * (600 / 180)
    };
  };

  return (
    <div className="w-full h-full bg-zinc-950 relative overflow-hidden">
      {/* Abstract Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <svg width="100%" height="100%" viewBox="0 0 800 600" className="relative z-10">
        {/* Render Order Routes */}
        {orders.filter(o => o.status === 'in_transit').map(order => {
          const driver = drivers.find(d => d.id === order.driverId);
          if (!driver) return null;
          
          return (
            <g key={order.id}>
              <line 
                x1={400} y1={300} x2={getPos(driver.location.lat, driver.location.lng).x} y2={getPos(driver.location.lat, driver.location.lng).y}
                stroke="#EA580C" strokeWidth="1" strokeDasharray="4 4" className="animate-[dash_2s_linear_infinite]"
              />
            </g>
          );
        })}

        {/* Render Drivers */}
        {drivers.map(driver => {
          const pos = getPos(driver.location.lat || 0, driver.location.lng || 0);
          return (
            <motion.g 
              key={driver.id}
              initial={false}
              animate={{ x: pos.x, y: pos.y }}
              transition={{ type: 'spring', damping: 20, stiffness: 50 }}
            >
              <circle r="6" fill="#EA580C" className="animate-pulse" />
              <g transform="translate(10, -10)">
                <rect width="80" height="20" rx="4" fill="black" stroke="#333" />
                <text x="5" y="14" fill="white" fontSize="8" fontWeight="bold" className="uppercase font-mono">
                  {driver.name.split(' ')[0]}
                </text>
              </g>
            </motion.g>
          );
        })}
      </svg>

      {/* Map Controls UI overlay */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2">
        <div className="p-4 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-2xl">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-3">Live Fleet Status</p>
          <div className="space-y-2">
            <LegendItem color="bg-orange-600" label="Active Driver" />
            <LegendItem color="bg-blue-600" label="Vehicle Pickup" />
            <LegendItem color="bg-zinc-700" label="Idle/Offline" />
          </div>
        </div>
      </div>

      <div className="absolute top-6 left-6 space-y-2">
        <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-full flex items-center gap-2">
          <Navigation className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Geo-Sync Primary</span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{label}</span>
    </div>
  );
}
