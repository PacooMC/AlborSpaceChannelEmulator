import React, { useState } from 'react'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import MainContentArea from './components/layout/MainContentArea'
import DashboardView from './components/views/DashboardView'
import ScenarioEditorView from './components/views/ScenarioEditorView'
import MonitoringView from './components/views/MonitoringView'
import SystemManagementView from './components/views/SystemManagementView'
import SettingsView from './components/views/SettingsView'

type ViewName = 'dashboard' | 'scenarios' | 'monitoring' | 'system' | 'settings';

export type Scenario = {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'stopped';
  // Add more scenario-specific details later if needed
};

const initialRunningScenarios: Scenario[] = [
  { id: 'leo-test-1', name: 'LEO Constellation Test', status: 'running' },
  { id: 'geo-link-sim', name: 'GEO Uplink Simulation', status: 'running' },
  { id: 'handover-study', name: 'MEO Handover Study', status: 'paused' },
  { id: 'global-overview', name: 'Global System', status: 'running' }, // Maybe a dummy scenario for global?
];

function App() {
  const [activeView, setActiveView] = useState<ViewName>('dashboard');
  const [runningScenarios, setRunningScenarios] = useState<Scenario[]>(initialRunningScenarios);
  // Default to null initially, or maybe a specific 'global' ID if you have one
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // Find the full scenario object based on the selected ID
  const selectedScenario = runningScenarios.find(s => s.id === selectedScenarioId) || null; // Ensure it can be null

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        // Pass both the ID and the full scenario object to DashboardView
        return <DashboardView selectedScenarioId={selectedScenarioId} scenario={selectedScenario} />;
      case 'scenarios':
        // Pass scenario context if needed for editing
        return <ScenarioEditorView selectedScenarioId={selectedScenarioId} />;
      case 'monitoring':
         // Monitoring is likely scenario-specific
        return <MonitoringView selectedScenarioId={selectedScenarioId} scenario={selectedScenario}/>;
      case 'system':
        // System view might be global or scenario-specific
        return <SystemManagementView selectedScenarioId={selectedScenarioId} scenario={selectedScenario}/>;
      case 'settings':
        return <SettingsView />;
      default:
        // Default to dashboard, potentially showing global if no scenario selected
        return <DashboardView selectedScenarioId={selectedScenarioId} scenario={selectedScenario} />;
    }
  };

  return (
    <div className="flex flex-col h-screen text-albor-light-gray font-sans overflow-hidden">
      {/* Header now shows the selected scenario name OR a default */}
      <Header selectedScenarioName={selectedScenario?.name || "System Overview"} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          runningScenarios={runningScenarios.filter(s => s.id !== 'global-overview')} // Don't show 'global' in the list
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
