import React from 'react';
    import ErrorBoundary from '../common/ErrorBoundary';
    import ScenarioEditorFallback from '../scenario_editor/ScenarioEditorFallback';
    import {
      ReactFlowProvider // Keep ReactFlowProvider
    } from 'reactflow';
    import 'reactflow/dist/style.css';

    // Import the actual editor component directly now
    import ScenarioEditorContent from '../scenario_editor/ScenarioEditorContent';

    // Props interface
    interface ScenarioEditorViewProps {
      scenarioId: string | null; // Receive scenarioId if needed
    }

    const ScenarioEditorView: React.FC<ScenarioEditorViewProps> = ({ scenarioId }) => {
      return (
        // Keep the ErrorBoundary as a safety net
        <ErrorBoundary fallback={<ScenarioEditorFallback />}>
          {/* Remove Suspense as we are importing directly */}
          {/* <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading editor...</div>}> */}
            <ReactFlowProvider>
              <ScenarioEditorContent scenarioId={scenarioId} />
            </ReactFlowProvider>
          {/* </React.Suspense> */}
        </ErrorBoundary>
      );
    };

    export default ScenarioEditorView;
