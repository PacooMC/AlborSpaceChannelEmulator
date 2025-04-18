import React from 'react';
    import { Server, TerminalSquare, Satellite, RadioTower, Smartphone, Plug, Beaker, Circle, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
    // Import data and types from content files
    import { dummySdrData, Port, PortStatus, SdrDevice, PortAssignment } from '../../content/sdr';
    import { NodeType } from '../../content/mapData'; // Import NodeType from mapData

    // Data structures, types, and dummy data are now imported from content files.

    // --- Helper Components & Functions ---
    const getNodeIcon = (nodeType: NodeType) => { // Use imported NodeType
      switch (nodeType) {
        case 'SAT': return <Satellite size={10} className="opacity-80" />; // Reduced size slightly
        case 'GS': return <RadioTower size={10} className="opacity-80" />; // Reduced size slightly
        case 'UE': return <Smartphone size={10} className="opacity-80" />; // Reduced size slightly
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
          // Reduced padding slightly (p-1.5 instead of p-2)
          className={`flex flex-col items-center justify-center p-1.5 rounded border text-xs font-mono transition-all duration-150 ease-in-out hover:ring-2 hover:ring-albor-orange/50 focus:outline-none focus:ring-2 focus:ring-albor-orange min-h-[55px] ${statusInfo.color}`} // Reduced min-height
        >
          {/* Port ID and Type */}
          <div className="flex items-center space-x-1 mb-0.5">
            <statusInfo.icon size={10} /> {/* Slightly smaller icon */}
            <span className="text-xs">{port.id}</span> {/* Ensure base size is xs */}
            <span className="text-[10px] opacity-70">({port.type})</span>
          </div>

          {/* Assignment Info - Reduced font size and spacing */}
          {assignment && (
            <div className="flex items-center space-x-0.5 text-[10px] mt-0.5 opacity-90"> {/* Reduced space and mt */}
              {assignment.signalType === 'physical' ? <Plug size={9} title="Physical SDR" /> : <Beaker size={9} title="Simulated Signal" />} {/* Smaller icon */}
              {getNodeIcon(assignment.nodeType)}
              <span className="truncate max-w-[50px]">{assignment.nodeId}</span> {/* Reduced max-width */}
            </div>
          )}
           {!assignment && port.status === 'available' && (
             <span className="text-[9px] opacity-60 mt-0.5">(Available)</span> // Smaller text
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

    // --- NEW: List View Component ---
    interface PortListItemProps {
        port: Port;
        sdrName: string;
    }
    const PortListItem: React.FC<PortListItemProps> = ({ port, sdrName }) => {
        const statusInfo = getStatusInfo(port.status);
        const assignment = port.assignment;
        return (
            <tr className="hover:bg-albor-bg-dark/30">
                <td className="py-1 px-2 text-albor-dark-gray">{sdrName}</td>
                <td className="py-1 px-2 font-mono">{port.id} ({port.type})</td>
                <td className="py-1 px-2">
                    <span className={`flex items-center space-x-1 ${statusInfo.color.split(' ')[2]}`}>
                        <statusInfo.icon size={12} />
                        <span>{statusInfo.label}</span>
                    </span>
                </td>
                <td className="py-1 px-2">
                    {assignment ? (
                        <div className="flex items-center space-x-1">
                            {assignment.signalType === 'physical' ? <Plug size={10} title="Physical" /> : <Beaker size={10} title="Simulated" />}
                            {getNodeIcon(assignment.nodeType)}
                            <span className="truncate max-w-[100px]">{assignment.nodeId}</span>
                        </div>
                    ) : (
                        <span className="text-albor-dark-gray">-</span>
                    )}
                </td>
            </tr>
        );
    };

    // --- Main Component ---
    type PortAssignmentMapProps = {
      className?: string;
      scenarioId?: string | null; // Add scenarioId prop if filtering is needed later
      displayMode?: 'map' | 'list'; // NEW: Control display mode
    };

    const PortAssignmentMap: React.FC<PortAssignmentMapProps> = ({
        className,
        scenarioId, // Keep scenarioId for potential future filtering
        displayMode = 'map' // Default to map view
    }) => {
      // Use imported data directly. Add filtering based on scenarioId if needed in the future.
      const sdrs: SdrDevice[] = dummySdrData;

      // --- Render Map View ---
      const renderMapView = () => (
        <>
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
        </>
      );

      // --- Render List View ---
      const renderListView = () => {
        const allPorts = sdrs.flatMap(sdr => sdr.ports.map(port => ({ ...port, sdrName: sdr.name })));
        return (
            <div className="overflow-auto h-full custom-scrollbar -mr-1 pr-1">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="text-albor-dark-gray border-b border-albor-bg-dark sticky top-0 bg-albor-bg-dark/80 backdrop-blur-sm z-10">
                            <th className="py-1 px-2">SDR</th>
                            <th className="py-1 px-2">Port</th>
                            <th className="py-1 px-2">Status</th>
                            <th className="py-1 px-2">Assignment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-albor-bg-dark/50">
                        {allPorts.map((port) => (
                            <PortListItem key={`${port.sdrName}-${port.id}`} port={port} sdrName={port.sdrName} />
                        ))}
                        {allPorts.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-4 text-albor-dark-gray italic">
                                    No SDR ports found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
      };

      return (
        // Adjust padding based on mode for better spacing in list view
        <div className={`bg-albor-bg-dark/80 backdrop-blur-sm rounded border border-albor-bg-dark/50 h-full flex flex-col ${displayMode === 'map' ? 'p-4' : 'p-2'} ${className}`}>
          {/* Title remains the same, content changes */}
          <h3 className="text-base font-semibold text-albor-light-gray mb-3 flex-shrink-0">Port Assignment</h3>
          <div className="flex-1 overflow-hidden min-h-0"> {/* Ensure inner div can scroll */}
            {displayMode === 'map' ? renderMapView() : renderListView()}
          </div>
        </div>
      );
    };

    export default PortAssignmentMap;
