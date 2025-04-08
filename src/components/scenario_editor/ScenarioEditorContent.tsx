import React, { useState, useCallback, useRef, useEffect } from 'react';
    import { nanoid } from 'nanoid';
    import {
      useNodesState,
      useEdgesState,
      useReactFlow,
      NodeChange,
      EdgeChange,
      Viewport,
      ReactFlowInstance, // Import ReactFlowInstance
    } from 'reactflow';
    import { debounce } from 'lodash-es'; // Import debounce

    import ScenarioTopBar from './ScenarioTopBar';
    import NodeListSidebar from './NodeListSidebar';
    import NodeConfigSidebar from './NodeConfigSidebar';
    import LinkOverviewPanel from './LinkOverviewPanel';
    import CanvasContextMenu from './CanvasContextMenu';
    import FlowCanvas from './FlowCanvas';
    import GlobalMapView from './GlobalMapView';
    import { ScenarioNode, ScenarioEdge, NodeType, ContextMenuData, HistoryEntry, CustomNodeData, ScenarioType, ScenarioState, CustomEdgeData } from './types'; // Ensure CustomEdgeData is imported

    // --- Constants ---
    const MAX_HISTORY_SIZE = 50;
    const LOCAL_STORAGE_PREFIX = 'albor_scenario_';
    const AUTOSAVE_DEBOUNCE_MS = 500; // Debounce auto-save

    // --- Initial Data (Fallback) ---
    const initialNodes: ScenarioNode[] = [
      { id: 'sat-1', type: 'SAT', position: { x: 150, y: 100 }, data: { type: 'SAT', name: 'Sat-LEO-01' } },
      { id: 'gs-1', type: 'GS', position: { x: 300, y: 250 }, data: { type: 'GS', name: 'GS-Madrid', latitude: 40.4, longitude: -3.7 } },
      { id: 'ue-1', type: 'UE', position: { x: 500, y: 150 }, data: { type: 'UE', name: 'UE-Mobile-A', latitude: 40.7, longitude: -74.0 } },
    ];
    const initialEdges: ScenarioEdge[] = [];
    const initialViewport: Viewport = { x: 0, y: 0, zoom: 1 };

    // --- Local Storage Utilities ---
    const saveScenarioToLocalStorage = (id: string, state: ScenarioState) => {
      try {
        const key = `${LOCAL_STORAGE_PREFIX}${id}`;
        localStorage.setItem(key, JSON.stringify(state));
        console.log(`DEBUG: Scenario '${id}' saved to Local Storage.`);
      } catch (error) {
        console.error("Error saving scenario to Local Storage:", error);
        // Handle potential storage quota errors
      }
    };

    const loadScenarioFromLocalStorage = (id: string): ScenarioState | null => {
      try {
        const key = `${LOCAL_STORAGE_PREFIX}${id}`;
        const savedState = localStorage.getItem(key);
        if (savedState) {
          console.log(`DEBUG: Scenario '${id}' loaded from Local Storage.`);
          // Add validation here if needed
          return JSON.parse(savedState) as ScenarioState;
        }
        console.log(`DEBUG: No saved state found for scenario '${id}'.`);
        return null;
      } catch (error) {
        console.error("Error loading scenario from Local Storage:", error);
        return null;
      }
    };
    // --- End Local Storage Utilities ---


    // Props interface
    interface ScenarioEditorContentProps {
      scenarioId: string | null; // Receive scenarioId
    }

    const ScenarioEditorContent: React.FC<ScenarioEditorContentProps> = ({ scenarioId }) => {
      console.log("ScenarioEditorContent Rendering, scenarioId:", scenarioId); // DEBUG

      // React Flow state hooks
      const [nodes, setNodes, onNodesChangeDirect] = useNodesState<CustomNodeData>([]); // Start empty, load later
      const [edges, setEdges, onEdgesChangeDirect] = useEdgesState<CustomEdgeData>([]); // Start empty
      // Note: useReactFlow hook is not used here as instance is managed via onInit

      // --- Scenario State ---
      const [scenarioName, setScenarioName] = useState<string>("New Scenario");
      const [scenarioType, setScenarioType] = useState<ScenarioType>('custom');
      const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null); // Track the ID being edited

      const [selectedNode, setSelectedNode] = useState<ScenarioNode | null>(null);
      const [selectedEdge, setSelectedEdge] = useState<ScenarioEdge | null>(null);
      const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);

      // --- Undo/Redo State ---
      const [history, setHistory] = useState<HistoryEntry[]>([]);
      const [historyIndex, setHistoryIndex] = useState<number>(-1);
      const isUndoingRedoing = useRef(false);
      const internalChangeRef = useRef(false); // Ref to track internal state changes vs history/load changes

      // --- Ref for React Flow Instance ---
      const reactFlowWrapperRef = useRef<HTMLDivElement>(null); // Ref for the main div containing ReactFlow
      const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null); // Store the instance


      // --- Save current state to history ---
      const saveHistory = useCallback(() => {
        if (isUndoingRedoing.current || internalChangeRef.current) {
          console.log("DEBUG: Skipping history save (internal/undo/redo)");
          isUndoingRedoing.current = false;
          internalChangeRef.current = false;
          return;
        }

        console.log("DEBUG: Saving history");
        const currentViewport = rfInstance?.getViewport() ?? initialViewport; // Get current viewport
        const newEntry: HistoryEntry = { nodes: [...nodes], edges: [...edges], viewport: currentViewport }; // Include viewport
        const nextHistory = history.slice(0, historyIndex + 1);
        const updatedHistory = [...nextHistory, newEntry];
        const finalHistory = updatedHistory.slice(-MAX_HISTORY_SIZE);
        const finalIndex = finalHistory.length - 1;

        setHistory(finalHistory);
        setHistoryIndex(finalIndex);
      }, [nodes, edges, history, historyIndex, rfInstance]); // Added rfInstance dependency

      // --- Effect to save state changes to history ---
      useEffect(() => {
        if (!isUndoingRedoing.current && !internalChangeRef.current) {
          saveHistory();
        }
      }, [nodes, edges, saveHistory]); // Depend on nodes and edges


      // --- Load Scenario on Mount or ID Change ---
      useEffect(() => {
        console.log("DEBUG: Load effect triggered. scenarioId prop:", scenarioId);
        internalChangeRef.current = true; // Mark as internal change

        let loadedState: ScenarioState | null = null;
        let effectiveId = scenarioId;

        if (!effectiveId) {
          // If no ID provided, create a new temporary one for this session
          effectiveId = `session_${nanoid(8)}`;
          console.log("DEBUG: No scenarioId provided, using temporary ID:", effectiveId);
          // Use initial defaults for a new scenario
          setNodes(initialNodes);
          setEdges(initialEdges);
          setScenarioName("New Scenario");
          setScenarioType('custom');
          if (rfInstance) {
            rfInstance.setViewport(initialViewport); // Reset viewport for new scenario
            rfInstance.fitView({ padding: 0.1, duration: 0 }); // Fit view immediately
          }
          setHistory([]); // Reset history for new scenario
          setHistoryIndex(-1);
        } else {
          // Try loading existing scenario
          loadedState = loadScenarioFromLocalStorage(effectiveId);
          if (loadedState) {
            setNodes(loadedState.nodes || initialNodes);
            setEdges(loadedState.edges || initialEdges);
            setScenarioName(loadedState.name || "Loaded Scenario");
            setScenarioType(loadedState.scenarioType || 'custom');
            // Restore viewport after instance is ready
            if (rfInstance) {
              rfInstance.setViewport(loadedState.viewport || initialViewport);
            } else {
              console.warn("DEBUG: React Flow instance not ready during load, viewport might not be restored immediately.");
            }
            // Reset history with the loaded state as the first entry
            setHistory([{ nodes: loadedState.nodes || [], edges: loadedState.edges || [], viewport: loadedState.viewport || initialViewport }]);
            setHistoryIndex(0);
          } else {
            // ID provided but no data found - treat as new scenario with this ID
            console.log(`DEBUG: Creating new scenario with ID: ${effectiveId}`);
            setNodes(initialNodes);
            setEdges(initialEdges);
            setScenarioName(`Scenario ${effectiveId.substring(0, 4)}...`); // Default name based on ID
            setScenarioType('custom');
            if (rfInstance) {
              rfInstance.setViewport(initialViewport);
              rfInstance.fitView({ padding: 0.1, duration: 0 }); // Fit view immediately
            }
            setHistory([]);
            setHistoryIndex(-1);
          }
        }

        setCurrentScenarioId(effectiveId); // Store the ID being worked on

        // Reset selections
        setSelectedNode(null);
        setSelectedEdge(null);
        setContextMenu(null);

        // Fit view after loading data (with a delay if instance wasn't ready)
        // This might be redundant if setViewport is called correctly
        const timer = setTimeout(() => {
          if (rfInstance && !loadedState?.viewport) { // Only fitView if viewport wasn't explicitly loaded
            console.log("DEBUG: Fitting view after load/ID change (delayed)");
            rfInstance.fitView({ padding: 0.1, duration: 200 });
          }
        }, 100);

        return () => clearTimeout(timer);

      }, [scenarioId, setNodes, setEdges, rfInstance]); // Depend on scenarioId prop and rfInstance


      // --- Modified State Change Handlers ---
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
          isUndoingRedoing.current = true;
          internalChangeRef.current = true;
          const previousIndex = historyIndex - 1;
          const previousState = history[previousIndex];
          console.log("DEBUG: Undoing to state index:", previousIndex);
          setNodes(previousState.nodes);
          setEdges(previousState.edges);
          if (rfInstance) { // Restore viewport
            rfInstance.setViewport(previousState.viewport || initialViewport);
          }
          setHistoryIndex(previousIndex);
          setSelectedNode(null);
          setSelectedEdge(null);
          setContextMenu(null);
        } else {
          console.log("DEBUG: Cannot undo further");
        }
      }, [history, historyIndex, setNodes, setEdges, rfInstance]); // Added rfInstance

      // --- Redo Action ---
      const handleRedo = useCallback(() => {
        console.log("DEBUG: handleRedo called");
        if (historyIndex < history.length - 1) {
          isUndoingRedoing.current = true;
          internalChangeRef.current = true;
          const nextIndex = historyIndex + 1;
          const nextState = history[nextIndex];
          console.log("DEBUG: Redoing to state index:", nextIndex);
          setNodes(nextState.nodes);
          setEdges(nextState.edges);
          if (rfInstance) { // Restore viewport
            rfInstance.setViewport(nextState.viewport || initialViewport);
          }
          setHistoryIndex(nextIndex);
          setSelectedNode(null);
          setSelectedEdge(null);
          setContextMenu(null);
        } else {
          console.log("DEBUG: Cannot redo further");
        }
      }, [history, historyIndex, setNodes, setEdges, rfInstance]); // Added rfInstance


      // --- Save Action (Explicit Save Button) ---
      const handleSave = useCallback(() => {
        if (!currentScenarioId) {
          console.error("Cannot save: No current scenario ID.");
          alert("Error: Cannot save scenario without an ID.");
          return;
        }
        const currentViewport = rfInstance?.getViewport() ?? initialViewport;
        const scenarioState: ScenarioState = {
          name: scenarioName,
          scenarioType: scenarioType,
          nodes: nodes,
          edges: edges,
          viewport: currentViewport,
        };
        saveScenarioToLocalStorage(currentScenarioId, scenarioState);
        alert(`Scenario '${scenarioName}' saved.`);
        // Optionally update history after explicit save? Maybe not needed if auto-save is robust.
      }, [nodes, edges, rfInstance, scenarioName, scenarioType, currentScenarioId]); // Include all relevant state


      // --- Auto-Save Logic ---
      const debouncedAutoSave = useCallback(
        debounce((id: string | null, state: ScenarioState) => {
          if (id) {
            saveScenarioToLocalStorage(id, state);
          } else {
            console.warn("Auto-save skipped: No current scenario ID.");
          }
        }, AUTOSAVE_DEBOUNCE_MS),
        [] // Empty dependency array for useCallback to create the debounced function once
      );

      useEffect(() => {
        // Don't auto-save during initial load or undo/redo
        if (internalChangeRef.current || isUndoingRedoing.current) {
          // Reset the flag after skipping
          if (internalChangeRef.current) internalChangeRef.current = false;
          if (isUndoingRedoing.current) isUndoingRedoing.current = false;
          return;
        }
        // Also skip if rfInstance is not yet available (prevents saving default viewport too early)
        if (!rfInstance) {
            return;
        }

        console.log("DEBUG: Auto-save effect triggered");
        const currentViewport = rfInstance.getViewport(); // Instance should be available here
        const currentState: ScenarioState = {
          name: scenarioName,
          scenarioType: scenarioType,
          nodes: nodes,
          edges: edges,
          viewport: currentViewport,
        };
        debouncedAutoSave(currentScenarioId, currentState);

      }, [nodes, edges, scenarioName, scenarioType, rfInstance, currentScenarioId, debouncedAutoSave]); // Depend on state that should trigger auto-save


      // --- Node/Edge Selection/Interaction Handlers ---
      const handleNodeClick = useCallback((event: React.MouseEvent, node: ScenarioNode) => {
        setSelectedNode(node);
        setSelectedEdge(null);
        setContextMenu(null);
      }, []);
      const handleEdgeClick = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => {
        if (scenarioType === 'custom') {
          setSelectedEdge(edge);
          setSelectedNode(null);
          setContextMenu(null);
        } else {
          setSelectedEdge(null);
          setSelectedNode(null);
          setContextMenu(null);
        }
      }, [scenarioType]);
      const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
        setSelectedEdge(null);
        setContextMenu(null);
      }, []);
      const handleAddNode = useCallback((type: NodeType, clientX: number, clientY: number) => {
        if (!rfInstance) return;
        const position = rfInstance.screenToFlowPosition({ x: clientX, y: clientY });
        const newNode: ScenarioNode = {
          id: `${type.toLowerCase()}-${nanoid(5)}`,
          type: type,
          position: position,
          data: { type: type, name: `${type}-${nodes.filter(n => n.data.type === type).length + 1}` },
        };
        internalChangeRef.current = true;
        setNodes((nds) => nds.concat(newNode));
      }, [rfInstance, setNodes, nodes]);
      const handleDeleteItem = useCallback((itemId: string) => {
        internalChangeRef.current = true;
        setNodes((nds) => nds.filter(node => node.id !== itemId));
        setEdges((eds) => eds.filter(edge => edge.id !== itemId && edge.source !== itemId && edge.target !== itemId));
        setSelectedNode(null);
        setSelectedEdge(null);
        setContextMenu(null);
      }, [setNodes, setEdges]);
      const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<CustomNodeData>) => {
        internalChangeRef.current = true;
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
          )
        );
        setSelectedNode(prev => prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...updates } } : prev);
      }, [setNodes]);
      const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: ScenarioNode) => {
        event.preventDefault();
        setSelectedNode(node);
        setSelectedEdge(null);
        setContextMenu({ x: event.clientX, y: event.clientY, type: 'node', itemId: node.id });
      }, []);
      const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => {
        event.preventDefault();
        if (scenarioType === 'custom') {
          setSelectedEdge(edge);
          setSelectedNode(null);
          setContextMenu({ x: event.clientX, y: event.clientY, type: 'edge', itemId: edge.id });
        }
      }, [scenarioType]);
      const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        setSelectedNode(null);
        setSelectedEdge(null);
        setContextMenu({ x: event.clientX, y: event.clientY, type: 'pane' });
      }, []);
      const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
      }, []);
      const handleZoomIn = useCallback(() => { rfInstance?.zoomIn({ duration: 100 }); }, [rfInstance]);
      const handleZoomOut = useCallback(() => { rfInstance?.zoomOut({ duration: 100 }); }, [rfInstance]);
      const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        const type = event.dataTransfer.getData('application/node-type') as NodeType | undefined;
        if (!type || !rfInstance) return;
        handleAddNode(type, event.clientX, event.clientY);
      }, [handleAddNode, rfInstance]);
      const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const target = event.target as HTMLElement;
        target.closest('.react-flow')?.parentElement?.classList.add('drag-over');
      }, []);
      const onDragLeave = useCallback((event: React.DragEvent) => {
        const target = event.target as HTMLElement;
        target.closest('.react-flow')?.parentElement?.classList.remove('drag-over');
      }, []);
      const handleScenarioTypeChange = useCallback((newType: ScenarioType) => {
        internalChangeRef.current = true;
        setScenarioType(newType);
        setSelectedNode(null);
        setSelectedEdge(null);
        setContextMenu(null);
        if (newType === 'realistic') {
          setEdges([]); // Clear edges when switching to realistic
        }
        // History will be saved by the auto-save effect
      }, [setEdges]);

      // Filter nodes for the Global Map View
      const mapNodes = nodes.filter(node =>
        (node.data.type === 'GS' || node.data.type === 'UE') &&
        node.data.latitude !== undefined &&
        node.data.longitude !== undefined
      );

      // Determine if undo/redo is possible
      const canUndo = historyIndex > 0;
      const canRedo = historyIndex < history.length - 1;

      return (
        <div
          ref={reactFlowWrapperRef} // Add ref here
          className="flex flex-col h-full text-white overflow-hidden"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          {/* 1. Top Bar */}
          <ScenarioTopBar
            scenarioName={scenarioName}
            onScenarioNameChange={(newName) => { internalChangeRef.current = true; setScenarioName(newName); }} // Mark internal change
            scenarioType={scenarioType}
            onScenarioTypeChange={handleScenarioTypeChange}
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
            <div className="flex flex-1 flex-col overflow-hidden relative">
              <div className="absolute inset-0 bg-albor-orange/10 border-2 border-dashed border-albor-orange pointer-events-none z-30 opacity-0 transition-opacity drag-over-target">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-albor-orange font-semibold">Drop Node Here</span>
              </div>

              {/* 2. Main Canvas View */}
              <div className="flex-1 min-h-0 relative">
                <FlowCanvas
                  nodes={nodes}
                  edges={edges}
                  setNodes={setNodes} // Pass state setters (might not be needed if only using onNodesChange)
                  setEdges={setEdges} // Pass state setters (might not be needed if only using onEdgesChange)
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                  onPaneClick={handlePaneClick}
                  onNodeContextMenu={handleNodeContextMenu}
                  onEdgeContextMenu={handleEdgeContextMenu}
                  onPaneContextMenu={handlePaneContextMenu}
                  scenarioType={scenarioType}
                  // Pass the onInit callback to store the instance
                  onInit={setRfInstance}
                />
              </div>

              {/* 6. Global Map View */}
              <div className="h-56 flex-shrink-0 border-t border-albor-bg-dark">
                <GlobalMapView nodes={mapNodes} />
              </div>

              {/* 5. Link Overview Panel */}
              <div className="h-48 flex-shrink-0 border-t border-albor-bg-dark">
                <LinkOverviewPanel
                  links={edges}
                  nodes={nodes}
                  scenarioType={scenarioType}
                />
              </div>
            </div>

            {/* 4. Right Sidebar */}
            <NodeConfigSidebar
              selectedNode={selectedNode}
              scenarioType={scenarioType}
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
              canDeleteEdge={scenarioType === 'custom'}
            />
          )}
        </div>
      );
    };

    // Add the missing default export
    export default ScenarioEditorContent;
