import React from 'react';
import { LayoutDashboard, ListChecks, BarChart2, Settings, HardDrive, PlayCircle, PauseCircle, StopCircle, Activity } from 'lucide-react';
import type { Scenario } from '../../content/scenarios';
import SavedScenariosPanel from './SavedScenariosPanel';
import { SavedScenarioInfo } from '../../content/scenarioStore';

type ViewName = 'dashboard' | 'scenarios' | 'monitoring' | 'system' | 'settings';

type SidebarProps = {
  activeView: ViewName;
  setActiveView: (viewName: ViewName) => void;
  runningScenarios: Scenario[];
  // Renamed props for clarity: This is for Dashboard context
  selectedScenarioIdForContext: string | null;
  setSelectedScenarioIdForContext: (id: string | null) => void;
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

const getStatusIcon = (status: Scenario['status']) => {
  switch (status) {
    case 'running': return <PlayCircle size={14} className="text-green-500 flex-shrink-0" />;
    case 'paused': return <PauseCircle size={14} className="text-yellow-500 flex-shrink-0" />;
    case 'stopped': return <StopCircle size={14} className="text-red-500 flex-shrink-0" />;
    default: return null;
  }
};

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  runningScenarios,
  selectedScenarioIdForContext, // Use renamed prop
  setSelectedScenarioIdForContext, // Use renamed prop
  savedScenarios,
  onLoadScenario,
}) => {

  // Handle selecting a running scenario to view its Dashboard data
  const handleScenarioContextSelect = (scenarioId: string) => {
    setSelectedScenarioIdForContext(scenarioId); // Set the context for the Dashboard
    setActiveView('dashboard'); // Switch to dashboard view when a scenario is clicked
  };

  // Handle clicking a main navigation item
  const handleMainNavClick = (view: ViewName) => {
      setActiveView(view);
      // If navigating TO scenarios, trigger load of null (new scenario)
      if (view === 'scenarios') {
          onLoadScenario(null);
      }
      // Clear dashboard context if navigating away from dashboard
      if (view !== 'dashboard') {
          setSelectedScenarioIdForContext(null);
      }
  };


  // Handler to load scenario from Saved Panel (triggers editor load)
  const handleLoadFromSavedPanel = (id: string | null) => {
      onLoadScenario(id); // Call the prop function passed from App
  };


  return (
    <aside className="w-64 bg-albor-bg-dark/80 backdrop-blur-sm p-4 border-r border-albor-bg-dark/50 flex flex-col overflow-y-auto">
      {/* Main Navigation */}
      <nav className="space-y-1 mb-6 flex-shrink-0">
        {mainNavItems.map((item) => (
          <button
            key={item.name}
            onClick={() => handleMainNavClick(item.view)}
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

      {/* Running Scenarios Section - Now primarily for Dashboard context selection */}
      <div className="space-y-1 mb-4 flex-shrink-0">
         <h3 className="text-xs font-semibold text-albor-dark-gray uppercase tracking-wider mb-2 px-1">Active Scenarios</h3>
         {runningScenarios.length > 0 ? (
            runningScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleScenarioContextSelect(scenario.id)} // Use context select handler
                className={`flex items-center justify-between w-full p-2 rounded cursor-pointer group transition-colors duration-150 ease-in-out text-left
                  ${ selectedScenarioIdForContext === scenario.id && activeView === 'dashboard' // Highlight only if selected for dashboard
                    ? 'bg-albor-bg-dark/70 ring-1 ring-albor-orange/50'
                    : 'text-albor-light-gray hover:bg-albor-bg-dark/60'
                  }`}
                 title={`View Dashboard for ${scenario.name}`}
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  {getStatusIcon(scenario.status)}
                  <span className="text-xs truncate">{scenario.name}</span>
                </div>
              </button>
            ))
         ) : (
           <p className="text-xs text-albor-dark-gray px-1 italic">No active scenarios.</p>
         )}
      </div>

      {/* Saved Scenarios Panel - For loading into editor */}
      <div className="flex-1 flex flex-col min-h-0">
          <SavedScenariosPanel
              savedScenarios={savedScenarios}
              selectedScenarioIds={new Set()}
              onLoadScenario={handleLoadFromSavedPanel}
              onToggleSelection={() => {}}
              initiallyOpen={true}
          />
      </div>

    </aside>
  );
};

export default Sidebar;
