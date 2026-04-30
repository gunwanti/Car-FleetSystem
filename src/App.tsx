import { useState, useEffect } from 'react';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { UserProfile, Order, Driver } from './types';
import AdminDashboard from './components/AdminDashboard';
import DriverApp from './components/DriverApp';
import AuthScreen from './components/AuthScreen';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
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
               updatedAt: new Date()
             });
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
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
