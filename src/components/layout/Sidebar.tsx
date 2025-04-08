import React from 'react';
import { LayoutDashboard, ListChecks, BarChart2, Settings, HardDrive, PlayCircle, PauseCircle, StopCircle, Activity } from 'lucide-react';
// Import Scenario type which now includes status
import type { Scenario } from '../../content/scenarios';
import SavedScenariosPanel from './SavedScenariosPanel';
import { SavedScenarioInfo } from '../../content/scenarioStore';

type ViewName = 'dashboard' | 'scenarios' | 'monitoring' | 'system' | 'settings';

type SidebarProps = {
  activeView: ViewName;
  setActiveView: (viewName: ViewName) => void; // Renamed back for clarity, App handles logic
  runningScenarios: Scenario[]; // This now includes status
  onNavigateToMonitor: (id: string) => void; // Handler to navigate to monitor view
  savedScenarios: SavedScenarioInfo[];
  onLoadScenario: (id: string | null) => void; // Function to trigger loading in App/Editor
};

const mainNavItems = [
  { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' as const },
  { name: 'Scenarios', icon: ListChecks, view: 'scenarios' as const },
  { name: 'Monitoring', icon: Activity, view: 'monitoring' as const },
  { name: 'System', icon: HardDrive, view: 'system' as const },
  { name: 'Settings', icon: Settings, view: 'settings' as const },
];

// Helper to get status icon and tooltip based on ScenarioStatus
const getStatusInfo = (status: Scenario['status']): { icon: React.ElementType; color: string; title: string } => {
  switch (status) {
    case 'running': return { icon: PlayCircle, color: 'text-green-500', title: 'Running' };
    case 'paused': return { icon: PauseCircle, color: 'text-yellow-500', title: 'Paused' };
    case 'stopped': return { icon: StopCircle, color: 'text-red-500', title: 'Stopped' };
    default: return { icon: StopCircle, color: 'text-gray-500', title: 'Unknown' }; // Fallback
  }
};

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView, // Use the handler passed from App
  runningScenarios,
  onNavigateToMonitor, // Use the monitor navigation handler
  savedScenarios,
  onLoadScenario,
}) => {

  // Handler to load scenario from Saved Panel (triggers editor load)
  const handleLoadFromSavedPanel = (id: string | null) => {
      onLoadScenario(id);
  };


  return (
    <aside className="w-64 bg-albor-bg-dark/80 backdrop-blur-sm p-4 border-r border-albor-bg-dark/50 flex flex-col overflow-y-auto">
      {/* Main Navigation */}
      <nav className="space-y-1 mb-4 flex-shrink-0"> {/* Reduced bottom margin */}
        {mainNavItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveView(item.view)} // Call the handler from App
            className={`flex items-center w-full p-2 rounded cursor-pointer group transition-colors duration-150 ease-in-out
              ${ activeView === item.view
                ? 'bg-albor-orange/20 text-albor-orange shadow-inner'
                : 'text-albor-light-gray hover:bg-albor-bg-dark/60 hover:text-white'
              }`}
          >
            <item.icon
              size={18}
              className={`mr-3 transition-colors duration-150 ease-in-out
                ${ activeView === item.view
                  ? 'text-albor-orange'
                  : 'text-albor-dark-gray group-hover:text-albor-light-gray'
                }`}
            />
            <span className={`text-sm font-medium ${ activeView === item.view ? 'text-albor-orange' : ''}`}>
              {item.name}
            </span>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <hr className="border-t border-albor-bg-dark/50 my-3 flex-shrink-0" />

      {/* Running/Active Scenarios Section */}
      <div className="space-y-1 mb-4 flex-shrink-0">
         <h3 className="text-xs font-semibold text-albor-dark-gray uppercase tracking-wider mb-2 px-1">Active Scenarios</h3>
         {/* Filter out stopped scenarios from this list */}
         {runningScenarios.filter(s => s.status !== 'stopped').length > 0 ? (
            runningScenarios.filter(s => s.status !== 'stopped').map((scenario) => {
              const statusInfo = getStatusInfo(scenario.status); // Get icon, color, title
              // Check if this scenario is the one being monitored
              // Note: This requires knowing which scenario is currently in the MonitoringView.
              // Since Sidebar doesn't know this directly, we'll use activeView === 'monitoring'
              // and potentially compare with a hypothetical 'monitoringTargetId' if passed down.
              // For now, let's just style the hover state more distinctly.
              const isBeingMonitored = activeView === 'monitoring'; // Simplified check

              return (
                <button
                  key={scenario.id}
                  onClick={() => onNavigateToMonitor(scenario.id)}
                  className={`flex items-center justify-between w-full p-1.5 rounded cursor-pointer group transition-colors duration-150 ease-in-out text-left text-albor-light-gray hover:bg-albor-bg-dark/60 border border-transparent hover:border-albor-dark-gray`} // Added border on hover
                   title={`Monitor Scenario: ${scenario.name} (${statusInfo.title})`}
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <statusInfo.icon size={14} className={`${statusInfo.color} flex-shrink-0`} />
                    <span className="text-xs truncate">{scenario.name}</span>
                  </div>
                  {/* Optional: Add an indicator if it's being monitored */}
                  {/* {isBeingMonitored && <Activity size={12} className="text-albor-orange animate-pulse" />} */}
                </button>
              );
            })
         ) : (
           <p className="text-xs text-albor-dark-gray px-1 italic">No running or paused scenarios.</p>
         )}
      </div>

      {/* Divider */}
      <hr className="border-t-2 border-albor-bg-dark/70 my-4 flex-shrink-0" /> {/* Thicker divider */}

      {/* Saved Scenarios Panel - Wrapped for styling */}
      <div className="flex-1 flex flex-col min-h-0 border border-albor-bg-dark/50 rounded-md p-2 bg-albor-deep-space/30">
          <SavedScenariosPanel
              savedScenarios={savedScenarios}
              selectedScenarioIds={new Set()} // Selection managed in editor view now
              onLoadScenario={handleLoadFromSavedPanel}
              onToggleSelection={() => {}} // Selection managed in editor view now
              initiallyOpen={true}
          />
      </div>

    </aside>
  );
};

export default Sidebar;
