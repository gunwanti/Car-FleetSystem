import { X, UserPlus, MapPin, Package, Clock, Truck, CheckCircle2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, Driver } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn, formatDate } from '../lib/utils';
import { useState } from 'react';

interface OrderDetailsProps {
  order: Order;
  drivers: Driver[];
  onClose: () => void;
}

export default function OrderDetails({ order, drivers, onClose }: OrderDetailsProps) {
  const [loading, setLoading] = useState(false);
  const availableDrivers = drivers.filter(d => d.status === 'available');

  const handleAssign = async (driverId: string) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        driverId,
        status: 'assigned',
        updatedAt: serverTimestamp()
      });
      // Also update driver status
      await updateDoc(doc(db, 'drivers', driverId), {
        status: 'busy',
        currentOrderId: order.id,
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="relative h-full bg-zinc-950 border-l border-zinc-900 flex flex-col"
      >
        <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-1">Order Interface</p>
            <h2 className="text-xl font-bold uppercase tracking-tight">#{order.id.slice(0, 12)}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Status Timeline */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Dispatch Progress</h3>
            <div className="relative pl-8 space-y-8">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-zinc-900" />
              
              <Step active={true} completed={true} label="Order Created" date={formatDate(order.createdAt)} icon={Package} />
              <Step active={order.status !== 'pending'} completed={order.status !== 'pending'} label="Driver Assigned" icon={UserPlus} />
              <Step active={order.status === 'in_transit' || order.status === 'delivered'} completed={order.status === 'delivered'} label="In Transit" icon={Truck} />
              <Step active={order.status === 'delivered'} completed={order.status === 'delivered'} label="Delivery Confirmed" icon={CheckCircle2} />
            </div>
          </section>

          {/* Vehicle Info */}
          <section className="p-6 bg-zinc-900/40 border border-zinc-900 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Vehicle Manifest</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Model</p>
                <p className="text-sm font-bold text-white">{order.carModel}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Identifier</p>
                <p className="text-sm font-mono text-zinc-400">{order.carVin.slice(0, 8)}...</p>
              </div>
            </div>
          </section>

          {/* Logistics */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Logistics Route</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-zinc-600 shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-600">Origin</p>
                  <p className="text-sm text-zinc-300">{order.origin}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Navigation className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-600">Destination</p>
                  <p className="text-sm text-zinc-300">{order.destination}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Driver Assignment */}
          {order.status === 'pending' && (
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-orange-500">Assign Field Operative</h3>
                <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">{availableDrivers.length} Available</span>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableDrivers.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No available drivers found in vicinity.</p>
                ) : (
                  availableDrivers.map(driver => (
                    <button 
                      key={driver.id} 
                      disabled={loading}
                      onClick={() => handleAssign(driver.id)}
                      className="w-full p-4 bg-zinc-900/60 border border-zinc-900 rounded-xl flex items-center justify-between hover:border-orange-500 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs uppercase group-hover:bg-orange-600 transition-colors">
                          {driver.name[0]}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white leading-tight">{driver.name}</p>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Authorized Driver</p>
                        </div>
                      </div>
                      <PlusIcon className="w-4 h-4 text-zinc-600 group-hover:text-white" />
                    </button>
                  ))
                )}
              </div>
            </section>
          )}

          {order.driverId && (
            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Assigned Field Agent</h3>
              <div className="p-4 bg-orange-600/10 border border-orange-500/20 rounded-xl flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-xl">
                   {drivers.find(d => d.id === order.driverId)?.name[0]}
                 </div>
                 <div>
                   <p className="font-bold text-white">{drivers.find(d => d.id === order.driverId)?.name}</p>
                   <p className="text-[10px] text-orange-500 uppercase font-black tracking-widest">Live in System</p>
                 </div>
              </div>
            </section>
          )}
        </div>
        
        <div className="p-8 border-t border-zinc-900 bg-zinc-950">
          <button 
            disabled={true} 
            className="w-full py-4 border border-zinc-800 text-zinc-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all"
          >
            Void Logistics Record
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Step({ active, completed, label, date, icon: Icon }: any) {
  return (
    <div className="flex items-start gap-6">
      <div className={cn(
        "relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2",
        completed ? "bg-orange-500 border-orange-500" : active ? "bg-zinc-950 border-orange-500" : "bg-zinc-950 border-zinc-900"
      )}>
        {completed ? <CheckCircle2 className="w-3 h-3 text-white" /> : <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-orange-500" : "bg-zinc-900")} />}
      </div>
      <div>
        <p className={cn("text-sm font-bold uppercase tracking-tight", active ? "text-white" : "text-zinc-600")}>{label}</p>
        {date && <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{date}</p>}
      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
