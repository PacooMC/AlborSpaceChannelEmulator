import React from 'react';
            import { Settings, MousePointerSquare } from 'lucide-react'; // Import MousePointerSquare
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
                <div className="w-full h-full bg-albor-bg-dark/50 border-l border-albor-bg-dark p-3 flex flex-col flex-shrink-0 overflow-hidden">
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

                  {/* Default view when nothing is selected - IMPROVED */}
                  {!showNodeConfig && !showEdgeConfig && (
                    // Added border and subtle background for better delimitation
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-albor-dark-gray/30 rounded-md bg-albor-deep-space/20 m-1">
                        <MousePointerSquare size={32} className="text-albor-dark-gray mb-3"/>
                        <h3 className="text-sm font-semibold text-albor-light-gray mb-1">Configuration Panel</h3>
                        <p className="text-xs text-albor-dark-gray">
                            Select a component on the canvas (node{scenarioType === 'custom' ? ' or link' : ''}) to view and edit its properties here.
                        </p>
                    </div>
                  )}
                </div>
              );
            };

            export default ConfigSidebar; // Ensure this file also has a default export
