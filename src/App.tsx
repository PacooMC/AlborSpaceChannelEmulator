import React, { useState, useCallback, useEffect } from 'react';
    import Header from './components/layout/Header';
    import Sidebar from './components/layout/Sidebar'; // Main app sidebar
    import MainContentArea from './components/layout/MainContentArea';
    import DashboardView from './components/views/DashboardView';
    import ScenarioEditorView from './components/views/ScenarioEditorView';
    import MonitoringView from './components/views/MonitoringView';
    import SystemManagementView from './components/views/SystemManagementView';
    import SettingsView from './components/views/SettingsView';
    import { initialRunningScenarios } from './content/scenarios';
    import type { Scenario, ScenarioStatus } from './content/scenarios';
    // Removed imports related to saved scenarios management

    type ViewName = 'dashboard' | 'scenarios' | 'monitoring' | 'system' | 'settings';

    function App() {
      const [activeView, setActiveView] = useState<ViewName>('dashboard');
      const [runningScenarios, setRunningScenarios] = useState<Scenario[]>(
          initialRunningScenarios.filter(s => s.id !== 'global-overview')
      );
      const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null); // For dashboard/monitoring context
      const [isLoadingScenario, setIsLoadingScenario] = useState<boolean>(false);
      const [editorScenarioId, setEditorScenarioId] = useState<string | null>(null); // ID of scenario to load in editor

      // Removed savedScenariosList state and useEffect

      const selectedScenario = runningScenarios.find(s => s.id === selectedScenarioId) || null;

      const getHeaderTitle = () => {
        switch (activeView) {
            case 'dashboard':
                return selectedScenario?.name || "Global System Overview";
            case 'scenarios':
                // Title might need adjustment if name isn't readily available here
                return editorScenarioId ? `Editing Scenario` : "Scenario Editor";
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

      const handleStartScenario = useCallback((id: string, name: string) => {
        if (!id || isLoadingScenario) return;
        console.log(`Attempting to start scenario: ${name} (${id})`);
        setIsLoadingScenario(true);
        setTimeout(() => {
          setRunningScenarios(prevScenarios => {
            if (prevScenarios.some(s => s.id === id)) {
              console.log(`Scenario ${id} is already running.`);
              return prevScenarios;
            }
            const newScenario: Scenario = { id, name, status: 'running' };
            console.log(`Adding scenario ${id} to running list.`);
            return [...prevScenarios, newScenario];
          });
          setSelectedScenarioId(id); // Set context for monitoring view
          setActiveView('monitoring'); // Switch view
          setIsLoadingScenario(false);
          console.log(`Scenario ${id} started, switching to monitoring view.`);
        }, 1500);
      }, [isLoadingScenario]);

      // This function now ONLY tells the App which scenario ID the editor should load
      const handleLoadScenario = useCallback((id: string | null) => {
        console.log(`Requesting to load scenario ${id ?? 'new'} into editor.`);
        setEditorScenarioId(id); // Update the ID for the editor view
        setActiveView('scenarios'); // Ensure the editor view is active
        setSelectedScenarioId(null); // Deselect any active scenario context
      }, []);

      // Removed handleDeleteScenario - now handled within ScenarioEditorContent

      const renderView = () => {
        switch (activeView) {
          case 'dashboard':
            return <DashboardView selectedScenarioId={selectedScenarioId} scenario={selectedScenario} />;
          case 'scenarios':
            return (
              <ScenarioEditorView
                scenarioIdToLoad={editorScenarioId} // Pass the ID to load
                isLoadingScenario={isLoadingScenario}
                onStartScenario={handleStartScenario} // Pass start handler
                onLoadScenario={handleLoadScenario} // Pass load trigger handler
                onScenarioSaved={() => { /* App notified, can update global state if needed */ }}
              />
            );
          case 'monitoring':
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
            {/* Pass only necessary props to the main Sidebar */}
            <Sidebar
              activeView={activeView}
              setActiveView={setActiveView}
              runningScenarios={runningScenarios}
              selectedScenarioId={selectedScenarioId}
              setSelectedScenarioId={setSelectedScenarioId}
              // Removed savedScenarios, onLoadScenario, onDeleteScenario props
            />
            <MainContentArea>
              {renderView()}
            </MainContentArea>
          </div>
        </div>
      )
    }

    export default App
