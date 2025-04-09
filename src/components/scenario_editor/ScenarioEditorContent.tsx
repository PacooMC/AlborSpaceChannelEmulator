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
    import ConfirmationModal, { ConfirmationModalProps } from '../common/ConfirmationModal'; // Import the modal
    import { ScenarioNode, ScenarioEdge, NodeType, ContextMenuData, HistoryEntry, CustomNodeData, ScenarioType, ScenarioState, CustomEdgeData } from './types';
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
    const AUTOSAVE_DEBOUNCE_MS = 1500;
    const initialViewport: Viewport = { x: 0, y: 0, zoom: 1 };

    interface ScenarioEditorContentProps {
      scenarioId: string | null;
      isLoadingScenario: boolean;
      onStartScenario: (id: string, name: string) => void;
      onLoadScenario: (id: string | null) => void;
      onScenarioSaved: () => void;
    }

    // --- NEW: Type for confirmation state ---
    type ConfirmationState = Omit<ConfirmationModalProps, 'isOpen' | 'onConfirm' | 'onCancel'> & {
        onConfirmCallback: () => void;
    } | null;

    const ScenarioEditorContentComponent: React.FC<ScenarioEditorContentProps> = ({
      scenarioId: initialScenarioIdProp,
      isLoadingScenario: isLoadingFromApp,
      onStartScenario,
      onLoadScenario: notifyAppToLoad,
      onScenarioSaved,
    }) => {
      const [nodes, setNodes, onNodesChangeDirect] = useNodesState<CustomNodeData>([]);
      const [edges, setEdges, onEdgesChangeDirect] = useEdgesState<CustomEdgeData>([]);
      const [scenarioName, setScenarioName] = useState<string>("New Scenario");
      const [scenarioType, setScenarioType] = useState<ScenarioType>('realistic');
      const [currentScenarioIdInternal, setCurrentScenarioIdInternal] = useState<string | null>(null);
      const [selectedNode, setSelectedNode] = useState<ScenarioNode | null>(null);
      const [selectedEdge, setSelectedEdge] = useState<ScenarioEdge | null>(null);
      const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
      const internalChangeRef = useRef(false);
      const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
      const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
      const [savedScenarios, setSavedScenarios] = useState<SavedScenarioInfo[]>([]);
      const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
      const isInitialLoadDone = useRef(false);
      const [selectedScenarioIds, setSelectedScenarioIds] = useState<Set<string>>(new Set());
      const [isLoading, setIsLoading] = useState<boolean>(false);
      const [lastSavedState, setLastSavedState] = useState<ScenarioState | null>(null);
      const [confirmationState, setConfirmationState] = useState<ConfirmationState>(null); // State for modal

      const { setViewport, getViewport } = useReactFlow();

      // --- Confirmation Modal Logic ---
      const requestConfirmation = (details: Omit<ConfirmationState, 'onConfirmCallback'> & { onConfirmCallback: () => void }) => {
        setConfirmationState(details);
      };

      const handleConfirm = () => {
        if (confirmationState) {
          confirmationState.onConfirmCallback();
        }
        setConfirmationState(null);
      };

      const handleCancel = () => {
        setConfirmationState(null);
      };
      // --- End Confirmation Modal Logic ---


      const refreshScenarioList = useCallback(async () => {
        console.log("DEBUG: Refreshing scenario list...");
        setIsLoading(true);
        try {
            const list = await getScenarioList();
            setSavedScenarios(list);
            console.log("DEBUG: Scenario list refreshed:", list.length, "items");
        } catch (error) {
            console.error("Error fetching scenario list:", error);
        } finally {
            setIsLoading(false);
        }
      }, []);

      useEffect(() => {
        refreshScenarioList();
      }, [refreshScenarioList]);

      const getCurrentState = useCallback((): ScenarioState => {
        return {
          name: scenarioName,
          scenarioType: scenarioType,
          nodes: nodes,
          edges: edges,
          viewport: getViewport(),
        };
      }, [scenarioName, scenarioType, nodes, edges, getViewport]);

      const compareStates = useCallback((stateA: ScenarioState | null, stateB: ScenarioState | null): boolean => {
        if (stateA === null || stateB === null) {
          return stateA === stateB;
        }
         return (
            stateA.name === stateB.name &&
            stateA.scenarioType === stateB.scenarioType &&
            isEqual(stateA.nodes, stateB.nodes) &&
            isEqual(stateA.edges, stateB.edges)
        );
      }, []);

      useEffect(() => {
        if (!isInitialLoadDone.current || internalChangeRef.current || lastSavedState === null) {
            return;
        }
        const currentState = getCurrentState();
        const areStatesEqual = compareStates(currentState, lastSavedState);
        if (!areStatesEqual && !hasUnsavedChanges) {
            console.log("DEBUG: Unsaved changes DETECTED.");
            setHasUnsavedChanges(true);
        } else if (areStatesEqual && hasUnsavedChanges) {
            console.log("DEBUG: Changes reverted to saved state.");
            setHasUnsavedChanges(false);
        }
      }, [nodes, edges, scenarioName, scenarioType, lastSavedState, getCurrentState, compareStates, hasUnsavedChanges]);

      const loadScenarioData = useCallback(async (idToLoad: string | null) => {
        console.log(`DEBUG: Starting loadScenarioData for ID: ${idToLoad}`);
        internalChangeRef.current = true;
        isInitialLoadDone.current = false;
        setIsLoading(true);
        setHasUnsavedChanges(false);
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
                    console.warn(`DEBUG: Scenario ${effectiveId} not found, creating new.`);
                    effectiveId = null;
                }
            }
            if (!effectiveId) {
                isNewScenario = true;
                effectiveId = generateNewScenarioId();
                loadedState = getNewScenarioDefaultState();
                console.log(`DEBUG: Created new scenario state with temp ID: ${effectiveId}`);
            }

            if (loadedState) {
                setCurrentScenarioIdInternal(effectiveId);
                setScenarioName(loadedState.name);
                setScenarioType(loadedState.scenarioType);
                setNodes(loadedState.nodes);
                setEdges(loadedState.edges);
                setViewport(loadedState.viewport);
                setLastSavedState(isNewScenario ? null : JSON.parse(JSON.stringify(loadedState)));
                setHasUnsavedChanges(false);
                console.log(`DEBUG: Scenario ${effectiveId} loaded. Name: ${loadedState.name}. Is New: ${isNewScenario}`);
            } else {
                 console.error("DEBUG: Failed to load or create scenario state.");
                 const defaultState = getNewScenarioDefaultState();
                 setCurrentScenarioIdInternal(generateNewScenarioId());
                 setScenarioName(defaultState.name);
                 setScenarioType(defaultState.scenarioType);
                 setNodes(defaultState.nodes);
                 setEdges(defaultState.edges);
                 setViewport(defaultState.viewport);
                 setLastSavedState(null);
                 setHasUnsavedChanges(false);
            }
        } catch (error) {
            console.error("Error during scenario load:", error);
        } finally {
            setTimeout(() => {
                internalChangeRef.current = false;
                isInitialLoadDone.current = true;
                setIsLoading(false);
                console.log("DEBUG: Load process finished.");
                if (rfInstance && (isNewScenario || !loadedState?.viewport || loadedState?.nodes.length === 0)) {
                     rfInstance.fitView({ padding: 0.1, duration: 200 });
                }
            }, 100);
        }
      }, [rfInstance, setNodes, setEdges, setViewport, compareStates]);

      useEffect(() => {
        console.log("DEBUG: initialScenarioIdProp changed to:", initialScenarioIdProp);
        loadScenarioData(initialScenarioIdProp);
      }, [initialScenarioIdProp, loadScenarioData]); // Ensure loadScenarioData is stable or included

      const onNodesChange = useCallback((changes: NodeChange[]) => {
        onNodesChangeDirect(changes);
      }, [onNodesChangeDirect]);

      const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        onEdgesChangeDirect(changes);
      }, [onEdgesChangeDirect]);

      const handleScenarioNameChange = (newName: string) => {
        setScenarioName(newName);
      };

      // --- UPDATED: Use Confirmation Modal ---
      const handleScenarioTypeChangeInternal = (newType: ScenarioType) => {
        if (newType === scenarioType) return;

        const proceedWithTypeChange = () => {
            console.log(`DEBUG: Changing scenario type to ${newType}`);
            internalChangeRef.current = true;
            setScenarioType(newType);
            setSelectedNode(null);
            setSelectedEdge(null);
            setContextMenu(null);
            if (newType === 'realistic') {
                console.log("DEBUG: Clearing edges for realistic mode.");
                setEdges([]);
            }
            if (lastSavedState !== null) {
                setHasUnsavedChanges(true);
            }
            setTimeout(() => { internalChangeRef.current = false; }, 50);
        };

        // *** MODIFIED: Only ask for confirmation if there are actual changes ***
        if (hasUnsavedChanges) {
            requestConfirmation({
                title: "Discard Unsaved Changes?",
                message: "Switching scenario type will discard your unsaved changes. Are you sure?",
                confirmText: "Discard & Switch",
                confirmButtonVariant: 'danger',
                onConfirmCallback: proceedWithTypeChange,
            });
        } else {
            proceedWithTypeChange(); // No unsaved changes, proceed directly
        }
      };
      // --- End Update ---

      const handleSave = useCallback(async () => {
        if (!currentScenarioIdInternal) {
            console.error("Cannot save, no current scenario ID.");
            alert("Error: No scenario ID. Please use 'Save As'."); // Keep alert for critical errors
            return;
        }
        console.log(`DEBUG: Saving scenario ID: ${currentScenarioIdInternal}`);
        internalChangeRef.current = true;
        setIsLoading(true);
        const currentState = getCurrentState();
        try {
            await saveScenario(currentScenarioIdInternal, currentState);
            setLastSavedState(JSON.parse(JSON.stringify(currentState)));
            setHasUnsavedChanges(false);
            console.log("DEBUG: Scenario saved successfully.");
            onScenarioSaved();
            await refreshScenarioList();
        } catch (error) {
            console.error("Error saving scenario:", error);
            alert(`Error saving scenario: ${error}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => { internalChangeRef.current = false; }, 50);
        }
      }, [currentScenarioIdInternal, getCurrentState, onScenarioSaved, refreshScenarioList]);

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
        const newState: ScenarioState = { ...currentState, name: newName.trim() };

        try {
            await saveScenario(newId, newState);
            setCurrentScenarioIdInternal(newId);
            setScenarioName(newState.name);
            setLastSavedState(JSON.parse(JSON.stringify(newState)));
            setHasUnsavedChanges(false);
            console.log("DEBUG: Scenario saved successfully with new ID.");
            onScenarioSaved();
            await refreshScenarioList();
            notifyAppToLoad(newId);
        } catch (error) {
            console.error("Error saving scenario as:", error);
            alert(`Error saving scenario: ${error}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => { internalChangeRef.current = false; }, 50);
        }
      }, [scenarioName, getCurrentState, onScenarioSaved, refreshScenarioList, notifyAppToLoad]);

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
          setHasUnsavedChanges(true);
          setTimeout(() => { internalChangeRef.current = false; }, 50);
       }, [rfInstance, setNodes, nodes]);

      const handleDeleteItem = useCallback((itemId: string) => {
          internalChangeRef.current = true;
          setNodes((nds) => nds.filter(node => node.id !== itemId));
          setEdges((eds) => eds.filter(edge => edge.id !== itemId && edge.source !== itemId && edge.target !== itemId));
          setSelectedNode(null);
          setSelectedEdge(null);
          setContextMenu(null);
          setHasUnsavedChanges(true);
          setTimeout(() => { internalChangeRef.current = false; }, 50);
        }, [setNodes, setEdges]);

      const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<CustomNodeData>) => {
          internalChangeRef.current = true;
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
            )
          );
          setSelectedNode(prev => prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...updates } } : prev);
          setHasUnsavedChanges(true);
          setTimeout(() => { internalChangeRef.current = false; }, 50);
        }, [setNodes]);

      const handleEdgeUpdate = useCallback((edgeId: string, updates: Partial<CustomEdgeData>) => {
          internalChangeRef.current = true;
          setEdges((eds) =>
            eds.map((edge) =>
              edge.id === edgeId ? { ...edge, data: { ...edge.data, ...updates } } : edge
            )
          );
           setSelectedEdge(prev => prev && prev.id === edgeId ? { ...prev, data: { ...prev.data, ...updates } } : prev);
          setHasUnsavedChanges(true);
          setTimeout(() => { internalChangeRef.current = false; }, 50);
        }, [setEdges]);

      const handleNodeClick = useCallback((event: React.MouseEvent, node: ScenarioNode) => { setSelectedNode(node); setSelectedEdge(null); setContextMenu(null); }, []);
      const handleEdgeClick = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => { if (scenarioType === 'custom') { setSelectedEdge(edge); setSelectedNode(null); setContextMenu(null); } else { setSelectedEdge(null); setSelectedNode(null); setContextMenu(null); } }, [scenarioType]);
      const handlePaneClick = useCallback(() => { setSelectedNode(null); setSelectedEdge(null); setContextMenu(null); }, []);
      const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: ScenarioNode) => { event.preventDefault(); setSelectedNode(node); setSelectedEdge(null); setContextMenu({ x: event.clientX, y: event.clientY, type: 'node', itemId: node.id }); }, []);
      const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: ScenarioEdge) => { event.preventDefault(); if (scenarioType === 'custom') { setSelectedEdge(edge); setSelectedNode(null); setContextMenu({ x: event.clientX, y: event.clientY, type: 'edge', itemId: edge.id }); } }, [scenarioType]);
      const handlePaneContextMenu = useCallback((event: React.MouseEvent) => { event.preventDefault(); setSelectedNode(null); setSelectedEdge(null); setContextMenu({ x: event.clientX, y: event.clientY, type: 'pane' }); }, []);
      const handleCloseContextMenu = useCallback(() => { setContextMenu(null); }, []);

      const onDrop = useCallback((event: React.DragEvent) => { event.preventDefault(); event.currentTarget.classList.remove('drag-over'); const type = event.dataTransfer.getData('application/node-type') as NodeType | undefined; if (!type || !rfInstance) return; handleAddNode(type, event.clientX, event.clientY); }, [handleAddNode, rfInstance]);
      const onDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; const target = event.target as HTMLElement; target.closest('.react-flow')?.parentElement?.classList.add('drag-over'); }, []);
      const onDragLeave = useCallback((event: React.DragEvent) => { const target = event.target as HTMLElement; target.closest('.react-flow')?.parentElement?.classList.remove('drag-over'); }, []);

      // --- UPDATED: Use Confirmation Modal ---
      const triggerStartScenario = useCallback(() => {
        if (!currentScenarioIdInternal) {
            alert("Please save the scenario before starting the simulation.");
            return;
        }

        const startAction = () => {
            onStartScenario(currentScenarioIdInternal, scenarioName);
        };

        const saveAndStartAction = async () => {
            await handleSave();
            // Check if save was successful? Assume yes for now.
            if (currentScenarioIdInternal) { // Re-check ID after potential save
               startAction();
            }
        };

        // *** MODIFIED: Only ask for confirmation if there are actual changes ***
        if (hasUnsavedChanges) {
            requestConfirmation({
                title: "Save Changes Before Starting?",
                message: "You have unsaved changes. Would you like to save them before starting the simulation?",
                confirmText: "Save & Start",
                cancelText: "Start Without Saving",
                onConfirmCallback: saveAndStartAction, // Save then start
                onCancel: startAction, // Start without saving (overrides default cancel)
            });
        } else {
            startAction(); // No unsaved changes, start directly
        }
      }, [currentScenarioIdInternal, scenarioName, onStartScenario, hasUnsavedChanges, handleSave]);
      // --- End Update ---

      const handleToggleScenarioSelection = useCallback((id: string) => {
        setSelectedScenarioIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
          return newSet;
        });
      }, []);

      // --- UPDATED: Use Confirmation Modal ---
      const handleDeleteSelectedScenarios = useCallback(async () => {
        if (selectedScenarioIds.size === 0) return;
        const scenariosToDelete = savedScenarios.filter(s => selectedScenarioIds.has(s.id));
        const namesToDelete = scenariosToDelete.map(s => s.name).join(', ');

        const proceedWithDelete = async () => {
            internalChangeRef.current = true;
            setIsLoading(true);
            let currentScenarioWasDeleted = false;
            const deletePromises = Array.from(selectedScenarioIds).map(async (id) => {
                try { await deleteScenario(id); if (currentScenarioIdInternal === id) { currentScenarioWasDeleted = true; } }
                catch (error) { console.error(`Error deleting ${id}:`, error); alert(`Error deleting: ${id}`); }
            });
            await Promise.all(deletePromises);
            setSelectedScenarioIds(new Set());
            onScenarioSaved();
            await refreshScenarioList();
            if (currentScenarioWasDeleted) { notifyAppToLoad(null); }
            setIsLoading(false);
            setTimeout(() => { internalChangeRef.current = false; }, 50);
        };

        requestConfirmation({
            title: `Delete Scenario${selectedScenarioIds.size > 1 ? 's' : ''}?`,
            message: (
                <>
                    Are you sure you want to permanently delete {selectedScenarioIds.size} selected scenario{selectedScenarioIds.size > 1 ? 's' : ''}?
                    <br />({namesToDelete})
                </>
            ),
            confirmText: "Delete",
            confirmButtonVariant: 'danger',
            onConfirmCallback: proceedWithDelete,
        });

      }, [selectedScenarioIds, savedScenarios, currentScenarioIdInternal, notifyAppToLoad, onScenarioSaved, refreshScenarioList]);
      // --- End Update ---

      // --- UPDATED: Use Confirmation Modal ---
      const handleLoadScenarioTrigger = useCallback((id: string | null) => {
        const proceedWithLoad = () => {
            notifyAppToLoad(id);
        };

        // *** MODIFIED: Only ask for confirmation if there are actual changes ***
        if (hasUnsavedChanges) {
          requestConfirmation({
              title: "Discard Unsaved Changes?",
              message: "Loading another scenario will discard your current unsaved changes. Are you sure?",
              confirmText: "Discard & Load",
              confirmButtonVariant: 'danger',
              onConfirmCallback: proceedWithLoad,
          });
        } else {
          proceedWithLoad(); // No unsaved changes
        }
      }, [notifyAppToLoad, hasUnsavedChanges]);
      // --- End Update ---

      // --- UPDATED: Use Confirmation Modal ---
      const handleDuplicateScenario = useCallback(async (idToDuplicate: string) => {
        console.log(`DEBUG: Duplicating scenario ID: ${idToDuplicate}`);
        internalChangeRef.current = true;
        setIsLoading(true);

        try {
            const originalState = await loadScenario(idToDuplicate);
            if (!originalState) { throw new Error("Original scenario not found."); }
            const newId = generateNewScenarioId();
            const newName = `${originalState.name} Copy`;
            const newState: ScenarioState = { ...originalState, name: newName };
            await saveScenario(newId, newState);
            console.log(`DEBUG: Scenario duplicated. New ID: ${newId}`);
            onScenarioSaved();
            await refreshScenarioList();

            // Ask user if they want to load the new duplicate using the modal
            requestConfirmation({
                title: "Scenario Duplicated",
                message: `Scenario duplicated as "${newName}". Load it now?`,
                confirmText: "Load Duplicate",
                cancelText: "Keep Current",
                onConfirmCallback: () => notifyAppToLoad(newId), // Load the new one
                // onCancel does nothing extra here, just closes modal
            });

        } catch (error) {
            console.error("Error duplicating scenario:", error);
            alert(`Error duplicating scenario: ${error}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => { internalChangeRef.current = false; }, 50);
        }
      }, [onScenarioSaved, refreshScenarioList, notifyAppToLoad]);
      // --- End Update ---

      const mapNodes = nodes.filter(node => (node.data.type === 'GS' || node.data.type === 'UE') && node.data.latitude !== undefined && node.data.longitude !== undefined);

      return (
        <div className="flex flex-col h-full text-white overflow-hidden">
          <ScenarioTopBar
            scenarioName={scenarioName}
            onScenarioNameChange={handleScenarioNameChange}
            scenarioType={scenarioType}
            onScenarioTypeChange={handleScenarioTypeChangeInternal}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            isLoading={isLoading || isLoadingFromApp}
            onStartScenario={triggerStartScenario}
            hasUnsavedChanges={hasUnsavedChanges}
          />
          <div className="flex flex-1 overflow-hidden">
            <ScenarioManagementSidebar
                savedScenarios={savedScenarios}
                selectedScenarioIds={selectedScenarioIds}
                currentScenarioId={currentScenarioIdInternal} // *** ADDED: Pass current ID ***
                onLoadScenario={handleLoadScenarioTrigger}
                onToggleSelection={handleToggleScenarioSelection}
                onDeleteSelected={handleDeleteSelectedScenarios}
                onDuplicateScenario={handleDuplicateScenario}
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
               <div className="h-[300px] flex flex-shrink-0 border-t border-albor-bg-dark">
                  <div className="w-3/5 h-full border-r border-albor-bg-dark">
                      <GlobalMapView nodes={mapNodes} />
                  </div>
                  <div className="w-2/5 h-full">
                      <LinkOverviewPanel links={edges} nodes={nodes} scenarioType={scenarioType} />
                  </div>
               </div>
            </div>
            <div className="flex flex-col w-64 flex-shrink-0">
                <div className="border-l border-b border-albor-bg-dark h-1/2">
                    <NodeListSidebar />
                </div>
                <div className="flex-1 border-l border-albor-bg-dark overflow-hidden min-h-0">
                    <ConfigSidebar
                        selectedNode={selectedNode}
                        selectedEdge={selectedEdge}
                        scenarioType={scenarioType}
                        onNodeUpdate={handleNodeUpdate}
                        onEdgeUpdate={handleEdgeUpdate}
                    />
                </div>
            </div>
          </div>
          {contextMenu && (
            <CanvasContextMenu
                x={contextMenu.x} y={contextMenu.y} type={contextMenu.type}
                itemId={contextMenu.itemId} onClose={handleCloseContextMenu}
                onDelete={handleDeleteItem}
                canDeleteEdge={scenarioType === 'custom'}
            />
          )}
          {/* Render the Confirmation Modal */}
          <ConfirmationModal
            isOpen={confirmationState !== null}
            title={confirmationState?.title || "Confirm Action"}
            message={confirmationState?.message || "Are you sure?"}
            confirmText={confirmationState?.confirmText}
            cancelText={confirmationState?.cancelText}
            confirmButtonVariant={confirmationState?.confirmButtonVariant}
            icon={confirmationState?.icon}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      );
    };

    export default ScenarioEditorContentComponent;
