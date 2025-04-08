import React, { useCallback } from 'react';
    import ReactFlow, {
      Controls,
      Background,
      applyNodeChanges,
      applyEdgeChanges,
      addEdge,
      NodeChange,
      EdgeChange,
      Connection,
      Edge,
      Node,
      BackgroundVariant,
      MiniMap,
      NodeTypes,
      MarkerType,
      useReactFlow,
      ReactFlowInstance, // Import ReactFlowInstance
    } from 'reactflow';
    import 'reactflow/dist/style.css';
    import { nanoid } from 'nanoid'; // Import nanoid

    import { ScenarioNode, ScenarioEdge, NodeType, ScenarioType, CustomEdgeData } from './types'; // Import types

    // --- Import Custom Node Components ---
    import SatNode from './nodes/SatNode';
    import GsNode from './nodes/GsNode';
    import UeNode from './nodes/UeNode';

    // --- Define Node Types Map ---
    const nodeTypes: NodeTypes = {
      SAT: SatNode,
      GS: GsNode,
      UE: UeNode,
    };
    // --- End Node Types ---


    interface FlowCanvasProps {
      nodes: ScenarioNode[];
      edges: ScenarioEdge[];
      setNodes: React.Dispatch<React.SetStateAction<ScenarioNode[]>>;
      setEdges: React.Dispatch<React.SetStateAction<ScenarioEdge[]>>;
      onNodesChange: (changes: NodeChange[]) => void;
      onEdgesChange: (changes: EdgeChange[]) => void;
      onNodeClick?: (event: React.MouseEvent, node: ScenarioNode) => void;
      onEdgeClick?: (event: React.MouseEvent, edge: ScenarioEdge) => void;
      onPaneClick?: (event: React.MouseEvent) => void;
      onNodeContextMenu?: (event: React.MouseEvent, node: ScenarioNode) => void;
      onEdgeContextMenu?: (event: React.MouseEvent, edge: ScenarioEdge) => void;
      onPaneContextMenu?: (event: React.MouseEvent) => void;
      scenarioType: ScenarioType; // Add scenarioType prop
      onInit?: (instance: ReactFlowInstance) => void; // Add onInit prop
    }

    const FlowCanvas: React.FC<FlowCanvasProps> = ({
      nodes,
      edges,
      setNodes,
      setEdges,
      onNodesChange,
      onEdgesChange,
      onNodeClick,
      onEdgeClick,
      onPaneClick,
      onNodeContextMenu,
      onEdgeContextMenu,
      onPaneContextMenu,
      scenarioType, // Receive scenarioType
      onInit, // Receive onInit
    }) => {
      const reactFlowInstance = useReactFlow();

      const onConnect = useCallback(
        (connection: Connection) => {
            if (scenarioType === 'custom') {
                console.log("ReactFlow Connection (Custom Mode):", connection);
                const newEdge: ScenarioEdge = {
                    ...connection,
                    id: `edge-${connection.source}-${connection.target}-${nanoid(4)}`,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 15,
                        height: 15,
                        color: 'var(--color-albor-dark-gray)',
                    },
                    style: {
                        strokeWidth: 1.5,
                        stroke: 'var(--color-albor-dark-gray)',
                    },
                    data: {}, // Initialize empty data
                };
                setEdges((eds) => addEdge(newEdge, eds));
            } else {
                console.log("ReactFlow Connection prevented in Realistic Mode");
            }
        },
        [setEdges, scenarioType]
      );


      // Pass scenarioType to each node via node.data
      const nodesWithScenarioType = nodes.map(node => ({
          ...node,
          data: {
              ...node.data,
              scenarioType: scenarioType, // Inject scenarioType into data
          }
      }));

      return (
        <div className="w-full h-full absolute inset-0 bg-albor-deep-space/50 border border-albor-bg-dark rounded overflow-hidden">
          <ReactFlow
            nodes={nodesWithScenarioType}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            onInit={onInit} // Pass onInit to ReactFlow component
            className="albor-flow"

            // --- Interactions ---
            zoomOnScroll={true}
            zoomOnPinch={true}
            panOnScroll={false}
            panOnDrag={true}
            nodesDraggable={true}
            nodesConnectable={scenarioType === 'custom'}
            elementsSelectable={true}
            edgesFocusable={scenarioType === 'custom'}
            edgesUpdatable={scenarioType === 'custom'}
            fitView={false} // fitView is handled by parent now
            preventScrolling={true}
            defaultEdgeOptions={{
                 markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 15,
                    height: 15,
                    color: 'var(--color-albor-dark-gray)',
                },
                style: {
                    strokeWidth: 1.5,
                    stroke: 'var(--color-albor-dark-gray)',
                },
            }}
          >
            <Controls />
            <MiniMap
                nodeStrokeWidth={3}
                zoomable
                pannable
                className="albor-minimap"
                nodeClassName={(node) => `albor-minimap-node ${node.selected ? 'selected' : ''}`}
                maskClassName="albor-minimap-mask"
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--color-albor-dark-gray)" style={{ opacity: 0.2 }} />
          </ReactFlow>
        </div>
      );
    };

    export default FlowCanvas;
