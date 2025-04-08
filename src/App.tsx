import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MainContentArea from './components/layout/MainContentArea';
import DashboardView from './components/views/DashboardView';
import ScenarioEditorView from './components/views/ScenarioEditorView';
import MonitoringView from './components/views/MonitoringView';
import SystemManagementView from './components/views/SystemManagementView';
import SettingsView from './components/views/SettingsView';
// Import initial data from content file
import { initialRunningScenarios } from './content/scenarios';
// Import Scenario type from content file if moved, otherwise keep here
import type { Scenario, ScenarioStatus } from './content/scenarios'; // Assuming type moved

type ViewName = 'dashboard' | 'scenarios' | 'monitoring' | 'system' | 'settings';

// Scenario type definition (can be moved to content/scenarios.ts)
// export type ScenarioStatus = 'running' | 'paused' | 'stopped';
// export interface Scenario {
//   id: string;
//   name: string;
//   status: ScenarioStatus;
// };

function App() {
  const [activeView, setActiveView] = useState<ViewName>('dashboard');
  // Use imported initial data - filter out the dummy 'global-overview' if it exists
  const [runningScenarios, setRunningScenarios] = useState<Scenario[]>(
      initialRunningScenarios.filter(s => s.id !== 'global-overview')
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null); // null represents global view

  const selectedScenario = runningScenarios.find(s => s.id === selectedScenarioId) || null;

  // Determine the header title based on the active view and selected scenario
  const getHeaderTitle = () => {
    switch (activeView) {
        case 'dashboard':
            return selectedScenario?.name || "Global System Overview";
        case 'scenarios':
            // Could potentially show the name of the scenario being edited later
            return "Scenario Editor";
        case 'monitoring':
            return selectedScenario ? `Monitoring: ${selectedScenario.name}` : "Global Monitoring";
        case 'system':
            return selectedScenario ? `System: ${selectedScenario.name}` : "Global System Management";
        case 'settings':
            return "Settings";
        default:
            return "Channel Emulator";
    }
  };


  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        // Pass scenarioId and scenario object to DashboardView
        return <DashboardView selectedScenarioId={selectedScenarioId} scenario={selectedScenario} />;
      case 'scenarios':
        // Pass scenarioId to ScenarioEditorView if needed for context, or null/undefined
        // For now, the editor manages its own state internally based on loaded data
        return <ScenarioEditorView scenarioId={selectedScenarioId} />;
      case 'monitoring':
         // Pass scenarioId and scenario object to MonitoringView
        return <MonitoringView /* selectedScenarioId={selectedScenarioId} scenario={selectedScenario} */ />; // Pass props if needed
      case 'system':
         // Pass scenarioId and scenario object to SystemManagementView
        return <SystemManagementView /* selectedScenarioId={selectedScenarioId} scenario={selectedScenario} */ />; // Pass props if needed
      case 'settings':
        return <SettingsView />;
      default:
        // Default to DashboardView, passing relevant props
        return <DashboardView selectedScenarioId={selectedScenarioId} scenario={selectedScenario} />;
    }
  };

  return (
    <div className="flex flex-col h-screen text-albor-light-gray font-sans overflow-hidden">
      {/* Pass the dynamically determined title */}
      <Header selectedScenarioName={getHeaderTitle()} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          runningScenarios={runningScenarios} // Pass the filtered list
          selectedScenarioId={selectedScenarioId}
          setSelectedScenarioId={setSelectedScenarioId}
        />
        <MainContentArea>
          {renderView()}
        </MainContentArea>
      </div>
    </div>
  )
}

export default App
