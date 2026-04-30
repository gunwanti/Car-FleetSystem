import { useState, useEffect } from 'react';
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
  Map as MapIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';

interface DriverAppProps {
  user: User;
}

export default function DriverApp({ user }: DriverAppProps) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubDriver = onSnapshot(doc(db, 'drivers', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const dData = { id: snapshot.id, ...snapshot.data() } as Driver;
        setDriver(dData);
        
        if (dData.currentOrderId) {
          onSnapshot(doc(db, 'orders', dData.currentOrderId), (orderSnap) => {
             if (orderSnap.exists()) {
               setCurrentOrder({ id: orderSnap.id, ...orderSnap.data() } as Order);
             }
          });
        } else {
          setCurrentOrder(null);
        }
      }
      setLoading(false);
    });

    return () => unsubDriver();
  }, [user.uid]);

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

  if (loading || !driver) return null;

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
            <svg className="h-8 w-auto" viewBox="0 0 100 30">
              <path fill="orange" d="M10,20 Q10,10 30,10 L70,10 Q90,10 90,20 L95,25 L5,25 Z" />
              <circle cx="25" cy="25" r="4" fill="orange" />
              <circle cx="75" cy="25" r="4" fill="orange" />
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
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-all active:scale-95 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button 
            onClick={toggleStatus}
            className={cn(
              "p-3 rounded-xl transition-all shadow-lg active:scale-95",
              driver.status === 'offline' ? "bg-emerald-600/10 text-emerald-500 shadow-emerald-500/5" : "bg-red-600/10 text-red-500 shadow-red-500/5"
            )}
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <StatBox label="Deliveries" value="12" />
        <StatBox label="Rating" value="4.9" />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!currentOrder ? (
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
                <h3 className="text-xl font-bold uppercase tracking-tighter">Locating Shipments</h3>
                <p className="text-zinc-500 text-sm max-w-[200px]">Scanning regional hub for new vehicle delivery orders...</p>
              </div>
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

               {/* Order Card */}
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-8">
                 <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
                   <div className="p-3 bg-zinc-800 rounded-2xl">
                     <Car className="w-8 h-8 text-white" />
                   </div>
                   <div>
                     <p className="text-2xl font-black uppercase tracking-tighter">{currentOrder.carModel}</p>
                     <p className="text-[10px] font-mono text-zinc-500">{currentOrder.carVin}</p>
                   </div>
                 </div>

                 <div className="space-y-6">
                   <div className="flex gap-4">
                     <div className="flex flex-col items-center pt-1">
                       <div className="w-3 h-3 bg-zinc-800 rounded-full border-2 border-zinc-700" />
                       <div className="w-0.5 h-10 bg-zinc-800" />
                       <MapPin className="w-4 h-4 text-orange-500" />
                     </div>
                     <div className="flex-1 space-y-6">
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Pickup Information</p>
                         <p className="text-sm font-bold text-zinc-300">{currentOrder.origin}</p>
                       </div>
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Destination Logistics</p>
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
                     className="w-full h-16 bg-orange-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-600/20 transition-transform active:scale-95 flex items-center justify-center gap-3"
                   >
                     <CheckCircle2 className="w-5 h-5" />
                     Confirm Delivery
                   </button>
                 )}
               </div>

               {/* Client Info */}
               <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl flex items-center justify-between">
                 <div>
                   <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-1">Customer</p>
                   <p className="text-lg font-bold">{currentOrder.customerName}</p>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Protocol-1</span>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <footer className="p-4 border-t border-zinc-900 bg-zinc-950 grid grid-cols-3 gap-2">
         <BottomNavItem icon={Navigation} active label="Mission" />
         <BottomNavItem icon={MapIcon} label="Route" />
         <BottomNavItem icon={Truck} label="Fleet" />
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

function BottomNavItem({ icon: Icon, active, label }: any) {
  return (
    <button className={cn(
      "flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all",
      active ? "text-orange-500 bg-zinc-900" : "text-zinc-600 hover:text-white"
    )}>
      <Icon className="w-5 h-5" />
      <span className="text-[9px] uppercase font-black tracking-widest">{label}</span>
    </button>
  );
}
