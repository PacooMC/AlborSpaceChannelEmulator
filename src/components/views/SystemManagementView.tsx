import React, { useState } from 'react';
import { HardDrive, Cpu, MemoryStick, KeyRound, GitBranch, RotateCcw, Power, Activity, Wifi, Server, Network, Thermometer, ShieldCheck, Database, Circle, Loader2, Info, XCircle, CheckCircle } from 'lucide-react';

// --- Helper Components (Keep existing ones) ---
const InfoItem: React.FC<{ icon: React.ElementType; label: string; value: string | React.ReactNode; progress?: number | null; }> = ({ icon: Icon, label, value, progress }) => (
  <div className="py-2 border-b border-albor-bg-dark/50 last:border-b-0">
    <div className="flex items-center space-x-2 mb-1">
      <Icon className="text-albor-dark-gray" size={16} />
      <span className="text-sm text-albor-dark-gray w-32 flex-shrink-0">{label}:</span>
      <span className="text-sm text-albor-light-gray font-medium truncate flex-1">{value}</span>
    </div>
    {progress !== undefined && progress !== null && (
      <div className="w-full bg-albor-deep-space rounded-full h-1.5 mt-1">
        {/* Corrected className syntax */}
        <div
          className={`h-1.5 rounded-full ${progress > 85 ? 'bg-red-500' : progress > 60 ? 'bg-yellow-500' : 'bg-albor-orange'}`}
          style={{ width: `${progress}%` }}
          title={`${progress}% Used`}
        /> {/* Ensure self-closing or proper closing tag */}
      </div>
    )}
  </div>
);


const StatusIndicatorV2: React.FC<{ label: string; status: 'ok' | 'warning' | 'error' | 'unknown'; icon: React.ElementType; detail?: string; }> = ({ label, status, icon: Icon, detail }) => {
  const statusInfo = {
    ok: { text: 'Operational', color: 'text-blue-400', bgColor: 'bg-blue-500', ring: 'ring-blue-500/50' },
    warning: { text: 'Warning', color: 'text-albor-orange', bgColor: 'bg-albor-orange', ring: 'ring-albor-orange/50' },
    error: { text: 'Error', color: 'text-red-400', bgColor: 'bg-red-500', ring: 'ring-red-500/50' },
    unknown: { text: 'Unknown', color: 'text-albor-dark-gray', bgColor: 'bg-albor-dark-gray', ring: 'ring-albor-dark-gray/50' },
  }[status];

  return (
    <div className={`flex items-center space-x-3 p-3 rounded border border-albor-bg-dark bg-albor-deep-space/50 transition-colors hover:bg-albor-deep-space/80 ring-1 ${statusInfo.ring}`}>
       <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.bgColor}`} title={statusInfo.text}></div>
       <Icon size={20} className={`${statusInfo.color} flex-shrink-0`} />
       <div className="flex-1 min-w-0">
         <div className="text-sm font-medium text-albor-light-gray truncate">{label}</div>
         {detail && <div className="text-xs text-albor-dark-gray truncate">{detail}</div>}
       </div>
    </div>
  );
};

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

interface UpdateStatusCardProps {
    status: 'idle' | 'checking' | 'available' | 'up-to-date' | 'error';
    message: string | null;
    onInstall?: () => void;
}

const UpdateStatusCard: React.FC<UpdateStatusCardProps> = ({ status, message, onInstall }) => {
    if (status === 'idle') return null;

    const statusInfo = {
        checking: { icon: Loader2, color: 'text-blue-400', spin: true, title: 'Checking...' },
        available: { icon: GitBranch, color: 'text-albor-orange', spin: false, title: 'Update Available' },
        'up-to-date': { icon: CheckCircle, color: 'text-green-400', spin: false, title: 'Up-to-Date' },
        error: { icon: XCircle, color: 'text-red-400', spin: false, title: 'Error' },
    }[status];

    const Icon = statusInfo.icon;

    return (
        <SystemCard title="Software Update Status" icon={GitBranch} className="lg:col-span-3">
            <div className="flex items-center space-x-3">
                <Icon size={24} className={`${statusInfo.color} ${statusInfo.spin ? 'animate-spin' : ''} flex-shrink-0`} />
                <div className="flex-1">
                    <p className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.title}</p>
                    {message && <p className="text-xs text-albor-dark-gray mt-1">{message}</p>}
                </div>
                {status === 'available' && onInstall && (
                    <button
                        onClick={onInstall}
                        className="flex items-center justify-center space-x-1.5 px-3 py-1 rounded text-xs bg-albor-orange hover:bg-albor-orange/80 text-white font-semibold transition-colors flex-shrink-0"
                    >
                        <GitBranch size={14} />
                        <span>Install Update</span>
                    </button>
                )}
            </div>
        </SystemCard>
    );
};


// --- Main Component ---
const SystemManagementView: React.FC = () => {
  // State for update check
  const [updateStatus, setUpdateStatus] = useState<UpdateStatusCardProps['status']>('idle');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  // --- NEW: State for other actions ---
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isCheckingConnectivity, setIsCheckingConnectivity] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  // --- End State ---

  const handleAction = (action: string) => {
    // Combine all loading states to prevent overlapping actions
    const isAnyActionInProgress = isCheckingUpdates || isDiagnosing || isCheckingConnectivity || isRestarting || isShuttingDown;
    if (isAnyActionInProgress) {
        console.log(`Action '${action}' blocked, another action is in progress.`);
        return;
    }

    if (action === 'check_updates') {
        console.log('Action: check_updates initiated');
        setIsCheckingUpdates(true);
        setUpdateStatus('checking');
        setUpdateMessage('Contacting update server...');
        setTimeout(() => {
            const result = Math.random();
            if (result < 0.5) {
                setUpdateStatus('up-to-date');
                setUpdateMessage('Your system software is currently up-to-date (v1.2.5-beta).');
            } else if (result < 0.85) {
                setUpdateStatus('available');
                setUpdateMessage('New version v1.3.0 available. Includes performance improvements and new channel models.');
            } else {
                setUpdateStatus('error');
                setUpdateMessage('Failed to check for updates. Please check your network connection or try again later.');
            }
            setIsCheckingUpdates(false);
            console.log('Action: check_updates finished');
        }, 2500);

    } else if (action === 'install_update') {
        console.log('Action: install_update initiated');
        alert('Simulating update installation...');
        setUpdateStatus('up-to-date');
        setUpdateMessage('System successfully updated to v1.3.0.');

    // --- NEW: Handle Diagnostics ---
    } else if (action === 'run_diagnostics') {
        console.log('Action: run_diagnostics initiated');
        setIsDiagnosing(true);
        setTimeout(() => {
            alert('Simulating diagnostics run... Check console for results (mock).');
            console.log('Mock Diagnostics Results: All systems nominal.');
            setIsDiagnosing(false);
            console.log('Action: run_diagnostics finished');
        }, 3000); // Simulate 3 seconds

    // --- NEW: Handle Connectivity Check ---
    } else if (action === 'check_connectivity') {
        console.log('Action: check_connectivity initiated');
        setIsCheckingConnectivity(true);
        setTimeout(() => {
            alert('Simulating connectivity check... Check console for results (mock).');
            console.log('Mock Connectivity Results: Uplink OK, SDR Ping OK.');
            setIsCheckingConnectivity(false);
            console.log('Action: check_connectivity finished');
        }, 2000); // Simulate 2 seconds

    // --- NEW: Handle Restart ---
    } else if (action === 'restart') {
      if (window.confirm(`Are you sure you want to ${action} the system?`)) {
        console.log(`Action: ${action} confirmed`);
        setIsRestarting(true); // Set loading state
        alert(`Simulating system ${action}...`);
        // Optional: Reset state after a delay for simulation purposes
        // setTimeout(() => setIsRestarting(false), 5000);
      } else {
        console.log(`Action: ${action} cancelled`);
      }

    // --- NEW: Handle Shutdown ---
    } else if (action === 'shutdown') {
      if (window.confirm(`Are you sure you want to ${action} the system?`)) {
        console.log(`Action: ${action} confirmed`);
        setIsShuttingDown(true); // Set loading state
        alert(`Simulating system ${action}...`);
        // Optional: Reset state after a delay for simulation purposes
        // setTimeout(() => setIsShuttingDown(false), 5000);
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
  const ramUsage = 15.6 / 32.0 * 100;
  const diskUsage = 450.2 / 1000 * 100;

  // Combine all loading states again for disabling buttons
  const isAnyActionInProgress = isCheckingUpdates || isDiagnosing || isCheckingConnectivity || isRestarting || isShuttingDown;

  return (
    <div className="text-white">
      <h1 className="text-xl font-semibold mb-4 pb-2 border-b border-albor-bg-dark/50">System Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* System Information Card */}
        <SystemCard title="System Information" icon={HardDrive} className="lg:col-span-2">
          <InfoItem icon={HardDrive} label="Operating System" value="AlborOS v2.1 (Linux 5.15)" />
          <InfoItem icon={Cpu} label="Processor" value="Virtual CPU @ 3.0GHz (4 Cores)" progress={cpuUsage} />
          <InfoItem icon={MemoryStick} label="Memory (RAM)" value={`${ramUsage.toFixed(1)}% (${(ramUsage * 32 / 100).toFixed(1)} / 32.0 GB)`} progress={ramUsage} />
          <InfoItem icon={Database} label="Disk Usage" value={`${diskUsage.toFixed(1)}% (${(diskUsage * 1000 / 100).toFixed(1)} GB / 1 TB)`} progress={diskUsage} />
          <InfoItem icon={KeyRound} label="License Status" value={<span className="text-green-400 font-medium">Active Pro (Expires: 2025-12-31)</span>} />
          <InfoItem icon={GitBranch} label="Software Version" value="v1.2.5-beta" />
          <InfoItem icon={ShieldCheck} label="Security Status" value={<span className="text-green-400">Protected</span>} />
        </SystemCard>

        {/* Hardware Status Card */}
        <SystemCard title="Hardware Status" icon={Server}>
          <div className="space-y-2">
            <StatusIndicatorV2 label="SDR Interface 1" status="ok" icon={Server} detail="Ettus X310" />
            <StatusIndicatorV2 label="SDR Interface 2" status="warning" icon={Server} detail="NI USRP-2974 (Temp High)" />
            <StatusIndicatorV2 label="Network Uplink" status="ok" icon={Network} detail="10 Gbps Fiber" />
            <StatusIndicatorV2 label="System Temperature" status="ok" icon={Thermometer} detail="45°C" />
            <StatusIndicatorV2 label="Backup Power" status="error" icon={Power} detail="Battery Fault" />
          </div>
        </SystemCard>

        {/* Actions Card - UPDATED BUTTONS */}
        <SystemCard title="System Actions" icon={Activity} className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Check Updates Button */}
            <button
                onClick={() => handleAction('check_updates')}
                disabled={isAnyActionInProgress}
                className="flex items-center justify-start space-x-3 p-3 rounded text-sm bg-albor-orange hover:bg-albor-orange/80 text-white transition-colors h-16 border border-albor-orange/50 disabled:opacity-60 disabled:cursor-wait"
            >
              {isCheckingUpdates ? <Loader2 size={20} className="animate-spin" /> : <GitBranch size={20} />}
              <span>{isCheckingUpdates ? 'Checking...' : 'Check Updates'}</span>
            </button>
            {/* Run Diagnostics Button */}
            <button
                onClick={() => handleAction('run_diagnostics')}
                disabled={isAnyActionInProgress}
                className="flex items-center justify-start space-x-3 p-3 rounded text-sm bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors border border-albor-dark-gray hover:border-albor-orange hover:text-albor-orange h-16 group disabled:opacity-60 disabled:cursor-wait"
            >
              {isDiagnosing ? <Loader2 size={20} className="animate-spin text-albor-orange" /> : <Activity size={20} className="text-albor-dark-gray group-hover:text-albor-orange transition-colors" />}
              <span>{isDiagnosing ? 'Running...' : 'Run Diagnostics'}</span>
            </button>
            {/* Check Connectivity Button */}
             <button
                onClick={() => handleAction('check_connectivity')}
                disabled={isAnyActionInProgress}
                className="flex items-center justify-start space-x-3 p-3 rounded text-sm bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors border border-albor-dark-gray hover:border-albor-orange hover:text-albor-orange h-16 group disabled:opacity-60 disabled:cursor-wait"
             >
              {isCheckingConnectivity ? <Loader2 size={20} className="animate-spin text-albor-orange" /> : <Wifi size={20} className="text-albor-dark-gray group-hover:text-albor-orange transition-colors" />}
              <span>{isCheckingConnectivity ? 'Checking...' : 'Check Connectivity'}</span>
            </button>
            {/* Restart Button */}
             <button
                onClick={() => handleAction('restart')}
                disabled={isAnyActionInProgress}
                className="flex items-center justify-start space-x-3 p-3 rounded text-sm bg-albor-dark-gray hover:bg-gray-500 text-albor-light-gray transition-colors h-16 border border-gray-600 disabled:opacity-60 disabled:cursor-wait"
             >
                {isRestarting ? <Loader2 size={20} className="animate-spin" /> : <RotateCcw size={20} />}
                <span>{isRestarting ? 'Restarting...' : 'Restart System'}</span>
              </button>
            {/* Shutdown Button */}
             <button
                onClick={() => handleAction('shutdown')}
                disabled={isAnyActionInProgress}
                className="flex items-center justify-start space-x-3 p-3 rounded text-sm bg-red-600 hover:bg-red-700 text-white transition-colors h-16 border border-red-500 disabled:opacity-60 disabled:cursor-wait"
             >
                {isShuttingDown ? <Loader2 size={20} className="animate-spin" /> : <Power size={20} />}
                <span>{isShuttingDown ? 'Shutting down...' : 'Shutdown System'}</span>
              </button>
          </div>
        </SystemCard>

        {/* Update Status Card */}
        <UpdateStatusCard
            status={updateStatus}
            message={updateMessage}
            onInstall={() => handleAction('install_update')}
        />

      </div>
    </div>
  );
};

export default SystemManagementView;
