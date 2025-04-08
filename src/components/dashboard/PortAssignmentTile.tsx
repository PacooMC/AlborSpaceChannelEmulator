import React from 'react';
import { Server, TerminalSquare, Satellite, RadioTower, Smartphone, Plug, Beaker, Circle, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
// Import data and types from content files
import { dummySdrData, Port, PortStatus, SdrDevice } from '../../content/sdr';
import { NodeType } from '../../content/mapData'; // Import NodeType from mapData

// --- Data Structures & Types are now imported ---

// --- Dummy Data is now imported ---

// --- Helper Components & Functions ---
const getNodeIcon = (nodeType: NodeType) => { // Use imported NodeType
  switch (nodeType) {
    case 'SAT': return <Satellite size={12} className="opacity-80" />;
    case 'GS': return <RadioTower size={12} className="opacity-80" />;
    case 'UE': return <Smartphone size={12} className="opacity-80" />;
    default: return null;
  }
};

const getStatusInfo = (status: PortStatus): { color: string; icon: React.ElementType; label: string } => { // Use imported PortStatus
  switch (status) {
    case 'available': return { color: 'bg-green-500/30 border-green-500/50 text-green-300', icon: Circle, label: 'Available' };
    case 'assigned': return { color: 'bg-blue-500/30 border-blue-500/50 text-blue-300', icon: TerminalSquare, label: 'Assigned' };
    case 'active': return { color: 'bg-emerald-500/40 border-emerald-400/60 text-emerald-300 ring-1 ring-emerald-400', icon: CheckCircle, label: 'Active' };
    case 'conflict': return { color: 'bg-red-500/30 border-red-500/50 text-red-300', icon: AlertTriangle, label: 'Conflict' };
    case 'error': return { color: 'bg-red-700/40 border-red-600/60 text-red-400', icon: XCircle, label: 'Error' };
    default: return { color: 'bg-albor-dark-gray/30 border-albor-dark-gray/50 text-albor-dark-gray', icon: Circle, label: 'Unknown' };
  }
};

interface PortCellProps {
  port: Port; // Use imported Port type
}

const PortCell: React.FC<PortCellProps> = ({ port }) => {
  const statusInfo = getStatusInfo(port.status);
  const assignment = port.assignment;

  const tooltipText = assignment
    ? `${port.id} (${port.type}) - ${statusInfo.label}\nAssigned to: ${assignment.nodeType} ${assignment.nodeId}\nSignal: ${assignment.signalType}${assignment.config?.frequency ? `\nFreq: ${assignment.config.frequency}` : ''}`
    : `${port.id} (${port.type}) - ${statusInfo.label}`;

  return (
    <button
      title={tooltipText}
      className={`flex flex-col items-center justify-center p-2 rounded border text-xs font-mono transition-all duration-150 ease-in-out hover:ring-2 hover:ring-albor-orange/50 focus:outline-none focus:ring-2 focus:ring-albor-orange min-h-[60px] ${statusInfo.color}`}
    >
      <div className="flex items-center space-x-1 mb-0.5">
        <statusInfo.icon size={12} />
        <span>{port.id}</span>
        <span className="text-[10px] opacity-70">({port.type})</span>
      </div>
      {assignment && (
        <div className="flex items-center space-x-1 text-[10px] mt-1 opacity-90">
          {assignment.signalType === 'physical' ? <Plug size={10} title="Physical SDR" /> : <Beaker size={10} title="Simulated Signal" />}
          {getNodeIcon(assignment.nodeType)}
          <span className="truncate max-w-[60px]">{assignment.nodeId}</span>
        </div>
      )}
       {!assignment && port.status === 'available' && (
         <span className="text-[10px] opacity-60 mt-1">(Available)</span>
       )}
    </button>
  );
};

// --- Legend Component ---
const Legend: React.FC = () => {
  const statuses: PortStatus[] = ['available', 'assigned', 'active', 'conflict', 'error']; // Use imported PortStatus
  return (
    <div className="mt-4 pt-3 border-t border-albor-bg-dark/50 text-xs text-albor-light-gray">
      <h4 className="font-semibold mb-2 flex items-center"><Info size={14} className="mr-1 text-albor-dark-gray"/>Legend:</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5">
        {/* Statuses */}
        {statuses.map(status => {
          const info = getStatusInfo(status);
          return (
            <div key={status} className="flex items-center space-x-1.5">
              <info.icon size={12} className={info.color.split(' ')[2]} /> {/* Extract text color */}
              <span>{info.label}</span>
            </div>
          );
        })}
        {/* Signal Types */}
        <div className="flex items-center space-x-1.5">
          <Plug size={12} className="text-albor-dark-gray" />
          <span>Physical Signal</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Beaker size={12} className="text-albor-dark-gray" />
          <span>Simulated Signal</span>
        </div>
         {/* Node Types */}
        <div className="flex items-center space-x-1.5">
          <Satellite size={12} className="text-albor-dark-gray" />
          <span>Satellite Node</span>
        </div>
         <div className="flex items-center space-x-1.5">
          <RadioTower size={12} className="text-albor-dark-gray" />
          <span>Ground Station Node</span>
        </div>
         <div className="flex items-center space-x-1.5">
          <Smartphone size={12} className="text-albor-dark-gray" />
          <span>User Terminal Node</span>
        </div>
      </div>
    </div>
  );
};


// --- Main Component ---
type PortAssignmentMapProps = {
  className?: string;
  scenarioId?: string | null; // Add scenarioId prop if filtering is needed later
};

const PortAssignmentMap: React.FC<PortAssignmentMapProps> = ({ className }) => {
  // Use imported data directly. Add filtering based on scenarioId if needed in the future.
  const sdrs: SdrDevice[] = dummySdrData;

  return (
    <div className={`bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 ${className}`}>
      <h3 className="text-base font-semibold text-albor-light-gray mb-4">Port Assignment Map</h3>
      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-4">
          {sdrs.map((sdr) => (
            <div key={sdr.id} className="flex-shrink-0 w-64">
              <div className="flex items-center space-x-2 mb-3 border-b border-albor-bg-dark pb-1">
                <Server size={16} className="text-albor-orange" />
                <span className="text-sm font-medium text-albor-light-gray truncate">{sdr.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sdr.ports.map((port) => (
                  <PortCell key={port.id} port={port} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Legend />
    </div>
  );
};

export default PortAssignmentMap;
