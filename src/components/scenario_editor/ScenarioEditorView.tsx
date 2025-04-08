import React, { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import ReactFlow, { // Import React Flow Provider and hooks
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  Viewport,
} from 'reactflow';

import ScenarioTopBar from './ScenarioTopBar';
import FlowCanvas from './FlowCanvas'; // Import the new FlowCanvas
import NodeListSidebar from './NodeListSidebar';
import NodeConfigSidebar from './NodeConfigSidebar';
import LinkOverviewPanel from './LinkOverviewPanel';
import CanvasContextMenu from './CanvasContextMenu';
import { ScenarioNode, ScenarioEdge, NodeType, ContextMenuData, HistoryEntry, CustomNodeData } from './types'; // Use updated types

// --- Constants ---
const MAX_HISTORY_SIZE = 50;

// --- Initial Data (Example) ---
const initialNodes: ScenarioNode[] = [
  { id: 'sat-1', type: 'SAT', position: { x: 150, y: 100 }, data: { type: 'SAT', name: 'Sat-LEO-01' } },
  { id: 'gs-1', type: 'GS', position: { x: 300, y: 250 }, data: { type: 'GS', name: 'GS-Madrid' } },
  { id: 'ue-1', type: 'UE', position: { x: 500, y: 150 }, data: { type: 'UE', name: 'UE-Mobile-A' } },
];
const initialEdges: ScenarioEdge[] = [];

// --- Main Editor Component ---
const ScenarioEditorInternal: React.FC = () => {
  console.log("ScenarioEditorInternal Rendering"); // DEBUG

  // React Flow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdgeData>(initialEdges);
  const { screenToFlowPosition, getViewport, setViewport } = useReactFlow(); // React Flow instance hook

  const [selectedNode, setSelectedNode] = useState<ScenarioNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ScenarioEdge | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);

  // --- Undo/Redo State ---
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoingRedoing = useRef(false);
  const internalChangeRef = useRef(false); // Ref to track internal state changes vs history changes

  // --- Save current state to history ---
  const saveHistory = useCallback(() => {
    if (isUndoingRedoing.current) {
      console.log("DEBUG: Skipping history save (undo/redo)");
      isUndoingRedoing.current = false; // Reset flag after skipping
      return;
    }
    if (internalChangeRef.current) {
        console.log("DEBUG: Skipping history save (internal change)");
        internalChangeRef.current = false; // Reset flag
        return;
    }

    console.log("DEBUG: Saving history");
    const newEntry: HistoryEntry = { nodes: [...nodes], edges: [...edges] }; // Capture current state
    const nextHistory = history.slice(0, historyIndex + 1);
    const updatedHistory = [...nextHistory, newEntry];

    // Limit history size
    const finalHistory = updatedHistory.slice(-MAX_HISTORY_SIZE);
    const finalIndex = finalHistory.length - 1;

    setHistory(finalHistory);
    setHistoryIndex(finalIndex);
  }, [nodes, edges, history, historyIndex]);

  // --- Effect to save state changes to history ---
  useEffect(() => {
    // Only save if it's not an undo/redo operation
    if (!isUndoingRedoing.current && !internalChangeRef.current) {
      saveHistory();
    }
  }, [nodes, edges, saveHistory]); // Depend on nodes and edges

   // --- Effect to save initial state ---
   useEffect(() => {
    if (history.length === 0 && historyIndex === -1) {
       console.log("DEBUG: Saving initial history state");
       internalChangeRef.current = true; // Mark as internal change to prevent loop
       saveHistory();
    }
  }, [saveHistory, history.length, historyIndex]);


  // --- Undo Action ---
  const handleUndo = useCallback(() => {
    console.log("DEBUG: handleUndo called");
    if (historyIndex > 0) {
      isUndoingRedoing.current = true; // Set flag before state change
      internalChangeRef.current = true; // Prevent immediate resave
      const previousIndex = historyIndex - 1;
      const previousState = history[previousIndex];
      console.log("DEBUG: Undoing to state index:", previousIndex);
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setHistoryIndex(previousIndex);
      setSelectedNode(null);
      setSelectedEdge(null);
      setContextMenu(null);
      // Optional: Restore viewport if saved in history
      // if (previousState.viewport) setViewport(previousState.viewport);
    } else {
      console.log("DEBUG: Cannot undo further");
    }
  }, [history, historyIndex, setNodes, setEdges, setViewport]);

  // --- Redo Action ---
  const handleRedo = useCallback(() => {
    console.log("DEBUG: handleRedo called");
    if (historyIndex < history.length - 1) {
      isUndoingRedoing.current = true; // Set flag before state change
      internalChangeRef.current = true; // Prevent immediate resave
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      console.log("DEBUG: Redoing to state index:", nextIndex);
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(nextIndex);
      setSelectedNode(null);
      setSelectedEdge(null);
      setContextMenu(null);
      // Optional: Restore viewport if saved in history
      // if (nextState.viewport) setViewport(nextState.viewport);
    } else {
      console.log("DEBUG: Cannot redo further");
    }
  }, [history, historyIndex, setNodes, setEdges, setViewport]);


  // --- Node/Edge Selection ---
  const handleNodeClick = useCallback((event: React.MouseEvent, node: ScenarioNode) => {
    console.log("DEBUG: Node clicked:", node.id);
    setSelectedNode(node);
    setSelectedEdge(null);
    setContextMenu(null);
  }, []);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => {
    console.log("DEBUG: Edge clicked:", edge.id);
    setSelectedEdge(edge);
    setSelectedNode(null);
    setContextMenu(null);
  }, []);

  const handlePaneClick = useCallback(() => {
    console.log("DEBUG: Pane clicked");
    setSelectedNode(null);
    setSelectedEdge(null);
    setContextMenu(null);
  }, []);

  // --- Add Node (from Drag & Drop in FlowCanvas) ---
  // This needs to be passed down or handled via context if FlowCanvas needs access to screenToFlowPosition
  const handleAddNode = useCallback((type: NodeType, clientX: number, clientY: number) => {
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      console.log("DEBUG: handleAddNode called", { type, position });
      const newNode: ScenarioNode = {
        id: `${type.toLowerCase()}-${nanoid(5)}`,
        type: type, // Use the custom type string for React Flow
        position: position,
        data: { // React Flow expects data field
            type: type,
            name: `${type}-${nodes.filter(n => n.data.type === type).length + 1}`,
        },
      };
      internalChangeRef.current = true; // Mark as internal change
      setNodes((nds) => nds.concat(newNode));
      // History is saved via useEffect
    }, [screenToFlowPosition, setNodes, nodes] // Add dependencies
  );

  // --- Delete Item (Node or Edge) ---
  const handleDeleteItem = useCallback((itemId: string) => {
    console.log("DEBUG: handleDeleteItem called", { itemId });
    internalChangeRef.current = true; // Mark as internal change
    setNodes((nds) => nds.filter(node => node.id !== itemId));
    setEdges((eds) => eds.filter(edge => edge.id !== itemId && edge.source !== itemId && edge.target !== itemId));
    setSelectedNode(null);
    setSelectedEdge(null);
    setContextMenu(null);
    // History is saved via useEffect
  }, [setNodes, setEdges]);

  // --- Update Node Properties ---
  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<CustomNodeData>) => {
    console.log("DEBUG: handleNodeUpdate called", { nodeId, updates });
    internalChangeRef.current = true; // Mark as internal change
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } } // Update data field
          : node
      )
    );
    // Update selected node state as well if it's the one being edited
    setSelectedNode(prev => prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...updates } } : prev);
    // History is saved via useEffect
  }, [setNodes]);


  // --- Context Menu Handling ---
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: ScenarioNode) => {
    event.preventDefault();
    console.log("DEBUG: Node context menu:", node.id);
    setSelectedNode(node);
    setSelectedEdge(null);
    setContextMenu({ x: event.clientX, y: event.clientY, type: 'node', itemId: node.id });
  }, []);

  const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => {
    event.preventDefault();
    console.log("DEBUG: Edge context menu:", edge.id);
    setSelectedEdge(edge);
    setSelectedNode(null);
    setContextMenu({ x: event.clientX, y: event.clientY, type: 'edge', itemId: edge.id });
  }, []);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    console.log("DEBUG: Pane context menu");
    setSelectedNode(null);
    setSelectedEdge(null);
    setContextMenu({ x: event.clientX, y: event.clientY, type: 'pane' });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    console.log("DEBUG: Closing context menu");
    setContextMenu(null);
  }, []);

  // --- Zoom Actions ---
  const handleZoomIn = useCallback(() => {
    console.log("DEBUG: handleZoomIn called");
    setViewport({ zoom: getViewport().zoom + 0.1, x: getViewport().x, y: getViewport().y }, { duration: 100 });
  }, [getViewport, setViewport]);

  const handleZoomOut = useCallback(() => {
    console.log("DEBUG: handleZoomOut called");
    setViewport({ zoom: getViewport().zoom - 0.1, x: getViewport().x, y: getViewport().y }, { duration: 100 });
  }, [getViewport, setViewport]);

  // --- Save Action ---
  const handleSave = useCallback(() => {
    console.log("Saving Scenario State (React Flow):");
    console.log("Nodes:", JSON.stringify(nodes, null, 2));
    console.log("Edges:", JSON.stringify(edges, null, 2));
    console.log("Viewport:", JSON.stringify(getViewport(), null, 2));
    alert("Scenario state logged to console (simulation of save).");
  }, [nodes, edges, getViewport]);

  // Determine if undo/redo is possible
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // --- Drag and Drop Handler (for adding nodes) ---
   const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/node-type') as NodeType | undefined;
      if (!type) return;
      handleAddNode(type, event.clientX, event.clientY);
    },
    [handleAddNode] // Include handleAddNode which depends on screenToFlowPosition
  );
  // --- End Drag and Drop ---

  return (
    <div className="flex flex-col h-full text-white overflow-hidden" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      {/* 1. Top Bar */}
      <ScenarioTopBar
        onSave={handleSave}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* 3. Left Sidebar */}
        <NodeListSidebar />

        {/* Center Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 2. Main Canvas View - Use FlowCanvas */}
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            setNodes={setNodes} // Pass state setters if FlowCanvas needs them directly (less common with hooks)
            setEdges={setEdges}
            onNodesChange={onNodesChange} // Pass React Flow handlers
            onEdgesChange={onEdgesChange}
            // Pass click/context handlers
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            onNodeContextMenu={handleNodeContextMenu}
            onEdgeContextMenu={handleEdgeContextMenu}
            onPaneContextMenu={handlePaneContextMenu}
          />

          {/* 5. Bottom Panel */}
          {/* Adapt LinkOverviewPanel to use React Flow edge data */}
          <LinkOverviewPanel links={edges} nodes={nodes} />
        </div>

        {/* 4. Right Sidebar */}
        {/* Adapt NodeConfigSidebar to use React Flow node data */}
        <NodeConfigSidebar
            selectedNode={selectedNode}
            onNodeUpdate={handleNodeUpdate}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          itemId={contextMenu.itemId}
          onClose={handleCloseContextMenu}
          onDelete={handleDeleteItem} // Pass the delete handler
        />
      )}
    </div>
  );
};


// --- Wrapper Component with Provider ---
interface ScenarioEditorViewProps {
  scenarioId: string | null; // Receive scenarioId if needed
}
const ScenarioEditorView: React.FC<ScenarioEditorViewProps> = ({ scenarioId }) => {
  return (
    <ReactFlowProvider>
      <ScenarioEditorInternal />
    </ReactFlowProvider>
  );
};

export default ScenarioEditorView;
