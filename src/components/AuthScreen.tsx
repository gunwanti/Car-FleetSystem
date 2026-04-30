import { Car, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onLogin: () => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-black overflow-hidden font-sans">
      {/* Left Pane - Branding */}
      <div className="flex-1 p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 bg-[radial-gradient(circle_at_20%_20%,#151515,black)]">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center p-2">
              <Car className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">FLEETSTREAM</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter uppercase mb-8">
            Next-Gen <br />
            <span className="text-orange-600">Car Delivery</span> <br />
            Logistics.
          </h1>
          
          <p className="text-zinc-500 text-lg max-w-md">
            The professional choice for secure vehicle transit. Track orders, manage fleets, and assign drivers in real-time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <ShieldCheck className="text-orange-600 w-6 h-6" />
            <h3 className="text-white font-bold uppercase text-xs tracking-widest">Real-time Safety</h3>
            <p className="text-zinc-600 text-sm">Military-grade tracking for every vehicle.</p>
          </div>
          <div className="space-y-2">
            <Truck className="text-orange-600 w-6 h-6" />
            <h3 className="text-white font-bold uppercase text-xs tracking-widest">Smart Fleet</h3>
            <p className="text-zinc-600 text-sm">Automated driver matching for max efficiency.</p>
          </div>
        </div>
      </div>

      {/* Right Pane - Login */}
      <div className="w-full md:w-[450px] flex items-center justify-center p-8 bg-black">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Access Dashboard</h2>
            <p className="text-zinc-500">Sign in with your enterprise credentials to continue.</p>
          </div>

          <button
            onClick={onLogin}
            className="w-full h-14 bg-white text-black font-bold rounded-full flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors group"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="pt-8 border-t border-zinc-900">
            <p className="text-zinc-600 text-xs text-center uppercase tracking-widest leading-loose">
              By entering, you agree to our <br />
              <span className="text-zinc-400 hover:text-white cursor-pointer underline underline-offset-4">Fleet Safety Protocols</span> and <br />
              <span className="text-zinc-400 hover:text-white cursor-pointer underline underline-offset-4">Service Level Agreements</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
