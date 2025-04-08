import React, { useMemo } from 'react';
import {
    Satellite, RadioTower, Smartphone, Network, Clock, BarChart, PlayCircle, PauseCircle, StopCircle, List, Cpu, Timer, Activity, CheckCircle, AlertTriangle, XCircle, MonitorPlay, CalendarDays, Settings2, Milestone, FileText, Info, TrendingUp, PackageX, Save // Added FileText, Info, TrendingUp, PackageX, Save
} from 'lucide-react';
// Import scenario data and summary functions/data
import { initialRunningScenarios } from '../../content/scenarios'; // Assuming this holds {id, name, status}
import { getSystemSummary, getAllActiveScenarioSummaries } from '../../content/systemSummary';
import type { Scenario, ScenarioStatus } from '../../App'; // Import Scenario types
import type { SystemSummaryStats } from '../../content/systemSummary'; // Import summary stats type

interface SystemSummaryTileProps {
  scenarioId: string | null; // Null for global view
  // onMonitorScenario?: (scenarioId: string) => void;
}

// Helper to get status icon and color
const getStatusInfo = (status: ScenarioStatus): { icon: React.ElementType; color: string; text: string } => {
    switch (status) {
      case 'running': return { icon: PlayCircle, color: 'text-green-400', text: 'Running' };
      case 'paused': return { icon: PauseCircle, color: 'text-yellow-400', text: 'Paused' };
      case 'stopped': return { icon: StopCircle, color: 'text-red-400', text: 'Stopped' };
      default: return { icon: StopCircle, color: 'text-gray-500', text: 'Unknown' };
    }
};

// --- V2: Component for individual stat items (Scenario View) ---
const StatItemV2: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode; className?: string }> =
    ({ icon: Icon, label, children, className = "" }) => (
    <div className={`flex flex-col p-2 bg-albor-deep-space/40 rounded border border-albor-bg-dark/50 ${className}`}>
        <div className="flex items-center space-x-1.5 mb-1">
            <Icon className="text-albor-dark-gray" size={14} />
            <span className="text-xs font-semibold text-albor-dark-gray uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-sm text-albor-light-gray">{children}</div>
    </div>
);

// --- V2: Component for Progress Bar ---
const ProgressBar: React.FC<{ value: number; colorClass: string }> = ({ value, colorClass }) => (
    <div className="w-full bg-albor-bg-dark rounded h-1.5 overflow-hidden">
        <div className={`${colorClass} h-full rounded transition-all duration-300`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }}></div>
    </div>
);

// --- V2: Component for Detailed Scenario Row (Global View) ---
interface ScenarioSummaryRowV2Props {
    scenarioInfo: { id: string; name: string; status: ScenarioStatus }; // Use info from initialRunningScenarios
    summary: SystemSummaryStats; // Pass the specific summary data for this scenario
    // onMonitorClick: (id: string) => void;
}

const ScenarioSummaryRowV2: React.FC<ScenarioSummaryRowV2Props> = ({ scenarioInfo, summary /*, onMonitorClick */ }) => {
     const statusInfo = getStatusInfo(scenarioInfo.status);

    return (
        // Adjusted grid columns for new data
        <div className="grid grid-cols-12 gap-x-2 items-center py-1.5 px-1 border-b border-albor-bg-dark/50 last:border-b-0 hover:bg-albor-bg-dark/30 transition-colors">
            {/* Name & Status Icon (col-span-4) */}
            <div className="col-span-4 flex items-center space-x-1.5 overflow-hidden">
                <statusInfo.icon size={14} className={`${statusInfo.color} flex-shrink-0`} />
                <span className="text-sm text-albor-light-gray truncate" title={scenarioInfo.name}>
                    {scenarioInfo.name}
                </span>
            </div>
            {/* Status Text (col-span-2) */}
            <div className={`col-span-2 text-xs font-medium capitalize ${statusInfo.color}`}>
                {statusInfo.text}
            </div>
            {/* Uptime (col-span-2) */}
            <div className="col-span-2 text-xs text-albor-dark-gray text-center font-mono" title="Uptime">
                {summary.uptime}
            </div>
            {/* Nodes (col-span-1) */}
            <div className="col-span-1 text-sm text-albor-light-gray text-center" title="Total Nodes">
                {summary.totalNodes}
            </div>
            {/* Links (col-span-1) */}
            <div className="col-span-1 text-sm text-albor-light-gray text-center" title="Active Links">
                {summary.activeLinks}
            </div>
            {/* Ports (col-span-1) */}
            <div className="col-span-1 text-xs text-albor-dark-gray text-center font-mono" title="Used Ports">
                {summary.usedPorts.split('/')[0]} {/* Show only used count */}
            </div>
            {/* Action (col-span-1) */}
            <div className="col-span-1 text-center">
                <button
                    // onClick={() => onMonitorClick(scenarioInfo.id)}
                    onClick={() => console.log(`TODO: Monitor ${scenarioInfo.id}`)}
                    className="p-1 rounded text-albor-dark-gray hover:bg-albor-orange/20 hover:text-albor-orange transition-colors"
                    title={`Monitor ${scenarioInfo.name}`}
                >
                    <MonitorPlay size={14} />
                </button>
            </div>
        </div>
    );
};
// --- End of ScenarioSummaryRowV2 ---


const SystemSummaryTile: React.FC<SystemSummaryTileProps> = ({ scenarioId /*, onMonitorScenario */ }) => {
  const isGlobalView = scenarioId === null;

  // --- Global View Logic ---
  const activeScenariosWithDetails = useMemo(() => {
      const runningIds = initialRunningScenarios.map(s => s.id);
      const summaries = getAllActiveScenarioSummaries(runningIds);
      return summaries.map(s => {
          const runningInfo = initialRunningScenarios.find(r => r.id === s.id);
          return {
              scenarioInfo: {
                  id: s.id,
                  name: runningInfo?.name || s.name,
                  status: runningInfo?.status || 'stopped',
              },
              summary: s.summary,
          };
      });
  }, [initialRunningScenarios]);


  // --- Scenario View Logic ---
  const scenarioSummaryData = !isGlobalView ? getSystemSummary(scenarioId) : null;
  const scenarioInfo = !isGlobalView ? initialRunningScenarios.find(s => s.id === scenarioId) : null;
  const statusInfo = scenarioInfo ? getStatusInfo(scenarioInfo.status) : getStatusInfo('stopped');

  // Determine title based on view
  const title = isGlobalView ? "Active Scenario Overview" : "Scenario Status & Parameters";

  return (
    <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex flex-col min-h-[250px]">
      <h3 className="text-base font-semibold text-albor-light-gray mb-3">{title}</h3>

      {/* Conditional Rendering based on view */}
      {isGlobalView ? (
        // --- Global View Content (Unchanged) ---
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-x-2 px-1 pb-1 border-b border-albor-dark-gray/50 mb-1 flex-shrink-0 text-xs font-semibold text-albor-dark-gray uppercase tracking-wider">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-center">Uptime</div>
                <div className="col-span-1 text-center" title="Nodes"><Cpu size={12} className="inline-block"/></div>
                <div className="col-span-1 text-center" title="Links"><Network size={12} className="inline-block"/></div>
                <div className="col-span-1 text-center" title="Ports"><BarChart size={12} className="inline-block"/></div>
                <div className="col-span-1 text-center">Action</div>
            </div>
            {/* Scenario List */}
            <div className="flex-1 overflow-y-auto -mr-2 pr-2 custom-scrollbar">
                {activeScenariosWithDetails.length > 0 ? (
                    activeScenariosWithDetails.map(({ scenarioInfo, summary }) => (
                        <ScenarioSummaryRowV2
                            key={scenarioInfo.id}
                            scenarioInfo={scenarioInfo}
                            summary={summary}
                        />
                    ))
                ) : (
                    <p className="text-sm text-albor-dark-gray italic text-center mt-4">No active scenarios.</p>
                )}
            </div>
             {/* Footer for total count */}
             <div className="mt-auto pt-2 border-t border-albor-bg-dark/50 text-xs flex-shrink-0">
                 <div className="flex justify-end items-center">
                    <span className="text-albor-dark-gray flex items-center"><List size={12} className="mr-1"/>Total Active:</span>
                    <span className="text-albor-light-gray font-medium ml-2">{activeScenariosWithDetails.length}</span>
                 </div>
            </div>
        </div>
      ) : (
        // --- ENRICHED Scenario View Content ---
        scenarioSummaryData ? (
          <div className="flex-1 flex flex-col space-y-3 overflow-y-auto custom-scrollbar -mr-2 pr-2"> {/* Added scroll */}
            {/* Top Status & Scenario Type */}
            <div className="flex justify-between items-center bg-albor-deep-space/30 p-2 rounded border border-albor-bg-dark/50 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <statusInfo.icon size={18} className={statusInfo.color} />
                    <span className={`text-sm font-semibold ${statusInfo.color}`}>{statusInfo.text}</span>
                </div>
                <div className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full font-medium ${scenarioSummaryData.scenarioType === 'realistic' ? 'bg-blue-500/30 text-blue-300' : 'bg-purple-500/30 text-purple-300'}`}>
                    <Settings2 size={12} />
                    <span>{scenarioSummaryData.scenarioType === 'realistic' ? 'Realistic' : 'Custom'}</span>
                </div>
            </div>

            {/* Description */}
            {scenarioSummaryData.description && (
                <div className="p-2 bg-albor-deep-space/20 rounded border border-albor-bg-dark/30 text-xs text-albor-light-gray/90 italic flex-shrink-0">
                    <Info size={14} className="inline-block mr-1.5 text-albor-dark-gray relative -top-px"/>
                    {scenarioSummaryData.description}
                </div>
            )}

            {/* Main Stats Grid - Now 3 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-grow">
                <StatItemV2 icon={Cpu} label="Nodes">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <span title="Satellites"><Satellite size={14} className="inline mr-1 opacity-70"/>{scenarioSummaryData.satellites}</span>
                        <span title="Ground Stations"><RadioTower size={14} className="inline mr-1 opacity-70"/>{scenarioSummaryData.groundStations}</span>
                        <span title="User Terminals"><Smartphone size={14} className="inline mr-1 opacity-70"/>{scenarioSummaryData.userTerminals}</span>
                    </div>
                </StatItemV2>

                <StatItemV2 icon={Network} label="Links">
                     <div className="flex items-center space-x-2">
                        <span>{scenarioSummaryData.activeLinks} Active</span>
                        {scenarioSummaryData.linkHealth && (
                            <div className="flex space-x-1 text-xs items-center ml-auto" title="Ok / Warning / Error">
                                <CheckCircle size={12} className="text-green-500"/><span>{scenarioSummaryData.linkHealth.ok}</span>
                                <AlertTriangle size={12} className="text-yellow-500"/><span>{scenarioSummaryData.linkHealth.warning}</span>
                                <XCircle size={12} className="text-red-500"/><span>{scenarioSummaryData.linkHealth.error}</span>
                            </div>
                        )}
                    </div>
                </StatItemV2>

                <StatItemV2 icon={BarChart} label="Port Usage">
                    <div className="flex items-center space-x-2">
                        <span className="font-mono">{scenarioSummaryData.usedPorts}</span>
                        {(() => {
                            const [used, total] = scenarioSummaryData.usedPorts.split('/').map(Number);
                            const percentage = total > 0 ? (used / total) * 100 : 0;
                            return <ProgressBar value={percentage} colorClass="bg-blue-500" />;
                        })()}
                    </div>
                </StatItemV2>

                {/* Timeline Information */}
                <StatItemV2 icon={CalendarDays} label="Timeline">
                    <div className="space-y-1 text-xs">
                        <div>
                            <span className="text-albor-dark-gray">Start:</span>
                            <span className="ml-1.5 text-albor-light-gray font-mono">{scenarioSummaryData.startTime || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-albor-dark-gray">End:</span>
                            <span className="ml-1.5 text-albor-light-gray font-mono">{scenarioSummaryData.endTime || 'Ongoing'}</span>
                        </div>
                        <div>
                            <span className="text-albor-dark-gray">Elapsed:</span>
                            <span className="ml-1.5 text-albor-light-gray font-mono">{scenarioSummaryData.uptime}</span>
                        </div>
                    </div>
                </StatItemV2>

                {/* Configuration Summary */}
                 <StatItemV2 icon={FileText} label="Config Summary">
                    <span>{scenarioSummaryData.configSummary || 'N/A'}</span>
                     {scenarioSummaryData.channelModelsUsed && scenarioSummaryData.channelModelsUsed.length > 0 && (
                        <div className="text-xs mt-1 text-albor-dark-gray">
                            Models: {scenarioSummaryData.channelModelsUsed.join(', ')}
                        </div>
                     )}
                </StatItemV2>

                {/* Last Saved */}
                <StatItemV2 icon={Save} label="Last Saved">
                    <span className="font-mono text-xs">{scenarioSummaryData.lastSaved || 'Never'}</span>
                </StatItemV2>

                {/* KPIs - Grouped */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                     <StatItemV2 icon={Activity} label="Avg. Latency (Sim.)">
                        <span className="font-mono">{scenarioSummaryData.avgLatency?.toFixed(1) ?? 'N/A'} ms</span>
                    </StatItemV2>
                     <StatItemV2 icon={TrendingUp} label="Throughput (Sim.)">
                        <span className="font-mono">{scenarioSummaryData.throughput?.toFixed(1) ?? 'N/A'} Mbps</span>
                    </StatItemV2>
                     <StatItemV2 icon={PackageX} label="Packet Loss (Sim.)">
                        <span className="font-mono">{scenarioSummaryData.packetLoss?.toFixed(2) ?? 'N/A'} %</span>
                    </StatItemV2>
                </div>

            </div>
          </div>
        ) : (
           <p className="text-sm text-albor-dark-gray italic text-center mt-4">Scenario data not available.</p>
        )
      )}
    </div>
  );
};

export default SystemSummaryTile;
