import React, { useState, useMemo } from 'react';
        import { HardDrive, Search, Download, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

        interface SavedScenario {
          id: string;
          name: string;
        }

        interface SavedScenariosPanelProps {
          savedScenarios: SavedScenario[];
          selectedScenarioIds: Set<string>; // Receive selected IDs
          onLoadScenario: (id: string | null) => void; // Allow null for "New Scenario"
          onToggleSelection: (id: string) => void; // Receive toggle handler
          // onDeleteScenario?: (id: string) => void; // Keep or remove based on preference
          initiallyOpen?: boolean;
        }

        const SavedScenariosPanel: React.FC<SavedScenariosPanelProps> = ({
          savedScenarios,
          selectedScenarioIds, // Destructure props
          onLoadScenario,
          onToggleSelection, // Destructure props
          // onDeleteScenario,
          initiallyOpen = false,
        }) => {
          const [isOpen, setIsOpen] = useState(initiallyOpen);
          const [searchTerm, setSearchTerm] = useState('');

          const filteredScenarios = useMemo(() => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            return (savedScenarios || []).filter(s =>
              s.name.toLowerCase().includes(lowerSearchTerm) ||
              s.id.toLowerCase().includes(lowerSearchTerm)
            );
          }, [savedScenarios, searchTerm]);

          return (
            <div className="mt-4 flex-1 flex flex-col min-h-0"> {/* Allow panel to grow and scroll */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-1 mb-2 text-left group flex-shrink-0" // Prevent header from shrinking
              >
                <div className="flex items-center space-x-2">
                   <HardDrive size={16} className="text-albor-dark-gray group-hover:text-albor-light-gray transition-colors"/>
                   <h3 className="text-xs font-semibold text-albor-dark-gray uppercase tracking-wider group-hover:text-albor-light-gray transition-colors">
                     Escenarios Guardados ({savedScenarios.length})
                   </h3>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-albor-dark-gray"/> : <ChevronRight size={16} className="text-albor-dark-gray"/>}
              </button>

              {isOpen && (
                <div className="pl-1 pr-1 space-y-2 animate-fade-in flex flex-col flex-1 min-h-0"> {/* Allow content to grow */}
                  <div className="relative mb-2 flex-shrink-0"> {/* Prevent search from shrinking */}
                    <input
                      type="text"
                      placeholder="Buscar por nombre o ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-albor-deep-space/50 border border-albor-bg-dark rounded px-2 py-1 text-xs placeholder-albor-dark-gray focus:outline-none focus:ring-1 focus:ring-albor-orange"
                    />
                    <Search size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-albor-dark-gray pointer-events-none"/>
                  </div>

                  {/* Make list scrollable and take remaining space */}
                  <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-1 min-h-[100px]"> {/* Ensure minimum height */}
                    {filteredScenarios.length > 0 ? (
                      filteredScenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          // Add hover effect to the whole item
                          className="flex items-center justify-between w-full p-1.5 rounded group hover:bg-albor-bg-dark/60 text-left cursor-pointer"
                          // Load scenario on click of the item itself (excluding checkbox/buttons)
                          onClick={() => onLoadScenario(scenario.id)}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedScenarioIds.has(scenario.id)}
                            // Call toggle selection when checkbox state changes
                            onChange={() => onToggleSelection(scenario.id)}
                            // Stop propagation to prevent loading when clicking checkbox
                            onClick={(e) => e.stopPropagation()}
                            className="mr-2 flex-shrink-0 form-checkbox h-4 w-4 text-albor-orange bg-albor-bg-dark border-albor-dark-gray rounded focus:ring-albor-orange focus:ring-offset-0" // Added focus style reset
                          />
                          {/* Name */}
                          <span
                            className="text-xs text-albor-light-gray truncate flex-1 mr-2"
                            title={scenario.name}
                          >
                            {scenario.name}
                          </span>
                          {/* Action Buttons - Appear on hover */}
                          <div className="flex-shrink-0 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Removed single delete button to favor multi-delete */}
                            {/* {onDeleteScenario && ( ... )} */}
                            <button
                              onClick={(e) => { e.stopPropagation(); onLoadScenario(scenario.id); }} // Ensure load on button click too
                              className="p-1 rounded text-albor-dark-gray hover:text-albor-orange hover:bg-albor-orange/10 transition-colors"
                              title="Cargar Escenario"
                            >
                              <Download size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-albor-dark-gray px-1 italic text-center py-3">
                        {searchTerm ? 'No se encontraron escenarios.' : 'No hay escenarios guardados.'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        };

        export default SavedScenariosPanel;
