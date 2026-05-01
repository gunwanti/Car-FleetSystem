import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import { BookOpen, Shield, Cpu, Zap, Activity } from 'lucide-react';

const DOC_CONTENT = `# Grid Manifest Alpha: Tactical Logistics Architecture

Grid Manifest Alpha is a high-security, real-time vehicle logistics platform designed for precision fleet management and mission-critical shipments.

## 1. Functional Architecture

The system operates on a dual-interface protocol connecting Command (HQ) with Field Agents (Drivers).

### User Roles & Workflows

#### A. Dispatcher (Admin Console)
- **Fleet Surveillance**: Real-time GPS tracking of all active assets on a C-Map Dark tactical grid.
- **Mission Initialization**: Registering new high-value vehicle shipments (Orders) with destination geocoding.
- **Resource Allocation**: Direct assignment of missions to available field agents.
- **Telemetry Monitoring**: Live distance tracking (km) showing driver proximity to both the Logistics Hub and the Terminal Destination.
- **Registry Management**: Decommissioning or onboarding field agents.

#### B. Field Agent (Driver Terminal)
- **Status Broadcast**: Toggling 'Live' status to enter the active dispatch pool.
- **Mission Acquisition**: Real-time push notifications of assigned payloads.
- **Tactical Navigation**: Integrated map routing from Hub to Terminal.
- **Arrival Detection**: proximity-locked 'Confirm Delivery' protocol (only unlocks within 500m of target).
- **Field Manual**: On-device operational guidance for protocol adherence.

---

## 2. Technical Architecture

### Stack Overview
- **Frontend**: React 18 + Vite (SPA)
- **Styling**: Tailwind CSS (Utility-first, Tactical Noir Aesthetic)
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)
- **Database/Real-time**: Firebase Firestore (NoSQL Document Store)
- **Authentication**: Firebase Authentication (Google Profile Sync)
- **Mapping**: Leaflet + React-Leaflet (CartoDB Dark Matter tiles)

### Core System Engines

| Engine | Technology | Purpose |
| :--- | :--- | :--- |
| **Sync Engine** | Firebase Snapshot Listeners | 0.5s latency sync between Dispatch and Driver terminal. |
| **Telemetry Engine** | Haversine Formula (Custom) | Real-time calculation of great-circle distance between GPS nodes. |
| **Simulation Vector** | Coordinate Interpolation | Smooth automated movement logic for demo/prototype visibility. |
| **Geofencing Logic** | Threshold Comparison | Arrival detection systems (500m logic gate). |

---

## 3. How It Works (Step-by-Step)

1. **Onboarding**: A driver joins the platform.
2. **Geofix**: Localisation services lock the driver's coordinates to the system grid.
3. **Dispatch**: Admin creates an order (e.g., Pune Hub to Mumbai Port).
4. **Lock-on**: Admin assigns the driver. The driver's tablet/terminal instantly updates via Firestore triggers.
5. **Transit**:
   - The system draws a **Tactical Vector** (Polyline) on the dispatcher's map.
   - Live telemetry updates the "Remaining Distance" every 3-5 seconds.
6. **Arrival**: Once the agent enters the "Arrival Vector" (0.5km), the Secure Delivery button activates.
7. **Audit**: Upon confirmation, the mission is moved to the permanent registry (History).

---

## 4. Business Benefits

- **Zero-Trust Transparency**: Real-time tracking eliminates "black box" transit periods.
- **Efficiency Vectors**: Automated distance calculation allows for precise ETA predictions.
- **Reduced Latency**: Direct dispatch-to-device missions bypass traditional phone/chat delays.
- **Sector Awareness**: Drivers can see other fleet members, preventing cluster-congestion in high-traffic zones.
- **Scalability**: Multi-region logistics hubs (Pune, Mumbai, Delhi) are geocoded automatically for rapid expansion.

---

## 5. System Previews

*Note: Visual representations of the tactical interface.*

### Dispatcher Command Center
![Dashboard Architecture](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000)
*Full fleet surveillance and telemetry grid.*

### Agent Field Terminal
![Driver App Interface](https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=1000)
*High-contrast mission interface for field conditions.*
`;

export default function Documentation() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-12">
        <div className="p-3 bg-orange-600 rounded-2xl shadow-lg shadow-orange-600/20">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white">SYSTEM MANUAL</h1>
          <p className="text-zinc-500 text-sm font-black uppercase tracking-[0.3em]">Grid Manifest Alpha / Docs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
        <QuickLink icon={Shield} title="Security" desc="Protocols & Rules" />
        <QuickLink icon={Cpu} title="Architecture" desc="System Core" />
        <QuickLink icon={Zap} title="Workflow" desc="Logic Gates" />
        <QuickLink icon={Activity} title="Telemetry" desc="Live Mapping" />
      </div>

      <div className="prose prose-invert prose-zinc max-w-none 
        prose-headings:font-black prose-headings:italic prose-headings:tracking-tight
        prose-h1:text-5xl prose-h1:mb-12
        prose-h2:text-2xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:text-orange-500
        prose-h3:text-lg prose-h3:mt-8 prose-h3:text-zinc-200
        prose-p:text-zinc-400 prose-p:leading-relaxed
        prose-li:text-zinc-400
        prose-hr:border-zinc-800
        prose-table:border prose-table:border-zinc-800
        prose-th:bg-zinc-900 prose-th:p-4 prose-th:text-zinc-300
        prose-td:p-4 prose-td:border-t prose-td:border-zinc-800
        prose-img:rounded-3xl prose-img:border prose-img:border-zinc-800 prose-img:shadow-2xl
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {DOC_CONTENT}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}

function QuickLink({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl hover:border-zinc-700 transition-colors group">
      <Icon className="w-6 h-6 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
      <h3 className="font-bold text-zinc-100">{title}</h3>
      <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mt-1">{desc}</p>
    </div>
  );
}
