import React from 'react';
    import { Save, Upload, Download, Play, ZoomIn, ZoomOut, Undo, Redo, Settings2, Satellite, Link } from 'lucide-react';
    import { ScenarioType } from './types'; // Import ScenarioType

    interface ScenarioTopBarProps {
      scenarioName: string;
      onScenarioNameChange: (newName: string) => void;
      scenarioType: ScenarioType; // Add scenario type prop
      onScenarioTypeChange: (newType: ScenarioType) => void; // Add handler prop
      onSave: () => void;
      onZoomIn: () => void;
      onZoomOut: () => void;
      onUndo: () => void;
      onRedo: () => void;
      canUndo: boolean;
      canRedo: boolean;
    }

    const ScenarioTopBar: React.FC<ScenarioTopBarProps> = ({
      scenarioName,
      onScenarioNameChange,
      scenarioType, // Receive scenario type
      onScenarioTypeChange, // Receive handler
      onSave,
      onZoomIn,
      onZoomOut,
      onUndo,
      onRedo,
      canUndo,
      canRedo
    }) => {

      const handleNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onScenarioNameChange(event.target.value);
      };

      return (
        <div className="sticky top-0 z-20 flex items-center justify-between p-2 bg-albor-bg-dark/90 backdrop-blur-sm border-b border-albor-bg-dark/50 mb-1 flex-shrink-0 space-x-4">
          {/* Left Side: Scenario Name & Type */}
          <div className="flex items-center space-x-3 flex-shrink min-w-0">
             <Settings2 size={16} className="text-albor-orange flex-shrink-0"/>
             <input
                type="text"
                value={scenarioName}
                onChange={handleNameInputChange}
                placeholder="Scenario Name"
                className="bg-transparent border border-albor-dark-gray rounded px-2 py-1 text-sm text-albor-light-gray focus:outline-none focus:ring-1 focus:ring-albor-orange min-w-[150px] flex-shrink"
             />
             {/* Scenario Type Selector */}
             <div className="flex items-center border border-albor-dark-gray rounded text-xs flex-shrink-0">
                <button
                    onClick={() => onScenarioTypeChange('realistic')} // Call handler
                    title="Realistic Orbit/Placement"
                    className={`px-2 py-1 rounded-l transition-colors ${scenarioType === 'realistic' ? 'bg-albor-orange text-white font-semibold' : 'bg-albor-bg-dark text-albor-dark-gray hover:bg-albor-bg-dark/70 hover:text-albor-light-gray'}`}
                >
                    <Satellite size={14} className="inline mr-1"/> Realistic
                </button>
                <button
                    onClick={() => onScenarioTypeChange('custom')} // Call handler
                    title="Custom Placement & Connections"
                    className={`px-2 py-1 rounded-r transition-colors ${scenarioType === 'custom' ? 'bg-albor-orange text-white font-semibold' : 'bg-albor-bg-dark text-albor-dark-gray hover:bg-albor-bg-dark/70 hover:text-albor-light-gray'}`}
                >
                   <Link size={14} className="inline mr-1"/> Custom
                </button>
             </div>
          </div>


          {/* Center Controls: Zoom, Undo/Redo */}
          <div className="flex items-center space-x-2 flex-shrink-0">
             <button
               onClick={onZoomOut} // Connect handler
               className="p-1.5 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors"
               title="Zoom Out"
             >
               <ZoomOut size={16} />
             </button>
             <button
               onClick={onZoomIn} // Connect handler
               className="p-1.5 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors"
               title="Zoom In"
             >
               <ZoomIn size={16} />
             </button>
             <div className="h-5 border-l border-albor-dark-gray/50 mx-1"></div> {/* Separator */}
             <button
               onClick={onUndo} // Connect handler
               disabled={!canUndo} // Use state to disable/enable
               className="p-1.5 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               title="Undo (Ctrl+Z)"
             >
               <Undo size={16} />
             </button>
             <button
               onClick={onRedo} // Connect handler
               disabled={!canRedo} // Use state to disable/enable
               className="p-1.5 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               title="Redo (Ctrl+Y)"
             >
               <Redo size={16} />
             </button>
          </div>

          {/* Right Side Controls: Save, Export, Load, Start */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={onSave} // Connect handler
              className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors"
            >
              <Save size={14} />
              <span>Save Draft</span>
            </button>
             <button className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors">
              <Upload size={14} />
              <span>Export</span>
            </button>
             <button className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors">
              <Download size={14} />
              <span>Load Template</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-1 rounded text-xs bg-albor-orange hover:bg-albor-orange/80 text-white font-semibold transition-colors">
              <Play size={14} />
              <span>Start Sim</span>
            </button>
          </div>
        </div>
      );
    };

    export default ScenarioTopBar;
