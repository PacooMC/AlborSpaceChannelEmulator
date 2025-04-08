import React from 'react';
    import { LayoutDashboard, ListChecks, BarChart2, Settings, HardDrive, PlayCircle, PauseCircle, StopCircle } from 'lucide-react';
    import type { Scenario } from '../../content/scenarios'; // Keep Scenario type
    import SavedScenariosPanel from './SavedScenariosPanel'; // Import the panel
    import { SavedScenarioInfo } from '../../content/scenarioStore'; // Import type from store

    type ViewName = 'dashboard' | 'scenarios' | 'monitoring' | 'system' | 'settings';

    // Removed SavedScenarioInfo type definition here

    type SidebarProps = {
      activeView: ViewName;
      setActiveView: (viewName: ViewName) => void;
      runningScenarios: Scenario[];
      selectedScenarioId: string | null;
      setSelectedScenarioId: (id: string | null) => void;
      // --- Updated Props ---
      savedScenarios: SavedScenarioInfo[]; // List of saved scenarios from store
      onLoadScenario: (id: string | null) => void; // Function to trigger loading in App/Editor
      // onDeleteScenario is likely handled within the editor now
    };

    const mainNavItems = [
      { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' as const },
      { name: 'Scenarios', icon: ListChecks, view: 'scenarios' as const },
      { name: 'Monitoring', icon: BarChart2, view: 'monitoring' as const },
      { name: 'System', icon: HardDrive, view: 'system' as const },
      { name: 'Settings', icon: Settings, view: 'settings' as const },
    ];

    const getStatusIcon = (status: Scenario['status']) => {
      switch (status) {
        case 'running': return <PlayCircle size={14} className="text-green-500" />;
        case 'paused': return <PauseCircle size={14} className="text-yellow-500" />;
        case 'stopped': return <StopCircle size={14} className="text-red-500" />;
        default: return null;
      }
    };

    const Sidebar: React.FC<SidebarProps> = ({
      activeView,
      setActiveView,
      runningScenarios,
      selectedScenarioId,
      setSelectedScenarioId,
      // --- Use Updated Props ---
      savedScenarios,
      onLoadScenario,
    }) => {

      const handleScenarioSelect = (scenarioId: string) => {
        setSelectedScenarioId(scenarioId);
        setActiveView('dashboard'); // Switch to dashboard for the selected running scenario
      };

      const handleGlobalDashboardSelect = () => {
        setSelectedScenarioId(null);
        setActiveView('dashboard');
      };

      // --- Handler to load scenario from Saved Panel ---
      // This calls the App's trigger function
      const handleLoadFromSavedPanel = (id: string | null) => {
          onLoadScenario(id); // Call the prop function passed from App
          // No need to switch view here, App handles it based on the load trigger
      };


      return (
        <aside className="w-64 bg-albor-bg-dark/80 backdrop-blur-sm p-4 border-r border-albor-bg-dark/50 flex flex-col overflow-y-auto">
          {/* Main Navigation */}
          <nav className="space-y-1 mb-6 flex-shrink-0"> {/* Prevent shrinking */}
            {mainNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  if (item.view === 'dashboard') {
                    handleGlobalDashboardSelect();
                  } else if (item.view === 'scenarios') {
                    // When clicking "Scenarios", trigger load of null (new scenario)
                    // or keep the currently loaded editor scenario? Let's load null for now.
                    handleLoadFromSavedPanel(null);
                  }
                   else {
                    setActiveView(item.view);
                    setSelectedScenarioId(null); // Clear scenario context for non-dashboard/scenario views
                  }
                }}
                className={`flex items-center w-full p-2 rounded cursor-pointer group transition-colors duration-150 ease-in-out
                  ${ (activeView === item.view && item.view === 'dashboard' && selectedScenarioId === null) ||
                    (activeView === item.view && item.view !== 'dashboard')
                    ? 'bg-albor-orange/20 text-albor-orange shadow-inner'
                    : 'text-albor-light-gray hover:bg-albor-bg-dark/60 hover:text-white'
                  }`}
              >
                <item.icon
                  size={18}
                  className={`mr-3 transition-colors duration-150 ease-in-out
                    ${ (activeView === item.view && item.view === 'dashboard' && selectedScenarioId === null) ||
                      (activeView === item.view && item.view !== 'dashboard')
                      ? 'text-albor-orange'
                      : 'text-albor-dark-gray group-hover:text-albor-light-gray'
                    }`}
                />
                <span className={`text-sm font-medium ${ (activeView === item.view && item.view === 'dashboard' && selectedScenarioId === null) ||
                  (activeView === item.view && item.view !== 'dashboard')
                  ? 'text-albor-orange' : ''}`}>
                  {item.name}
                </span>
              </button>
            ))}
          </nav>

          {/* Running Scenarios Section */}
          <div className="space-y-1 mb-4 flex-shrink-0"> {/* Prevent shrinking */}
             <h3 className="text-xs font-semibold text-albor-dark-gray uppercase tracking-wider mb-2 px-1">Active Scenarios</h3>
             {runningScenarios.length > 0 ? (
                runningScenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => handleScenarioSelect(scenario.id)}
                    className={`flex items-center justify-between w-full p-2 rounded cursor-pointer group transition-colors duration-150 ease-in-out text-left
                      ${ selectedScenarioId === scenario.id && (activeView === 'dashboard' || activeView === 'monitoring') // Highlight if selected for dash or monitoring
                        ? 'bg-albor-bg-dark/70 ring-1 ring-albor-orange/50'
                        : 'text-albor-light-gray hover:bg-albor-bg-dark/60'
                      }`}
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

          {/* Saved Scenarios Panel - Allow to take remaining space */}
          <div className="flex-1 flex flex-col min-h-0">
              <SavedScenariosPanel
                  savedScenarios={savedScenarios}
                  selectedScenarioIds={new Set()} // Main sidebar doesn't manage selection state
                  onLoadScenario={handleLoadFromSavedPanel} // Use the specific handler
                  onToggleSelection={() => {}} // No multi-select actions here
                  initiallyOpen={true} // Keep open
              />
          </div>

        </aside>
      );
    };

    export default Sidebar;
