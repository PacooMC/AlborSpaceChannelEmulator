import React from 'react';
import { HardDrive, Cpu, MemoryStick, KeyRound, GitBranch, RotateCcw, Power, Activity, Wifi, Server, Network, Thermometer, ShieldCheck, Database, Circle } from 'lucide-react'; // Added Circle

// --- Helper Components ---

// Info Item with Progress Bar (No changes needed here)
const InfoItem: React.FC<{ icon: React.ElementType; label: string; value: string | React.ReactNode; progress?: number | null; }> = ({ icon: Icon, label, value, progress }) => (
  <div className="py-2 border-b border-albor-bg-dark/50 last:border-b-0">
    <div className="flex items-center space-x-2 mb-1">
      <Icon className="text-albor-dark-gray" size={16} />
      <span className="text-sm text-albor-dark-gray w-32 flex-shrink-0">{label}:</span>
      <span className="text-sm text-albor-light-gray font-medium truncate flex-1">{value}</span>
    </div>
    {progress !== undefined && progress !== null && (
      <div className="w-full bg-albor-deep-space rounded-full h-1.5 mt-1">
        <div
          // Use accent color for progress, but keep warning/error colors
          className={`h-1.5 rounded-full ${progress > 85 ? 'bg-red-500' : progress > 60 ? 'bg-yellow-500' : 'bg-albor-orange'}`} // Changed green to albor-orange
          style={{ width: `${progress}%` }}
          title={`${progress}% Used`}
        ></div>
      </div>
    )}
  </div>
);

// --- V2: Enhanced Status Indicator with Palette Colors ---
const StatusIndicatorV2: React.FC<{ label: string; status: 'ok' | 'warning' | 'error' | 'unknown'; icon: React.ElementType; detail?: string; }> = ({ label, status, icon: Icon, detail }) => {
  const statusInfo = {
    // Changed 'ok' to use blue
    ok: { text: 'Operational', color: 'text-blue-400', bgColor: 'bg-blue-500', ring: 'ring-blue-500/50' },
    // Changed 'warning' to use orange
    warning: { text: 'Warning', color: 'text-albor-orange', bgColor: 'bg-albor-orange', ring: 'ring-albor-orange/50' },
    error: { text: 'Error', color: 'text-red-400', bgColor: 'bg-red-500', ring: 'ring-red-500/50' }, // Keep red
    unknown: { text: 'Unknown', color: 'text-albor-dark-gray', bgColor: 'bg-albor-dark-gray', ring: 'ring-albor-dark-gray/50' }, // Keep gray
  }[status];

  return (
    <div className={`flex items-center space-x-3 p-3 rounded border border-albor-bg-dark bg-albor-deep-space/50 transition-colors hover:bg-albor-deep-space/80 ring-1 ${statusInfo.ring}`}>
       {/* Status Dot */}
       <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.bgColor}`} title={statusInfo.text}></div>
       {/* Icon */}
       <Icon size={20} className={`${statusInfo.color} flex-shrink-0`} />
       {/* Text */}
       <div className="flex-1 min-w-0">
         <div className="text-sm font-medium text-albor-light-gray truncate">{label}</div>
         {detail && <div className="text-xs text-albor-dark-gray truncate">{detail}</div>}
       </div>
       {/* Status Text (Optional or different style) */}
       {/* <span className={`text-xs font-semibold ${statusInfo.color}`}>{statusInfo.text}</span> */}
    </div>
  );
};

// Card Component (No changes needed here)
const SystemCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string }> = ({ title, icon: Icon, children, className = "" }) => (
    <div className={`bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex flex-col ${className}`}>
        <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-albor-dark-gray/50 flex-shrink-0">
            <Icon className="text-albor-orange" size={18} />
            <h2 className="text-base font-semibold text-albor-light-gray">{title}</h2>
        </div>
        <div className="flex-1 space-y-3">
            {children}
        </div>
    </div>
);


const SystemManagementView: React.FC = () => {

  const handleAction = (action: string) => {
    if (action === 'restart' || action === 'shutdown') {
      if (window.confirm(`Are you sure you want to ${action} the system?`)) {
        console.log(`Action: ${action} confirmed`);
        alert(`Simulating system ${action}...`);
      } else {
        console.log(`Action: ${action} cancelled`);
      }
    } else {
      console.log(`Action: ${action}`);
      alert(`Simulating action: ${action}...`);
    }
  };

  // Placeholder usage values
  const cpuUsage = 72;
  const ramUsage = 15.6 / 32.0 * 100; // Calculate percentage
  const diskUsage = 450.2 / 1000 * 100; // Calculate percentage

  return (
    <div className="text-white">
      <h1 className="text-xl font-semibold mb-4 pb-2 border-b border-albor-bg-dark/50">System Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* System Information Card */}
        <SystemCard title="System Information" icon={HardDrive} className="lg:col-span-2">
          {/* InfoItems remain the same, progress bar uses orange now */}
          <InfoItem icon={HardDrive} label="Operating System" value="AlborOS v2.1 (Linux 5.15)" />
          <InfoItem icon={Cpu} label="Processor" value="Virtual CPU @ 3.0GHz (4 Cores)" progress={cpuUsage} />
          <InfoItem icon={MemoryStick} label="Memory (RAM)" value={`${ramUsage.toFixed(1)}% (${(ramUsage * 32 / 100).toFixed(1)} / 32.0 GB)`} progress={ramUsage} />
          <InfoItem icon={Database} label="Disk Usage" value={`${diskUsage.toFixed(1)}% (${(diskUsage * 1000 / 100).toFixed(1)} GB / 1 TB)`} progress={diskUsage} />
          <InfoItem icon={KeyRound} label="License Status" value={<span className="text-green-400 font-medium">Active Pro (Expires: 2025-12-31)</span>} /> {/* Keep green for license ok */}
          <InfoItem icon={GitBranch} label="Software Version" value="v1.2.5-beta" />
          <InfoItem icon={ShieldCheck} label="Security Status" value={<span className="text-green-400">Protected</span>} /> {/* Keep green for security ok */}
        </SystemCard>

        {/* Hardware Status Card - Using V2 Indicator with updated colors */}
        <SystemCard title="Hardware Status" icon={Server}>
          <div className="space-y-2">
            <StatusIndicatorV2 label="SDR Interface 1" status="ok" icon={Server} detail="Ettus X310" />
            <StatusIndicatorV2 label="SDR Interface 2" status="warning" icon={Server} detail="NI USRP-2974 (Temp High)" />
            <StatusIndicatorV2 label="Network Uplink" status="ok" icon={Network} detail="10 Gbps Fiber" />
            <StatusIndicatorV2 label="System Temperature" status="ok" icon={Thermometer} detail="45°C" />
            <StatusIndicatorV2 label="Backup Power" status="error" icon={Power} detail="Battery Fault" />
          </div>
        </SystemCard>

        {/* Actions Card - Refined Layout & Colors */}
        <SystemCard title="System Actions" icon={Activity} className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Check Updates - Orange */}
            <button onClick={() => handleAction('check_updates')} className="flex items-center justify-start space-x-3 p-3 rounded text-sm bg-albor-orange hover:bg-albor-orange/80 text-white transition-colors h-16 border border-albor-orange/50">
              <GitBranch size={20} />
              <span>Check Updates</span>
            </button>
            {/* Diagnostics - Dark with Orange Hover */}
            <button onClick={() => handleAction('run_diagnostics')} className="flex items-center justify-start space-x-3 p-3 rounded text-sm bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors border border-albor-dark-gray hover:border-albor-orange hover:text-albor-orange h-16 group">
              <Activity size={20} className="text-albor-dark-gray group-hover:text-albor-orange transition-colors" />
              <span>Run Diagnostics</span>
            </button>
            {/* Connectivity - Dark with Orange Hover */}
             <button onClick={() => handleAction('check_connectivity')} className="flex items-center justify-start space-x-3 p-3 rounded text-sm bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors border border-albor-dark-gray hover:border-albor-orange hover:text-albor-orange h-16 group">
              <Wifi size={20} className="text-albor-dark-gray group-hover:text-albor-orange transition-colors" />
              <span>Check Connectivity</span>
            </button>
            {/* Restart - Gray */}
             <button onClick={() => handleAction('restart')} className="flex items-center justify-start space-x-3 p-3 rounded text-sm bg-albor-dark-gray hover:bg-gray-500 text-albor-light-gray transition-colors h-16 border border-gray-600">
                <RotateCcw size={20} />
                <span>Restart System</span>
              </button>
            {/* Shutdown - Red */}
             <button onClick={() => handleAction('shutdown')} className="flex items-center justify-start space-x-3 p-3 rounded text-sm bg-red-600 hover:bg-red-700 text-white transition-colors h-16 border border-red-500">
                <Power size={20} />
                <span>Shutdown System</span>
              </button>
             {/* Add more actions if needed */}
          </div>
        </SystemCard>

      </div>
    </div>
  );
};

export default SystemManagementView;
