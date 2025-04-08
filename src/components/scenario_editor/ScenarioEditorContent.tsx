import React, { useState, useCallback, useRef, useEffect } from 'react';
    import { nanoid } from 'nanoid';
    import {
      useNodesState,
      useEdgesState,
      useReactFlow,
      NodeChange,
      EdgeChange,
      Viewport,
      ReactFlowInstance,
      Node,
      Edge as ReactFlowEdge,
    } from 'reactflow';
    import { debounce } from 'lodash-es';
    import { isEqual } from 'lodash-es'; // Import deep comparison

    import ScenarioTopBar from './ScenarioTopBar';
    import NodeListSidebar from './NodeListSidebar';
    import ConfigSidebar from './ConfigSidebar';
    import LinkOverviewPanel from './LinkOverviewPanel';
    import CanvasContextMenu from './CanvasContextMenu';
    import FlowCanvas from './FlowCanvas';
    import GlobalMapView from './GlobalMapView';
    import ScenarioManagementSidebar from './ScenarioManagementSidebar';
    import { ScenarioNode, ScenarioEdge, NodeType, ContextMenuData, HistoryEntry, CustomNodeData, ScenarioType, ScenarioState, CustomEdgeData } from './types';
    // Import the new scenario store functions
    import {
        getScenarioList,
        loadScenario,
        saveScenario,
        deleteScenario,
        generateNewScenarioId,
        getNewScenarioDefaultState,
        SavedScenarioInfo
    } from '../../content/scenarioStore';

    // --- Constants ---
    const MAX_HISTORY_SIZE = 50;
    // const LOCAL_STORAGE_PREFIX = 'albor_scenario_'; // No longer needed
    const AUTOSAVE_DEBOUNCE_MS = 1500; // Keep for potential future use

    // --- Initial Data (Now handled by store/new state function) ---
    // const initialNodes: Node<CustomNodeData>[] = [ ... ]; // Removed
    // const initialEdges: ReactFlowEdge<CustomEdgeData>[] = []; // Removed
    const initialViewport: Viewport = { x: 0, y: 0, zoom: 1 }; // Keep as default

    // interface SavedScenarioInfo { id: string; name: string; } // Moved to store

    // --- Local Storage Utilities --- REMOVED ---

    interface ScenarioEditorContentProps {
      scenarioId: string | null; // ID passed from App to load initially
      isLoadingScenario: boolean; // Loading state from App (might be less relevant now)
      onStartScenario: (id: string, name: string) => void; // Function to start the current scenario
      onLoadScenario: (id: string | null) => void; // Function to trigger loading a scenario in App
      onScenarioSaved: () => void; // Callback when a save/delete occurs (e.g., to refresh external lists if needed)
    }

    // Define the component function
    const ScenarioEditorContentComponent: React.FC<ScenarioEditorContentProps> = ({
      scenarioId: initialScenarioIdProp, // Use the prop name for initial load trigger
      isLoadingScenario: isLoadingFromApp, // Rename to avoid confusion
      onStartScenario,
      onLoadScenario: notifyAppToLoad, // Rename for clarity
      onScenarioSaved,
    }) => {
      const [nodes, setNodes, onNodesChangeDirect] = useNodesState<CustomNodeData>([]); // Start empty
      const [edges, setEdges, onEdgesChangeDirect] = useEdgesState<CustomEdgeData>([]); // Start empty
      const [scenarioName, setScenarioName] = useState<string>("New Scenario");
      const [scenarioType, setScenarioType] = useState<ScenarioType>('realistic');
      const [currentScenarioIdInternal, setCurrentScenarioIdInternal] = useState<string | null>(null); // Internal tracking ID
      const [selectedNode, setSelectedNode] = useState<ScenarioNode | null>(null);
      const [selectedEdge, setSelectedEdge] = useState<ScenarioEdge | null>(null);
      const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
      // const [history, setHistory] = useState<HistoryEntry[]>([]); // History might need rework with async save/load
      // const [historyIndex, setHistoryIndex] = useState<number>(-1);
      // const isUndoingRedoing = useRef(false);
      const internalChangeRef = useRef(false); // Tracks changes made internally (load, undo/redo)
      const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
      const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
      const [savedScenarios, setSavedScenarios] = useState<SavedScenarioInfo[]>([]);
      const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
      const isInitialLoadDone = useRef(false); // Tracks if the initial load effect has finished
      const [selectedScenarioIds, setSelectedScenarioIds] = useState<Set<string>>(new Set()); // State for multi-select
      const [isLoading, setIsLoading] = useState<boolean>(false); // Internal loading state
      const [lastSavedState, setLastSavedState] = useState<ScenarioState | null>(null); // State for comparison

      const { setViewport, getViewport } = useReactFlow(); // Get viewport functions

      // --- Fetch saved scenarios list ---
      const refreshScenarioList = useCallback(async () => {
        console.log("DEBUG: Refreshing scenario list...");
        setIsLoading(true);
        try {
            const list = await getScenarioList();
            setSavedScenarios(list);
            console.log("DEBUG: Scenario list refreshed:", list.length, "items");
        } catch (error) {
            console.error("Error fetching scenario list:", error);
            // Handle error display if needed
        } finally {
            setIsLoading(false);
        }
      }, []);

      useEffect(() => {
        refreshScenarioList();
      }, [refreshScenarioList]);

      // --- Get Current Editor State ---
      const getCurrentState = useCallback((): ScenarioState => {
        return {
          name: scenarioName,
          scenarioType: scenarioType,
          nodes: nodes,
          edges: edges,
          viewport: getViewport(),
        };
      }, [scenarioName, scenarioType, nodes, edges, getViewport]);

      // --- Compare States ---
      const compareStates = useCallback((stateA: ScenarioState | null, stateB: ScenarioState | null): boolean => {
        if (stateA === null || stateB === null) {
          return stateA === stateB; // True if both are null, false otherwise
        }
        // Compare specific fields for unsaved changes detection
         return (
            stateA.name === stateB.name &&
            stateA.scenarioType === stateB.scenarioType &&
            isEqual(stateA.nodes, stateB.nodes) && // Deep compare nodes
            isEqual(stateA.edges, stateB.edges) // Deep compare edges
            // Optionally exclude viewport: && isEqual(stateA.viewport, stateB.viewport)
        );
      }, []);

      // --- Effect to check for unsaved changes ---
      useEffect(() => {
        if (!isInitialLoadDone.current || internalChangeRef.current || lastSavedState === null) {
            // Don't check for changes during initial load, internal ops, or if it's a pristine new scenario
            return;
        }

        const currentState = getCurrentState();
        const areStatesEqual = compareStates(currentState, lastSavedState);

        if (!areStatesEqual && !hasUnsavedChanges) {
            console.log("DEBUG: Unsaved changes DETECTED.");
            setHasUnsavedChanges(true);
        } else if (areStatesEqual && hasUnsavedChanges) {
            // This case might happen if user undoes changes back to saved state
            console.log("DEBUG: Changes reverted to saved state.");
            setHasUnsavedChanges(false);
        }
        // If states are equal and hasUnsavedChanges is false, do nothing.
      }, [nodes, edges, scenarioName, scenarioType, lastSavedState, getCurrentState, compareStates, hasUnsavedChanges]);


      // --- Load Scenario Data ---
      const loadScenarioData = useCallback(async (idToLoad: string | null) => {
        console.log(`DEBUG: Starting loadScenarioData for ID: ${idToLoad}`);
        internalChangeRef.current = true; // Mark as internal change START
        isInitialLoadDone.current = false;
        setIsLoading(true);
        setHasUnsavedChanges(false); // Reset initially
        setSelectedScenarioIds(new Set());
        setSelectedNode(null);
        setSelectedEdge(null);
        setContextMenu(null);

        let loadedState: ScenarioState | null = null;
        let effectiveId = idToLoad;
        let isNewScenario = false;

        try {
            if (effectiveId) {
                loadedState = await loadScenario(effectiveId);
                if (!loadedState) {
                    console.warn(`DEBUG: Scenario ${effectiveId} not found in store, creating new.`);
                    effectiveId = null; // Treat as new scenario creation
                }
            }

            if (!effectiveId) {
                // Create a new scenario state
                isNewScenario = true;
                effectiveId = generateNewScenarioId(); // Generate ID for internal tracking
                loadedState = getNewScenarioDefaultState();
                console.log(`DEBUG: Created new scenario state with temp ID: ${effectiveId}`);
            }

            if (loadedState) {
                setCurrentScenarioIdInternal(effectiveId);
                setScenarioName(loadedState.name);
                setScenarioType(loadedState.scenarioType);
                setNodes(loadedState.nodes);
                setEdges(loadedState.edges);
                setViewport(loadedState.viewport); // Use setViewport from useReactFlow
                // Store null as last saved for new scenarios, otherwise store loaded state
                setLastSavedState(isNewScenario ? null : JSON.parse(JSON.stringify(loadedState)));
                setHasUnsavedChanges(false); // Start clean, changes detected by useEffect later
                console.log(`DEBUG: Scenario ${effectiveId} loaded. Name: ${loadedState.name}. Is New: ${isNewScenario}`);
            } else {
                 console.error("DEBUG: Failed to load or create scenario state.");
                 // Handle error state - load a default empty state
                 const defaultState = getNewScenarioDefaultState();
                 setCurrentScenarioIdInternal(generateNewScenarioId());
                 setScenarioName(defaultState.name);
                 setScenarioType(defaultState.scenarioType);
                 setNodes(defaultState.nodes);
                 setEdges(defaultState.edges);
                 setViewport(defaultState.viewport);
                 setLastSavedState(null); // No saved state
                 setHasUnsavedChanges(false); // Start clean
            }

        } catch (error) {
            console.error("Error during scenario load:", error);
            // Handle error display
        } finally {
            // Use setTimeout to allow state updates and rendering
            setTimeout(() => {
                internalChangeRef.current = false; // Mark as internal change END
                isInitialLoadDone.current = true; // Mark initial load as DONE
                setIsLoading(false);
                console.log("DEBUG: Load process finished. internalChangeRef/isInitialLoadDone reset.");
                 // Fit view only for newly created scenarios or if viewport wasn't explicitly loaded?
                if (rfInstance && (isNewScenario || !loadedState?.viewport || loadedState?.nodes.length === 0)) {
                     rfInstance.fitView({ padding: 0.1, duration: 200 });
                }
            }, 100);
        }
      }, [rfInstance, setNodes, setEdges, setViewport, compareStates]); // Added compareStates dependency

      // Effect to load data when the initialScenarioIdProp changes
      useEffect(() => {
        console.log("DEBUG: initialScenarioIdProp changed to:", initialScenarioIdProp);
        // Loading logic now happens within loadScenarioData, triggered by prop change
        loadScenarioData(initialScenarioIdProp);
      }, [initialScenarioIdProp]); // Depend only on the initial prop


      // --- State Change Handlers ---
      const onNodesChange = useCallback((changes: NodeChange[]) => {
        onNodesChangeDirect(changes);
        // Unsaved changes check is now handled by the useEffect watching nodes/edges etc.
      }, [onNodesChangeDirect]);

      const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        onEdgesChangeDirect(changes);
        // Unsaved changes check is now handled by the useEffect watching nodes/edges etc.
      }, [onEdgesChangeDirect]);

      const handleScenarioNameChange = (newName: string) => {
        setScenarioName(newName);
        // Unsaved changes check handled by useEffect
      };

      const handleScenarioTypeChangeInternal = (newType: ScenarioType) => {
        if (newType === scenarioType) return;

        // Check for unsaved changes before proceeding
        // Skip check if it's a pristine new scenario (lastSavedState is null)
        if (hasUnsavedChanges && lastSavedState !== null) {
            if (!window.confirm("You have unsaved changes. Discard changes and switch scenario type?")) {
                console.log("DEBUG: Scenario type change cancelled due to unsaved changes.");
                return; // Abort the change
            }
            console.log("DEBUG: User confirmed discarding changes for type switch.");
        }

        console.log(`DEBUG: Changing scenario type to ${newType}`);
        internalChangeRef.current = true; // Mark as internal change START

        setScenarioType(newType);
        setSelectedNode(null);
        setSelectedEdge(null);
        setContextMenu(null);
        if (newType === 'realistic') {
            console.log("DEBUG: Clearing edges for realistic mode.");
            setEdges([]); // This will trigger the useEffect for unsaved changes check
        }
        // Mark unsaved if switching type on a previously saved scenario
        if (lastSavedState !== null) {
            setHasUnsavedChanges(true);
        }

        // Reset internal change flag after state updates are likely processed
        setTimeout(() => {
            internalChangeRef.current = false;
            console.log("DEBUG: internalChangeRef reset after type change timeout.");
        }, 50);
      };

      // --- Save Action ---
      const handleSave = useCallback(async () => {
        if (!currentScenarioIdInternal) {
            console.error("Cannot save, no current scenario ID.");
            alert("Error: No scenario ID. Please use 'Save As'.");
            return;
        }
        console.log(`DEBUG: Saving scenario ID: ${currentScenarioIdInternal}`);
        internalChangeRef.current = true;
        setIsLoading(true);
        const currentState = getCurrentState();
        try {
            await saveScenario(currentScenarioIdInternal, currentState);
            setLastSavedState(JSON.parse(JSON.stringify(currentState))); // Update last saved state
            setHasUnsavedChanges(false); // Mark as saved
            console.log("DEBUG: Scenario saved successfully.");
            onScenarioSaved(); // Notify parent
            await refreshScenarioList(); // Refresh list
        } catch (error) {
            console.error("Error saving scenario:", error);
            alert(`Error saving scenario: ${error}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => { internalChangeRef.current = false; }, 50);
        }
      }, [currentScenarioIdInternal, getCurrentState, onScenarioSaved, refreshScenarioList]);

      // --- Save As Action ---
      const handleSaveAs = useCallback(async () => {
        const newName = prompt("Enter new scenario name:", `${scenarioName} Copy`);
        if (!newName || newName.trim() === '') {
            console.log("DEBUG: Save As cancelled.");
            return;
        }

        const newId = generateNewScenarioId();
        console.log(`DEBUG: Saving As new scenario ID: ${newId}, Name: ${newName}`);
        internalChangeRef.current = true;
        setIsLoading(true);

        const currentState = getCurrentState();
        const newState: ScenarioState = {
            ...currentState,
            name: newName.trim(), // Use the new name
        };

        try {
            await saveScenario(newId, newState); // Save with the new ID
            setCurrentScenarioIdInternal(newId); // Update the current ID
            setScenarioName(newState.name); // Update the current name
            setLastSavedState(JSON.parse(JSON.stringify(newState))); // Update last saved state
            setHasUnsavedChanges(false); // Mark as saved
            console.log("DEBUG: Scenario saved successfully with new ID.");
            onScenarioSaved(); // Notify parent
            await refreshScenarioList(); // Refresh the list to show the new scenario
            // Notify App that the context has changed to the new ID
            notifyAppToLoad(newId);
        } catch (error) {
            console.error("Error saving scenario as:", error);
            alert(`Error saving scenario: ${error}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => { internalChangeRef.current = false; }, 50);
        }
      }, [scenarioName, getCurrentState, onScenarioSaved, refreshScenarioList, notifyAppToLoad]);


      // --- Other Handlers (Simplified - Add/Delete/Update need internalChangeRef) ---
      const handleAddNode = useCallback((type: NodeType, clientX: number, clientY: number) => {
          if (!rfInstance) return;
          internalChangeRef.current = true;
          const position = rfInstance.screenToFlowPosition({ x: clientX, y: clientY });
          const newNode: ScenarioNode = {
            id: `${type.toLowerCase()}-${nanoid(5)}`,
            type: type,
            position: position,
            data: { type: type, name: `${type}-${nodes.filter(n => n.data.type === type).length + 1}` },
          };
          setNodes((nds) => nds.concat(newNode));
          // Mark unsaved if adding to a previously saved state or a new state
          setHasUnsavedChanges(true);
          setTimeout(() => { internalChangeRef.current = false; }, 50);
       }, [rfInstance, setNodes, nodes]); // Removed lastSavedState dependency here

      const handleDeleteItem = useCallback((itemId: string) => {
          internalChangeRef.current = true;
          setNodes((nds) => nds.filter(node => node.id !== itemId));
          setEdges((eds) => eds.filter(edge => edge.id !== itemId && edge.source !== itemId && edge.target !== itemId));
          setSelectedNode(null);
          setSelectedEdge(null);
          setContextMenu(null);
          // Mark unsaved if deleting from a previously saved state or a new state
          setHasUnsavedChanges(true);
          setTimeout(() => { internalChangeRef.current = false; }, 50);
        }, [setNodes, setEdges]); // Removed lastSavedState dependency here

      const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<CustomNodeData>) => {
          internalChangeRef.current = true;
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
            )
          );
          setSelectedNode(prev => prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...updates } } : prev);
          // Mark unsaved if updating a previously saved state or a new state
          setHasUnsavedChanges(true);
          setTimeout(() => { internalChangeRef.current = false; }, 50);
        }, [setNodes]); // Removed lastSavedState dependency here

      const handleEdgeUpdate = useCallback((edgeId: string, updates: Partial<CustomEdgeData>) => {
          internalChangeRef.current = true;
          setEdges((eds) =>
            eds.map((edge) =>
              edge.id === edgeId ? { ...edge, data: { ...edge.data, ...updates } } : edge
            )
          );
           setSelectedEdge(prev => prev && prev.id === edgeId ? { ...prev, data: { ...prev.data, ...updates } } : prev);
          // Mark unsaved if updating a previously saved state or a new state
          setHasUnsavedChanges(true);
          setTimeout(() => { internalChangeRef.current = false; }, 50);
        }, [setEdges]); // Removed lastSavedState dependency here

      // --- Click/Context Handlers (No change needed) ---
      const handleNodeClick = useCallback((event: React.MouseEvent, node: ScenarioNode) => { setSelectedNode(node); setSelectedEdge(null); setContextMenu(null); }, []);
      const handleEdgeClick = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => { if (scenarioType === 'custom') { setSelectedEdge(edge); setSelectedNode(null); setContextMenu(null); } else { setSelectedEdge(null); setSelectedNode(null); setContextMenu(null); } }, [scenarioType]);
      const handlePaneClick = useCallback(() => { setSelectedNode(null); setSelectedEdge(null); setContextMenu(null); }, []);
      const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: ScenarioNode) => { event.preventDefault(); setSelectedNode(node); setSelectedEdge(null); setContextMenu({ x: event.clientX, y: event.clientY, type: 'node', itemId: node.id }); }, []);
      const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => { event.preventDefault(); if (scenarioType === 'custom') { setSelectedEdge(edge); setSelectedNode(null); setContextMenu({ x: event.clientX, y: event.clientY, type: 'edge', itemId: edge.id }); } }, [scenarioType]);
      const handlePaneContextMenu = useCallback((event: React.MouseEvent) => { event.preventDefault(); setSelectedNode(null); setSelectedEdge(null); setContextMenu({ x: event.clientX, y: event.clientY, type: 'pane' }); }, []);
      const handleCloseContextMenu = useCallback(() => { setContextMenu(null); }, []);

      // --- Drag/Drop Handlers ---
      const onDrop = useCallback((event: React.DragEvent) => { event.preventDefault(); event.currentTarget.classList.remove('drag-over'); const type = event.dataTransfer.getData('application/node-type') as NodeType | undefined; if (!type || !rfInstance) return; handleAddNode(type, event.clientX, event.clientY); }, [handleAddNode, rfInstance]);
      const onDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; const target = event.target as HTMLElement; target.closest('.react-flow')?.parentElement?.classList.add('drag-over'); }, []);
      const onDragLeave = useCallback((event: React.DragEvent) => { const target = event.target as HTMLElement; target.closest('.react-flow')?.parentElement?.classList.remove('drag-over'); }, []);

      // --- Scenario Action Handlers ---
      const triggerStartScenario = useCallback(() => {
        if (!currentScenarioIdInternal) {
            alert("Please save the scenario before starting the simulation.");
            return;
        }
        if (hasUnsavedChanges && lastSavedState !== null) { // Only ask if it's not a new scenario
            if (window.confirm("You have unsaved changes. Save before starting simulation?")) {
                handleSave().then(() => {
                    // Check if save was successful? For now, assume it was.
                    if (currentScenarioIdInternal) { // Re-check ID after potential save
                       onStartScenario(currentScenarioIdInternal, scenarioName);
                    }
                });
            } else {
                // Start without saving (use last saved state implicitly)
                onStartScenario(currentScenarioIdInternal, scenarioName);
            }
        } else {
            // No unsaved changes or it's a new unsaved scenario, start directly
            onStartScenario(currentScenarioIdInternal, scenarioName);
        }
      }, [currentScenarioIdInternal, scenarioName, onStartScenario, hasUnsavedChanges, handleSave, lastSavedState]);

      // --- Multi-Select Handlers ---
      const handleToggleScenarioSelection = useCallback((id: string) => {
        setSelectedScenarioIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
          return newSet;
        });
      }, []);

      const handleDeleteSelectedScenarios = useCallback(async () => {
        if (selectedScenarioIds.size === 0) return;
        const scenariosToDelete = savedScenarios.filter(s => selectedScenarioIds.has(s.id));
        const namesToDelete = scenariosToDelete.map(s => s.name).join(', ');

        if (window.confirm(`Are you sure you want to delete ${selectedScenarioIds.size} selected scenario(s)?\n(${namesToDelete})`)) {
          internalChangeRef.current = true;
          setIsLoading(true);
          let currentScenarioWasDeleted = false;
          const deletePromises = Array.from(selectedScenarioIds).map(async (id) => {
            try {
              await deleteScenario(id);
              if (currentScenarioIdInternal === id) {
                currentScenarioWasDeleted = true;
              }
            } catch (error) {
               console.error(`Error deleting scenario ${id}:`, error);
               alert(`Error deleting scenario with ID: ${id}`);
            }
          });

          await Promise.all(deletePromises);

          setSelectedScenarioIds(new Set()); // Clear selection
          onScenarioSaved(); // Notify App
          await refreshScenarioList(); // Refresh list state

          if (currentScenarioWasDeleted) {
            console.log(`DEBUG: Deleted current scenario, loading new.`);
            notifyAppToLoad(null); // Use the App's handler to load null
          }
          setIsLoading(false);
          setTimeout(() => { internalChangeRef.current = false; }, 50);
        }
      }, [selectedScenarioIds, savedScenarios, currentScenarioIdInternal, notifyAppToLoad, onScenarioSaved, refreshScenarioList]);

      // --- Load Trigger Handler (Checks Unsaved Changes) ---
      const handleLoadScenarioTrigger = useCallback((id: string | null) => {
        // Skip confirmation ONLY if it's a pristine new scenario (lastSavedState is null)
        if (hasUnsavedChanges && lastSavedState !== null) {
          if (!window.confirm("You have unsaved changes. Discard changes and load another scenario?")) {
            console.log("DEBUG: Load scenario cancelled due to unsaved changes.");
            return; // Abort load
          }
          console.log("DEBUG: User confirmed discarding changes for load.");
        }
        // Proceed with calling the App's load handler
        notifyAppToLoad(id);
      }, [notifyAppToLoad, hasUnsavedChanges, lastSavedState]); // Add lastSavedState dependency

      // --- Duplicate Scenario Handler ---
      const handleDuplicateScenario = useCallback(async (idToDuplicate: string) => {
        console.log(`DEBUG: Duplicating scenario ID: ${idToDuplicate}`);
        internalChangeRef.current = true;
        setIsLoading(true);

        try {
            const originalState = await loadScenario(idToDuplicate);
            if (!originalState) {
                throw new Error("Original scenario not found for duplication.");
            }

            const newId = generateNewScenarioId();
            const newName = `${originalState.name} Copy`; // Simple copy naming

            const newState: ScenarioState = {
                ...originalState, // Copy nodes, edges, viewport, type
                name: newName, // Set the new name
            };

            await saveScenario(newId, newState); // Save the duplicated scenario

            console.log(`DEBUG: Scenario duplicated successfully. New ID: ${newId}, Name: ${newName}`);
            onScenarioSaved(); // Notify parent
            await refreshScenarioList(); // Refresh the list

            // Ask user if they want to load the new duplicate
            if (window.confirm(`Scenario duplicated as "${newName}". Load it now?`)) {
                notifyAppToLoad(newId); // Trigger loading the new duplicate
            }

        } catch (error) {
            console.error("Error duplicating scenario:", error);
            alert(`Error duplicating scenario: ${error}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => { internalChangeRef.current = false; }, 50);
        }
      }, [onScenarioSaved, refreshScenarioList, notifyAppToLoad]); // Dependencies


      const mapNodes = nodes.filter(node => (node.data.type === 'GS' || node.data.type === 'UE') && node.data.latitude !== undefined && node.data.longitude !== undefined);

      // --- Component's JSX return ---
      return (
        <div className="flex flex-col h-full text-white overflow-hidden">
          <ScenarioTopBar
            scenarioName={scenarioName}
            onScenarioNameChange={handleScenarioNameChange}
            scenarioType={scenarioType}
            onScenarioTypeChange={handleScenarioTypeChangeInternal}
            onSave={handleSave} // Pass implemented handler
            onSaveAs={handleSaveAs} // Pass implemented handler
            isLoading={isLoading || isLoadingFromApp} // Combine loading states
            onStartScenario={triggerStartScenario} // Pass implemented handler
            hasUnsavedChanges={hasUnsavedChanges}
          />
          <div className="flex flex-1 overflow-hidden">
            <ScenarioManagementSidebar
                savedScenarios={savedScenarios}
                selectedScenarioIds={selectedScenarioIds}
                onLoadScenario={handleLoadScenarioTrigger} // Pass the trigger handler
                onToggleSelection={handleToggleScenarioSelection}
                onDeleteSelected={handleDeleteSelectedScenarios}
                onDuplicateScenario={handleDuplicateScenario} // Pass duplicate handler
            />
            <div ref={reactFlowWrapperRef} className="flex flex-1 flex-col overflow-hidden relative" onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
               <div className="absolute inset-0 bg-albor-orange/10 border-2 border-dashed border-albor-orange pointer-events-none z-30 opacity-0 transition-opacity drag-over-target"> <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-albor-orange font-semibold">Drop Node Here</span> </div>
               <div className="flex-1 min-h-0 relative">
                 <FlowCanvas
                   nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges}
                   onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                   onNodeClick={handleNodeClick} onEdgeClick={handleEdgeClick}
                   onPaneClick={handlePaneClick} onNodeContextMenu={handleNodeContextMenu}
                   onEdgeContextMenu={handleEdgeContextMenu} onPaneContextMenu={handlePaneContextMenu}
                   scenarioType={scenarioType} onInit={setRfInstance}
                 />
               </div>
               {/* Bottom Panel Layout Adjustment: Side-by-side */}
               {/* Increased Height, Adjusted Width Split */}
               <div className="h-[300px] flex flex-shrink-0 border-t border-albor-bg-dark">
                  {/* Give Map View 3/5 width */}
                  <div className="w-3/5 h-full border-r border-albor-bg-dark">
                      <GlobalMapView nodes={mapNodes} />
                  </div>
                  {/* Give Link Overview 2/5 width */}
                  <div className="w-2/5 h-full">
                      <LinkOverviewPanel links={edges} nodes={nodes} scenarioType={scenarioType} />
                  </div>
               </div>
            </div>
            <div className="flex flex-col w-64 flex-shrink-0">
                {/* Node List Sidebar */}
                {/* Ensure parent div allows NodeListSidebar to fill width */}
                <div className="border-l border-b border-albor-bg-dark h-1/2"> {/* Adjusted height */}
                    <NodeListSidebar />
                </div>
                {/* Config Sidebar - Allow to take remaining height */}
                <div className="flex-1 border-l border-albor-bg-dark overflow-hidden min-h-0"> {/* Adjusted height */}
                    <ConfigSidebar
                        selectedNode={selectedNode}
                        selectedEdge={selectedEdge}
                        scenarioType={scenarioType}
                        onNodeUpdate={handleNodeUpdate} // Pass handler
                        onEdgeUpdate={handleEdgeUpdate} // Pass handler
                    />
                </div>
            </div>
          </div>
          {contextMenu && (
            <CanvasContextMenu
                x={contextMenu.x} y={contextMenu.y} type={contextMenu.type}
                itemId={contextMenu.itemId} onClose={handleCloseContextMenu}
                onDelete={handleDeleteItem} // Pass handler
                canDeleteEdge={scenarioType === 'custom'}
            />
          )}
        </div>
      );
    };

    // Export the defined component
    export default ScenarioEditorContentComponent;
