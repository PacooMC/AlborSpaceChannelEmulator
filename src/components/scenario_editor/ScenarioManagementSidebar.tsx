import React from 'react';
        import { PlusCircle, Trash2 } from 'lucide-react'; // Import PlusCircle & Trash2
        import SavedScenariosPanel from '../layout/SavedScenariosPanel'; // Reuse the panel component

        interface SavedScenarioInfo {
          id: string;
          name: string;
        }

        interface ScenarioManagementSidebarProps {
          savedScenarios: SavedScenarioInfo[];
          selectedScenarioIds: Set<string>; // Receive selected IDs
          onLoadScenario: (id: string | null) => void; // Allow null for "New Scenario"
          onToggleSelection: (id: string) => void; // Receive toggle handler
          onDeleteSelected: () => void; // Receive multi-delete handler
        }

        const ScenarioManagementSidebar: React.FC<ScenarioManagementSidebarProps> = ({
          savedScenarios,
          selectedScenarioIds, // Destructure props
          onLoadScenario,
          onToggleSelection, // Destructure props
          onDeleteSelected, // Destructure props
        }) => {
          return (
            // Use similar styling to the main sidebar but maybe slightly different bg
            <div className="w-64 bg-albor-bg-dark/60 backdrop-blur-sm p-3 border-r border-albor-bg-dark/50 flex flex-col flex-shrink-0 overflow-hidden"> {/* Ensure overflow hidden */}
              {/* Maybe a title */}
              <h2 className="text-base font-semibold text-albor-light-gray mb-4 px-1 flex-shrink-0">Gestión Escenarios</h2>

              {/* Button for New Scenario */}
              <button
                 onClick={() => onLoadScenario(null)} // Pass null to signal new scenario
                 className="w-full mb-4 px-3 py-1.5 rounded text-sm bg-albor-orange hover:bg-albor-orange/80 text-white font-semibold transition-colors flex items-center justify-center space-x-1 flex-shrink-0"
              >
                <PlusCircle size={16}/>
                <span>Nuevo Escenario</span>
              </button>

              {/* Saved Scenarios Panel - Allow it to take remaining space */}
              <div className="flex-1 flex flex-col min-h-0"> {/* Allow panel to grow and scroll */}
                  <SavedScenariosPanel
                      savedScenarios={savedScenarios}
                      selectedScenarioIds={selectedScenarioIds} // Pass down selected IDs
                      onLoadScenario={onLoadScenario}
                      onToggleSelection={onToggleSelection} // Pass down toggle handler
                      // onDeleteScenario={onDeleteScenario} // Remove single delete prop if not needed
                      initiallyOpen={true} // Keep open by default here
                  />
              </div>

              {/* Multi-Delete Button - Conditionally Rendered */}
              {selectedScenarioIds.size > 0 && (
                <div className="mt-2 flex-shrink-0">
                  <button
                    onClick={onDeleteSelected}
                    className="w-full px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors flex items-center justify-center space-x-1"
                    title={`Borrar ${selectedScenarioIds.size} escenarios seleccionados`}
                  >
                    <Trash2 size={16} />
                    <span>Borrar Seleccionados ({selectedScenarioIds.size})</span>
                  </button>
                </div>
              )}

              {/* Placeholder for future actions */}
              <div className="mt-auto pt-4 border-t border-albor-bg-dark/50 space-y-2 flex-shrink-0">
                 <button className="w-full text-left text-xs text-albor-dark-gray hover:text-albor-light-gray p-1 rounded hover:bg-albor-bg-dark/50">Importar Escenario...</button>
                 <button className="w-full text-left text-xs text-albor-dark-gray hover:text-albor-light-gray p-1 rounded hover:bg-albor-bg-dark/50">Cargar Plantilla...</button>
              </div>
            </div>
          );
        };

        export default ScenarioManagementSidebar;
