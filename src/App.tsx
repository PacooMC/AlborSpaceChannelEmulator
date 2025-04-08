import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MainContentArea from './components/layout/MainContentArea';
import DashboardView from './components/views/DashboardView';
import ScenarioEditorView from './components/views/ScenarioEditorView';
import MonitoringView from './components/views/MonitoringView';
import SystemManagementView from './components/views/SystemManagementView';
import SettingsView from './components/views/SettingsView';
// Import Scenario type and initial data
import { Scenario, ScenarioStatus, initialRunningScenarios } from './content/scenarios';
import { getScenarioList, SavedScenarioInfo } from './content/scenarioStore';
import { getSystemSummary, SystemSummaryStats } from './content/systemSummary'; // Import summary type

type ViewName = 'dashboard' | 'scenarios' | 'monitoring' | 'system' | 'settings';

function App() {
  const [activeView, setActiveView] = useState<ViewName>('dashboard');
  const [runningScenarios, setRunningScenarios] = useState<Scenario[]>(initialRunningScenarios);
  // selectedScenarioId is NO LONGER USED by DashboardView directly, kept for potential future context needs?
  // Let's remove it for now to avoid confusion. If needed later, we can re-add.
  // const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editorScenarioId, setEditorScenarioId] = useState<string | null>(null);
  const [savedScenarioListForSidebar, setSavedScenarioListForSidebar] = useState<SavedScenarioInfo[]>([]);
  // *** NEW: State to track which scenario to monitor ***
  const [monitoringTargetScenarioId, setMonitoringTargetScenarioId] = useState<string | null>(null);

  // Fetch saved scenarios for the main sidebar
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

  // --- Simulation Start Logic ---
  const handleStartScenario = useCallback(async (id: string, name: string) => {
    if (!id || isLoading) return;
    console.log(`App: Attempting to start scenario: ${name} (${id})`);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

    let scenarioStarted = false;
    setRunningScenarios(prevScenarios => {
      const existingScenario = prevScenarios.find(s => s.id === id);
      if (existingScenario) {
        scenarioStarted = true;
        return prevScenarios.map(s => s.id === id ? { ...s, status: 'running' } : s);
      } else {
        const newScenario: Scenario = { id, name, status: 'running' };
        scenarioStarted = true;
        return [...prevScenarios, newScenario];
      }
    });

    if (scenarioStarted) {
        // *** Navigate to monitoring view for the started scenario ***
        setMonitoringTargetScenarioId(id);
        setActiveView('monitoring');
        console.log(`App: Scenario ${id} started/running, switching to monitoring view.`);
    }
    setIsLoading(false);
  }, [isLoading]);

  // --- Simulation Control Handlers ---
  const handlePauseScenario = useCallback((id: string) => {
    console.log(`App: Pausing scenario ${id}`);
    setRunningScenarios(prev => prev.map(s => s.id === id ? { ...s, status: 'paused' } : s));
  }, []);

  const handleResumeScenario = useCallback((id: string) => {
    console.log(`App: Resuming scenario ${id}`);
    setRunningScenarios(prev => prev.map(s => s.id === id ? { ...s, status: 'running' } : s));
  }, []);

  const handleStopScenario = useCallback((id: string) => {
    console.log(`App: Stopping scenario ${id}`);
    setRunningScenarios(prev => prev.map(s => s.id === id ? { ...s, status: 'stopped' } : s));
    // If the stopped scenario was being monitored, clear the target
    if (monitoringTargetScenarioId === id) {
        setMonitoringTargetScenarioId(null);
    }
  }, [monitoringTargetScenarioId]); // Add dependency

  // --- Scenario Load Trigger (Editor) ---
  const handleLoadScenarioTrigger = useCallback((id: string | null) => {
    console.log(`App: Requesting editor to load scenario ID: ${id ?? 'new'}`);
    setEditorScenarioId(id);
    setActiveView('scenarios');
    setMonitoringTargetScenarioId(null); // Clear monitoring target when editing
  }, []);

  // --- Callback for Editor Save/Delete ---
  const handleScenarioEditorAction = useCallback(() => {
      console.log("App: Notified by editor of save/delete action.");
      refreshSavedListForSidebar();
      // If a scenario being monitored was deleted, we might need to clear monitoringTargetScenarioId
      // This requires more complex logic checking if the ID still exists in the store.
      // For now, just refresh the list.
  }, [refreshSavedListForSidebar]);

  // --- NEW: Handler to navigate to Monitoring View ---
  const handleNavigateToMonitor = useCallback((id: string) => {
      console.log(`App: Navigating to monitor scenario ${id}`);
      setMonitoringTargetScenarioId(id);
      setActiveView('monitoring');
  }, []);

  // --- NEW: Handler for main nav clicks ---
  const handleMainNavClick = useCallback((view: ViewName) => {
      setActiveView(view);
      if (view === 'scenarios') {
          handleLoadScenarioTrigger(null); // Load new scenario editor
      }
      // Clear monitoring target unless navigating TO monitoring
      if (view !== 'monitoring') {
          setMonitoringTargetScenarioId(null);
      }
      // If navigating TO monitoring without a specific target yet,
      // the MonitoringView component will handle default selection.
  }, [handleLoadScenarioTrigger]); // Add dependency


  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        // DashboardView is now always global, pass navigation handler
        return <DashboardView
                    runningScenarios={runningScenarios}
                    onMonitorScenario={handleNavigateToMonitor}
                />;
      case 'scenarios':
        return (
          <ScenarioEditorView
            scenarioIdToLoad={editorScenarioId}
            isLoadingScenario={isLoading}
            onStartScenario={handleStartScenario}
            onLoadScenario={handleLoadScenarioTrigger}
            onScenarioSaved={handleScenarioEditorAction}
          />
        );
      case 'monitoring':
        // Pass the specific scenario ID to monitor
        return (
            <MonitoringView
                scenarioIdToMonitor={monitoringTargetScenarioId}
                allRunningScenarios={runningScenarios} // Pass the full list for dropdown
                onPauseScenario={handlePauseScenario}
                onResumeScenario={handleResumeScenario}
                onStopScenario={handleStopScenario}
            />
        );
      case 'system':
        return <SystemManagementView />;
      case 'settings':
        return <SettingsView />;
      default:
        // Default back to global dashboard
        return <DashboardView
                    runningScenarios={runningScenarios}
                    onMonitorScenario={handleNavigateToMonitor}
                />;
    }
  };

  return (
    <div className="flex flex-col h-screen text-albor-light-gray font-sans overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Pass the new main nav click handler and monitor navigation handler */}
        <Sidebar
          activeView={activeView}
          setActiveView={handleMainNavClick} // Use the new handler
          runningScenarios={runningScenarios}
          // selectedScenarioIdForContext={selectedScenarioId} // Removed
          // setSelectedScenarioIdForContext={setSelectedScenarioId} // Removed
          onNavigateToMonitor={handleNavigateToMonitor} // Pass monitor navigation handler
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

export default App;
