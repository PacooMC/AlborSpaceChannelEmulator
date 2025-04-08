import React from 'react';
import SystemSummaryTile from '../dashboard/SystemSummaryTile';
import OrbitMapTile from '../dashboard/OrbitMapTile';
import LinkOverviewTile from '../dashboard/LinkOverviewTile';
import PortAssignmentMap from '../dashboard/PortAssignmentTile';
import NotificationsPanel from '../dashboard/NotificationsPanel';
import AlertsPanel from '../dashboard/AlertsPanel';
// Removed DashboardBottomBar import
import SuggestionsPanel from '../dashboard/SuggestionsPanel'; // Import the new SuggestionsPanel
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
          <SystemSummaryTile scenarioId={selectedScenarioId} />
          {/* OrbitMapTile might need explicit height or aspect ratio if content varies */}
          <OrbitMapTile /> {/* Removed scenarioId prop if not used */}
          <LinkOverviewTile className="md:col-span-2" scenarioId={selectedScenarioId} />
          <PortAssignmentMap className="md:col-span-2" scenarioId={selectedScenarioId} />
        </div>

        {/* Right Panel - Ensure this column also handles height correctly */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <NotificationsPanel scenarioId={selectedScenarioId} />
          <AlertsPanel scenarioId={selectedScenarioId} />
          {/* Use the new SuggestionsPanel, ensure it fills space */}
          <div className="flex-1 min-h-[200px]"> {/* Wrapper to help with flex sizing */}
             <SuggestionsPanel scenarioId={selectedScenarioId} />
          </div>
        </div>
      </div>

      {/* Removed DashboardBottomBar */}
    </div>
  );
};

export default DashboardView;
