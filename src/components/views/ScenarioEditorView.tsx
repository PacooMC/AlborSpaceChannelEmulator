import React from 'react';
import ErrorBoundary from '../common/ErrorBoundary';
import ScenarioEditorFallback from '../scenario_editor/ScenarioEditorFallback';
import {
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import the actual editor component with a dynamic import to allow error boundary to catch any issues
// Keep using React.lazy for safety, even with the patch
const ScenarioEditorContent = React.lazy(() => import('../scenario_editor/ScenarioEditorContent'));

// Props interface
interface ScenarioEditorViewProps {
  scenarioId: string | null; // Receive scenarioId if needed
}

const ScenarioEditorView: React.FC<ScenarioEditorViewProps> = ({ scenarioId }) => {
  return (
    // Keep the ErrorBoundary as a safety net
    <ErrorBoundary fallback={<ScenarioEditorFallback />}>
      <React.Suspense fallback={<div className="flex items-center justify-center h-full">Loading editor...</div>}>
        <ReactFlowProvider>
          <ScenarioEditorContent scenarioId={scenarioId} />
        </ReactFlowProvider>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default ScenarioEditorView;
