import React from 'react';
    import { Settings } from 'lucide-react';
    import { ScenarioNode, ScenarioEdge, CustomNodeData, CustomEdgeData, ScenarioType } from './types'; // Import types

    // Import the specific panels - Ensure the import path and name are correct
    import NodeConfigPanel from './NodeConfigPanel'; // Default import
    import EdgeConfigPanel from './EdgeConfigPanel'; // Default import

    interface ConfigSidebarProps {
      selectedNode: ScenarioNode | null;
      selectedEdge: ScenarioEdge | null;
      scenarioType: ScenarioType;
      onNodeUpdate: (nodeId: string, updates: Partial<CustomNodeData>) => void;
      onEdgeUpdate: (edgeId: string, updates: Partial<CustomEdgeData>) => void;
    }

    const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
      selectedNode,
      selectedEdge,
      scenarioType,
      onNodeUpdate,
      onEdgeUpdate,
    }) => {

      const showNodeConfig = selectedNode !== null;
      const showEdgeConfig = selectedEdge !== null && scenarioType === 'custom';

      return (
        <div className="w-64 bg-albor-bg-dark/50 border-l border-albor-bg-dark p-3 flex flex-col flex-shrink-0 overflow-hidden">
          {/* Conditionally render Node Configuration */}
          {showNodeConfig && selectedNode && (
            <NodeConfigPanel // Use the imported component
              selectedNode={selectedNode}
              scenarioType={scenarioType}
              onNodeUpdate={onNodeUpdate}
            />
          )}

          {/* Conditionally render Edge Configuration */}
          {showEdgeConfig && selectedEdge && (
            <EdgeConfigPanel // Use the imported component
              selectedEdge={selectedEdge}
              onEdgeUpdate={onEdgeUpdate}
            />
          )}

          {/* Default view when nothing is selected */}
          {!showNodeConfig && !showEdgeConfig && (
            <>
              <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-albor-bg-dark flex-shrink-0">
                <Settings size={16} className="text-albor-orange"/>
                <h3 className="text-sm font-semibold text-albor-light-gray">Configuration</h3>
              </div>
              <p className="text-xs text-albor-dark-gray italic text-center mt-4 flex-1 flex items-center justify-center">
                Select a node{scenarioType === 'custom' ? ' or edge' : ''} on the canvas to configure its properties.
              </p>
            </>
          )}
        </div>
      );
    };

    export default ConfigSidebar; // Ensure this file also has a default export
