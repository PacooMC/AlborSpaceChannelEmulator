import React from 'react';
import SystemSummaryTile from '../dashboard/SystemSummaryTile';
import OrbitMapTile from '../dashboard/OrbitMapTile';
import LinkOverviewTile from '../dashboard/LinkOverviewTile';
import PortAssignmentMap from '../dashboard/PortAssignmentTile';
import NotificationsPanel from '../dashboard/NotificationsPanel';
import AlertsPanel from '../dashboard/AlertsPanel';
import DashboardBottomBar from '../dashboard/DashboardBottomBar';
import { Scenario } from '../../App';

interface DashboardViewProps {
  selectedScenarioId: string | null; // Can be null for global view
  scenario?: Scenario | null; // Full scenario object if selected
}

const DashboardView: React.FC<DashboardViewProps> = ({ selectedScenarioId, scenario }) => {

  const isGlobalView = selectedScenarioId === null;

  const dashboardTitle = isGlobalView
    ? "Global System Overview"
    : `Dashboard: ${scenario?.name || 'Unknown Scenario'}`;

  const dashboardSubtitle = isGlobalView
    ? "Aggregated view across all active scenarios and system hardware."
    : `Status: ${scenario?.status || 'N/A'} | ID: ${scenario?.id || 'N/A'}`;

  return (
    <div className="flex flex-col h-full">
       <div className="mb-4 pb-2 border-b border-albor-bg-dark/50">
         <h1 className="text-xl font-semibold text-albor-light-gray">{dashboardTitle}</h1>
         <p className="text-xs text-albor-dark-gray">{dashboardSubtitle}</p>
       </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto p-1">

        {/* Main View (Live Tiles) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <SystemSummaryTile scenarioId={selectedScenarioId} />
          <OrbitMapTile scenarioId={selectedScenarioId} />
          <LinkOverviewTile className="md:col-span-2" scenarioId={selectedScenarioId} />
          {/* Port Assignment Map is likely global, but pass ID for consistency */}
          <PortAssignmentMap className="md:col-span-2" scenarioId={selectedScenarioId} />
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <NotificationsPanel scenarioId={selectedScenarioId} />
          <AlertsPanel scenarioId={selectedScenarioId} />
          <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex-1 min-h-[150px]">
             <h3 className="text-sm font-semibold text-albor-light-gray mb-2">Suggestions</h3>
             <p className="text-xs text-albor-dark-gray">
               {isGlobalView
                 ? "AI-driven suggestions for the overall system..."
                 : `AI-driven suggestions for '${scenario?.name || 'this scenario'}'...`}
             </p>
           </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <DashboardBottomBar scenarioId={selectedScenarioId} />
    </div>
  );
};

export default DashboardView;
