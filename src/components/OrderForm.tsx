import React, { useState } from 'react';
import { X, Plus, Car, MapPin, DollarSign, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface OrderFormProps {
  onClose: () => void;
}

export default function OrderForm({ onClose }: OrderFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    carModel: '',
    carVin: '',
    origin: '',
    destination: '',
    price: 450,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Get current location to offset for destination demo
      let lat = 34.0522;
      let lng = -118.2437;
      
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      await addDoc(collection(db, 'orders'), {
        ...formData,
        status: 'pending',
        driverId: null,
        dropoff: {
          lat: lat + (Math.random() - 0.5) * 0.05, 
          lng: lng + (Math.random() - 0.5) * 0.05,
          address: formData.destination
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-zinc-900 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Initialize Delivery</h2>
            <p className="text-zinc-500 text-sm">Fill in the order details to begin the dispatch process.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <InputGroup 
              label="Customer Name" 
              icon={Plus} 
              value={formData.customerName}
              onChange={v => setFormData({ ...formData, customerName: v })}
              placeholder="Elon Musk"
            />
            <InputGroup 
              label="Vehicle Model" 
              icon={Car} 
              value={formData.carModel}
              onChange={v => setFormData({ ...formData, carModel: v })}
              placeholder="Tesla Model S Plaid"
            />
          </div>

          <InputGroup 
            label="Vehicle VIN" 
            icon={ShieldCheck} 
            value={formData.carVin}
            onChange={v => setFormData({ ...formData, carVin: v })}
            placeholder="5YJ3E1EAXJF..."
            fontMono
          />

          <div className="grid grid-cols-2 gap-6">
            <InputGroup 
              label="Origin Address" 
              icon={MapPin} 
              value={formData.origin}
              onChange={v => setFormData({ ...formData, origin: v })}
              placeholder="Fremont Factory, CA"
            />
            <InputGroup 
              label="Destination Address" 
              icon={MapPin} 
              value={formData.destination}
              onChange={v => setFormData({ ...formData, destination: v })}
              placeholder="Starbase, TX"
            />
          </div>

          <div className="p-6 bg-zinc-900/50 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-500" />
              </div>
              <span className="font-bold text-sm uppercase tracking-widest text-zinc-400">Estimated Quote</span>
            </div>
            <span className="text-3xl font-black text-white">${formData.price}</span>
          </div>

          <button 
            disabled={loading}
            className="w-full h-14 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-orange-600/20 transition-all"
          >
            {loading ? 'Processing...' : 'Deploy Global Dispatch'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function InputGroup({ label, icon: Icon, value, onChange, placeholder, fontMono }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 flex items-center gap-2">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      <input 
        type="text" 
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className={cn(
          "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 placeholder:text-zinc-700 focus:border-orange-500 focus:ring-0 transition-colors",
          fontMono && "font-mono text-xs"
        )}
      />
    </div>
  );
}
