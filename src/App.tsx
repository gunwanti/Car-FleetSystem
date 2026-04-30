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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (u) {
          // Fetch or create profile
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Default role is driver unless it's the admin email
            const isAdmin = u.email === 'gunvanticareer@gmail.com';
            const newProfile: UserProfile = {
              id: u.uid,
              role: isAdmin ? 'admin' : 'driver',
              email: u.email || '',
            };
            await setDoc(doc(db, 'users', u.uid), newProfile);
            setProfile(newProfile);
            
            // If driver, also create driver doc
            if (!isAdmin) {
               await setDoc(doc(db, 'drivers', u.uid), {
                 name: u.displayName || 'Unnamed Driver',
                 email: u.email || '',
                 status: 'offline',
                 location: { lat: 0, lng: 0 },
                 updatedAt: serverTimestamp()
               });
            }
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth System Error:", err);
        setError("Synchronization failure. Please ensure enterprise access permissions.");
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

  if (!user || !profile) {
    return <AuthScreen onLogin={signInWithGoogle} />;
  }

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {profile.role === 'admin' ? (
        <AdminDashboard user={user} />
      ) : (
        <DriverApp user={user} />
      )}
    </div>
  );
}
