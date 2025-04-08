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

    import ScenarioTopBar from './ScenarioTopBar';
    import NodeListSidebar from './NodeListSidebar';
    import ConfigSidebar from './ConfigSidebar';
    import LinkOverviewPanel from './LinkOverviewPanel';
    import CanvasContextMenu from './CanvasContextMenu';
    import FlowCanvas from './FlowCanvas';
    import GlobalMapView from './GlobalMapView';
    import ScenarioManagementSidebar from './ScenarioManagementSidebar';
    import { ScenarioNode, ScenarioEdge, NodeType, ContextMenuData, HistoryEntry, CustomNodeData, ScenarioType, ScenarioState, CustomEdgeData } from './types';

    // --- Constants ---
    const MAX_HISTORY_SIZE = 50;
    const LOCAL_STORAGE_PREFIX = 'albor_scenario_';
    const AUTOSAVE_DEBOUNCE_MS = 1500;

    // --- Initial Data (Improved Default) ---
    const initialNodes: Node<CustomNodeData>[] = [
      { id: 'sat-leo-default', type: 'SAT', position: { x: 200, y: 150 }, data: { type: 'SAT', name: 'Sat-Default-LEO', tle: "1 25544U 98067A   23310.56318310  .00016717  00000-0  30306-3 0  9999\n2 25544  51.6410 218.9064 0006703 148.7738 211.3391 15.49013835396839" } },
      { id: 'gs-default', type: 'GS', position: { x: 450, y: 350 }, data: { type: 'GS', name: 'GS-Default', latitude: 40.4168, longitude: -3.7038, altitude: 650 } },
      { id: 'ue-default', type: 'UE', position: { x: 650, y: 200 }, data: { type: 'UE', name: 'UE-Default', latitude: 48.8566, longitude: 2.3522, altitude: 35 } },
    ];
    const initialEdges: ReactFlowEdge<CustomEdgeData>[] = [];
    const initialViewport: Viewport = { x: 0, y: 0, zoom: 0.9 };

    interface SavedScenarioInfo { id: string; name: string; }

    // --- Local Storage Utilities ---
    const saveScenarioToLocalStorage = (id: string, state: ScenarioState) => { try { const key = `${LOCAL_STORAGE_PREFIX}${id}`; localStorage.setItem(key, JSON.stringify(state)); console.log(`DEBUG: Scenario '${id}' saved.`); } catch (error) { console.error("Error saving scenario:", error); } };
    const loadScenarioFromLocalStorage = (id: string): ScenarioState | null => { try { const key = `${LOCAL_STORAGE_PREFIX}${id}`; const savedState = localStorage.getItem(key); return savedState ? JSON.parse(savedState) as ScenarioState : null; } catch (error) { console.error("Error loading scenario:", error); return null; } };
    const getSavedScenarios = (): SavedScenarioInfo[] => { const scenarios: SavedScenarioInfo[] = []; try { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) { const scenarioId = key.substring(LOCAL_STORAGE_PREFIX.length); const savedStateRaw = localStorage.getItem(key); let scenarioName = `Unnamed Scenario (${scenarioId.substring(0, 4)}...)`; if (savedStateRaw) { try { const savedState = JSON.parse(savedStateRaw) as Partial<ScenarioState>; if (savedState.name && savedState.name.trim() !== '') { scenarioName = savedState.name; } } catch (e) { /* ignore parsing error for name */ } } scenarios.push({ id: scenarioId, name: scenarioName }); } } } catch (error) { console.error("Error reading saved scenarios:", error); } return scenarios.sort((a, b) => a.name.localeCompare(b.name)); };
    // --- End Local Storage Utilities ---

    interface ScenarioEditorContentProps {
      scenarioId: string | null; // Renamed from scenarioIdToLoad for clarity
      isLoadingScenario: boolean;
      onStartScenario: (id: string, name: string) => void;
      onLoadScenario: (id: string | null) => void; // Keep this to trigger load from App
      onScenarioSaved: () => void; // Callback when a save occurs
    }

    // Define the component function
    const ScenarioEditorContentComponent: React.FC<ScenarioEditorContentProps> = ({
      scenarioId: currentScenarioIdProp, // Use the prop name
      isLoadingScenario,
      onStartScenario,
      onLoadScenario, // Keep receiving this prop
      onScenarioSaved,
    }) => {
      const [nodes, setNodes, onNodesChangeDirect] = useNodesState<CustomNodeData>(initialNodes);
      const [edges, setEdges, onEdgesChangeDirect] = useEdgesState<CustomEdgeData>(initialEdges);
      const [scenarioName, setScenarioName] = useState<string>("New Scenario");
      const [scenarioType, setScenarioType] = useState<ScenarioType>('realistic'); // Default to realistic
      const [currentScenarioIdInternal, setCurrentScenarioIdInternal] = useState<string | null>(null); // Internal tracking ID
      const [selectedNode, setSelectedNode] = useState<ScenarioNode | null>(null);
      const [selectedEdge, setSelectedEdge] = useState<ScenarioEdge | null>(null);
      const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
      const [history, setHistory] = useState<HistoryEntry[]>([]);
      const [historyIndex, setHistoryIndex] = useState<number>(-1);
      const isUndoingRedoing = useRef(false);
      const internalChangeRef = useRef(false); // Tracks changes made internally (load, undo/redo)
      const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
      const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
      const [savedScenarios, setSavedScenarios] = useState<SavedScenarioInfo[]>([]);
      const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
      const isInitialLoadDone = useRef(false); // Tracks if the initial load effect has finished
      const [selectedScenarioIds, setSelectedScenarioIds] = useState<Set<string>>(new Set()); // State for multi-select

      // Fetch saved scenarios on mount
      useEffect(() => { setSavedScenarios(getSavedScenarios()); }, []);

      // *** DEBUG: Comment out complex hooks/effects ***

      // const saveHistory = useCallback(() => { /* ... */ }, [nodes, edges, history, historyIndex, rfInstance]);
      // useEffect(() => { if (!isUndoingRedoing.current && !internalChangeRef.current && isInitialLoadDone.current) { saveHistory(); } }, [nodes, edges, saveHistory]);

      // --- Load Scenario Data --- *** RESTORED ***
      const loadScenarioData = useCallback((idToLoad: string | null) => {
        // Confirmation is now handled before calling this via onLoadScenario prop

        console.log(`DEBUG: Starting loadScenarioData for ID: ${idToLoad}`);
        internalChangeRef.current = true; // Mark as internal change START
        isInitialLoadDone.current = false; // Mark initial load as not done yet
        setHasUnsavedChanges(false); // Reset unsaved changes flag *during* load
        setSelectedScenarioIds(new Set()); // Clear multi-selection on load
        console.log("DEBUG: hasUnsavedChanges reset to false at start of load.");

        let loadedState: ScenarioState | null = null;
        let effectiveId = idToLoad;
        let name = "New Scenario";
        let type: ScenarioType = 'realistic'; // Default to realistic for new
        let loadedNodes = initialNodes;
        let loadedEdges = initialEdges;
        let loadedViewport = initialViewport;

        if (!effectiveId) {
          effectiveId = `session_${nanoid(8)}`;
          console.log(`DEBUG: Created new session ID: ${effectiveId}`);
        } else {
          loadedState = loadScenarioFromLocalStorage(effectiveId);
          if (loadedState) {
            console.log(`DEBUG: Found saved state for ${effectiveId}`);
            name = loadedState.name || `Loaded Scenario (${effectiveId.substring(0,4)}...)`;
            type = loadedState.scenarioType || 'realistic';
            loadedNodes = loadedState.nodes || initialNodes;
            loadedEdges = loadedState.edges || initialEdges;
            loadedViewport = loadedState.viewport || initialViewport;
          } else {
            console.warn(`DEBUG: No saved state found for ${effectiveId}, initializing.`);
            name = `Scenario ${effectiveId.substring(0, 4)}...`;
            // Keep defaults: realistic, initialNodes, initialEdges, initialViewport
          }
        }

        setCurrentScenarioIdInternal(effectiveId); // Update internal ID tracking
        setScenarioName(name);
        setScenarioType(type);
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        if (rfInstance) { rfInstance.setViewport(loadedViewport); }
        setHistory([{ nodes: loadedNodes, edges: loadedEdges, viewport: loadedViewport }]);
        setHistoryIndex(0);
        setSelectedNode(null); setSelectedEdge(null); setContextMenu(null);

        // Use setTimeout to ensure state updates propagate before resetting flags
        // Increased delay slightly
        setTimeout(() => {
            internalChangeRef.current = false; // Mark as internal change END
            isInitialLoadDone.current = true; // Mark initial load as DONE
            console.log("DEBUG: internalChangeRef and isInitialLoadDone reset after load timeout.");
            // Fit view only if viewport wasn't explicitly loaded
            if (rfInstance && !loadedState?.viewport) {
                rfInstance.fitView({ padding: 0.1, duration: 200 });
            }
        }, 150); // Increased delay

        return true; // Indicate load proceeded (though confirmation is now outside)
      }, [rfInstance, setNodes, setEdges]); // *** RESTORED Dependencies ***

      // Effect to load data when the scenarioId prop changes *** RESTORED ***
      useEffect(() => {
        console.log("DEBUG: scenarioId prop changed to:", currentScenarioIdProp);
        loadScenarioData(currentScenarioIdProp);
      }, [currentScenarioIdProp, loadScenarioData]); // Depend on the prop


      // --- Modified State Change Handlers ---
      const markUnsavedChanges = () => {
          // Only mark unsaved if it's not an internal change and initial load is done
          if (!internalChangeRef.current && isInitialLoadDone.current) {
              setHasUnsavedChanges(true);
              console.log("DEBUG: Unsaved changes MARKED.");
          } else {
              console.log(`DEBUG: Unsaved changes NOT marked (internalChange: ${internalChangeRef.current}, initialLoadDone: ${isInitialLoadDone.current})`);
          }
      };

      const onNodesChange = useCallback((changes: NodeChange[]) => {
        onNodesChangeDirect(changes);
        if (changes.length > 0) markUnsavedChanges();
      }, [onNodesChangeDirect]); // Keep basic handlers

      const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        onEdgesChangeDirect(changes);
         if (changes.length > 0) markUnsavedChanges();
      }, [onEdgesChangeDirect]); // Keep basic handlers

      const handleScenarioNameChange = (newName: string) => {
        setScenarioName(newName);
        markUnsavedChanges();
      };

      // --- REFINED V2: Scenario Type Change Handler ---
      const handleScenarioTypeChangeInternal = (newType: ScenarioType) => {
        if (newType === scenarioType) return; // No change needed

        // Check for unsaved changes before proceeding
        if (hasUnsavedChanges) {
            // If user clicks Cancel (confirm returns false), abort.
            if (!window.confirm("Tienes cambios sin guardar. ¿Descartar cambios y cambiar el tipo de escenario?")) {
                console.log("DEBUG: Scenario type change cancelled due to unsaved changes.");
                return; // Abort the change
            }
            console.log("DEBUG: User confirmed discarding changes for type switch.");
            // If user clicks OK (confirm returns true), proceed.
        }

        console.log(`DEBUG: Changing scenario type to ${newType}`);
        internalChangeRef.current = true; // Mark as internal change START
        setHasUnsavedChanges(false); // Reset unsaved changes flag *before* state update

        // Apply state changes
        setScenarioType(newType);
        setSelectedNode(null);
        setSelectedEdge(null);
        setContextMenu(null);
        if (newType === 'realistic') {
            console.log("DEBUG: Clearing edges for realistic mode.");
            setEdges([]);
        }

        // Reset internal change flag *immediately* after initiating state changes
        internalChangeRef.current = false;
        console.log("DEBUG: internalChangeRef reset immediately after state change calls.");
      };
      // --- End Modified Handlers ---


      // --- Save Action ---
      // const handleSave = useCallback(() => {
      //   // ... (save logic)
      // }, [nodes, edges, rfInstance, scenarioName, scenarioType, currentScenarioIdInternal, onScenarioSaved]);

      // --- Save As Action ---
      // const handleSaveAs = useCallback(() => {
      //   // ... (save as logic)
      // }, [nodes, edges, rfInstance, scenarioName, scenarioType, onScenarioSaved]);


      // --- Auto-Save ---
      // const debouncedAutoSave = useCallback( debounce((id: string | null, state: ScenarioState) => { if (id) { saveScenarioToLocalStorage(id, state); console.log("DEBUG: Auto-save triggered for", id); } }, AUTOSAVE_DEBOUNCE_MS), [] );
      // useEffect(() => {
      //   // ... (auto-save logic)
      // }, [nodes, edges, scenarioName, scenarioType, rfInstance, currentScenarioIdInternal, debouncedAutoSave, hasUnsavedChanges]); // Include hasUnsavedChanges

      // --- Other Handlers ---
      // const handleAddNode = useCallback((type: NodeType, clientX: number, clientY: number) => { /* ... */ }, [rfInstance, setNodes, nodes]);
      // const handleDeleteItem = useCallback((itemId: string) => { /* ... */ }, [setNodes, setEdges]);
      // const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<CustomNodeData>) => { /* ... */ }, [setNodes]);
      // const handleEdgeUpdate = useCallback((edgeId: string, updates: Partial<CustomEdgeData>) => { /* ... */ }, [setEdges]);
      const handleNodeClick = useCallback((event: React.MouseEvent, node: ScenarioNode) => { setSelectedNode(node); setSelectedEdge(null); setContextMenu(null); }, []);
      const handleEdgeClick = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => { if (scenarioType === 'custom') { setSelectedEdge(edge); setSelectedNode(null); setContextMenu(null); } else { setSelectedEdge(null); setSelectedNode(null); setContextMenu(null); } }, [scenarioType]);
      const handlePaneClick = useCallback(() => { setSelectedNode(null); setSelectedEdge(null); setContextMenu(null); }, []);
      const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: ScenarioNode) => { event.preventDefault(); setSelectedNode(node); setSelectedEdge(null); setContextMenu({ x: event.clientX, y: event.clientY, type: 'node', itemId: node.id }); }, []);
      const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => { event.preventDefault(); if (scenarioType === 'custom') { setSelectedEdge(edge); setSelectedNode(null); setContextMenu({ x: event.clientX, y: event.clientY, type: 'edge', itemId: edge.id }); } }, [scenarioType]);
      const handlePaneContextMenu = useCallback((event: React.MouseEvent) => { event.preventDefault(); setSelectedNode(null); setSelectedEdge(null); setContextMenu({ x: event.clientX, y: event.clientY, type: 'pane' }); }, []);
      const handleCloseContextMenu = useCallback(() => { setContextMenu(null); }, []);
      const onDrop = useCallback((event: React.DragEvent) => { event.preventDefault(); event.currentTarget.classList.remove('drag-over'); const type = event.dataTransfer.getData('application/node-type') as NodeType | undefined; if (!type || !rfInstance) return; /* handleAddNode(type, event.clientX, event.clientY); */ }, [/* handleAddNode, */ rfInstance]); // Commented out handleAddNode call
      const onDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; const target = event.target as HTMLElement; target.closest('.react-flow')?.parentElement?.classList.add('drag-over'); }, []);
      const onDragLeave = useCallback((event: React.DragEvent) => { const target = event.target as HTMLElement; target.closest('.react-flow')?.parentElement?.classList.remove('drag-over'); }, []);
      // --- End Other Handlers ---

      // --- Scenario Action Handlers ---
      // const triggerStartScenario = useCallback(() => { /* ... */ }, [currentScenarioIdInternal, scenarioName, onStartScenario, hasUnsavedChanges, handleSave]);

      // --- Multi-Select Handlers ---
      // *** RESTORED handleToggleSelection ***
      const handleToggleScenarioSelection = useCallback((id: string) => {
        setSelectedScenarioIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
      }, []); // *** RESTORED Dependencies (empty) ***

      // *** RESTORED handleDeleteSelectedScenarios ***
      const handleDeleteSelectedScenarios = useCallback(() => {
        if (selectedScenarioIds.size === 0) return;

        const scenariosToDelete = savedScenarios.filter(s => selectedScenarioIds.has(s.id));
        const namesToDelete = scenariosToDelete.map(s => s.name).join(', ');

        if (window.confirm(`¿Estás seguro de que quieres borrar ${selectedScenarioIds.size} escenarios seleccionados?\n(${namesToDelete})`)) {
          internalChangeRef.current = true; // Prevent marking unsaved during delete
          let currentScenarioWasDeleted = false;
          selectedScenarioIds.forEach(id => {
            try {
              localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${id}`);
              if (currentScenarioIdInternal === id) {
                currentScenarioWasDeleted = true;
              }
            } catch (error) {
               console.error(`Error deleting scenario ${id}:`, error);
               alert(`Error al borrar el escenario con ID: ${id}`);
            }
          });

          const updatedList = getSavedScenarios();
          setSavedScenarios(updatedList); // Update list state
          setSelectedScenarioIds(new Set()); // Clear selection
          onScenarioSaved(); // Notify App

          if (currentScenarioWasDeleted) {
            console.log(`DEBUG: Deleted current scenario, loading new.`);
            onLoadScenario(null); // Use the App's handler to load null
          }
          setTimeout(() => { internalChangeRef.current = false; }, 50);
        }
      }, [selectedScenarioIds, savedScenarios, currentScenarioIdInternal, onLoadScenario, onScenarioSaved]); // *** RESTORED Dependencies ***
      // --- End Multi-Select Handlers ---


      // This function now primarily acts as a wrapper to check for unsaved changes before calling the App's load trigger
      // *** FIX: Define handleLoadScenarioTrigger ***
      const handleLoadScenarioTrigger = useCallback((id: string | null) => {
        if (hasUnsavedChanges) {
          if (!window.confirm("Tienes cambios sin guardar. ¿Descartar cambios y cargar otro escenario?")) {
            console.log("DEBUG: Load scenario cancelled due to unsaved changes.");
            return; // Abort load
          }
          console.log("DEBUG: User confirmed discarding changes for load.");
        }
        // Proceed with calling the App's load handler
        onLoadScenario(id);
      }, [onLoadScenario, hasUnsavedChanges]); // Depend on the prop function and unsaved flag

      const mapNodes = nodes.filter(node => (node.data.type === 'GS' || node.data.type === 'UE') && node.data.latitude !== undefined && node.data.longitude !== undefined);

      // Component's JSX return - *** RESTORED ***
      return (
        <div className="flex flex-col h-full text-white overflow-hidden">
          <ScenarioTopBar
            scenarioName={scenarioName}
            onScenarioNameChange={handleScenarioNameChange}
            scenarioType={scenarioType}
            onScenarioTypeChange={handleScenarioTypeChangeInternal}
            onSave={undefined /* handleSave */} // Pass undefined for now
            onSaveAs={undefined /* handleSaveAs */} // Pass undefined for now
            isLoading={isLoadingScenario}
            onStartScenario={undefined /* triggerStartScenario */} // Pass undefined for now
            hasUnsavedChanges={hasUnsavedChanges}
          />
          <div className="flex flex-1 overflow-hidden">
            <ScenarioManagementSidebar
                savedScenarios={savedScenarios}
                selectedScenarioIds={selectedScenarioIds}
                onLoadScenario={handleLoadScenarioTrigger} // *** FIX: Pass the defined handler ***
                onToggleSelection={handleToggleScenarioSelection}
                onDeleteSelected={handleDeleteSelectedScenarios}
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
               <div className="h-[300px] flex flex-col flex-shrink-0 border-t border-albor-bg-dark">
                  <div className="h-[150px] flex-shrink-0"> <GlobalMapView nodes={mapNodes} /> </div>
                  <div className="h-[150px] flex-shrink-0 border-t border-albor-bg-dark"> <LinkOverviewPanel links={edges} nodes={nodes} scenarioType={scenarioType} /> </div>
               </div>
            </div>
            <div className="flex flex-col w-64 flex-shrink-0">
                <div className="h-1/2 border-l border-b border-albor-bg-dark"> <NodeListSidebar /> </div>
                <div className="h-1/2 border-l border-albor-bg-dark overflow-hidden"> <ConfigSidebar selectedNode={selectedNode} selectedEdge={selectedEdge} scenarioType={scenarioType} onNodeUpdate={undefined /* handleNodeUpdate */} onEdgeUpdate={undefined /* handleEdgeUpdate */} /> </div>
            </div>
          </div>
          {contextMenu && ( <CanvasContextMenu x={contextMenu.x} y={contextMenu.y} type={contextMenu.type} itemId={contextMenu.itemId} onClose={handleCloseContextMenu} onDelete={undefined /* handleDeleteItem */} canDeleteEdge={scenarioType === 'custom'} /> )}
        </div>
      );
    };

    // Export the defined component
    export default ScenarioEditorContentComponent;
