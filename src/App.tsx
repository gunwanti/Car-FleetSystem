import { useState, useEffect } from 'react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { UserProfile, Order, Driver } from './types';
import AdminDashboard from './components/AdminDashboard';
import DriverApp from './components/DriverApp';
import AuthScreen from './components/AuthScreen';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulatingDriver, setIsSimulatingDriver] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        setError(null);
        if (u) {
          setUser(u);
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            setProfile(profileData);
            
            // Check if driver supplemental profile exists
            const driverDoc = await getDoc(doc(db, 'drivers', u.uid));
            if (!driverDoc.exists()) {
               await setDoc(doc(db, 'drivers', u.uid), {
                 name: u.displayName || 'Unnamed User',
                 email: u.email || '',
                 status: 'offline',
                 location: { lat: 34.0522, lng: -118.2437 }, // Default to LA for demo stability
                 updatedAt: serverTimestamp()
               });
            }
          } else {
            // Default role is driver unless it's the admin email
            const isAdminEmail = u.email === 'gunvanticareer@gmail.com';
            const newProfile: UserProfile = {
              id: u.uid,
              role: isAdminEmail ? 'admin' : 'driver',
              email: u.email || '',
            };
            
            // USE BATCH TO CREATE BOTH AT ONCE
            const { writeBatch } = await import('firebase/firestore');
            const batch = writeBatch(db);
            
            batch.set(doc(db, 'users', u.uid), newProfile);
            
            batch.set(doc(db, 'drivers', u.uid), {
                name: u.displayName || 'Unnamed User',
                email: u.email || '',
                status: 'offline',
                location: { lat: 34.0522, lng: -118.2437 },
                updatedAt: serverTimestamp()
            });
            
            await batch.commit();
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
          setIsSimulatingDriver(false);
          setUser(null);
        }
      } catch (err: any) {
        console.error("Critical Auth System Error:", err);
        const code = err?.code || 'unknown';
        const msg = err?.message || 'No detail provided';
        
        if (code === 'permission-denied' || msg.includes('permission')) {
          setError(`Security Fault: Authentication confirmed but terminal access was rejected by the cloud firewall. Code: ${code}. Message: ${msg}`);
        } else {
          setError(`Core Synchronization Fault: The fleet terminal connection failed. Code: ${code}. Message: ${msg}`);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500 font-sans">Syncing Hub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white p-8 text-center font-sans">
        <div className="max-w-sm space-y-4">
          <p className="text-red-500 font-bold uppercase tracking-widest text-xs">Security Fault</p>
          <p className="text-zinc-400 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white text-black text-xs font-bold uppercase rounded-lg"
          >
            Reconnect Terminal
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={signInWithGoogle} />;
  }

  if (!profile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500 font-sans">Authorizing Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {(profile.role === 'admin' && !isSimulatingDriver) ? (
        <AdminDashboard user={user} onSimulateDriver={() => setIsSimulatingDriver(true)} />
      ) : (
        <DriverApp 
          user={user} 
          isSimulating={profile.role === 'admin'} 
          onExitSimulation={() => setIsSimulatingDriver(false)} 
        />
      )}
    </div>
  );
}
