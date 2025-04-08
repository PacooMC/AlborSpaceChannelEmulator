import React, { useState, useCallback, useEffect } from 'react';
    import Header from './components/layout/Header';
    import Sidebar from './components/layout/Sidebar'; // Main app sidebar
    import MainContentArea from './components/layout/MainContentArea';
    import DashboardView from './components/views/DashboardView';
    import ScenarioEditorView from './components/views/ScenarioEditorView';
    import MonitoringView from './components/views/MonitoringView';
    import SystemManagementView from './components/views/SystemManagementView';
    import SettingsView from './components/views/SettingsView';
    import { initialRunningScenarios } from './content/scenarios'; // Keep for running state simulation
    import type { Scenario, ScenarioStatus } from './content/scenarios'; // Keep type
    import { getScenarioList, SavedScenarioInfo } from './content/scenarioStore'; // Import store functions

    type ViewName = 'dashboard' | 'scenarios' | 'monitoring' | 'system' | 'settings';

    function App() {
      const [activeView, setActiveView] = useState<ViewName>('dashboard');
      // Running scenarios state remains for simulation/monitoring view context
      const [runningScenarios, setRunningScenarios] = useState<Scenario[]>(
          initialRunningScenarios.filter(s => s.id !== 'global-overview')
      );
      const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null); // For dashboard/monitoring context
      const [isLoading, setIsLoading] = useState<boolean>(false); // General loading state
      const [editorScenarioId, setEditorScenarioId] = useState<string | null>(null); // ID of scenario to load in editor
      const [savedScenarioListForSidebar, setSavedScenarioListForSidebar] = useState<SavedScenarioInfo[]>([]); // List for the main sidebar (if needed)

      // Fetch saved scenarios for the main sidebar (if it needs it)
      const refreshSavedListForSidebar = useCallback(async () => {
          try {
              const list = await getScenarioList();
              setSavedScenarioListForSidebar(list);
          } catch (error) {
              console.error("App: Error fetching scenario list for sidebar:", error);
          }
      }, []);

      useEffect(() => {
          refreshSavedListForSidebar();
      }, [refreshSavedListForSidebar]);


      const selectedScenario = runningScenarios.find(s => s.id === selectedScenarioId) || null;

      const getHeaderTitle = () => {
        switch (activeView) {
            case 'dashboard':
                // Find name from running list OR potentially saved list if not running?
                const dashScenario = runningScenarios.find(s => s.id === selectedScenarioId)
                                    // || savedScenarioListForSidebar.find(s => s.id === selectedScenarioId); // Optional: Check saved list too
                return dashScenario?.name || "Global System Overview";
            case 'scenarios':
                // Title is handled within the editor now based on loaded scenario name
                return "Scenario Editor";
            case 'monitoring':
                const monitoredScenario = runningScenarios.find(s => s.id === selectedScenarioId);
                return monitoredScenario ? `Monitoring: ${monitoredScenario.name}` : "Global Monitoring";
            case 'system':
                return selectedScenario ? `System: ${selectedScenario.name}` : "Global System Management";
            case 'settings':
                return "Settings";
            default:
                return "Channel Emulator";
        }
      };

      // --- Simulation Start Logic ---
      const handleStartScenario = useCallback(async (id: string, name: string) => {
        if (!id || isLoading) return;
        console.log(`App: Attempting to start scenario: ${name} (${id})`);
        setIsLoading(true);

        // Simulate loading/preparation time
        await new Promise(resolve => setTimeout(resolve, 1500));

        setRunningScenarios(prevScenarios => {
          if (prevScenarios.some(s => s.id === id)) {
            console.log(`App: Scenario ${id} is already running.`);
            // Optionally update status if needed, e.g., from paused to running
            return prevScenarios.map(s => s.id === id ? { ...s, status: 'running' } : s);
          }
          // Add the new scenario to the running list
          const newScenario: Scenario = { id, name, status: 'running' };
          console.log(`App: Adding scenario ${id} to running list.`);
          return [...prevScenarios, newScenario];
        });

        setSelectedScenarioId(id); // Set context for monitoring/dashboard view
        setActiveView('monitoring'); // Switch view to monitoring after starting
        setIsLoading(false);
        console.log(`App: Scenario ${id} started, switching to monitoring view.`);

      }, [isLoading]);

      // --- Scenario Load Trigger (Called by Editor Sidebar) ---
      // This function now ONLY tells the App which scenario ID the editor should load/display.
      // The actual loading logic is inside ScenarioEditorContent.
      const handleLoadScenarioTrigger = useCallback((id: string | null) => {
        console.log(`App: Requesting editor to load scenario ID: ${id ?? 'new'}`);
        setEditorScenarioId(id); // Update the ID for the editor view
        setActiveView('scenarios'); // Ensure the editor view is active
        setSelectedScenarioId(null); // Deselect any active dashboard/monitoring context
      }, []);

      // --- Callback for when Editor Saves/Deletes ---
      // This allows the App to refresh lists if necessary (e.g., for the main sidebar)
      const handleScenarioEditorAction = useCallback(() => {
          console.log("App: Notified by editor of save/delete action.");
          refreshSavedListForSidebar(); // Refresh the list used by the main sidebar
      }, [refreshSavedListForSidebar]);


      const renderView = () => {
        switch (activeView) {
          case 'dashboard':
            return <DashboardView selectedScenarioId={selectedScenarioId} scenario={selectedScenario} />;
          case 'scenarios':
            return (
              <ScenarioEditorView
                scenarioIdToLoad={editorScenarioId} // Pass the ID to load
                isLoadingScenario={isLoading} // Pass App's loading state
                onStartScenario={handleStartScenario} // Pass start handler
                onLoadScenario={handleLoadScenarioTrigger} // Pass load trigger handler
                onScenarioSaved={handleScenarioEditorAction} // Pass notification handler
              />
            );
          case 'monitoring':
            // Pass necessary data for the selected running scenario
            return <MonitoringView /* selectedScenarioId={selectedScenarioId} scenario={selectedScenario} */ />;
          case 'system':
            return <SystemManagementView /* selectedScenarioId={selectedScenarioId} scenario={selectedScenario} */ />;
          case 'settings':
            return <SettingsView />;
          default:
            return <DashboardView selectedScenarioId={selectedScenarioId} scenario={selectedScenario} />;
        }
      };

      return (
        <div className="flex flex-col h-screen text-albor-light-gray font-sans overflow-hidden">
          <Header selectedScenarioName={getHeaderTitle()} />
          <div className="flex flex-1 overflow-hidden">
            {/* Main Sidebar might still need the saved list for quick loading */}
            <Sidebar
              activeView={activeView}
              setActiveView={setActiveView}
              runningScenarios={runningScenarios}
              selectedScenarioId={selectedScenarioId}
              setSelectedScenarioId={setSelectedScenarioId}
              // Pass saved list and load trigger if sidebar needs them
              savedScenarios={savedScenarioListForSidebar}
              onLoadScenario={handleLoadScenarioTrigger}
            />
            <MainContentArea>
              {renderView()}
            </MainContentArea>
          </div>
        </div>
      )
    }

    export default App
