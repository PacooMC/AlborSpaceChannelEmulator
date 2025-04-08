import React from 'react';
    import ErrorBoundary from '../common/ErrorBoundary';
    import ScenarioEditorFallback from '../scenario_editor/ScenarioEditorFallback';
    import { ReactFlowProvider } from 'reactflow';
    import 'reactflow/dist/style.css';

    import ScenarioEditorContent from '../scenario_editor/ScenarioEditorContent'; // Import the actual editor

    // --- New Props ---
    interface ScenarioEditorViewProps {
      scenarioIdToLoad: string | null; // ID of the scenario to load/display
      isLoadingScenario: boolean; // Loading state from App
      onStartScenario: (id: string, name: string) => void; // Function to start the current scenario
      onLoadScenario: (id: string | null) => void; // Function to trigger loading a scenario
      onScenarioSaved: () => void; // *** ADDED: Callback when a save/delete occurs ***
    }

    const ScenarioEditorView: React.FC<ScenarioEditorViewProps> = ({
      scenarioIdToLoad,
      isLoadingScenario,
      onStartScenario,
      onLoadScenario, // Receive load handler
      onScenarioSaved, // *** ADDED: Receive save handler ***
    }) => {
      return (
        <ErrorBoundary fallback={<ScenarioEditorFallback />}>
          <ReactFlowProvider>
            {/* Pass the necessary props down to the content */}
            <ScenarioEditorContent
              scenarioId={scenarioIdToLoad} // Pass the ID to load
              isLoadingScenario={isLoadingScenario}
              onStartScenario={onStartScenario}
              onLoadScenario={onLoadScenario} // Pass load handler down
              onScenarioSaved={onScenarioSaved} // *** ADDED: Pass save handler down ***
            />
          </ReactFlowProvider>
        </ErrorBoundary>
      );
    };

    export default ScenarioEditorView;
