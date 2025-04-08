import React, { useState, useCallback, useRef, useEffect } from 'react';
      import { nanoid } from 'nanoid';
      import ReactFlow, {
        useNodesState,
        useEdgesState,
        useReactFlow,
        Background,
        BackgroundVariant,
        NodeTypes, // Keep NodeTypes import
        NodeChange,
        EdgeChange,
        applyNodeChanges,
        applyEdgeChanges,
        Viewport, // Import Viewport
      } from 'reactflow';

      import ScenarioTopBar from './ScenarioTopBar';
      import NodeListSidebar from './NodeListSidebar';
      import NodeConfigSidebar from './NodeConfigSidebar';
      import LinkOverviewPanel from './LinkOverviewPanel';
      import CanvasContextMenu from './CanvasContextMenu';
      import FlowCanvas from './FlowCanvas'; // Import the updated FlowCanvas
      import GlobalMapView from './GlobalMapView'; // Import the new Global Map View
      import { ScenarioNode, ScenarioEdge, NodeType, ContextMenuData, HistoryEntry, CustomNodeData, ScenarioType, ScenarioState } from './types'; // Import ScenarioType and ScenarioState

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

      // --- Constants ---
      const MAX_HISTORY_SIZE = 50;

      // --- Initial Data (Example) ---
      const initialNodes: ScenarioNode[] = [
        { id: 'sat-1', type: 'SAT', position: { x: 150, y: 100 }, data: { type: 'SAT', name: 'Sat-LEO-01' } },
        { id: 'gs-1', type: 'GS', position: { x: 300, y: 250 }, data: { type: 'GS', name: 'GS-Madrid', latitude: 40.4, longitude: -3.7 } }, // Added coords
        { id: 'ue-1', type: 'UE', position: { x: 500, y: 150 }, data: { type: 'UE', name: 'UE-Mobile-A', latitude: 40.7, longitude: -74.0 } }, // Added coords
      ];
      const initialEdges: ScenarioEdge[] = [];

      // Props interface
      interface ScenarioEditorContentProps {
        scenarioId: string | null; // Receive scenarioId if needed
      }

      const ScenarioEditorContent: React.FC<ScenarioEditorContentProps> = ({ scenarioId }) => {
        console.log("ScenarioEditorContent Rendering"); // DEBUG

        // React Flow state hooks
        const [nodes, setNodes, onNodesChangeDirect] = useNodesState<CustomNodeData>(initialNodes);
        const [edges, setEdges, onEdgesChangeDirect] = useEdgesState<CustomEdgeData>(initialEdges);
        const { screenToFlowPosition, getViewport, setViewport, fitView } = useReactFlow(); // React Flow instance hook, added fitView

        // --- Scenario State ---
        const [scenarioName, setScenarioName] = useState<string>("New Scenario");
        const [scenarioType, setScenarioType] = useState<ScenarioType>('custom'); // Default to custom

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
          // Skip saving if undoing/redoing or if it's an internal change (like loading state)
          if (isUndoingRedoing.current || internalChangeRef.current) {
            console.log("DEBUG: Skipping history save (internal/undo/redo)");
            isUndoingRedoing.current = false; // Reset flags after skipping
            internalChangeRef.current = false;
            return;
          }

          console.log("DEBUG: Saving history");
          // Capture current state including nodes and edges
          const newEntry: HistoryEntry = { nodes: [...nodes], edges: [...edges] };
          const nextHistory = history.slice(0, historyIndex + 1); // Discard redo states if new change occurs
          const updatedHistory = [...nextHistory, newEntry];

          // Limit history size
          const finalHistory = updatedHistory.slice(-MAX_HISTORY_SIZE);
          const finalIndex = finalHistory.length - 1;

          setHistory(finalHistory);
          setHistoryIndex(finalIndex);
        }, [nodes, edges, history, historyIndex]); // Dependencies: nodes, edges, history, historyIndex

        // --- Effect to save state changes to history ---
        useEffect(() => {
          // Only save if it's not an undo/redo operation or an internal load
          if (!isUndoingRedoing.current && !internalChangeRef.current) {
            saveHistory();
          }
        }, [nodes, edges, saveHistory]); // Depend on nodes and edges

         // --- Effect to save initial state ---
         useEffect(() => {
          if (history.length === 0 && historyIndex === -1) {
             console.log("DEBUG: Saving initial history state");
             internalChangeRef.current = true; // Mark as internal change to prevent immediate resave
             saveHistory();
          }
        }, [saveHistory, history.length, historyIndex]);

        // --- Fit view on initial load ---
        useEffect(() => {
            // Needs a small delay for the layout to settle
            const timer = setTimeout(() => {
                console.log("DEBUG: Fitting view");
                fitView({ padding: 0.1, duration: 200 });
            }, 50); // Adjust delay if needed
            return () => clearTimeout(timer);
        }, [fitView]); // Run only once on mount


        // --- Modified State Change Handlers to manage internalChangeRef ---
        const onNodesChange = useCallback(
          (changes: NodeChange[]) => {
            console.log("DEBUG: onNodesChange called", changes);
            internalChangeRef.current = true; // Mark internal change *before* applying
            onNodesChangeDirect(changes);
          },
          [onNodesChangeDirect]
        );

        const onEdgesChange = useCallback(
          (changes: EdgeChange[]) => {
            console.log("DEBUG: onEdgesChange called", changes);
            internalChangeRef.current = true; // Mark internal change *before* applying
            onEdgesChangeDirect(changes);
          },
          [onEdgesChangeDirect]
        );

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
            setSelectedNode(null); // Clear selection
            setSelectedEdge(null);
            setContextMenu(null);
            // Optional: Restore viewport if saved in history
            // if (previousState.viewport) setViewport(previousState.viewport);
          } else {
            console.log("DEBUG: Cannot undo further");
          }
        }, [history, historyIndex, setNodes, setEdges, setViewport]); // Added setViewport dependency

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
            setSelectedNode(null); // Clear selection
            setSelectedEdge(null);
            setContextMenu(null);
            // Optional: Restore viewport if saved in history
            // if (nextState.viewport) setViewport(nextState.viewport);
          } else {
            console.log("DEBUG: Cannot redo further");
          }
        }, [history, historyIndex, setNodes, setEdges, setViewport]); // Added setViewport dependency


        // --- Node/Edge Selection ---
        const handleNodeClick = useCallback((event: React.MouseEvent, node: ScenarioNode) => {
          console.log("DEBUG: Node clicked:", node.id);
          setSelectedNode(node);
          setSelectedEdge(null);
          setContextMenu(null);
        }, []);

        const handleEdgeClick = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => {
          console.log("DEBUG: Edge clicked:", edge.id);
          // Only allow selecting edges in custom mode
          if (scenarioType === 'custom') {
              setSelectedEdge(edge);
              setSelectedNode(null);
              setContextMenu(null);
          } else {
              setSelectedEdge(null); // Clear selection in realistic mode
              setSelectedNode(null);
              setContextMenu(null);
              console.log("DEBUG: Edge selection disabled in realistic mode");
          }
        }, [scenarioType]); // Add scenarioType dependency

        const handlePaneClick = useCallback(() => {
          console.log("DEBUG: Pane clicked");
          setSelectedNode(null);
          setSelectedEdge(null);
          setContextMenu(null);
        }, []);

        // --- Add Node (from Drag & Drop) ---
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
                  // Initialize specific data based on scenario type? Maybe later.
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
          setSelectedNode(null); // Clear selection
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
          setSelectedNode(node); // Select the node on context menu
          setSelectedEdge(null);
          setContextMenu({ x: event.clientX, y: event.clientY, type: 'node', itemId: node.id });
        }, []);

        const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => {
          event.preventDefault();
          // Only allow context menu on edges in custom mode
          if (scenarioType === 'custom') {
              console.log("DEBUG: Edge context menu:", edge.id);
              setSelectedEdge(edge); // Select the edge on context menu
              setSelectedNode(null);
              setContextMenu({ x: event.clientX, y: event.clientY, type: 'edge', itemId: edge.id });
          } else {
              console.log("DEBUG: Edge context menu disabled in realistic mode");
          }
        }, [scenarioType]); // Add scenarioType dependency

        const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
          event.preventDefault();
          console.log("DEBUG: Pane context menu");
          setSelectedNode(null); // Clear selection
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
          setViewport((vp) => ({ ...vp, zoom: vp.zoom + 0.1 }), { duration: 100 });
        }, [setViewport]);

        const handleZoomOut = useCallback(() => {
          console.log("DEBUG: handleZoomOut called");
          setViewport((vp) => ({ ...vp, zoom: vp.zoom - 0.1 }), { duration: 100 });
        }, [setViewport]);

        // --- Save Action ---
        const handleSave = useCallback(() => {
          const currentViewport = getViewport();
          const scenarioState: ScenarioState = {
              name: scenarioName,
              scenarioType: scenarioType, // Include scenario type
              nodes: nodes,
              edges: edges,
              viewport: currentViewport,
          };
          console.log("Saving Scenario State:", JSON.stringify(scenarioState, null, 2));
          alert("Scenario state logged to console (simulation of save).");
          // Later: Implement actual saving mechanism (e.g., local storage, API call)
        }, [nodes, edges, getViewport, scenarioName, scenarioType]); // Include all relevant state

        // Determine if undo/redo is possible
        const canUndo = historyIndex > 0;
        const canRedo = historyIndex < history.length - 1;

        // --- Drag and Drop Handler (for adding nodes) ---
        const onDrop = useCallback(
          (event: React.DragEvent) => {
            event.preventDefault();
            event.currentTarget.classList.remove('drag-over'); // Remove visual cue on drop
            const type = event.dataTransfer.getData('application/node-type') as NodeType | undefined;
            if (!type) return;
            handleAddNode(type, event.clientX, event.clientY);
          },
          [handleAddNode] // Include handleAddNode which depends on screenToFlowPosition
        );

        // Add visual cue when dragging over the canvas
        const onDragOver = useCallback((event: React.DragEvent) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            // Check if the target is the main canvas area before adding class
            const target = event.target as HTMLElement;
            if (target.closest('.react-flow')) { // Check if dragging over ReactFlow pane
                 target.closest('.react-flow')?.parentElement?.classList.add('drag-over');
            }
        }, []);

        const onDragLeave = useCallback((event: React.DragEvent) => {
             const target = event.target as HTMLElement;
             target.closest('.react-flow')?.parentElement?.classList.remove('drag-over');
        }, []);
        // --- End Drag and Drop ---

        // --- Handle Scenario Type Change ---
        const handleScenarioTypeChange = useCallback((newType: ScenarioType) => {
            console.log("Changing scenario type to:", newType);
            // Add logic here if changing type should reset/clear certain data
            // For now, just update the type state. Consider adding to history?
            setScenarioType(newType);
            setSelectedNode(null); // Clear selection as config panel changes
            setSelectedEdge(null);
            setContextMenu(null);
            // Clear edges when switching to realistic mode? Or keep them but make non-interactive?
            // Let's clear them for now for simplicity.
            if (newType === 'realistic') {
                internalChangeRef.current = true; // Mark as internal change
                setEdges([]);
            }
            // Maybe reset history? Or add type change as a history step? For now, keep simple.
        }, [setEdges]); // Add setEdges dependency

        // Filter nodes for the Global Map View (only GS/UE with coordinates)
        const mapNodes = nodes.filter(node =>
            (node.data.type === 'GS' || node.data.type === 'UE') &&
            node.data.latitude !== undefined &&
            node.data.longitude !== undefined
        );

        return (
          // Main container needs to handle drag events for dropping nodes
          <div
              className="flex flex-col h-full text-white overflow-hidden"
              onDrop={onDrop}
              onDragOver={onDragOver} // Need onDragOver on the drop target container
              onDragLeave={onDragLeave}
          >
            {/* 1. Top Bar */}
            <ScenarioTopBar
              scenarioName={scenarioName}
              onScenarioNameChange={setScenarioName}
              scenarioType={scenarioType}
              onScenarioTypeChange={handleScenarioTypeChange} // Pass handler
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

              {/* Center Area - Modified Layout */}
              <div className="flex flex-1 flex-col overflow-hidden relative"> {/* Added relative for drag overlay */}
                 {/* Optional: Drag Overlay Visual Feedback */}
                 <div className="absolute inset-0 bg-albor-orange/10 border-2 border-dashed border-albor-orange pointer-events-none z-30 opacity-0 transition-opacity drag-over-target">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-albor-orange font-semibold">Drop Node Here</span>
                 </div>

                {/* 2. Main Canvas View (Takes up most space) */}
                {/* Ensure this container allows FlowCanvas to expand */}
                <div className="flex-1 min-h-0 relative"> {/* Use min-h-0 for flex shrinking */}
                    <FlowCanvas
                      nodes={nodes}
                      edges={edges}
                      setNodes={setNodes} // Pass state setters
                      setEdges={setEdges}
                      onNodesChange={onNodesChange} // Pass modified handlers
                      onEdgesChange={onEdgesChange}
                      // Pass click/context handlers
                      onNodeClick={handleNodeClick}
                      onEdgeClick={handleEdgeClick}
                      onPaneClick={handlePaneClick}
                      onNodeContextMenu={handleNodeContextMenu}
                      onEdgeContextMenu={handleEdgeContextMenu}
                      onPaneContextMenu={handlePaneContextMenu}
                      // Pass scenarioType to FlowCanvas
                      scenarioType={scenarioType}
                    />
                </div>

                {/* 6. Global Map View (Fixed height below canvas) */}
                {/* Increased height slightly */}
                <div className="h-56 flex-shrink-0 border-t border-albor-bg-dark">
                    <GlobalMapView nodes={mapNodes} />
                </div>

                {/* 5. Link Overview Panel (Fixed height below global map) */}
                <div className="h-48 flex-shrink-0 border-t border-albor-bg-dark">
                    <LinkOverviewPanel
                        links={edges}
                        nodes={nodes}
                        scenarioType={scenarioType} // Pass scenarioType
                    />
                </div>
              </div>

              {/* 4. Right Sidebar */}
              <NodeConfigSidebar
                  selectedNode={selectedNode}
                  scenarioType={scenarioType} // Pass scenario type
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
                onDelete={handleDeleteItem}
                // Disable delete edge in realistic mode
                canDeleteEdge={scenarioType === 'custom'}
              />
            )}
          </div>
        );
      };

      export default ScenarioEditorContent;
