import React from 'react';
import { Satellite, RadioTower, Smartphone, Network, Clock, BarChart, PlayCircle, PauseCircle, StopCircle, List } from 'lucide-react';
// Import scenario data and summary functions/data
import { initialRunningScenarios } from '../../content/scenarios';
import { getSystemSummary, globalSystemSummaryData } from '../../content/systemSummary';
import type { Scenario, ScenarioStatus } from '../../App'; // Import Scenario types
import type { SystemSummaryStats } from '../../content/systemSummary'; // Import summary stats type

interface SystemSummaryTileProps {
  scenarioId: string | null; // Null for global view
}

// Helper to get status icon
const getStatusIcon = (status: ScenarioStatus) => {
    switch (status) {
      case 'running': return <PlayCircle size={16} className="text-green-500 flex-shrink-0" />;
      case 'paused': return <PauseCircle size={16} className="text-yellow-500 flex-shrink-0" />;
      case 'stopped': return <StopCircle size={16} className="text-red-500 flex-shrink-0" />;
      default: return null;
    }
};

// Component for individual stat items (used in scenario view)
const StatItem: React.FC<{ icon: React.ElementType; label: string; value: string | number }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-2 text-sm">
    <Icon className="text-albor-orange" size={16} />
    <span className="text-albor-dark-gray">{label}:</span>
    <span className="text-albor-light-gray font-medium">{value}</span>
  </div>
);

// --- NEW: Component for Detailed Scenario Row (Global View) ---
interface ScenarioSummaryRowProps {
    scenario: Scenario;
    summary: SystemSummaryStats; // Pass the specific summary data for this scenario
}

const ScenarioSummaryRow: React.FC<ScenarioSummaryRowProps> = ({ scenario, summary }) => {
     const statusColor = scenario.status === 'running' ? 'text-green-400' : scenario.status === 'paused' ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="grid grid-cols-12 gap-x-2 items-center py-1.5 px-1 border-b border-albor-bg-dark/50 last:border-b-0 hover:bg-albor-bg-dark/30">
            {/* Name (col-span-5) */}
            <div className="col-span-5 flex items-center space-x-2 overflow-hidden">
                {getStatusIcon(scenario.status)}
                <span className="text-sm text-albor-light-gray truncate" title={scenario.name}>
                    {scenario.name}
                </span>
            </div>
            {/* Status Text (col-span-2) */}
            <div className={`col-span-2 text-xs font-medium capitalize ${statusColor}`}>
                {scenario.status}
            </div>
            {/* Active Links (col-span-2) */}
            <div className="col-span-2 text-sm text-albor-light-gray text-center">
                {summary.activeLinks}
            </div>
            {/* Used Ports (col-span-3) */}
            <div className="col-span-3 text-sm text-albor-light-gray text-center">
                {summary.usedPorts}
            </div>
        </div>
    );
};
// --- End of ScenarioSummaryRow ---


const SystemSummaryTile: React.FC<SystemSummaryTileProps> = ({ scenarioId }) => {
  const isGlobalView = scenarioId === null;

  // --- Global View Logic ---
  const activeScenarios = isGlobalView
    ? initialRunningScenarios.filter(s => s.id !== 'global-overview')
    : [];
  // Fetch summary data for each active scenario in global view
  const scenariosWithData = isGlobalView
    ? activeScenarios.map(scenario => ({
        scenario,
        summary: getSystemSummary(scenario.id) // Get specific data
      }))
    : [];

  // --- Scenario View Logic ---
  const scenarioSummaryData = !isGlobalView ? getSystemSummary(scenarioId) : null;

  const title = isGlobalView ? "Vista General de Escenarios" : "Resumen del Escenario";

  return (
    <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex flex-col min-h-[200px]">
      <h3 className="text-base font-semibold text-albor-light-gray mb-3">{title}</h3>

      {/* Conditional Rendering based on view */}
      {isGlobalView ? (
        // --- Global View Content ---
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-x-2 px-1 pb-1 border-b border-albor-dark-gray/50 mb-1 flex-shrink-0">
                <div className="col-span-5 text-xs font-semibold text-albor-dark-gray">Nombre</div>
                <div className="col-span-2 text-xs font-semibold text-albor-dark-gray">Estado</div>
                <div className="col-span-2 text-xs font-semibold text-albor-dark-gray text-center">Enlaces</div>
                <div className="col-span-3 text-xs font-semibold text-albor-dark-gray text-center">Puertos</div>
            </div>
            {/* Scenario List */}
            <div className="flex-1 overflow-y-auto -mr-2 pr-2">
                {scenariosWithData.length > 0 ? (
                    scenariosWithData.map(({ scenario, summary }) => (
                        <ScenarioSummaryRow key={scenario.id} scenario={scenario} summary={summary} />
                    ))
                ) : (
                    <p className="text-sm text-albor-dark-gray italic text-center mt-4">No hay escenarios activos.</p>
                )}
            </div>
             {/* Optional Footer for total count */}
             <div className="mt-auto pt-2 border-t border-albor-bg-dark/50 text-xs flex-shrink-0">
                 <div className="flex justify-end items-center">
                    <span className="text-albor-dark-gray flex items-center"><List size={12} className="mr-1"/>Total Escenarios:</span>
                    <span className="text-albor-light-gray font-medium ml-2">{activeScenarios.length}</span>
                 </div>
            </div>
        </div>
      ) : (
        // --- Scenario View Content ---
        scenarioSummaryData ? (
          <div className="flex-1 grid grid-cols-2 gap-y-3 gap-x-4">
            <StatItem icon={Satellite} label="Satélites" value={scenarioSummaryData.satellites} />
            <StatItem icon={RadioTower} label="Estaciones" value={scenarioSummaryData.groundStations} />
            <StatItem icon={Smartphone} label="Terminales" value={scenarioSummaryData.userTerminals} />
            <StatItem icon={Network} label="Enlaces Act." value={scenarioSummaryData.activeLinks} />
            <StatItem icon={BarChart} label="Puertos Usados" value={scenarioSummaryData.usedPorts} />
            <StatItem icon={Clock} label="Uptime Esc." value={scenarioSummaryData.uptime} />
          </div>
        ) : (
           <p className="text-sm text-albor-dark-gray italic text-center mt-4">Datos del escenario no disponibles.</p>
        )
      )}
    </div>
  );
};

export default SystemSummaryTile;
