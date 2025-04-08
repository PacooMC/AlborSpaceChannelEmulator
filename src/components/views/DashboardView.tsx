import React from 'react';
import SystemSummaryTile from '../dashboard/SystemSummaryTile';
import OrbitMapTile from '../dashboard/OrbitMapTile';
import LinkOverviewTile from '../dashboard/LinkOverviewTile';
import PortAssignmentMap from '../dashboard/PortAssignmentTile';
import NotificationsPanel from '../dashboard/NotificationsPanel';
import AlertsPanel from '../dashboard/AlertsPanel';
import SuggestionsPanel from '../dashboard/SuggestionsPanel';
import { Scenario } from '../../App'; // Keep Scenario type for the list

interface DashboardViewProps {
  // selectedScenarioId: string | null; // Removed - View is always global
  // scenario?: Scenario | null; // Removed
  runningScenarios: Scenario[]; // Pass the list of running scenarios for the summary table
  onMonitorScenario: (id: string) => void; // Callback to navigate to monitoring view
}

const DashboardView: React.FC<DashboardViewProps> = ({ runningScenarios, onMonitorScenario }) => {

  // Titles are now always global
  const dashboardTitle = "Global System Overview";
  const dashboardSubtitle = "Aggregated view across all active scenarios and system hardware.";

  return (
    // Ensure the main container takes full height
    <div className="flex flex-col h-full">
       <div className="mb-4 pb-2 border-b border-albor-bg-dark/50 flex-shrink-0"> {/* Keep header */}
         <h1 className="text-xl font-semibold text-albor-light-gray">{dashboardTitle}</h1>
         <p className="text-xs text-albor-dark-gray">{dashboardSubtitle}</p>
       </div>

      {/* Main content area: flex-1 allows it to take remaining space, overflow-y-auto for scrolling */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto p-1 custom-scrollbar">

        {/* Main View (Live Tiles) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SystemSummaryTile now shows the global table */}
          <SystemSummaryTile
            viewMode="global" // Explicitly set to global view
            activeScenarios={runningScenarios.filter(s => s.status !== 'stopped')} // Pass active scenarios
            onMonitorClick={onMonitorScenario} // Pass navigation handler
          />
          {/* OrbitMapTile shows global view (scenarioId=null implicitly) */}
          <OrbitMapTile scenarioId={null} />
          {/* LinkOverviewTile shows global view */}
          <LinkOverviewTile className="md:col-span-2" scenarioId={null} />
          {/* PortAssignmentMap shows global view */}
          <PortAssignmentMap className="md:col-span-2" scenarioId={null} />
        </div>

        {/* Right Panel - Ensure this column also handles height correctly */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Panels show global info (scenarioId=null implicitly) */}
          <NotificationsPanel scenarioId={null} />
          <AlertsPanel scenarioId={null} />
          <div className="flex-1 min-h-[200px]">
             <SuggestionsPanel scenarioId={null} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
