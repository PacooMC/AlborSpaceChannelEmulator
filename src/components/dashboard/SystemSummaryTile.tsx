import React, { useMemo } from 'react';
import {
    Satellite, RadioTower, Smartphone, Network, Clock, BarChart, PlayCircle, PauseCircle, StopCircle, List, Cpu, Timer, Activity, CheckCircle, AlertTriangle, XCircle, MonitorPlay, CalendarDays, Settings2, Milestone, FileText, Info, TrendingUp, PackageX, Save
} from 'lucide-react';
import { initialRunningScenarios } from '../../content/scenarios'; // Assuming this holds {id, name, status}
import { getSystemSummary, getAllActiveScenarioSummaries } from '../../content/systemSummary';
import type { Scenario, ScenarioStatus } from '../../App'; // Import Scenario types
import type { SystemSummaryStats } from '../../content/systemSummary'; // Import summary stats type

interface SystemSummaryTileProps {
  viewMode: 'global' | 'scenario'; // *** NEW: Control display mode ***
  scenarioId?: string | null; // Required for 'scenario' mode
  scenario?: Scenario | null; // Required for 'scenario' mode status
  activeScenarios?: Scenario[]; // Required for 'global' mode
  onMonitorClick?: (scenarioId: string) => void; // Required for 'global' mode
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
        {/* *** FIXED: Completed className and added children rendering *** */}
        <div className="text-sm text-albor-light-gray font-medium">
            {children}
        </div>
    </div>
);

// --- V1: Component for individual stat items (Global View) ---
const StatItem: React.FC<{ icon: React.ElementType; label: string; value: string | number; unit?: string }> =
    ({ icon: Icon, label, value, unit }) => (
    <div className="flex items-center space-x-2">
        <Icon className="text-albor-dark-gray" size={16} />
        <div>
            <div className="text-xs text-albor-dark-gray">{label}</div>
            <div className="text-sm font-semibold text-albor-light-gray">
                {value} {unit && <span className="text-xs text-albor-dark-gray">{unit}</span>}
            </div>
        </div>
    </div>
);

// --- Main Component ---
const SystemSummaryTile: React.FC<SystemSummaryTileProps> = ({
    viewMode,
    scenarioId,
    scenario,
    activeScenarios,
    onMonitorClick
}) => {
    const summaryData = useMemo(() => getSystemSummary(scenarioId ?? null), [scenarioId]);
    const allSummaries = useMemo(() => getAllActiveScenarioSummaries(activeScenarios?.map(s => s.id) ?? []), [activeScenarios]);

    const renderGlobalView = () => (
        <>
            <h3 className="text-base font-semibold text-albor-light-gray mb-3">Active Scenarios Summary</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="text-albor-dark-gray border-b border-albor-bg-dark">
                            <th className="py-1 px-2">Scenario</th>
                            <th className="py-1 px-2">Status</th>
                            <th className="py-1 px-2">Nodes</th>
                            <th className="py-1 px-2">Links</th>
                            <th className="py-1 px-2">Uptime</th>
                            <th className="py-1 px-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-albor-bg-dark">
                        {allSummaries.map(item => {
                            const runningScenario = activeScenarios?.find(s => s.id === item.id);
                            const statusInfo = getStatusInfo(runningScenario?.status ?? 'stopped');
                            return (
                                <tr key={item.id} className="hover:bg-albor-bg-dark/30">
                                    <td className="py-1.5 px-2 text-albor-light-gray font-medium truncate max-w-[100px]" title={item.name}>{item.name}</td>
                                    <td className="py-1.5 px-2">
                                        <span className={`flex items-center space-x-1 ${statusInfo.color}`}>
                                            <statusInfo.icon size={12} />
                                            <span>{statusInfo.text}</span>
                                        </span>
                                    </td>
                                    <td className="py-1.5 px-2">{item.summary.totalNodes}</td>
                                    <td className="py-1.5 px-2">{item.summary.activeLinks}</td>
                                    <td className="py-1.5 px-2">{item.summary.uptime}</td>
                                    <td className="py-1.5 px-2">
                                        <button
                                            onClick={() => onMonitorClick?.(item.id)}
                                            className="p-1 rounded text-albor-dark-gray hover:text-albor-orange hover:bg-albor-orange/10 transition-colors"
                                            title={`Monitor ${item.name}`}
                                        >
                                            <MonitorPlay size={14} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {allSummaries.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-4 text-albor-dark-gray italic">
                                    No active scenarios running.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );

    const renderScenarioView = () => {
        const statusInfo = getStatusInfo(scenario?.status ?? 'stopped');
        return (
            <>
                {/* Header with Status */}
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-albor-bg-dark/50">
                    <h3 className="text-sm font-semibold text-albor-light-gray">Scenario Details</h3>
                    <span className={`flex items-center space-x-1 text-xs font-medium px-1.5 py-0.5 rounded ${statusInfo.color} bg-opacity-20`}>
                        <statusInfo.icon size={12} />
                        <span>{statusInfo.text}</span>
                    </span>
                </div>

                {/* Grid for Stats */}
                <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-1 max-h-[calc(100%-3rem)]"> {/* Allow scrolling */}
                    <StatItemV2 icon={Milestone} label="Type"> {summaryData.scenarioType || 'N/A'} </StatItemV2>
                    <StatItemV2 icon={Settings2} label="Config"> {summaryData.configSummary || 'N/A'} </StatItemV2>
                    <StatItemV2 icon={Satellite} label="Satellites"> {summaryData.satellites} </StatItemV2>
                    <StatItemV2 icon={RadioTower} label="Ground Stations"> {summaryData.groundStations} </StatItemV2>
                    <StatItemV2 icon={Smartphone} label="User Terminals"> {summaryData.userTerminals} </StatItemV2>
                    <StatItemV2 icon={Network} label="Active Links"> {summaryData.activeLinks} </StatItemV2>
                    <StatItemV2 icon={Activity} label="Avg. Latency"> {summaryData.avgLatency?.toFixed(1) ?? 'N/A'} ms </StatItemV2>
                    <StatItemV2 icon={TrendingUp} label="Throughput"> {summaryData.throughput?.toFixed(1) ?? 'N/A'} Mbps </StatItemV2>
                    <StatItemV2 icon={PackageX} label="Packet Loss"> {summaryData.packetLoss?.toFixed(2) ?? 'N/A'} % </StatItemV2>
                    <StatItemV2 icon={Cpu} label="Used Ports"> {summaryData.usedPorts} </StatItemV2>
                    <StatItemV2 icon={CalendarDays} label="Start Time"> {summaryData.startTime || 'N/A'} </StatItemV2>
                    <StatItemV2 icon={Timer} label="Uptime"> {summaryData.uptime} </StatItemV2>
                    <StatItemV2 icon={Save} label="Last Saved"> {summaryData.lastSaved || 'N/A'} </StatItemV2>
                    <StatItemV2 icon={FileText} label="Description" className="col-span-2"> {summaryData.description || 'N/A'} </StatItemV2>
                </div>
            </>
        );
    };

    return (
        <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-3 rounded border border-albor-bg-dark/50 h-full flex flex-col"> {/* Ensure full height */}
            {viewMode === 'global' ? renderGlobalView() : renderScenarioView()}
        </div>
    );
};

export default SystemSummaryTile;
