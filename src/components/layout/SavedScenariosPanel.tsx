import React, { useState, useMemo } from 'react';
        import { HardDrive, Search, Download, Trash2, ChevronDown, ChevronRight, Edit } from 'lucide-react'; // Added Edit icon

        interface SavedScenario {
          id: string;
          name: string;
        }

        interface SavedScenariosPanelProps {
          savedScenarios: SavedScenario[];
          selectedScenarioIds: Set<string>; // Receive selected IDs
          currentScenarioId: string | null; // *** ADDED: ID of the currently loaded scenario ***
          onLoadScenario: (id: string | null) => void; // Allow null for "New Scenario"
          onToggleSelection: (id: string) => void; // Receive toggle handler
          // onDeleteScenario?: (id: string) => void; // Keep or remove based on preference
          initiallyOpen?: boolean;
        }

        const SavedScenariosPanel: React.FC<SavedScenariosPanelProps> = ({
          savedScenarios,
          selectedScenarioIds, // Destructure props
          currentScenarioId, // *** ADDED ***
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
            <div className="flex-1 flex flex-col min-h-0"> {/* Allow panel to grow and scroll */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-1 mb-2 text-left group flex-shrink-0" // Prevent header from shrinking
              >
                <div className="flex items-center space-x-2">
                   <HardDrive size={16} className="text-albor-dark-gray group-hover:text-albor-light-gray transition-colors"/>
                   <h3 className="text-xs font-semibold text-albor-dark-gray uppercase tracking-wider group-hover:text-albor-light-gray transition-colors">
                     Saved Scenarios ({savedScenarios.length})
                   </h3>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-albor-dark-gray"/> : <ChevronRight size={16} className="text-albor-dark-gray"/>}
              </button>

              {isOpen && (
                <div className="pl-1 pr-1 space-y-2 animate-fade-in flex flex-col flex-1 min-h-0"> {/* Allow content to grow */}
                  <div className="relative mb-2 flex-shrink-0"> {/* Prevent search from shrinking */}
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-albor-deep-space/50 border border-albor-bg-dark rounded px-2 py-1 text-xs placeholder-albor-dark-gray focus:outline-none focus:ring-1 focus:ring-albor-orange"
                    />
                    <Search size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-albor-dark-gray pointer-events-none"/>
                  </div>

                  {/* Make list scrollable and take remaining space */}
                  <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-1 min-h-[100px]"> {/* Ensure minimum height */}
                    {filteredScenarios.length > 0 ? (
                      filteredScenarios.map((scenario) => {
                        const isSelected = selectedScenarioIds.has(scenario.id);
                        const isCurrent = currentScenarioId === scenario.id; // *** Check if it's the currently loaded one ***
                        let itemClasses = `flex items-center justify-between w-full p-1.5 rounded group hover:bg-albor-bg-dark/60 text-left cursor-pointer transition-colors`;
                        if (isCurrent) {
                            itemClasses += ' bg-albor-orange/10 ring-1 ring-inset ring-albor-orange/60'; // Highlight for current
                        } else if (isSelected) {
                            itemClasses += ' bg-albor-bg-dark/40 ring-1 ring-inset ring-albor-dark-gray'; // Different highlight for selected
                        }

                        return (
                          <div
                            key={scenario.id}
                            className={itemClasses}
                            onClick={() => onLoadScenario(scenario.id)}
                          >
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleSelection(scenario.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="mr-2 flex-shrink-0 form-checkbox h-4 w-4 text-albor-orange bg-albor-bg-dark border-albor-dark-gray rounded focus:ring-albor-orange focus:ring-offset-0"
                            />
                            {/* Name & Current Indicator */}
                            <div className="flex items-center space-x-1 flex-1 mr-2 overflow-hidden">
                                {isCurrent && <Edit size={10} className="text-albor-orange flex-shrink-0" title="Currently Editing"/>}
                                <span
                                  className={`text-xs truncate ${isCurrent ? 'text-albor-orange font-medium' : 'text-albor-light-gray'}`}
                                  title={scenario.name}
                                >
                                  {scenario.name}
                                </span>
                            </div>
                            {/* Action Buttons - Appear on hover */}
                            <div className="flex-shrink-0 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); onLoadScenario(scenario.id); }}
                                className="p-1 rounded text-albor-dark-gray hover:text-albor-orange hover:bg-albor-orange/10 transition-colors"
                                title="Load Scenario"
                              >
                                <Download size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-albor-dark-gray px-1 italic text-center py-3">
                        {searchTerm ? 'No scenarios found.' : 'No saved scenarios.'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        };

        export default SavedScenariosPanel;
