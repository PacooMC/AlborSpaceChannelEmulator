import React, { useState, useEffect, useCallback } from 'react';
    import { X, Move, Save } from 'lucide-react';
    import { NodeType, MovementPatternType, MovementParameters, LinearMovementParams, CircularMovementParams, EllipticalMovementParams, GroundTrackLoopParams } from './types'; // Import EllipticalMovementParams
    import FlatMapPathEditor from './FlatMapPathEditor'; // Import map editor

    interface MovementPatternEditorModalProps {
      isOpen: boolean;
      onClose: () => void;
      nodeType: NodeType;
      initialPattern: MovementPatternType;
      initialParams: MovementParameters;
      onSave: (pattern: MovementPatternType, params: MovementParameters) => void;
    }

    // Reusable Input Component (similar to NodeConfigPanel's)
    const ModalConfigInput: React.FC<{ id: string; label: string; value: string | number | undefined; onChange: (value: string) => void; type?: string; placeholder?: string; step?: string | number; min?: string | number; max?: string | number; className?: string }> =
      ({ id, label, value, onChange, type = "text", placeholder, step, min, max, className = "" }) => {
        const [currentValue, setCurrentValue] = useState(value ?? '');
        useEffect(() => { setCurrentValue(value ?? ''); }, [value]);
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setCurrentValue(e.target.value); onChange(e.target.value); }; // Update parent immediately on change
        const commonProps = { id, value: currentValue, onChange: handleChange, placeholder: placeholder || label, className: `w-full bg-albor-deep-space/80 border border-albor-bg-dark rounded px-2 py-1 text-sm placeholder-albor-dark-gray focus:outline-none focus:ring-1 focus:ring-albor-orange text-albor-light-gray ${className}`, };
        return ( <div> <label htmlFor={id} className="block text-albor-dark-gray mb-1 text-xs">{label}</label> <input {...commonProps} type={type} step={step} min={min} max={max} /> </div> );
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

      // Reset state when initial props change (e.g., opening for a different node)
      useEffect(() => {
        setPattern(initialPattern);
        setParams(initialParams);
      }, [initialPattern, initialParams, isOpen]); // Depend on isOpen to reset when opened

      const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPattern = e.target.value as MovementPatternType;
        setPattern(newPattern);
        // Reset params, preserving speed if applicable
        const currentSpeed = params.speedKmh;
        let newParams: MovementParameters = {};
        if (newPattern !== 'STATIC') {
            newParams.speedKmh = currentSpeed;
        }
        setParams(newParams);
      };

      const handleParamChange = (paramKey: keyof MovementParameters, value: string | number | boolean | undefined) => {
         let processedValue = value;
         // Convert numeric fields
         const numericKeys: (keyof MovementParameters)[] = ['speedKmh', 'centerX', 'centerY', 'radius', 'altitudeKm', 'startLon', 'startLat', 'endLon', 'endLat', 'semiMajorAxis', 'semiMinorAxis', 'angleDegrees'];
         if (typeof value === 'string' && numericKeys.includes(paramKey as any)) {
             processedValue = value === '' ? undefined : parseFloat(value);
             if (isNaN(processedValue as number)) processedValue = undefined;
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
        onSave(pattern, params);
        onClose();
      };

      if (!isOpen) {
        return null;
      }

      // Define available patterns based on node type
      const availablePatterns: MovementPatternType[] = ['STATIC'];
      if (nodeType === 'SAT') {
          availablePatterns.push('LINEAR', 'CIRCULAR', 'ELLIPTICAL', 'GROUND_TRACK_LOOP');
      } else { // GS or UE
          availablePatterns.push('LINEAR', 'CIRCULAR');
      }

      return (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={onClose} // Close on backdrop click
        >
          <div
            className="bg-albor-bg-dark border border-albor-dark-gray rounded-lg shadow-xl w-full max-w-3xl p-5 m-4 text-albor-light-gray transform transition-all scale-95 opacity-0 animate-scale-in flex flex-col max-h-[90vh]" // Increased max-w
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
                            <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>

                {/* Parameter Editor Area */}
                <div className="border border-albor-bg-dark/80 rounded p-3 bg-albor-deep-space/30 min-h-[150px]"> {/* Increased min-h */}
                    <h3 className="text-sm font-semibold text-albor-light-gray mb-3">Parameters for: <span className="text-albor-orange">{pattern.replace(/_/g, ' ')}</span></h3>

                    {pattern === 'STATIC' && (
                        <p className="text-sm text-albor-dark-gray italic">No parameters needed for static nodes.</p>
                    )}

                    {/* Parameters for LINEAR */}
                    {pattern === 'LINEAR' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            <ModalConfigInput id="modalMoveSpeedLinear" label="Speed (km/h)" value={params.speedKmh} onChange={(val) => handleParamChange('speedKmh', val)} type="number" step="any" placeholder="Constant speed"/>
                            <ModalConfigInput id="modalMoveAngleLinear" label="Direction Angle (°)" value={(params as LinearMovementParams).angleDegrees} onChange={(val) => handleParamChange('angleDegrees', val)} type="number" step="any" min="0" max="360" placeholder="0-360 (Optional)"/>
                             <p className="text-xs text-albor-dark-gray italic md:col-span-2">Note: Linear movement assumes constant speed and direction from the node's starting position.</p>
                        </div>
                    )}

                    {/* Parameters for CIRCULAR */}
                    {pattern === 'CIRCULAR' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            <ModalConfigInput id="modalMoveCenterXCirc" label="Center X (Canvas)" value={(params as CircularMovementParams).centerX} onChange={(val) => handleParamChange('centerX', val)} type="number" step="any" placeholder="Canvas X coordinate"/>
                            <ModalConfigInput id="modalMoveCenterYCirc" label="Center Y (Canvas)" value={(params as CircularMovementParams).centerY} onChange={(val) => handleParamChange('centerY', val)} type="number" step="any" placeholder="Canvas Y coordinate"/>
                            <ModalConfigInput id="modalMoveRadiusCirc" label="Radius (Canvas Units)" value={(params as CircularMovementParams).radius} onChange={(val) => handleParamChange('radius', val)} type="number" step="any" placeholder="e.g., 100"/>
                            <ModalConfigInput id="modalMoveSpeedCirc" label="Speed (km/h, Optional)" value={params.speedKmh} onChange={(val) => handleParamChange('speedKmh', val)} type="number" step="any" placeholder="Simulation speed"/>
                            <div className="md:col-span-2 flex items-center space-x-2 mt-1">
                                <input type="checkbox" id="modalMoveClockwiseCirc" checked={(params as CircularMovementParams).clockwise ?? false} onChange={(e) => handleParamChange('clockwise', e.target.checked)} className="form-checkbox h-4 w-4 text-albor-orange bg-albor-bg-dark border-albor-dark-gray rounded focus:ring-albor-orange focus:ring-offset-0"/>
                                <label htmlFor="modalMoveClockwiseCirc" className="text-sm text-albor-dark-gray">Clockwise Rotation</label>
                            </div>
                        </div>
                    )}

                    {/* Parameters for ELLIPTICAL */}
                    {pattern === 'ELLIPTICAL' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                            <ModalConfigInput id="modalMoveCenterXEllip" label="Center X (Canvas)" value={(params as EllipticalMovementParams).centerX} onChange={(val) => handleParamChange('centerX', val)} type="number" step="any" placeholder="Canvas X coordinate"/>
                            <ModalConfigInput id="modalMoveCenterYEllip" label="Center Y (Canvas)" value={(params as EllipticalMovementParams).centerY} onChange={(val) => handleParamChange('centerY', val)} type="number" step="any" placeholder="Canvas Y coordinate"/>
                            <ModalConfigInput id="modalMoveSmaEllip" label="Semi-Major Axis" value={(params as EllipticalMovementParams).semiMajorAxis} onChange={(val) => handleParamChange('semiMajorAxis', val)} type="number" step="any" placeholder="Longer radius (Canvas)"/>
                            <ModalConfigInput id="modalMoveSmiEllip" label="Semi-Minor Axis" value={(params as EllipticalMovementParams).semiMinorAxis} onChange={(val) => handleParamChange('semiMinorAxis', val)} type="number" step="any" placeholder="Shorter radius (Canvas)"/>
                            <ModalConfigInput id="modalMoveAngleEllip" label="Rotation Angle (°)" value={(params as EllipticalMovementParams).angleDegrees} onChange={(val) => handleParamChange('angleDegrees', val)} type="number" step="any" min="0" max="360" placeholder="Ellipse rotation"/>
                            <ModalConfigInput id="modalMoveSpeedEllip" label="Speed (km/h, Optional)" value={params.speedKmh} onChange={(val) => handleParamChange('speedKmh', val)} type="number" step="any" placeholder="Simulation speed"/>
                             <div className="md:col-span-2 flex items-center space-x-2 mt-1">
                                <input type="checkbox" id="modalMoveClockwiseEllip" checked={(params as EllipticalMovementParams).clockwise ?? false} onChange={(e) => handleParamChange('clockwise', e.target.checked)} className="form-checkbox h-4 w-4 text-albor-orange bg-albor-bg-dark border-albor-dark-gray rounded focus:ring-albor-orange focus:ring-offset-0"/>
                                <label htmlFor="modalMoveClockwiseEllip" className="text-sm text-albor-dark-gray">Clockwise Rotation</label>
                            </div>
                        </div>
                    )}

                    {/* Parameters for GROUND_TRACK_LOOP */}
                    {pattern === 'GROUND_TRACK_LOOP' && nodeType === 'SAT' && (
                        <div className="space-y-3">
                            <p className="text-sm text-albor-dark-gray">Define the start and end points of the repeating ground track loop on the map.</p>
                            {/* Increased map size and reduced scale */}
                            <FlatMapPathEditor
                                startPoint={(params as GroundTrackLoopParams).startLon !== undefined && (params as GroundTrackLoopParams).startLat !== undefined ? { lon: (params as GroundTrackLoopParams).startLon!, lat: (params as GroundTrackLoopParams).startLat! } : null}
                                endPoint={(params as GroundTrackLoopParams).endLon !== undefined && (params as GroundTrackLoopParams).endLat !== undefined ? { lon: (params as GroundTrackLoopParams).endLon!, lat: (params as GroundTrackLoopParams).endLat! } : null}
                                onPointSet={(type, point) => {
                                    handleParamChange(type === 'start' ? 'startLon' : 'endLon', point.lon);
                                    handleParamChange(type === 'start' ? 'startLat' : 'endLat', point.lat);
                                }}
                                mapHeight={250} // Larger map height
                                mapWidth={500} // Larger map width
                                projectionScale={80} // Reduced scale to show more map
                            />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
                                <ModalConfigInput id="modalMoveStartLonGTL" label="Start Lon (°)" value={(params as GroundTrackLoopParams).startLon} onChange={(val) => handleParamChange('startLon', val)} type="number" step="any" placeholder="-180 to 180"/>
                                <ModalConfigInput id="modalMoveStartLatGTL" label="Start Lat (°)" value={(params as GroundTrackLoopParams).startLat} onChange={(val) => handleParamChange('startLat', val)} type="number" step="any" placeholder="-90 to 90"/>
                                <ModalConfigInput id="modalMoveEndLonGTL" label="End Lon (°)" value={(params as GroundTrackLoopParams).endLon} onChange={(val) => handleParamChange('endLon', val)} type="number" step="any" placeholder="-180 to 180"/>
                                <ModalConfigInput id="modalMoveEndLatGTL" label="End Lat (°)" value={(params as GroundTrackLoopParams).endLat} onChange={(val) => handleParamChange('endLat', val)} type="number" step="any" placeholder="-90 to 90"/>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                <ModalConfigInput id="modalMoveAltGTL" label="Altitude (km)" value={(params as GroundTrackLoopParams).altitudeKm} onChange={(val) => handleParamChange('altitudeKm', val)} type="number" step="any" placeholder="Used for speed calculation"/>
                                <ModalConfigInput id="modalMoveSpeedGTL" label="Speed (km/h, Optional)" value={params.speedKmh} onChange={(val) => handleParamChange('speedKmh', val)} type="number" step="any" placeholder="Overrides altitude calculation"/>
                            </div>
                            <p className="text-xs text-albor-dark-gray italic">Note: Speed is automatically calculated based on altitude unless explicitly provided.</p>
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
