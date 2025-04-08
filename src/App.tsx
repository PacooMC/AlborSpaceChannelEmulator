import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MainContentArea from './components/layout/MainContentArea';
import DashboardView from './components/views/DashboardView';
import ScenarioEditorView from './components/views/ScenarioEditorView';
import MonitoringView from './components/views/MonitoringView';
import SystemManagementView from './components/views/SystemManagementView';
import SettingsView from './components/views/SettingsView';
import { initialRunningScenarios } from './content/scenarios';
import type { Scenario, ScenarioStatus } from './content/scenarios';
import { getScenarioList, SavedScenarioInfo } from './content/scenarioStore';

type ViewName = 'dashboard' | 'scenarios' | 'monitoring' | 'system' | 'settings';

function App() {
  const [activeView, setActiveView] = useState<ViewName>('dashboard');
  const [runningScenarios, setRunningScenarios] = useState<Scenario[]>(
      initialRunningScenarios.filter(s => s.id !== 'global-overview')
  );
  // selectedScenarioId is now primarily for Dashboard context, Monitoring manages its own internal selection
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editorScenarioId, setEditorScenarioId] = useState<string | null>(null);
  const [savedScenarioListForSidebar, setSavedScenarioListForSidebar] = useState<SavedScenarioInfo[]>([]);

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

  // Find the full scenario object based on the selected ID (for Dashboard)
  const selectedScenarioForDashboard = runningScenarios.find(s => s.id === selectedScenarioId) || null;

  // --- Default Scenario Selection Logic for Dashboard ---
  useEffect(() => {
    // If navigating to Dashboard and no scenario is selected, select the first running one.
    if (activeView === 'dashboard' && selectedScenarioId === null && runningScenarios.length > 0) {
      console.log("App: Defaulting dashboard scenario to first running:", runningScenarios[0].id);
      setSelectedScenarioId(runningScenarios[0].id);
    }
    // If dashboard is active but the selected scenario is no longer running, clear selection (or select first running)
    else if (activeView === 'dashboard' && selectedScenarioId && !runningScenarios.some(s => s.id === selectedScenarioId)) {
        console.log("App: Selected dashboard scenario no longer running. Clearing selection.");
        setSelectedScenarioId(runningScenarios.length > 0 ? runningScenarios[0].id : null);
    }
  }, [activeView, selectedScenarioId, runningScenarios]);


  // --- Simulation Start Logic ---
  const handleStartScenario = useCallback(async (id: string, name: string) => {
    if (!id || isLoading) return;
    console.log(`App: Attempting to start scenario: ${name} (${id})`);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

    let scenarioStarted = false;
    setRunningScenarios(prevScenarios => {
      if (prevScenarios.some(s => s.id === id)) {
        scenarioStarted = true; // Already running
        return prevScenarios.map(s => s.id === id ? { ...s, status: 'running' } : s);
      }
      const newScenario: Scenario = { id, name, status: 'running' };
      scenarioStarted = true;
      return [...prevScenarios, newScenario];
    });

    if (scenarioStarted) {
        // Don't force setSelectedScenarioId here, let MonitoringView handle its selection
        setActiveView('monitoring'); // Switch view
        console.log(`App: Scenario ${id} started/running, switching to monitoring view.`);
    }
    setIsLoading(false);
  }, [isLoading]);

  // --- Scenario Load Trigger (Editor) ---
  const handleLoadScenarioTrigger = useCallback((id: string | null) => {
    console.log(`App: Requesting editor to load scenario ID: ${id ?? 'new'}`);
    setEditorScenarioId(id);
    setActiveView('scenarios');
    setSelectedScenarioId(null); // Clear dashboard context when editing
  }, []);

  // --- Callback for Editor Save/Delete ---
  const handleScenarioEditorAction = useCallback(() => {
      console.log("App: Notified by editor of save/delete action.");
      refreshSavedListForSidebar();
      // Potentially update runningScenarios if a running one was deleted/renamed
      // For simplicity now, just refresh saved list.
  }, [refreshSavedListForSidebar]);


  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        // Dashboard uses selectedScenarioId managed by App
        return <DashboardView selectedScenarioId={selectedScenarioId} scenario={selectedScenarioForDashboard} />;
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
        // Monitoring view now receives the list of running scenarios
        // It will manage its own internal selection state.
        return <MonitoringView runningScenarios={runningScenarios} />;
      case 'system':
        return <SystemManagementView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView selectedScenarioId={selectedScenarioId} scenario={selectedScenarioForDashboard} />;
    }
  };

  return (
    <div className="flex flex-col h-screen text-albor-light-gray font-sans overflow-hidden">
      {/* Header is now simpler */}
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar manages view changes and editor loading */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          runningScenarios={runningScenarios}
          selectedScenarioIdForContext={selectedScenarioId} // Pass dashboard context for potential highlighting
          setSelectedScenarioIdForContext={setSelectedScenarioId} // Allow sidebar click to set dashboard context
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
