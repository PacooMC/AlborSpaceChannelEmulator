import React from 'react';
    import { Save, Upload, Download, Play, Settings2, Satellite, Link, Info, Loader2, SaveAll, AlertCircle } from 'lucide-react';

    // Import ScenarioType if it's defined elsewhere, otherwise define it here
    type ScenarioType = 'realistic' | 'custom';

    interface ScenarioTopBarProps {
      scenarioName: string;
      onScenarioNameChange: (newName: string) => void;
      scenarioType: ScenarioType;
      onScenarioTypeChange: (newType: ScenarioType) => void;
      onSave: () => void;
      onSaveAs: () => void; // Added prop
      isLoading: boolean;
      onStartScenario: () => void;
      hasUnsavedChanges: boolean; // Added prop
    }

    const ScenarioTopBar: React.FC<ScenarioTopBarProps> = ({
      scenarioName,
      onScenarioNameChange,
      scenarioType,
      onScenarioTypeChange,
      onSave,
      onSaveAs, // Receive handler
      isLoading,
      onStartScenario,
      hasUnsavedChanges // Receive flag
    }) => {

      const handleNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onScenarioNameChange(event.target.value);
      };

      const modeInfoText = scenarioType === 'realistic'
        ? "Define orbits/positions. Links are automatic."
        : "Place nodes freely. Create links manually.";

      return (
        <div className="sticky top-0 z-20 flex items-center justify-between p-2 bg-albor-bg-dark/90 backdrop-blur-sm border-b border-albor-bg-dark/50 mb-1 flex-shrink-0 space-x-4">
          {/* Left Side: Scenario Name & Type */}
          <div className="flex items-center space-x-3 flex-shrink min-w-0">
             <Settings2 size={16} className="text-albor-orange flex-shrink-0"/>
             <div className="relative">
                <input
                    type="text"
                    value={scenarioName}
                    onChange={handleNameInputChange}
                    placeholder="Scenario Name"
                    className={`bg-transparent border rounded px-2 py-1 text-sm text-albor-light-gray focus:outline-none focus:ring-1 focus:ring-albor-orange min-w-[150px] flex-shrink ${hasUnsavedChanges ? 'border-yellow-500' : 'border-albor-dark-gray'}`}
                />
                {hasUnsavedChanges && (
                    <span title="Unsaved Changes" className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                )}
             </div>
             <div className="flex items-center border border-albor-dark-gray rounded text-xs flex-shrink-0">
                <button onClick={() => onScenarioTypeChange('realistic')} title="Realistic Orbit/Placement" className={`px-2 py-1 rounded-l transition-colors flex items-center space-x-1 ${scenarioType === 'realistic' ? 'bg-albor-orange text-white font-semibold ring-1 ring-inset ring-albor-orange' : 'bg-albor-bg-dark text-albor-dark-gray hover:bg-albor-bg-dark/70 hover:text-albor-light-gray'}`}> <Satellite size={14} /> <span>Realistic</span> </button>
                <button onClick={() => onScenarioTypeChange('custom')} title="Custom Placement & Connections" className={`px-2 py-1 rounded-r transition-colors flex items-center space-x-1 ${scenarioType === 'custom' ? 'bg-albor-orange text-white font-semibold ring-1 ring-inset ring-albor-orange' : 'bg-albor-bg-dark text-albor-dark-gray hover:bg-albor-bg-dark/70 hover:text-albor-light-gray'}`}> <Link size={14} /> <span>Custom</span> </button>
             </div>
             <div className="flex items-center text-albor-dark-gray text-xs ml-2" title={modeInfoText}> <Info size={14} className="mr-1 flex-shrink-0"/> <span className="hidden md:inline">{modeInfoText}</span> </div>
          </div>

          <div className="flex-1"></div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button onClick={onSave} className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors relative" title="Save current scenario">
              <Save size={14} />
              <span>Save</span>
              {hasUnsavedChanges && ( <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-yellow-500 ring-1 ring-albor-bg-dark"></span> )}
            </button>
            <button onClick={onSaveAs} className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors" title="Save as new scenario">
              <SaveAll size={14} />
              <span>Save As...</span>
            </button>
            <button className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors"> <Upload size={14} /> <span>Export</span> </button>
            <button onClick={onStartScenario} disabled={isLoading} className={`flex items-center space-x-1 px-3 py-1 rounded text-xs bg-albor-orange hover:bg-albor-orange/80 text-white font-semibold transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {isLoading ? ( <Loader2 size={14} className="animate-spin" /> ) : ( <Play size={14} /> )}
              <span>{isLoading ? 'Starting...' : 'Start Sim'}</span>
            </button>
          </div>
        </div>
      );
    };

    export default ScenarioTopBar;
