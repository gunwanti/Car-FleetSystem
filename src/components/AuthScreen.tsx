import { useState } from 'react';
import { Car, ShieldCheck, Truck, ArrowRight, Info, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onLogin: () => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-black overflow-x-hidden font-sans relative">
      {/* Left Pane - Branding */}
      <div className="shrink-0 md:flex-1 p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 bg-[radial-gradient(circle_at_20%_20%,#151515,black)] min-h-[50vh] md:min-h-screen">
        <div>
          <div className="flex items-center gap-2 mb-8 md:mb-12">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-600 rounded-lg flex items-center justify-center p-2">
              <Car className="text-white" />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tighter text-white">FLEETSTREAM</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.85] tracking-tighter uppercase mb-6 md:mb-8">
            Next-Gen <br />
            <span className="text-orange-600">Car Delivery</span> <br />
            Logistics.
          </h1>
          
          <p className="text-zinc-500 text-sm md:text-lg max-w-md">
            The professional choice for secure vehicle transit. Track orders, manage fleets, and assign drivers in real-time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-8 mt-8 md:mt-0">
          <div className="space-y-1 md:space-y-2">
            <ShieldCheck className="text-orange-600 w-5 h-5 md:w-6 md:h-6" />
            <h3 className="text-white font-bold uppercase text-[10px] md:text-xs tracking-widest">Real-time Safety</h3>
            <p className="text-zinc-600 text-[10px] md:text-sm">Military-grade tracking for every vehicle.</p>
          </div>
          <div className="space-y-1 md:space-y-2">
            <Truck className="text-orange-600 w-5 h-5 md:w-6 md:h-6" />
            <h3 className="text-white font-bold uppercase text-[10px] md:text-xs tracking-widest">Smart Fleet</h3>
            <p className="text-zinc-600 text-[10px] md:text-sm">Automated driver matching for max efficiency.</p>
          </div>
        </div>
      </div>

      {/* Right Pane - Login */}
      <div className="w-full md:w-[450px] flex items-center justify-center p-6 md:p-8 bg-black min-h-[40vh] md:min-h-screen relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6 md:space-y-8 bg-black/80 backdrop-blur-sm p-6 rounded-3xl md:bg-transparent md:p-0 md:rounded-none"
        >
          <div className="space-y-2">
            <p className="text-orange-500 font-black uppercase tracking-[0.3em] text-[10px]">Secure Authentication</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-none">Vehicle Dispatch <br />Terminal</h2>
            <p className="text-zinc-500 text-sm md:text-base mt-2">Log in via the secure Google portal to access your assignment dashboard. This platform facilitates real-time vehicle logistics and manifest management.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={onLogin}
              className="w-full h-16 bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-[0.98] group shadow-xl shadow-white/5"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Identify Identity
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => setShowInfo(true)}
              className="w-full flex items-center justify-center gap-2 text-zinc-600 hover:text-white transition-colors py-2 group"
            >
              <Info className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">System Documentation</span>
            </button>
          </div>

          <div className="pt-6 md:pt-8 border-t border-zinc-900">
            <p className="text-zinc-600 text-[10px] md:text-xs text-center uppercase tracking-widest leading-loose">
              By entering, you agree to our <br />
              <span className="text-zinc-400 hover:text-white cursor-pointer underline underline-offset-4">Fleet Safety Protocols</span> and <br />
              <span className="text-zinc-400 hover:text-white cursor-pointer underline underline-offset-4">Service Level Agreements</span>.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Car Animation Overlay */}
      <div className="fixed bottom-0 left-0 w-full overflow-hidden h-20 pointer-events-none opacity-20">
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="flex items-center h-full"
        >
          <div className="flex items-center gap-2 text-white">
             <div className="h-[2px] w-48 bg-gradient-to-r from-transparent to-orange-600" />
             <Car className="w-8 h-8 fill-orange-600 text-orange-600" />
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-[2rem] p-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setShowInfo(false)} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
                  <X className="w-6 h-6 text-zinc-500" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <p className="text-orange-500 font-black uppercase tracking-[0.4em] text-[10px]">Technical Briefing</p>
                  <h2 className="text-4xl font-bold tracking-tighter text-white uppercase italic">System Architecture</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 line-height-relaxed">
                  <div className="space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2 uppercase tracking-tighter">
                      <ShieldCheck className="w-4 h-4 text-orange-500" />
                      Operational Roles
                    </h3>
                    <ul className="text-zinc-500 text-sm space-y-3">
                      <li>
                        <strong className="text-zinc-300 uppercase text-[10px] block">Dispatcher (Admin)</strong>
                        Monitor the global grid, create delivery orders, and track driver locations in real-time.
                      </li>
                      <li>
                        <strong className="text-zinc-300 uppercase text-[10px] block">Operator (Driver)</strong>
                        Go online to signal availability, accept car delivery missions, and update shipment status.
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2 uppercase tracking-tighter">
                      <Navigation className="w-4 h-4 text-orange-500" />
                      Usage Protocol
                    </h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      To begin your shift, log in and toggle your <span className="text-orange-500 font-bold uppercase text-[10px]">Duty Status</span>. The terminal will automatically synchronize your GPS coordinates with the central fleet manifest. Use the <strong className="text-zinc-300">Mission Hub</strong> to track your active car assignments from pickup to arrival.
                    </p>
                  </div>
                </div>

                <div className="pt-8 border-t border-zinc-900 grid grid-cols-3 gap-4">
                   <TechTag label="Real-time Engine" value="Firestore Sync" />
                   <TechTag label="Frontend" value="React 19" />
                   <TechTag label="Security" value="OAuth 2.0" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TechTag({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[8px] uppercase font-bold text-zinc-600 tracking-widest">{label}</p>
      <p className="text-[10px] text-zinc-300 font-mono font-bold uppercase">{value}</p>
    </div>
  );
}
