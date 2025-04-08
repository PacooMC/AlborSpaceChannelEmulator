import React from 'react';
import { FileWarning, LifeBuoy } from 'lucide-react';

const ScenarioEditorFallback: React.FC = () => {
  return (
    <div className="flex flex-col h-full text-white overflow-hidden">
      <div className="p-4 border-b border-albor-bg-dark/50 bg-albor-bg-dark/70 backdrop-blur-sm flex-shrink-0">
        <h2 className="text-lg font-semibold">Scenario Editor</h2>
      </div>
      
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="max-w-lg p-6 bg-albor-bg-dark/80 backdrop-blur-sm rounded-lg border border-albor-orange/30 text-center">
          <FileWarning size={48} className="mx-auto text-albor-orange mb-4" />
          
          <h3 className="text-xl font-semibold text-albor-light-gray mb-2">
            Canvas Rendering Issue
          </h3>
          
          <p className="text-albor-light-gray mb-4">
            The interactive canvas editor couldn't be loaded due to compatibility issues with the current environment.
          </p>
          
          <div className="bg-albor-deep-space/50 p-4 rounded-md text-left text-sm text-albor-dark-gray mb-4">
            <code>Error: selection4.interrupt is not a function</code>
            <p className="mt-2">
              This is likely due to ReactFlow's dependencies having compatibility issues with the current runtime environment.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm">
            <LifeBuoy size={16} className="text-albor-orange" />
            <span className="text-albor-light-gray">
              Alternative options for scenario configuration will be implemented soon.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioEditorFallback;
