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
  MiniMap, // Import MiniMap
  NodeTypes,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ScenarioNode, ScenarioEdge, NodeType, ScenarioType } from './types'; // Import ScenarioType

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
}) => {
  const reactFlowInstance = useReactFlow();

  const onConnect = useCallback(
    (connection: Connection) => {
        // Only allow connections in 'custom' mode
        if (scenarioType === 'custom') {
            console.log("ReactFlow Connection (Custom Mode):", connection);
            // Add markerEnd for arrowhead and style
            const newEdge: ScenarioEdge = {
                ...connection,
                id: `edge-${connection.source}-${connection.target}-${nanoid(4)}`, // Use nanoid for unique ID
                // animated: true, // Keep animation
                markerEnd: { // Add arrowhead
                    type: MarkerType.ArrowClosed,
                    width: 15,
                    height: 15,
                    color: 'var(--color-albor-dark-gray)', // Use CSS variable
                },
                style: { // Ensure selected style overrides this
                    strokeWidth: 1.5,
                    stroke: 'var(--color-albor-dark-gray)',
                },
                // Add empty data object if needed for CustomEdgeData
                data: {},
            };
            setEdges((eds) => addEdge(newEdge, eds));
        } else {
            console.log("ReactFlow Connection prevented in Realistic Mode");
            // Optionally show a notification to the user
        }
    },
    [setEdges, scenarioType] // Add scenarioType dependency
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
    // This container needs to define the bounds for ReactFlow
    // Use absolute positioning to fill the parent relative container
    <div className="w-full h-full absolute inset-0 bg-albor-deep-space/50 border border-albor-bg-dark rounded overflow-hidden">
      <ReactFlow
        nodes={nodesWithScenarioType} // Use nodes with injected scenarioType
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes} // Use the custom node types map
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        className="albor-flow" // Add class for potential specific CSS targeting

        // --- Interactions ---
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        panOnDrag={true}
        nodesDraggable={true}
        // Disable node connectability in realistic mode
        nodesConnectable={scenarioType === 'custom'}
        elementsSelectable={true}
        // Disable edge selection/interaction in realistic mode
        edgesFocusable={scenarioType === 'custom'}
        edgesUpdatable={scenarioType === 'custom'}
        fitView={false} // fitView is handled on mount in parent now
        preventScrolling={true}
        // Define default edge options including the marker
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
        {/* Use theme colors for Controls and MiniMap via CSS overrides in index.css */}
        <Controls />
        {/* Add the MiniMap component */}
        <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            // Style using CSS variables (overrides in index.css)
            className="albor-minimap"
            nodeClassName={(node) => `albor-minimap-node ${node.selected ? 'selected' : ''}`}
            maskClassName="albor-minimap-mask"
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--color-albor-dark-gray)" style={{ opacity: 0.2 }} />
      </ReactFlow>
    </div>
  );
};

// Need nanoid for unique edge IDs
import { nanoid } from 'nanoid';

export default FlowCanvas;
