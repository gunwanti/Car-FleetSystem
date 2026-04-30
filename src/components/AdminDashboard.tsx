import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
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
  AlertCircle
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import OrderForm from './OrderForm';
import MapView from './MapView';
import OrderDetails from './OrderDetails';

interface AdminDashboardProps {
  user: User;
}

type Tab = 'orders' | 'drivers' | 'map';

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const stats = [
    { label: 'Active Orders', value: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length, icon: Package, color: 'text-orange-500' },
    { label: 'Available Drivers', value: drivers.filter(d => d.status === 'available').length, icon: Users, color: 'text-emerald-500' },
    { label: 'Completed Today', value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle2, color: 'text-blue-500' },
  ];

  return (
    <div className="flex h-full overflow-hidden bg-zinc-950">
      {/* Sidebar */}
      <div className="w-20 md:w-64 border-r border-zinc-900 flex flex-col p-4 bg-zinc-950">
        <div className="flex items-center gap-3 px-3 mb-10">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-600 rounded flex items-center justify-center shrink-0">
            <Package className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="hidden md:block font-bold tracking-tighter text-lg uppercase">FleetStream</span>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')} 
            icon={Package} 
            label="Orders" 
          />
          <NavItem 
            active={activeTab === 'drivers'} 
            onClick={() => setActiveTab('drivers')} 
            icon={Users} 
            label="Drivers" 
          />
          <NavItem 
            active={activeTab === 'map'} 
            onClick={() => setActiveTab('map')} 
            icon={MapIcon} 
            label="Live Map" 
          />
          <NavItem 
            active={false} 
            onClick={() => {}} 
            icon={Settings} 
            label="System Settings" 
          />
        </nav>

        <div className="pt-4 border-t border-zinc-900 mt-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center uppercase font-bold text-xs">
              {user.email?.[0]}
            </div>
            <div className="hidden md:block overflow-hidden">
              <p className="text-xs font-bold truncate">{user.email}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight capitalize">{activeTab}</h1>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-full">
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
            <button className="p-2 hover:bg-zinc-900 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </button>
            <button 
              onClick={() => setShowOrderForm(true)}
              className="bg-white text-black font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Order
            </button>
          </div>
        </header>

        {/* Dash Scroll Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/40 border border-zinc-900 p-6 rounded-2xl flex items-center gap-4 group hover:border-zinc-700 transition-colors"
              >
                <div className={cn("p-4 rounded-xl bg-zinc-900 group-hover:scale-110 transition-transform", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
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
                  <div className="flex gap-2">
                    {['all', 'pending', 'in_transit', 'delivered'].map(f => (
                      <button key={f} className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 hover:bg-zinc-900 rounded-md transition-colors text-zinc-500 hover:text-white">
                        {f.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
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
                              {order.driverId ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-bold">
                                    {drivers.find(d => d.id === order.driverId)?.name[0]}
                                  </div>
                                  <span className="text-sm font-medium">{drivers.find(d => d.id === order.driverId)?.name}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Unassigned</span>
                              )}
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
                  <div key={driver.id} className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 hover:border-zinc-700 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-xl group-hover:bg-orange-600 transition-colors">
                        {driver.name[0]}
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                        driver.status === 'available' ? "bg-emerald-500/10 text-emerald-500" : 
                        driver.status === 'busy' ? "bg-orange-500/10 text-orange-500" : "bg-zinc-500/10 text-zinc-500"
                      )}>
                        {driver.status}
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
