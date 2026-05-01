import { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Driver, Order } from '../types';
import { 
  Navigation, 
  Package, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Power, 
  Truck,
  Car,
  ChevronRight,
  LogOut,
  Map as MapIcon,
  Loader2,
  Ruler,
  Compass,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { cn, formatDate, getDistance } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import MapView from './MapView';
import Documentation from './Documentation';

interface DriverAppProps {
  user: User;
  isSimulating?: boolean;
  onExitSimulation?: () => void;
}

export default function DriverApp({ user, isSimulating, onExitSimulation }: DriverAppProps) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [hubLocation, setHubLocation] = useState<{lat: number, lng: number} | null>({ lat: 18.5204, lng: 73.8567 });

  const [activeTab, setActiveTab] = useState<'mission' | 'route' | 'fleet' | 'manual'>('mission');
  const [deliveriesCount, setDeliveriesCount] = useState(0);
  const [fleetStatus, setFleetStatus] = useState<Driver[]>([]);

  // Telemetry metrics
  const telemetry = useMemo(() => {
    if (!driver?.location || !currentOrder?.dropoff) return null;
    
    const distToTarget = getDistance(
      driver.location.lat, 
      driver.location.lng, 
      currentOrder.dropoff.lat, 
      currentOrder.dropoff.lng
    );

    // Initial origin is usually where they accepted or fixed hub
    const originLocation = hubLocation || { lat: driver.location.lat, lng: driver.location.lng };
    const distFromHub = getDistance(
      originLocation.lat,
      originLocation.lng,
      driver.location.lat,
      driver.location.lng
    );

    return {
      distToTarget,
      distFromHub,
      isArriving: distToTarget < 0.5,
      isAtHub: distFromHub < 0.1
    };
  }, [driver?.location, currentOrder?.dropoff, hubLocation]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setHubLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null,
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    // Fetch total delivered orders for this driver
    const q = query(collection(db, 'orders'), where('driverId', '==', user.uid), where('status', '==', 'delivered'));
    getDocs(q).then(snap => setDeliveriesCount(snap.size));

    // Fetch other drivers for "Fleet" view
    const qFleet = query(collection(db, 'drivers'));
    const unsubFleet = onSnapshot(qFleet, (snap) => {
      setFleetStatus(snap.docs.map(d => ({ id: d.id, ...d.data() } as Driver)));
    });

    return () => unsubFleet();
  }, [user.uid]);

  useEffect(() => {
    if (driver?.status === 'busy' && currentOrder?.status === 'in_transit') {
      const interval = setInterval(async () => {
        const currentLat = driver.location?.lat ?? 18.5204;
        const currentLng = driver.location?.lng ?? 73.8567;
        const destLat = currentOrder.dropoff.lat;
        const destLng = currentOrder.dropoff.lng;
        
        // Move towards destination
        const step = 0.05; // 5% move for faster visual feedback in demo
        const newLat = currentLat + (destLat - currentLat) * step;
        const newLng = currentLng + (destLng - currentLng) * step;
        
        await updateDoc(doc(db, 'drivers', user.uid), {
          location: { lat: newLat, lng: newLng },
          updatedAt: serverTimestamp()
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [driver?.status, currentOrder?.status, driver?.location, currentOrder?.dropoff, user.uid]);

  useEffect(() => {
    setLoading(true);
    let unsubOrder: (() => void) | null = null;

    const unsubDriver = onSnapshot(doc(db, 'drivers', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const dData = { id: snapshot.id, ...snapshot.data() } as Driver;
        setDriver(dData);
        
        // Handle order listener
        if (dData.currentOrderId) {
          // Only create a new listener if it's different
          if (unsubOrder) unsubOrder();
          unsubOrder = onSnapshot(doc(db, 'orders', dData.currentOrderId), (orderSnap) => {
             if (orderSnap.exists()) {
               setCurrentOrder({ id: orderSnap.id, ...orderSnap.data() } as Order);
             }
          }, (err) => {
            console.error("Order snapshot error:", err);
          });
        } else {
          if (unsubOrder) {
            unsubOrder();
            unsubOrder = null;
          }
          setCurrentOrder(null);
        }
      } else {
        console.warn("Driver document does not exist yet.");
      }
      setLoading(false);
    }, (err) => {
      console.error("Driver snapshot error:", err);
      setLoading(false);
    });

    return () => {
      unsubDriver();
      if (unsubOrder) unsubOrder();
    };
  }, [user.uid]);

  useEffect(() => {
    let watchId: number | null = null;

    if (driver?.status === 'available' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            await updateDoc(doc(db, 'drivers', user.uid), {
              location: { lat: latitude, lng: longitude },
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            console.error("Location Update Failed:", err);
          }
        },
        (err) => console.error("Geolocation Error:", err),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [driver?.status, user.uid]);

  const [showGuide, setShowGuide] = useState(false);

  const toggleStatus = async () => {
    if (!driver) return;
    const newStatus = driver.status === 'offline' ? 'available' : 'offline';
    await updateDoc(doc(db, 'drivers', user.uid), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  };

  const updateOrderStatus = async (newStatus: 'in_transit' | 'delivered') => {
    if (!currentOrder || !driver) return;
    
    await updateDoc(doc(db, 'orders', currentOrder.id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    if (newStatus === 'delivered') {
      await updateDoc(doc(db, 'drivers', user.uid), {
        status: 'available',
        currentOrderId: null,
        updatedAt: serverTimestamp()
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
        <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Profile Initialization</h2>
        <p className="text-zinc-500 text-sm mb-6 max-w-xs">Your driver profile is currently being provisioned by the terminal. This may take a few seconds on first entry.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white text-black font-bold uppercase text-[10px] tracking-widest rounded-lg"
        >
          Check Profile Status
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 relative overflow-hidden">
        {/* Porsche Animation Background (Driver) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
          <motion.div
            animate={{ x: ['110%', '-110%'] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="h-full flex items-center"
          >
            <svg className="h-8 w-auto" viewBox="0 0 120 40" fill="orange">
              <path d="M10,30 L15,25 Q25,10 50,12 L85,15 Q110,18 115,30 Z" />
              <path d="M115,30 L118,34 L2,34 L5,30 Z" />
              <circle cx="28" cy="34" r="5" fill="black" stroke="orange" strokeWidth="1" />
              <circle cx="92" cy="34" r="5" fill="black" stroke="orange" strokeWidth="1" />
            </svg>
          </motion.div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-orange-600/20 text-white">
            {driver.name[0]}
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tight text-white uppercase leading-none">{driver.name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse shadow-sm", driver.status === 'available' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50')} />
              <span className="text-[8px] uppercase font-black tracking-[0.2em] text-zinc-500">{driver.status}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
            <div className={cn("w-1.5 h-1.5 rounded-full", driver.status === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500')} />
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{driver.status}</span>
          </div>
          <button 
            onClick={toggleStatus}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] transition-all",
              driver.status === 'offline' 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                : "bg-zinc-800 text-zinc-500 hover:text-red-500 border border-zinc-700"
            )}
          >
            {driver.status === 'offline' ? 'Go Live' : 'Go Offline'}
          </button>
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-all active:scale-95 group"
            title="Switch Account"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Switch</span>
          </button>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <StatBox label="Deliveries" value={deliveriesCount.toString()} />
        <StatBox label="Rating" value={(driver.rating || 5.0).toFixed(1)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'mission' ? (
            driver.status === 'offline' ? (
              <motion.div 
                key="offline-splash"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center space-y-8 py-20 text-center"
              >
                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center relative">
                   <div className="absolute inset-0 border-2 border-zinc-800 rounded-full" />
                   <Power className="w-10 h-10 text-zinc-700" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">System Standby</h3>
                  <p className="text-zinc-500 text-sm max-w-[240px] mt-2">Your terminal is currently offline. You will not receive any delivery assignments in this state.</p>
                </div>
                <button 
                  onClick={toggleStatus}
                  className="px-8 py-4 bg-emerald-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  <Power className="w-5 h-5" />
                  Go Online
                </button>
              </motion.div>
            ) : !currentOrder ? (
              <motion.div 
                key="looking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center space-y-4 py-20 text-center"
              >
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center relative">
                   <div className="absolute inset-0 border-2 border-orange-600/20 rounded-full animate-ping" />
                   <Navigation className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tighter text-white">Locating Shipments</h3>
                  <p className="text-zinc-500 text-sm max-w-[200px]">Scanning regional hub for new vehicle delivery orders...</p>
                </div>
                
                <button 
                  onClick={() => setShowGuide(true)}
                  className="mt-4 px-4 py-2 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-2"
                >
                  <AlertCircle className="w-3 h-3" />
                  Guide: How to use this Terminal
                </button>

                <AnimatePresence>
                  {showGuide && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="fixed inset-x-6 bottom-32 z-50 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl"
                    >
                       <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xs font-black uppercase text-orange-500 tracking-widest">Field Manual</h4>
                          <button onClick={() => setShowGuide(false)} className="text-zinc-500 hover:text-white"><LogOut className="w-4 h-4 rotate-90" /></button>
                       </div>
                       <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                          <div className="p-4 bg-orange-600/5 border border-orange-500/10 rounded-2xl mb-2">
                             <h5 className="text-[10px] font-black uppercase text-orange-500 tracking-wider mb-2">System Purpose</h5>
                             <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                                Built for high-frequency, high-security vehicle logistics. This terminal bridges the gap between HQ command and field agents, ensuring 0% latency in shipment updates and 100% transparency in fleet positioning.
                             </p>
                          </div>

                          <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                <Power className="w-4 h-4 text-emerald-500" />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-white uppercase mt-1">1. Operational Status</p>
                                <p className="text-[10px] text-zinc-500 leading-snug">Toggle **"Go Live"** at the top right to signal availability to Dispatch. You will only receive mission alerts while active.</p>
                             </div>
                          </div>

                          <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-blue-500" />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-white uppercase mt-1">2. Mission Acquisition</p>
                                <p className="text-[10px] text-zinc-500 leading-snug">Incoming payloads appear in the **Mission** tab. Review details and "Accept" to begin the lock-on process.</p>
                             </div>
                          </div>

                          <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                <MapIcon className="w-4 h-4 text-purple-500" />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-white uppercase mt-1">3. Precision Routing</p>
                                <p className="text-[10px] text-zinc-500 leading-snug">Switch to the **Route** tab for a live tactical map. The system calculates the most efficient vector to the target drop-off point.</p>
                             </div>
                          </div>

                          <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                                <Navigation className="w-4 h-4 text-orange-500" />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-white uppercase mt-1">4. Fleet Intel</p>
                                <p className="text-[10px] text-zinc-500 leading-snug">The **Fleet** tab shows live status of other agents. Use this for sector awareness and to avoid overlap in high-traffic zones.</p>
                             </div>
                          </div>

                          <div className="pt-4 border-t border-zinc-800 mt-4">
                             <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest text-center">Protocol: Secure. Tactical. Efficient.</p>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                 key="active-order"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-6"
               >
                 <div className="flex justify-between items-center">
                   <h2 className="text-[10px] uppercase font-black tracking-[0.3em] text-orange-500">Active Assignment</h2>
                   <span className="text-[10px] font-mono text-zinc-500">#{currentOrder.id.slice(0, 12)}</span>
                 </div>
   
                 {/* Telemetry HUD */}
                 {telemetry && (
                   <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-2xl flex items-center gap-3">
                         <div className="p-2 bg-emerald-500/10 rounded-lg">
                           <Compass className="w-3 h-3 text-emerald-500" />
                         </div>
                         <div>
                            <p className="text-[8px] font-black uppercase text-zinc-500 leading-none">Dist Covered</p>
                            <p className="text-xs font-mono font-bold text-zinc-200 mt-1">{telemetry.distFromHub.toFixed(2)} km</p>
                         </div>
                      </div>
                      <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-2xl flex items-center gap-3">
                         <div className="p-2 bg-orange-500/10 rounded-lg">
                           <Target className="w-3 h-3 text-orange-500" />
                         </div>
                         <div>
                            <p className="text-[8px] font-black uppercase text-zinc-500 leading-none">Terminal Range</p>
                            <p className="text-xs font-mono font-bold text-zinc-200 mt-1">{telemetry.distToTarget.toFixed(2)} km</p>
                         </div>
                      </div>
                   </div>
                 )}

                 {/* Order Card */}
                 <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-8">
                   <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
                     <div className="p-3 bg-zinc-800 rounded-2xl">
                       <Car className="w-8 h-8 text-white" />
                     </div>
                     <div>
                       <p className="text-2xl font-black uppercase tracking-tighter text-white">{currentOrder.carModel}</p>
                       <p className="text-[10px] font-mono text-zinc-500">{currentOrder.carVin}</p>
                     </div>
                   </div>
   
                   <div className="space-y-6">
                     <div className="flex gap-4">
                       <div className="flex flex-col items-center pt-1">
                         <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                         <div className="w-0.5 h-10 bg-zinc-800" />
                         <MapPin className="w-4 h-4 text-orange-500" />
                       </div>
                       <div className="flex-1 space-y-6">
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Logistic Hub Origin</p>
                             {telemetry?.isAtHub && <span className="text-[7px] bg-emerald-500/10 text-emerald-500 px-1 rounded font-bold">DOCKED</span>}
                           </div>
                           <p className="text-sm font-bold text-zinc-300">{currentOrder.origin}</p>
                         </div>
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Terminal Destination</p>
                             {telemetry?.isArriving && <span className="text-[7px] bg-orange-500/10 text-orange-500 px-1 rounded font-bold animate-pulse">ARRIVING</span>}
                           </div>
                           <p className="text-sm font-bold text-zinc-300">{currentOrder.destination}</p>
                         </div>
                       </div>
                     </div>
                   </div>
   
                   {currentOrder.status === 'assigned' && (
                     <button 
                       onClick={() => updateOrderStatus('in_transit')}
                       className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-transform active:scale-95"
                     >
                       Confirm Pickup
                     </button>
                   )}
   
                   {currentOrder.status === 'in_transit' && (
                     <button 
                       onClick={() => updateOrderStatus('delivered')}
                       className={cn(
                        "w-full h-16 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3",
                        telemetry?.isArriving 
                          ? "bg-orange-600 text-white shadow-orange-600/20" 
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
                       )}
                       disabled={!telemetry?.isArriving}
                     >
                       <CheckCircle2 className="w-5 h-5" />
                       {telemetry?.isArriving ? 'Confirm Delivery' : 'Distance Too Large'}
                     </button>
                   )}
                 </div>
   
                 {/* Client Info */}
                 <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl flex items-center justify-between">
                   <div>
                     <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-1">Customer</p>
                     <p className="text-lg font-bold text-white">{currentOrder.customerName}</p>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Protocol-1</span>
                   </div>
                 </div>
              </motion.div>
            )
          ) : activeTab === 'route' ? (
            <motion.div 
               key="route"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="h-full bg-zinc-900/30 border border-zinc-900 rounded-3xl overflow-hidden min-h-[400px]"
            >
               <MapView drivers={[driver]} orders={currentOrder ? [currentOrder] : []} missionMode={true} />
            </motion.div>
          ) : activeTab === 'manual' ? (
             <motion.div 
               key="manual"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="h-full overflow-y-auto"
             >
                <Documentation />
             </motion.div>
          ) : (
             <motion.div 
               key="fleet"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="space-y-6"
             >
                <h2 className="text-[10px] uppercase font-black tracking-[0.3em] text-orange-500">Fleet Operations</h2>
                <div className="space-y-3">
                   {fleetStatus.filter(d => d.id !== user.uid).map(other => (
                      <div key={other.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-white">
                               {other.name[0]}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white">{other.name}</p>
                               <div className="flex items-center gap-1.5">
                                 <div className={cn("w-1.5 h-1.5 rounded-full", other.status === 'available' ? 'bg-emerald-500' : other.status === 'busy' ? 'bg-orange-500' : 'bg-red-500')} />
                                 <span className="text-[8px] uppercase font-bold text-zinc-500">{other.status}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] text-zinc-600 uppercase font-black">Clearance</p>
                            <p className="text-[10px] text-zinc-400 font-mono italic">Tier {other.status === 'available' ? '1' : '2'}</p>
                         </div>
                      </div>
                   ))}
                   {fleetStatus.length <= 1 && (
                      <p className="text-center text-[10px] text-zinc-600 uppercase font-bold tracking-widest pt-8 italic">No other field agents currently active in this sector.</p>
                   )}
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <footer className="p-4 border-t border-zinc-900 bg-zinc-950 grid grid-cols-4 gap-1">
         <BottomNavItem icon={Navigation} active={activeTab === 'mission'} onClick={() => setActiveTab('mission')} label="Mission" />
         <BottomNavItem icon={MapIcon} active={activeTab === 'route'} onClick={() => setActiveTab('route')} label="Route" />
         <BottomNavItem icon={Truck} active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')} label="Fleet" />
         <BottomNavItem icon={BookOpen} active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} label="Doc" />
      </footer>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-1">{label}</p>
      <p className="text-2xl font-black text-white italic">{value}</p>
    </div>
  );
}

function BottomNavItem({ icon: Icon, active, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all",
        active ? "text-orange-500 bg-zinc-900" : "text-zinc-600 hover:text-white"
      )}>
      <Icon className="w-5 h-5" />
      <span className="text-[9px] uppercase font-black tracking-widest">{label}</span>
    </button>
  );
}
