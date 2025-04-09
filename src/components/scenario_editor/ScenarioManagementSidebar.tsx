import React, { useState } from 'react';
    import { PlusCircle, Trash2, Upload, FileText, Copy } from 'lucide-react'; // Import icons
    import SavedScenariosPanel from '../layout/SavedScenariosPanel'; // Reuse the panel component

    interface SavedScenarioInfo {
      id: string;
      name: string;
    }

    interface ScenarioManagementSidebarProps {
      savedScenarios: SavedScenarioInfo[];
      selectedScenarioIds: Set<string>; // Receive selected IDs
      currentScenarioId: string | null; // *** ADDED: ID of the currently loaded scenario ***
      onLoadScenario: (id: string | null) => void; // Allow null for "New Scenario"
      onToggleSelection: (id: string) => void; // Receive toggle handler
      onDeleteSelected: () => void; // Receive multi-delete handler
      onDuplicateScenario: (id: string) => void; // Handler for duplication
    }

    const ScenarioManagementSidebar: React.FC<ScenarioManagementSidebarProps> = ({
      savedScenarios,
      selectedScenarioIds, // Destructure props
      currentScenarioId, // *** ADDED ***
      onLoadScenario,
      onToggleSelection, // Destructure props
      onDeleteSelected, // Destructure props
      onDuplicateScenario, // Receive duplicate handler
    }) => {
      const [showMoreActions, setShowMoreActions] = useState(false); // State for dropdown visibility

      const canDelete = selectedScenarioIds.size > 0;
      const canDuplicate = selectedScenarioIds.size === 1; // Enable duplicate only for single selection

      const handleDuplicateClick = () => {
        if (canDuplicate) {
          const selectedId = Array.from(selectedScenarioIds)[0];
          onDuplicateScenario(selectedId);
        }
      };

      return (
        // Use similar styling to the main sidebar but maybe slightly different bg
        <div className="w-64 bg-albor-bg-dark/60 backdrop-blur-sm p-3 border-r border-albor-bg-dark/50 flex flex-col flex-shrink-0 overflow-hidden"> {/* Ensure overflow hidden */}
          {/* Maybe a title */}
          <h2 className="text-base font-semibold text-albor-light-gray mb-4 px-1 flex-shrink-0">Scenario Management</h2>

          {/* Button for New Scenario */}
          <button
             onClick={() => onLoadScenario(null)} // Pass null to signal new scenario
             className="w-full mb-4 px-3 py-1.5 rounded text-sm bg-albor-orange hover:bg-albor-orange/80 text-white font-semibold transition-colors flex items-center justify-center space-x-1 flex-shrink-0"
          >
            <PlusCircle size={16}/>
            <span>New Scenario</span>
          </button>

          {/* Saved Scenarios Panel - Allow it to take remaining space */}
          {/* Added border top/bottom */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-b border-albor-bg-dark/50 py-2 mb-2"> {/* Allow panel to grow and scroll */}
              <SavedScenariosPanel
                  savedScenarios={savedScenarios}
                  selectedScenarioIds={selectedScenarioIds} // Pass down selected IDs
                  currentScenarioId={currentScenarioId} // *** ADDED: Pass down current ID ***
                  onLoadScenario={onLoadScenario}
                  onToggleSelection={onToggleSelection} // Pass down toggle handler
                  // onDeleteScenario={onDeleteScenario} // Remove single delete prop if not needed
                  initiallyOpen={true} // Keep open by default here
              />
          </div>

          {/* Action Buttons Group - MOVED BELOW THE LIST */}
          <div className="space-y-1 flex-shrink-0">
             {/* Duplicate Button */}
             <button
                onClick={handleDuplicateClick}
                disabled={!canDuplicate}
                className={`w-full px-3 py-1 rounded text-xs transition-colors flex items-center justify-center space-x-1 ${
                    canDuplicate
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-albor-bg-dark text-albor-dark-gray cursor-not-allowed'
                }`}
                title={canDuplicate ? "Duplicate selected scenario" : "Select one scenario to duplicate"}
             >
                <Copy size={14} />
                <span>Duplicate</span>
             </button>

             {/* Delete Button */}
             <button
                onClick={onDeleteSelected}
                disabled={!canDelete}
                className={`w-full px-3 py-1 rounded text-xs transition-colors flex items-center justify-center space-x-1 ${
                    canDelete
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-albor-bg-dark text-albor-dark-gray cursor-not-allowed'
                }`}
                title={canDelete ? `Delete ${selectedScenarioIds.size} selected scenario(s)` : "Select scenarios to delete"}
             >
                <Trash2 size={14} />
                <span>Delete ({selectedScenarioIds.size})</span>
             </button>
          </div>


          {/* Other Actions (Import/Template) - Moved to bottom */}
          <div className="mt-auto pt-3 border-t border-albor-bg-dark/50 space-y-1 flex-shrink-0">
             <button className="w-full text-left text-xs text-albor-dark-gray hover:text-albor-light-gray p-1.5 rounded hover:bg-albor-bg-dark/50 flex items-center space-x-1.5">
                <Upload size={14}/>
                <span>Import Scenario...</span>
             </button>
             <button className="w-full text-left text-xs text-albor-dark-gray hover:text-albor-light-gray p-1.5 rounded hover:bg-albor-bg-dark/50 flex items-center space-x-1.5">
                <FileText size={14}/>
                <span>Load Template...</span>
             </button>
          </div>
        </div>
      );
    };

    export default ScenarioManagementSidebar;
