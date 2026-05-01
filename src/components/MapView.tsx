import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Driver, Order } from '../types';
import { Navigation, Flag, User, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

interface MapViewProps {
  drivers: Driver[];
  orders: Order[];
  missionMode?: boolean;
}

// Function to create custom Lucide markers
const createDriverIcon = (name: string, status: string) => {
  const color = status === 'available' ? '#10b981' : status === 'busy' ? '#f59e0b' : '#71717a';
  
  const html = renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div className="absolute w-10 h-10 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }} />
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-zinc-900" style={{ backgroundColor: color }}>
        <span className="text-[10px] font-black uppercase">{name[0]}</span>
      </div>
    </div>
  );

  return L.divIcon({
    html,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const createDispatcherIcon = () => {
  const html = renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div className="absolute w-12 h-12 rounded-full animate-pulse bg-blue-500/20" />
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg border-2 border-zinc-900 ring-2 ring-blue-500/20">
        <Navigation className="w-4 h-4 fill-white" />
      </div>
    </div>
  );
  return L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
};

const createDestinationIcon = () => {
  const html = renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div className="absolute w-10 h-10 rounded-full bg-orange-600 animate-ping opacity-20" />
      <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(234,88,12,0.4)] border-2 border-zinc-900 ring-2 ring-orange-500/20">
        <Flag className="w-5 h-5" />
      </div>
    </div>
  );
  return L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
};

const createOriginIcon = () => {
  const html = renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-zinc-900 border-dashed border-zinc-500">
        <MapPin className="w-4 h-4 text-zinc-400" />
      </div>
    </div>
  );
  return L.divIcon({ html, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
};

function AutoBounds({ drivers, orders, dispatcherLoc, missionMode }: { drivers: Driver[], orders: Order[], dispatcherLoc: {lat: number, lng: number} | null, missionMode?: boolean }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];
    
    // In mission mode, we prioritize the driver and their destination
    if (missionMode && drivers.length > 0 && orders.length > 0) {
      const driver = drivers[0];
      const order = orders[0];
      if (driver.location) points.push([driver.location.lat, driver.location.lng]);
      if (order.dropoff) points.push([order.dropoff.lat, order.dropoff.lng]);
      
      if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
        return;
      }
    }

    // Default bounds logic
    drivers.filter(d => d.location && d.location.lat !== undefined).forEach(d => {
      points.push([d.location.lat, d.location.lng]);
    });

    orders.filter(o => o.status === 'assigned' || o.status === 'in_transit').forEach(o => {
      points.push([o.dropoff.lat, o.dropoff.lng]);
    });

    if (dispatcherLoc && !missionMode) points.push([dispatcherLoc.lat, dispatcherLoc.lng]);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 12 });
    }
  }, [drivers, orders, dispatcherLoc, missionMode, map]);

  return null;
}

export default function MapView({ drivers, orders, missionMode }: MapViewProps) {
  const [dispatcherLoc, setDispatcherLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDispatcherLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Dispatcher Geolocation Error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  return (
    <div className="w-full h-full bg-zinc-950 relative overflow-hidden">
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        style={{ height: '100%', width: '100%', background: '#09090b' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Draw Mission Route Line */}
        {missionMode && drivers.length > 0 && orders.length > 0 && drivers[0].location && (
          <Polyline 
            positions={[
              [drivers[0].location.lat, drivers[0].location.lng],
              [orders[0].dropoff.lat, orders[0].dropoff.lng]
            ]}
            pathOptions={{ 
              color: '#ea580c', 
              weight: 3, 
              dashArray: '10, 10', 
              opacity: 0.6 
            }}
          />
        )}

        {/* Dispatcher Station */}
        {dispatcherLoc && !missionMode && (
          <Marker position={[dispatcherLoc.lat, dispatcherLoc.lng]} icon={createDispatcherIcon()}>
            <Popup className="custom-popup">
              <div className="p-3 min-w-[150px]">
                <p className="text-[10px] font-black uppercase text-blue-500 mb-1">HQ Station</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                   <span className="text-xs font-bold text-white">Your Terminal Location</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Markers */}
        {orders.filter(o => o.status === 'assigned' || o.status === 'in_transit').map(order => (
          <Marker 
            key={`dest-${order.id}`} 
            position={[order.dropoff.lat, order.dropoff.lng]} 
            icon={createDestinationIcon()}
          >
            <Popup className="custom-popup">
              <div className="p-3 min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-black uppercase text-orange-500">Target Destination</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-100 mb-1">{order.carModel}</h4>
                <p className="text-[10px] text-zinc-400 font-mono tracking-tighter capitalize">{order.status.replace('_', ' ')}</p>
                <p className="text-[10px] text-zinc-500 mt-2 font-mono leading-tight">{order.dropoff.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Pickup Marker (Origin) for assigned orders */}
        {missionMode && orders[0]?.status === 'assigned' && (
          <Marker position={[dispatcherLoc?.lat || 0, dispatcherLoc?.lng || 0]} icon={createOriginIcon()}>
             <Popup className="custom-popup">
                <div className="p-3 min-w-[120px]">
                  <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Pickup Point</p>
                  <p className="text-xs font-bold text-white">HQ Terminal</p>
                </div>
             </Popup>
          </Marker>
        )}
        
        {drivers.filter(d => d.location && d.location.lat !== undefined).map(driver => (
          <Marker 
            key={driver.id} 
            position={[driver.location.lat, driver.location.lng]}
            icon={createDriverIcon(driver.name, driver.status)}
          >
            <Popup className="custom-popup">
              <div className="p-3 min-w-[200px] bg-zinc-900 text-white rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{driver.name}</h4>
                    <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-tighter">{driver.id.slice(0, 8)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-2 py-1 bg-zinc-950 rounded border border-zinc-800 mb-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${driver.status === 'available' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-[10px] uppercase font-bold text-zinc-400">{driver.status}</span>
                </div>
                
                {driver.currentOrderId && (
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <p className="text-[8px] font-black uppercase tracking-tighter text-zinc-300">Active Order</p>
                    <p className="text-[10px] text-emerald-400">Order ID: #{driver.currentOrderId.slice(0, 8)}</p>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <AutoBounds drivers={drivers} orders={orders} dispatcherLoc={dispatcherLoc} missionMode={missionMode} />
      </MapContainer>

      {/* Recenter Button */}
      {drivers.length > 0 && (
        <div className="absolute top-20 left-6 z-[1000]">
           <button 
             onClick={() => {
               // Reloading is a bit harsh but ensures AutoBounds re-runs and cleans up state
               window.dispatchEvent(new Event('resize')); 
               // Better: most users expect a 'snap to me' button.
             }}
             className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-xl active:scale-95"
           >
              <Navigation className="w-5 h-5 -rotate-45" />
           </button>
        </div>
      )}

      {/* Map Controls UI overlay */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-[1000]">
        <div className="p-4 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-3">Live Fleet Status</p>
          <div className="space-y-2">
            <LegendItem color="bg-emerald-600" label="Available Now" />
            <LegendItem color="bg-orange-600" label="On Assignment" />
            <LegendItem color="bg-zinc-700" label="System Offline" />
          </div>
        </div>
      </div>

      <div className="absolute top-6 left-6 space-y-2 z-[1000]">
        <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-full flex items-center gap-2 shadow-2xl">
          <Navigation className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white">Grid Manifest Alpha</span>
        </div>
      </div>
      
      <style>{`
        .leaflet-popup-content-wrapper {
          background: #18181b !important;
          color: white !important;
          border: 1px solid #27272a;
          border-radius: 12px !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-tip {
          background: #18181b !important;
          border: 1px solid #27272a;
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">{label}</span>
    </div>
  );
}
