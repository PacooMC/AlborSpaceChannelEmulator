import React, { useState } from 'react';
    import { Layers, Search, Maximize, Minimize, MapPin, Orbit, X } from 'lucide-react';
    import HologramMap, { LayerVisibility } from './HologramMap';
    import LayerControlPanel from './LayerControlPanel';
    import SearchPanel from './SearchPanel';

    // --- NEW: Add scenarioId prop ---
    interface OrbitMapTileProps {
      scenarioId: string | null; // Null for global view
      isMaximized?: boolean; // Optional: Used when maximizing from MonitoringView
    }

    const OrbitMapTile: React.FC<OrbitMapTileProps> = ({ scenarioId, isMaximized: isMaximizedProp = false }) => {
      const [isMaximizedInternal, setIsMaximizedInternal] = useState(false);
      const [showLayersPanel, setShowLayersPanel] = useState(false);
      const [showSearchPanel, setShowSearchPanel] = useState(false);

      // Use the prop if provided (for modal view), otherwise use internal state
      const isMaximized = isMaximizedProp || isMaximizedInternal;

      const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
        footprints: true,
        countries: true,
        satellites: true,
        groundStations: true,
        userTerminals: true,
      });

      const toggleMaximize = () => {
        // Only allow toggling internal state if not controlled by prop
        if (!isMaximizedProp) {
            setIsMaximizedInternal(!isMaximizedInternal);
        }
        setShowLayersPanel(false);
        setShowSearchPanel(false);
      };

      const toggleLayersPanel = () => {
        setShowLayersPanel(!showLayersPanel);
        setShowSearchPanel(false);
      };

       const toggleSearchPanel = () => {
        setShowSearchPanel(!showSearchPanel);
        setShowLayersPanel(false);
      };

      const title = scenarioId ? "Scenario Orbit Map" : "Global Live Orbit Map";

      return (
        <div className={`
          bg-albor-bg-dark/80 backdrop-blur-sm rounded border border-albor-bg-dark/50
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isMaximized
            ? 'fixed inset-0 z-50 p-4' // Fullscreen styles
            : 'relative min-h-[250px] lg:min-h-[300px] p-4 h-full' // Normal styles, ensure h-full
          }
        `}>
          {/* Header */}
          <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <h3 className="text-base font-semibold text-albor-light-gray">{title}</h3>
            <div className="flex space-x-1.5">
              <button
                onClick={toggleLayersPanel}
                className={`p-1.5 rounded transition-colors ${showLayersPanel ? 'bg-albor-orange/20 text-albor-orange' : 'text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50'}`}
                title="Toggle Layers"
              >
                <Layers size={16} />
              </button>
              <button
                 onClick={toggleSearchPanel}
                 className={`p-1.5 rounded transition-colors ${showSearchPanel ? 'bg-albor-orange/20 text-albor-orange' : 'text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50'}`}
                 title="Search"
              >
                <Search size={16} />
              </button>
              {/* Only show maximize/minimize if not controlled by prop */}
              {!isMaximizedProp && (
                <button
                  onClick={toggleMaximize}
                  className="p-1.5 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors"
                  title={isMaximized ? "Minimize Map" : "Maximize Map"}
                >
                  {isMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 bg-albor-deep-space/30 rounded border border-albor-bg-dark/50 overflow-hidden relative min-h-0"> {/* Added min-h-0 */}
             {isMaximized && !isMaximizedProp && ( // Only show close if internally maximized
                <button
                  onClick={toggleMaximize}
                  className="absolute top-3 left-3 z-30 p-2 rounded-full bg-albor-bg-dark/70 text-albor-light-gray hover:bg-albor-orange/80 transition-colors shadow-lg"
                  title="Close Map View"
                >
                  <X size={18} />
                </button>
             )}

            {/* Pass isMaximized state and scenarioId to HologramMap */}
            <HologramMap
              layerVisibility={layerVisibility}
              isMaximized={isMaximized}
              scenarioId={scenarioId} // Pass scenarioId
            />

            {showLayersPanel && (
              <LayerControlPanel
                visibility={layerVisibility}
                setVisibility={setLayerVisibility}
                onClose={() => setShowLayersPanel(false)}
              />
            )}
             {showSearchPanel && (
              <SearchPanel
                onClose={() => setShowSearchPanel(false)}
                scenarioId={scenarioId} // Pass scenarioId
              />
            )}
          </div>

          {!isMaximized && (
             <div className="mt-2 text-center text-xs text-albor-dark-gray flex-shrink-0">Time Scrub Bar Area</div>
          )}
        </div>
      );
    };

    export default OrbitMapTile;
