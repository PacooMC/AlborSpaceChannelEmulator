import React, { useState, useEffect, useCallback, useMemo } from 'react';
        import { X, Move, Save, RefreshCw, Info, Repeat, CornerDownLeft } from 'lucide-react'; // Added Repeat, CornerDownLeft
        // Import simplified types
        import { NodeType, MovementPatternType, MovementParameters, LinearMovementParams, CircularPathParams, PathBehavior } from './types'; // Added PathBehavior
        // --- RE-IMPORT FlatMapPathEditor ---
        import FlatMapPathEditor from './FlatMapPathEditor';

        // --- Constants ---
        const GM = 398600.4418; // Earth's gravitational constant (km^3/s^2)
        const EARTH_RADIUS_KM = 6371.0; // Mean Earth radius

        // --- NEW: Info Tooltip Component ---
        const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
            const [showTooltip, setShowTooltip] = useState(false);
            return (
                <div className="relative inline-block ml-1">
                    <Info
                        size={12}
                        className="text-albor-dark-gray cursor-help"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    />
                    {showTooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 w-48 p-2 bg-albor-bg-dark border border-albor-dark-gray rounded shadow-lg text-xs text-albor-light-gray z-50 pointer-events-none">
                            {text}
                        </div>
                    )}
                </div>
            );
        };
        // --- End Info Tooltip Component ---


        interface MovementPatternEditorModalProps {
          isOpen: boolean;
          onClose: () => void;
          nodeType: NodeType;
          initialPattern: MovementPatternType;
          initialParams: MovementParameters;
          onSave: (pattern: MovementPatternType, params: MovementParameters) => void;
        }

        // Reusable Input Component (no changes needed)
        const ModalConfigInput: React.FC<{ id: string; label: string; value: string | number | undefined; onChange: (value: string) => void; type?: string; placeholder?: string; step?: string | number; min?: string | number; max?: string | number; className?: string; readOnly?: boolean }> = // Added readOnly prop
          ({ id, label, value, onChange, type = "text", placeholder, step, min, max, className = "", readOnly = false }) => {
            const [currentValue, setCurrentValue] = useState(value ?? '');
            useEffect(() => { setCurrentValue(value ?? ''); }, [value]);
            const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                if (!readOnly) {
                    setCurrentValue(e.target.value);
                    onChange(e.target.value);
                }
            };
            const commonProps = { id, value: currentValue, onChange: handleChange, placeholder: placeholder || label, className: `w-full bg-albor-deep-space/80 border rounded px-2 py-1 text-sm placeholder-albor-dark-gray focus:outline-none focus:ring-1 focus:ring-albor-orange text-albor-light-gray ${readOnly ? 'border-albor-bg-dark/50 text-albor-dark-gray cursor-not-allowed' : 'border-albor-bg-dark'} ${className}`, readOnly };
            return ( <div> <label htmlFor={id} className="block text-albor-dark-gray mb-1 text-xs">{label}</label> <input {...commonProps} type={type} step={step} min={min} max={max} /> </div> );
        };

        // *** NEW: Helper to get display name ***
        const getPatternDisplayName = (pattern: MovementPatternType): string => {
            switch (pattern) {
                case 'STATIC': return 'Static';
                case 'LINEAR': return 'Linear';
                case 'CIRCULAR_PATH': return 'Circular Path';
                default: return pattern; // Fallback
            }
        };


        const MovementPatternEditorModal: React.FC<MovementPatternEditorModalProps> = ({
          isOpen,
          onClose,
          nodeType,
          initialPattern,
          initialParams,
          onSave,
        }) => {
          const [pattern, setPattern] = useState<MovementPatternType>(initialPattern);
          const [params, setParams] = useState<MovementParameters>(initialParams);

          // Reset state when initial props change
          useEffect(() => {
            setPattern(initialPattern);
            setParams(initialParams);
          }, [initialPattern, initialParams, isOpen]);

          // --- Calculate Speed for Circular Path ---
          const calculatedCircularSpeedKmh = useMemo(() => {
            if (pattern !== 'CIRCULAR_PATH') return undefined;
            const altitudeKm = (params as CircularPathParams)?.altitudeKm;
            if (altitudeKm === undefined || altitudeKm <= 0) return undefined;

            try {
                const r_km = EARTH_RADIUS_KM + altitudeKm;
                const v_km_s = Math.sqrt(GM / r_km);
                const v_kmh = v_km_s * 3600;
                return parseFloat(v_kmh.toFixed(0)); // Return as number, rounded
            } catch (e) {
                console.error("Error calculating circular speed:", e);
                return undefined;
            }
          }, [pattern, params]);

          // --- Get effective speed (user input or calculated) ---
          const effectiveSpeedKmh = useMemo(() => {
              if (pattern === 'CIRCULAR_PATH') {
                  return params.speedKmh ?? calculatedCircularSpeedKmh;
              }
              return params.speedKmh;
          }, [pattern, params.speedKmh, calculatedCircularSpeedKmh]);
          // --- End Speed Calculation ---


          const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const newPattern = e.target.value as MovementPatternType;
            setPattern(newPattern);
            // Reset params, preserving speed if applicable (only for LINEAR now)
            let newParams: MovementParameters = {};
            if (newPattern === 'LINEAR') {
                newParams.speedKmh = params.speedKmh;
            }
            // Set default circular path params if switching to CIRCULAR_PATH
            if (newPattern === 'CIRCULAR_PATH') {
                newParams = { ...newParams, altitudeKm: 550 }; // Example LEO default altitude
            }
            setParams(newParams);
          };

          const handleParamChange = (paramKey: keyof MovementParameters | keyof LinearMovementParams | keyof CircularPathParams, value: string | number | boolean | PathBehavior | undefined) => { // Added PathBehavior
             let processedValue = value;
             // Convert numeric fields
             const numericKeys: (keyof MovementParameters | keyof CircularPathParams | keyof LinearMovementParams)[] = [
                 'speedKmh', 'angleDegrees', 'altitudeKm',
                 'startLon', 'startLat', 'endLon', 'endLat' // Add geographic coords
             ];
             if (typeof value === 'string' && numericKeys.includes(paramKey as any)) {
                 processedValue = value === '' ? undefined : parseFloat(value);
                 if (isNaN(processedValue as number)) processedValue = undefined;
             }
             // Handle pathBehavior
             if (paramKey === 'pathBehavior') {
                 processedValue = value as PathBehavior | undefined;
                 // Ensure undefined if empty string or invalid value comes somehow
                 if (processedValue !== 'loop' && processedValue !== 'bounce') {
                     processedValue = undefined;
                 }
             }

             setParams(prev => {
                 const newParams = { ...prev, [paramKey]: processedValue };
                 // Clean up undefined fields
                 Object.keys(newParams).forEach(key => {
                     if (newParams[key as keyof MovementParameters] === undefined) {
                         delete newParams[key as keyof MovementParameters];
                     }
                 });
                 return newParams;
             });
          };

          const handleSaveClick = () => {
            // If circular path and speed wasn't manually set, save the calculated one
            let finalParams = { ...params };
            if (pattern === 'CIRCULAR_PATH' && params.speedKmh === undefined && calculatedCircularSpeedKmh !== undefined) {
                finalParams.speedKmh = calculatedCircularSpeedKmh;
            }
            onSave(pattern, finalParams);
            onClose();
          };

          if (!isOpen) {
            return null;
          }

          // Define available patterns based on node type (Simplified)
          const availablePatterns: MovementPatternType[] = ['STATIC', 'LINEAR'];
          // Allow CIRCULAR_PATH for all types in custom mode
          availablePatterns.push('CIRCULAR_PATH');


          return (
            <div
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={onClose} // Close on backdrop click
            >
              {/* --- INCREASED MAX WIDTH --- */}
              <div
                className="bg-albor-bg-dark border border-albor-dark-gray rounded-lg shadow-xl w-full max-w-2xl p-5 m-4 text-albor-light-gray transform transition-all scale-95 opacity-0 animate-scale-in flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-albor-dark-gray/50 flex-shrink-0">
                  <h2 className="text-lg font-semibold flex items-center space-x-2">
                    <Move size={20} className="text-albor-orange" />
                    <span>Edit Movement Pattern ({nodeType})</span>
                  </h2>
                  <button onClick={onClose} className="p-1 rounded-full text-albor-dark-gray hover:bg-albor-bg-dark/70 hover:text-albor-light-gray transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-4">
                    {/* Pattern Selector */}
                    <div>
                        <label htmlFor="movementPatternSelect" className="block text-albor-dark-gray mb-1 text-sm">Movement Type</label>
                        <select
                            id="movementPatternSelect"
                            value={pattern}
                            onChange={handlePatternChange}
                            className="w-full bg-albor-deep-space/80 border border-albor-bg-dark rounded px-2 py-1.5 text-sm text-albor-light-gray focus:outline-none focus:ring-1 focus:ring-albor-orange"
                        >
                            {availablePatterns.map(p => (
                                // *** UPDATED: Use display name helper ***
                                <option key={p} value={p}>{getPatternDisplayName(p)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Parameter Editor Area */}
                    <div className="border border-albor-bg-dark/80 rounded p-3 bg-albor-deep-space/30 min-h-[150px]">
                        {/* *** UPDATED: Use display name helper *** */}
                        <h3 className="text-sm font-semibold text-albor-light-gray mb-3">Parameters for: <span className="text-albor-orange">{getPatternDisplayName(pattern)}</span></h3>

                        {pattern === 'STATIC' && (
                            <p className="text-sm text-albor-dark-gray italic">No parameters needed for static nodes.</p>
                        )}

                        {/* Parameters for LINEAR */}
                        {pattern === 'LINEAR' && (
                            <div className="space-y-3">
                                <p className="text-sm text-albor-dark-gray flex items-center">
                                    Define the start and end points of the linear path on the map.
                                    <InfoTooltip text="Linear path assumes the node is NOT orbiting (e.g., a drone, car). Speed is manually controlled and constant along the path." />
                                </p>
                                {/* --- ADDED MAP EDITOR --- */}
                                <FlatMapPathEditor
                                    startPoint={(params as LinearMovementParams).startLon !== undefined && (params as LinearMovementParams).startLat !== undefined ? { lon: (params as LinearMovementParams).startLon!, lat: (params as LinearMovementParams).startLat! } : null}
                                    endPoint={(params as LinearMovementParams).endLon !== undefined && (params as LinearMovementParams).endLat !== undefined ? { lon: (params as LinearMovementParams).endLon!, lat: (params as LinearMovementParams).endLat! } : null}
                                    onPointSet={(type, point) => {
                                        handleParamChange(type === 'start' ? 'startLon' : 'endLon', point.lon);
                                        handleParamChange(type === 'start' ? 'startLat' : 'endLat', point.lat);
                                    }}
                                    mapHeight={200} // Adjust size as needed
                                    mapWidth={400}
                                    projectionScale={60}
                                />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
                                    <ModalConfigInput id="modalMoveStartLonLin" label="Start Lon (°)" value={(params as LinearMovementParams).startLon} onChange={(val) => handleParamChange('startLon', val)} type="number" step="any" placeholder="-180 to 180"/>
                                    <ModalConfigInput id="modalMoveStartLatLin" label="Start Lat (°)" value={(params as LinearMovementParams).startLat} onChange={(val) => handleParamChange('startLat', val)} type="number" step="any" placeholder="-90 to 90"/>
                                    <ModalConfigInput id="modalMoveEndLonLin" label="End Lon (°)" value={(params as LinearMovementParams).endLon} onChange={(val) => handleParamChange('endLon', val)} type="number" step="any" placeholder="-180 to 180"/>
                                    <ModalConfigInput id="modalMoveEndLatLin" label="End Lat (°)" value={(params as LinearMovementParams).endLat} onChange={(val) => handleParamChange('endLat', val)} type="number" step="any" placeholder="-90 to 90"/>
                                </div>
                                <hr className="border-albor-bg-dark/50 my-2"/>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                    <ModalConfigInput id="modalMoveSpeedLinear" label="Speed (km/h)" value={params.speedKmh} onChange={(val) => handleParamChange('speedKmh', val)} type="number" step="any" placeholder="Constant speed"/>
                                    {/* --- NEW: Path Behavior Radio Buttons --- */}
                                    <div>
                                        <label className="block text-albor-dark-gray mb-1 text-xs">Path End Behavior</label>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center space-x-1 cursor-pointer">
                                                <input type="radio" name="linearPathBehavior" value="loop" checked={(params as LinearMovementParams).pathBehavior === 'loop' || (params as LinearMovementParams).pathBehavior === undefined} onChange={() => handleParamChange('pathBehavior', 'loop')} className="form-radio h-4 w-4 text-albor-orange bg-albor-bg-dark border-albor-dark-gray focus:ring-albor-orange focus:ring-offset-0"/>
                                                <span className="text-sm text-albor-light-gray">Loop</span>
                                                <InfoTooltip text="When the node reaches the End Point, it instantly reappears at the Start Point and continues." />
                                            </label>
                                            <label className="flex items-center space-x-1 cursor-pointer">
                                                <input type="radio" name="linearPathBehavior" value="bounce" checked={(params as LinearMovementParams).pathBehavior === 'bounce'} onChange={() => handleParamChange('pathBehavior', 'bounce')} className="form-radio h-4 w-4 text-albor-orange bg-albor-bg-dark border-albor-dark-gray focus:ring-albor-orange focus:ring-offset-0"/>
                                                <span className="text-sm text-albor-light-gray">Bounce</span>
                                                <InfoTooltip text="When the node reaches the End Point, it reverses direction and moves back towards the Start Point (and vice-versa)." />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-albor-dark-gray italic">Note: Start/end points define the path. Speed determines how fast the node traverses it.</p>
                            </div>
                        )}

                        {/* Parameters for CIRCULAR_PATH */}
                        {pattern === 'CIRCULAR_PATH' && (
                            <div className="space-y-3">
                                <p className="text-sm text-albor-dark-gray">Define the start and end points of the circular arc on the map and the altitude.</p>
                                {/* --- ADDED MAP EDITOR --- */}
                                <FlatMapPathEditor
                                    startPoint={(params as CircularPathParams).startLon !== undefined && (params as CircularPathParams).startLat !== undefined ? { lon: (params as CircularPathParams).startLon!, lat: (params as CircularPathParams).startLat! } : null}
                                    endPoint={(params as CircularPathParams).endLon !== undefined && (params as CircularPathParams).endLat !== undefined ? { lon: (params as CircularPathParams).endLon!, lat: (params as CircularPathParams).endLat! } : null}
                                    onPointSet={(type, point) => {
                                        handleParamChange(type === 'start' ? 'startLon' : 'endLon', point.lon);
                                        handleParamChange(type === 'start' ? 'startLat' : 'endLat', point.lat);
                                    }}
                                    mapHeight={200}
                                    mapWidth={400}
                                    projectionScale={60}
                                />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
                                    <ModalConfigInput id="modalMoveStartLonCirc" label="Start Lon (°)" value={(params as CircularPathParams).startLon} onChange={(val) => handleParamChange('startLon', val)} type="number" step="any" placeholder="-180 to 180"/>
                                    <ModalConfigInput id="modalMoveStartLatCirc" label="Start Lat (°)" value={(params as CircularPathParams).startLat} onChange={(val) => handleParamChange('startLat', val)} type="number" step="any" placeholder="-90 to 90"/>
                                    <ModalConfigInput id="modalMoveEndLonCirc" label="End Lon (°)" value={(params as CircularPathParams).endLon} onChange={(val) => handleParamChange('endLon', val)} type="number" step="any" placeholder="-180 to 180"/>
                                    <ModalConfigInput id="modalMoveEndLatCirc" label="End Lat (°)" value={(params as CircularPathParams).endLat} onChange={(val) => handleParamChange('endLat', val)} type="number" step="any" placeholder="-90 to 90"/>
                                </div>
                                <hr className="border-albor-bg-dark/50 my-2"/>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                    <ModalConfigInput id="modalMoveAltitudeCirc" label="Altitude (km)" value={(params as CircularPathParams).altitudeKm} onChange={(val) => handleParamChange('altitudeKm', val)} type="number" step="any" placeholder="e.g., 550"/>
                                    {/* Speed Input - Optional */}
                                    <div className="relative">
                                        <ModalConfigInput
                                            id="modalMoveSpeedCirc"
                                            label="Speed (km/h, Optional)"
                                            value={params.speedKmh} // Show user input if present
                                            onChange={(val) => handleParamChange('speedKmh', val)}
                                            type="number" step="any"
                                            placeholder={calculatedCircularSpeedKmh !== undefined ? `Calculated: ${calculatedCircularSpeedKmh}` : 'Auto-calculated'}
                                        />
                                        {/* Show calculated speed if no user input */}
                                        {params.speedKmh === undefined && calculatedCircularSpeedKmh !== undefined && (
                                            <span className="absolute right-2 bottom-1.5 text-xs text-albor-dark-gray italic pointer-events-none">
                                                (~{calculatedCircularSpeedKmh} km/h)
                                            </span>
                                        )}
                                        {/* Button to clear manual speed and use calculated */}
                                        {params.speedKmh !== undefined && calculatedCircularSpeedKmh !== undefined && (
                                             <button
                                                onClick={() => handleParamChange('speedKmh', undefined)}
                                                className="absolute right-1 bottom-1 p-0.5 rounded text-albor-dark-gray hover:text-albor-orange"
                                                title={`Use calculated speed (${calculatedCircularSpeedKmh} km/h)`}
                                            >
                                                <RefreshCw size={12}/>
                                            </button>
                                        )}
                                    </div>
                                    {/* --- NEW: Path Behavior Radio Buttons --- */}
                                    <div>
                                        <label className="block text-albor-dark-gray mb-1 text-xs">Path End Behavior</label>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center space-x-1 cursor-pointer">
                                                <input type="radio" name="circularPathBehavior" value="loop" checked={(params as CircularPathParams).pathBehavior === 'loop' || (params as CircularPathParams).pathBehavior === undefined} onChange={() => handleParamChange('pathBehavior', 'loop')} className="form-radio h-4 w-4 text-albor-orange bg-albor-bg-dark border-albor-dark-gray focus:ring-albor-orange focus:ring-offset-0"/>
                                                <span className="text-sm text-albor-light-gray">Loop</span>
                                                <InfoTooltip text="When the node reaches the End Point, it instantly reappears at the Start Point and continues along the arc." />
                                            </label>
                                            <label className="flex items-center space-x-1 cursor-pointer">
                                                <input type="radio" name="circularPathBehavior" value="bounce" checked={(params as CircularPathParams).pathBehavior === 'bounce'} onChange={() => handleParamChange('pathBehavior', 'bounce')} className="form-radio h-4 w-4 text-albor-orange bg-albor-bg-dark border-albor-dark-gray focus:ring-albor-orange focus:ring-offset-0"/>
                                                <span className="text-sm text-albor-light-gray">Bounce</span>
                                                <InfoTooltip text="When the node reaches the End Point, it reverses direction and moves back towards the Start Point along the arc (and vice-versa)." />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {/* REMOVED Clockwise checkbox */}
                                <p className="text-xs text-albor-dark-gray italic">Note: Defines a circular path segment. Speed is calculated from altitude if not specified.</p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-albor-dark-gray/50 flex-shrink-0">
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded text-sm bg-albor-bg-dark/80 hover:bg-albor-dark-gray/50 border border-albor-dark-gray text-albor-light-gray transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClick}
                    className="px-4 py-1.5 rounded text-sm font-semibold transition-colors flex items-center space-x-1.5 bg-albor-orange hover:bg-albor-orange/80 text-white"
                  >
                    <Save size={16} />
                    <span>Apply Changes</span>
                  </button>
                </div>
              </div>
              {/* Add animation styles if not already present globally */}
              <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
                @keyframes scaleIn {
                  from { transform: scale(0.95); opacity: 0; }
                  to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scaleIn 0.2s ease-out forwards; }
              `}</style>
            </div>
          );
        };

        export default MovementPatternEditorModal;
