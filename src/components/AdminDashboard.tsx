import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, Driver } from '../types';
import { 
  Package, 
  Users, 
  Navigation, 
  Plus, 
  Search, 
  Radio, 
  Map as MapIcon, 
  Settings,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Menu,
  LogOut,
  Trash2
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import OrderForm from './OrderForm';
import MapView from './MapView';
import OrderDetails from './OrderDetails';

interface AdminDashboardProps {
  user: User;
  onSimulateDriver: () => void;
}

type Tab = 'orders' | 'drivers' | 'map';

export default function AdminDashboard({ user, onSimulateDriver }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
    });

    const qDrivers = query(collection(db, 'drivers'));
    const unsubDrivers = onSnapshot(qDrivers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
      setDrivers(data);
    });

    return () => {
      unsubOrders();
      unsubDrivers();
    };
  }, []);

  const handleDeleteDriver = async (driverId: string, driverName: string) => {
    if (window.confirm(`Are you sure you want to decommission Agent ${driverName}? This will remove all field clearance records.`)) {
      try {
        await deleteDoc(doc(db, 'drivers', driverId));
      } catch (error) {
        console.error("Error decommissioning driver:", error);
        alert("Failed to remove agent from registry.");
      }
    }
  };

  const stats = [
    { label: 'Active Orders', value: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length, icon: Package, color: 'text-orange-500' },
    { label: 'Drivers', value: drivers.filter(d => d.status === 'available').length, icon: Users, color: 'text-emerald-500' },
    { label: 'Completed', value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle2, color: 'text-blue-500' },
  ];

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-full overflow-hidden bg-zinc-950 flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden h-20 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 bg-zinc-950 relative overflow-hidden">
        {/* Porsche Animation Background (Mobile) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
          <motion.div
            animate={{ x: ['110%', '-110%'] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
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
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
              <Package className="text-white w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-tighter text-sm uppercase text-white leading-none">FleetStream</span>
              <span className="text-[8px] uppercase font-bold text-orange-500 tracking-[0.2em]">Enterprise</span>
            </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={() => auth.signOut()} 
            className="p-3 bg-zinc-900 rounded-xl text-zinc-400 hover:text-red-500 transition-all active:scale-95 flex items-center gap-2 px-4"
            title="Switch Account"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Switch</span>
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-3 bg-zinc-900 rounded-xl text-white active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-0 z-40 md:relative md:flex w-full md:w-64 border-r border-zinc-900 flex-col p-4 bg-zinc-950 transition-transform duration-300",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="hidden md:flex items-center gap-3 px-3 mb-10">
          <div className="w-10 h-10 bg-orange-600 rounded flex items-center justify-center shrink-0">
            <Package className="text-white w-6 h-6" />
          </div>
          <span className="font-bold tracking-tighter text-lg uppercase">FleetStream</span>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem 
            active={activeTab === 'orders'} 
            onClick={() => handleTabClick('orders')} 
            icon={Package} 
            label="Orders" 
          />
          <NavItem 
            active={activeTab === 'drivers'} 
            onClick={() => handleTabClick('drivers')} 
            icon={Users} 
            label="Drivers" 
          />
          <NavItem 
            active={activeTab === 'map'} 
            onClick={() => handleTabClick('map')} 
            icon={MapIcon} 
            label="Live Map" 
          />

          <div className="pt-8 px-3">
             <button 
                onClick={onSimulateDriver}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-orange-500/50 group"
             >
               <Navigation className="w-5 h-5 group-hover:rotate-12 transition-transform" />
               <div className="text-left">
                 <p className="text-[10px] font-black uppercase tracking-widest leading-none">Simulation</p>
                 <p className="text-[8px] text-zinc-500 uppercase font-bold mt-1">Driver Portal View</p>
               </div>
             </button>
          </div>
        </nav>

        <div className="pt-4 space-y-2">
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-zinc-500 hover:bg-zinc-900 hover:text-white group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Switch Account</span>
          </button>

          <div className="pt-4 border-t border-zinc-900">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center uppercase font-bold text-xs shrink-0 text-white">
                {user.email?.[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate text-zinc-100">{user.email}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold text-left">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="hidden md:flex h-20 border-b border-zinc-900 items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md relative overflow-hidden">
          {/* Porsche Animation Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
            <motion.div
              animate={{ x: ['110%', '-110%'] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="h-full flex items-center"
            >
              <svg className="h-10 w-auto" viewBox="0 0 120 40" fill="currentColor">
                <path d="M10,30 L15,25 Q25,10 50,12 L85,15 Q110,18 115,30 Z" />
                <path d="M115,30 L118,34 L2,34 L5,30 Z" />
                <circle cx="28" cy="34" r="5" fill="black" stroke="white" strokeWidth="1" />
                <circle cx="92" cy="34" r="5" fill="black" stroke="white" strokeWidth="1" />
              </svg>
            </motion.div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <h1 className="text-xl font-bold tracking-tight capitalize">{activeTab}</h1>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">System Live</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-zinc-900 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-orange-500 w-64"
              />
            </div>
            <button 
              onClick={() => setShowOrderForm(true)}
              className="bg-white text-black font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Order
            </button>
          </div>
        </header>

        {/* Mobile Sub-Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-900/20">
           <h1 className="text-sm font-black uppercase tracking-[0.2em]">{activeTab}</h1>
           <button 
              onClick={() => setShowOrderForm(true)}
              className="bg-orange-600 text-white p-2 rounded-lg"
           >
             <Plus className="w-4 h-4" />
           </button>
        </div>

        {/* Dash Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/40 border border-zinc-900 p-4 md:p-6 rounded-2xl flex items-center gap-4 group hover:border-zinc-700 transition-colors"
              >
                <div className={cn("p-3 md:p-4 rounded-xl bg-zinc-900 group-hover:scale-110 transition-transform", stat.color)}>
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-0.5">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-black">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Active Tab View */}
          <AnimatePresence mode="wait">
            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">Recent Deliveries</h2>
                </div>

                <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl overflow-hidden">
                  {/* Desktop Table */}
                  <table className="w-full text-left hidden lg:table">
                    <thead className="bg-zinc-900/50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-500 tracking-widest italic">Order ID</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-500 tracking-widest italic">Vehicle</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-500 tracking-widest italic">Route</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-500 tracking-widest italic">Driver</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-500 tracking-widest italic">Status</th>
                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-zinc-500 tracking-widest italic text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 italic">No orders found. System ready for dispatch.</td>
                        </tr>
                      ) : (
                        orders.map((order) => (
                          <tr 
                            key={order.id} 
                            className="hover:bg-zinc-900/40 transition-colors cursor-pointer group"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <td className="px-6 py-4 font-mono text-xs text-orange-500">#{order.id.slice(0, 8)}</td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold">{order.carModel}</p>
                              <p className="text-[10px] text-zinc-500 font-mono">{order.carVin}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm">{order.origin}</p>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">to {order.destination}</p>
                            </td>
                            <td className="px-6 py-4">
                              <DriverAvatar driver={drivers.find(d => d.id === order.driverId)} />
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="px-6 py-4 text-right text-xs text-zinc-500">
                              {formatDate(order.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Mobile Grid */}
                  <div className="lg:hidden divide-y divide-zinc-900">
                    {orders.length === 0 ? (
                      <div className="p-12 text-center text-zinc-600 italic">No orders found.</div>
                    ) : (
                      orders.map((order) => (
                        <div 
                          key={order.id} 
                          className="p-4 space-y-4 active:bg-zinc-900 transition-colors"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-white">{order.carModel}</p>
                              <p className="text-[10px] text-zinc-500 font-mono">#{order.id.slice(0, 8)}</p>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                             <div>
                               <p className="text-zinc-600 font-black uppercase text-[8px] tracking-widest mb-1">Route</p>
                               <p className="truncate text-zinc-300">{order.origin} → {order.destination}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-zinc-600 font-black uppercase text-[8px] tracking-widest mb-1">Assigned To</p>
                               <div className="flex justify-end">
                                 <DriverAvatar driver={drivers.find(d => d.id === order.driverId)} size="xs" />
                               </div>
                             </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'drivers' && (
              <motion.div 
                key="drivers"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {drivers.map(driver => (
                  <div key={driver.id} className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 hover:border-zinc-700 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-xl group-hover:bg-orange-600 transition-colors">
                        {driver.name[0]}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={cn(
                          "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                          driver.status === 'available' ? "bg-emerald-500/10 text-emerald-500" : 
                          driver.status === 'busy' ? "bg-orange-500/10 text-orange-500" : "bg-zinc-500/10 text-zinc-500"
                        )}>
                          {driver.status}
                        </div>
                        <button 
                          onClick={() => handleDeleteDriver(driver.id, driver.name)}
                          className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Decommission Agent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{driver.name}</h3>
                    <p className="text-xs text-zinc-500 mb-4">{driver.email}</p>
                    
                    <div className="space-y-3 pt-4 border-t border-zinc-900/50">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                        <span>Current Order</span>
                        <span className="text-zinc-300">{driver.currentOrderId ? `HID-330-${driver.currentOrderId.slice(0,4)}` : 'None'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                        <span>Location</span>
                        <span className="text-zinc-300">{driver.location.lat.toFixed(4)}, {driver.location.lng.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'map' && (
              <div className="h-[600px] bg-zinc-900/30 border border-zinc-900 rounded-3xl overflow-hidden relative">
                <MapView drivers={drivers} orders={orders} />
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Slide Overs */}
      <AnimatePresence>
        {showOrderForm && (
          <OrderForm onClose={() => setShowOrderForm(false)} />
        )}
        {selectedOrder && (
          <OrderDetails 
            order={selectedOrder} 
            drivers={drivers} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
        active ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-zinc-500 hover:text-white hover:bg-zinc-900"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-white" : "group-hover:scale-110 transition-transform")} />
      <span className="hidden md:block text-xs font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function DriverAvatar({ driver, size = 'sm' }: { driver?: Driver, size?: 'xs' | 'sm' }) {
  if (!driver) return <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Unassigned</span>;

  const sizeClasses = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-6 h-6 text-[10px]'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("rounded-full bg-orange-600 flex items-center justify-center font-bold text-white", sizeClasses[size])}>
        {driver.name[0]}
      </div>
      <span className={cn("font-medium", size === 'xs' ? 'text-xs' : 'text-sm')}>{driver.name}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-zinc-100 text-zinc-900',
    assigned: 'bg-blue-500 text-white',
    in_transit: 'bg-orange-500 text-white',
    delivered: 'bg-emerald-500 text-white',
    cancelled: 'bg-red-500 text-white',
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
      styles[status as keyof typeof styles]
    )}>
      {status.replace('_', ' ')}
    </span>
  );
}
