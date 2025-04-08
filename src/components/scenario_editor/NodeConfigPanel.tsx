import React, { useState, useEffect, useCallback, useRef } from 'react';
    import { Settings, Satellite, RadioTower, Smartphone, MapPin, Orbit, Hand, Info } from 'lucide-react';
    import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
    import { geoOrthographic } from 'd3-geo';
    import * as satellite from 'satellite.js';

    import { ScenarioNode, CustomNodeData, ScenarioType, KeplerianElements } from './types';

    // --- Constants ---
    const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
    const MAP_ROTATION: [number, number, number] = [-10, -40, 0];
    const GM = 398600.4418; // Earth's gravitational constant (km^3/s^2)
    const EARTH_RADIUS_KM = 6371.0; // Mean Earth radius

    // --- Interfaces ---
    interface NodeConfigPanelProps {
      selectedNode: ScenarioNode;
      scenarioType: ScenarioType;
      onNodeUpdate: (nodeId: string, updates: Partial<CustomNodeData>) => void;
    }

    interface CalculatedOrbitParams {
        period?: number; // minutes
        apogee?: number; // km above surface
        perigee?: number; // km above surface
        meanMotion?: number; // revs per day
        error?: string;
    }

    // --- Helper Components ---
    const ConfigInput: React.FC<{ id: string; label: string; value: string | number | undefined; onChange: (value: string) => void; onSave: () => void; type?: string; placeholder?: string; step?: string | number; rows?: number; min?: string | number; max?: string | number; }> =
      ({ id, label, value, onChange, onSave, type = "text", placeholder, step, rows, min, max }) => {
        const [currentValue, setCurrentValue] = useState(value ?? '');
        useEffect(() => { setCurrentValue(value ?? ''); }, [value]);
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setCurrentValue(e.target.value); };
        const handleBlur = () => { if (currentValue !== (value ?? '')) { onChange(String(currentValue)); onSave(); } };
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => { if (e.key === 'Enter' && type !== 'textarea') { handleBlur(); e.currentTarget.blur(); } else if (e.key === 'Escape') { setCurrentValue(value ?? ''); e.currentTarget.blur(); } };
        const commonProps = { id, value: currentValue, onChange: handleChange, onBlur: handleBlur, onKeyDown: handleKeyDown, placeholder: placeholder || label, className: "w-full bg-albor-deep-space/50 border border-albor-bg-dark rounded px-2 py-1 text-xs placeholder-albor-dark-gray focus:outline-none focus:ring-1 focus:ring-albor-orange", };
        return ( <div> <label htmlFor={id} className="block text-albor-dark-gray mb-1 text-xs">{label}</label> {type === 'textarea' ? <textarea {...commonProps} rows={rows || 3}></textarea> : <input {...commonProps} type={type} step={step} min={min} max={max} />} </div> );
    };

    type MapInteraction = 'place' | 'pan';
    interface MapPreviewProps {
        latitude?: number;
        longitude?: number;
        onMapClick: (coords: { lat: number; lon: number }) => void;
        interactionMode: MapInteraction;
    }
    const MapPreview: React.FC<MapPreviewProps> =
        ({ latitude, longitude, onMapClick, interactionMode }) => {
        const [rotation, setRotation] = useState<[number, number, number]>(MAP_ROTATION);
        const [isDraggingMap, setIsDraggingMap] = useState(false);
        const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (latitude !== undefined && longitude !== undefined && !isDraggingMap) {
                 setRotation(prevRotation => {
                    const newRotation: [number, number, number] = [-longitude, -latitude, 0];
                    if (Math.abs(newRotation[0] - prevRotation[0]) > 0.1 || Math.abs(newRotation[1] - prevRotation[1]) > 0.1) {
                        return newRotation;
                    }
                    return prevRotation;
                });
            } else if (latitude === undefined && longitude === undefined && !isDraggingMap) {
                 setRotation(MAP_ROTATION);
            }
        }, [latitude, longitude, isDraggingMap]);

        const projection = geoOrthographic()
            .scale(90)
            .translate([100, 100])
            .rotate(rotation)
            .clipAngle(90);

        const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
            if (interactionMode === 'pan') {
                setIsDraggingMap(true);
                lastMousePosRef.current = { x: event.clientX, y: event.clientY };
                if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
            } else if (interactionMode === 'place') {
                 const div = event.currentTarget;
                 const rect = div.getBoundingClientRect();
                 const x = event.clientX - rect.left;
                 const y = event.clientY - rect.top;
                 const clickedCoords = projection.invert?.([x, y]);
                 if (clickedCoords && !isNaN(clickedCoords[0]) && !isNaN(clickedCoords[1])) {
                     onMapClick({ lon: clickedCoords[0], lat: clickedCoords[1] });
                 }
            }
        };
        const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
            if (interactionMode === 'pan' && isDraggingMap && lastMousePosRef.current) {
                const dx = event.clientX - lastMousePosRef.current.x;
                const dy = event.clientY - lastMousePosRef.current.y;
                const sensitivity = 0.35;
                setRotation(prev => [ prev[0] + dx * sensitivity, prev[1] - dy * sensitivity, prev[2] ]);
                lastMousePosRef.current = { x: event.clientX, y: event.clientY };
            }
        };
        const handleMouseUpOrLeave = () => {
            if (interactionMode === 'pan' && isDraggingMap) {
                setIsDraggingMap(false);
                lastMousePosRef.current = null;
                if (containerRef.current) containerRef.current.style.cursor = 'grab';
            }
        };

        const cursorStyle = interactionMode === 'pan' ? (isDraggingMap ? 'grabbing' : 'grab') : 'pointer';

        return (
            <div ref={containerRef} className="mt-2 border border-albor-bg-dark rounded overflow-hidden relative aspect-square max-w-[200px] mx-auto" title={interactionMode === 'place' ? "Click map to set coordinates" : "Drag map to rotate"} style={{ cursor: cursorStyle }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUpOrLeave} onMouseLeave={handleMouseUpOrLeave} >
                 {/* Restore the map children */}
                <ComposableMap projection={projection} width={200} height={200} style={{ width: "100%", height: "100%", pointerEvents: interactionMode === 'pan' ? 'none' : 'auto' }} >
                    <defs> <radialGradient id="map-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"> <stop offset="0%" stopColor="var(--color-albor-bg-dark)" stopOpacity="0.8" /> <stop offset="100%" stopColor="var(--color-albor-deep-space)" stopOpacity="0.5" /> </radialGradient> </defs>
                    <circle cx={100} cy={100} r={90} fill="url(#map-gradient)" stroke="var(--color-albor-dark-gray)" strokeWidth={0.5} />
                    <Geographies geography={geoUrl}>
                      {({ geographies }) => geographies.map(geo => (
                        <Geography key={geo.rsmKey} geography={geo} fill="var(--color-albor-dark-gray)" stroke="var(--color-albor-bg-dark)" strokeWidth={0.3} style={{ opacity: 0.4 }} />
                      ))}
                    </Geographies>
                    {latitude !== undefined && longitude !== undefined && (
                      <Marker coordinates={[longitude, latitude]}>
                        <circle r={3} fill="var(--color-albor-orange)" stroke="white" strokeWidth={0.5} />
                      </Marker>
                    )}
                </ComposableMap>
                <div className="absolute bottom-1 right-1 text-[9px] text-albor-dark-gray/50 bg-albor-deep-space/50 px-1 rounded"> {interactionMode === 'place' ? 'Click to set' : 'Drag to rotate'} </div>
            </div>
        );
    };

    const OrbitParamsDisplay: React.FC<{ params: CalculatedOrbitParams }> = ({ params }) => {
        if (params.error) { return <div className="mt-2 p-2 border border-red-500/50 bg-red-500/10 rounded text-xs text-red-400">Error: {params.error}</div>; }
        if (!params.period && !params.apogee && !params.perigee && !params.meanMotion) { return <div className="mt-2 p-2 border border-dashed border-albor-dark-gray/50 rounded text-center text-albor-dark-gray text-xs">Enter valid TLE or Keplerian data to calculate parameters.</div>; }
        return ( <div className="mt-2 space-y-1 text-xs border border-albor-bg-dark p-2 rounded"> <h5 className="text-xs font-semibold text-albor-dark-gray mb-1">Calculated Orbit Parameters:</h5> {params.period !== undefined && <div><span className="text-albor-dark-gray">Period:</span> <span className="text-albor-light-gray font-medium">{params.period.toFixed(2)} min</span></div>} {params.apogee !== undefined && <div><span className="text-albor-dark-gray">Apogee:</span> <span className="text-albor-light-gray font-medium">{params.apogee.toFixed(0)} km</span></div>} {params.perigee !== undefined && <div><span className="text-albor-dark-gray">Perigee:</span> <span className="text-albor-light-gray font-medium">{params.perigee.toFixed(0)} km</span></div>} {params.meanMotion !== undefined && <div><span className="text-albor-dark-gray">Mean Motion:</span> <span className="text-albor-light-gray font-medium">{params.meanMotion.toFixed(4)} rev/day</span></div>} </div> );
    };

    const InfoBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div className="flex items-start space-x-1.5 mt-3 p-2 bg-albor-deep-space/40 rounded border border-albor-bg-dark">
            <Info size={16} className="text-albor-dark-gray mt-0.5 flex-shrink-0"/>
            <p className="text-albor-dark-gray text-xs">{children}</p>
        </div>
    );

    const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ selectedNode, scenarioType, onNodeUpdate }) => {
      const [nodeData, setNodeData] = useState<Partial<CustomNodeData>>({});
      const [orbitInputType, setOrbitInputType] = useState<'tle' | 'keplerian'>('tle');
      const [orbitParams, setOrbitParams] = useState<CalculatedOrbitParams>({});
      const [mapInteractionMode, setMapInteractionMode] = useState<MapInteraction>('place');

      const calculateOrbitParams = useCallback((tleString?: string, keplerian?: KeplerianElements, inputType?: 'tle' | 'keplerian'): CalculatedOrbitParams => {
        console.log(`DEBUG: Calculating orbit params. Input type: ${inputType}, TLE provided: ${!!tleString}, Keplerian provided: ${!!keplerian}`);
        let satrec: satellite.SatRec | null = null;
        let errorMsg: string | undefined = undefined;
        let calculatedParams: Partial<CalculatedOrbitParams> = {};

        try {
            if (inputType === 'tle' && tleString) {
                const lines = tleString.trim().split('\n');
                if (lines.length >= 2) {
                    const line1 = lines[0].trim();
                    const line2 = lines[1].trim();
                    if (line1.length > 68 && line2.length > 68 && line1.startsWith('1 ') && line2.startsWith('2 ')) {
                         satrec = satellite.twoline2satrec(line1, line2);
                         if (satrec.error > 0) {
                            errorMsg = `TLE parsing error: ${satellite.getErrStr(satrec.error) || `Code ${satrec.error}`}`;
                            console.error("DEBUG: TLE Error - ", errorMsg);
                            satrec = null;
                         } else { console.log("DEBUG: TLE parsed successfully."); }
                    } else { errorMsg = "Invalid TLE format (check line length/start)."; }
                } else if (tleString.trim() !== '') { errorMsg = "Incomplete TLE data (requires 2 lines)."; }
            }
            else if (inputType === 'keplerian' && keplerian) {
                const { semiMajorAxis: a_km, eccentricity: e, inclination: i_deg } = keplerian;
                if (a_km !== undefined && e !== undefined && i_deg !== undefined &&
                    a_km > EARTH_RADIUS_KM && e >= 0 && e < 1 && i_deg >= 0 && i_deg <= 180)
                {
                    const a_m = a_km * 1000;
                    const n_rad_per_sec = Math.sqrt(GM * 1e9 / Math.pow(a_m, 3));
                    calculatedParams = {
                        period: (2 * Math.PI / n_rad_per_sec) / 60,
                        apogee: (a_km * (1 + e)) - EARTH_RADIUS_KM,
                        perigee: (a_km * (1 - e)) - EARTH_RADIUS_KM,
                        meanMotion: n_rad_per_sec * (86400 / (2 * Math.PI)),
                    };
                     console.log("DEBUG: Keplerian params calculated:", calculatedParams);
                } else if (Object.values(keplerian).some(v => v !== undefined && v !== '')) {
                    errorMsg = "Incomplete or invalid Keplerian elements (Requires valid SMA > Earth Radius, Eccentricity [0,1), Inclination [0,180]).";
                }
            }
        } catch (e: any) {
            errorMsg = `Error during orbit calculation: ${e.message || 'Unknown error'}`;
            console.error("DEBUG: Calculation Exception - ", e);
            satrec = null;
        }

        if (satrec && !errorMsg) {
            try {
                const meanMotion_rad_min = satrec.no_kozai;
                const a_km = Math.cbrt(GM / Math.pow(meanMotion_rad_min / 60, 2));
                const e = satrec.ecco;
                calculatedParams = {
                    period: (2 * Math.PI) / meanMotion_rad_min,
                    apogee: (a_km * (1 + e)) - EARTH_RADIUS_KM,
                    perigee: (a_km * (1 - e)) - EARTH_RADIUS_KM,
                    meanMotion: meanMotion_rad_min * (1440 / (2 * Math.PI)),
                };
                 console.log("DEBUG: TLE-derived params calculated:", calculatedParams);
            } catch (e: any) {
                 errorMsg = `Error calculating params from TLE: ${e.message || 'Unknown error'}`;
                 console.error("DEBUG: TLE Param Calculation Exception - ", e);
            }
        }

        if (errorMsg) {
            console.log("DEBUG: Orbit calculation resulted in error:", errorMsg);
            return { error: errorMsg };
        } else if (Object.keys(calculatedParams).length > 0) {
            return calculatedParams;
        } else {
            console.log("DEBUG: No orbit parameters calculated (no valid input).");
            return {};
        }
      }, []);

      useEffect(() => {
        console.log("DEBUG: NodeConfigPanel useEffect for selectedNode change", selectedNode?.id);
        const data = selectedNode?.data || {};
        setNodeData(data);
        setMapInteractionMode('place');
        if (selectedNode?.data?.type === 'SAT') {
            const initialInputType = (data.keplerian && Object.values(data.keplerian).some(v => v !== undefined && v !== '')) ? 'keplerian' : 'tle';
            setOrbitInputType(initialInputType);
            const params = calculateOrbitParams(data.tle, data.keplerian, initialInputType);
            setOrbitParams(params);
        } else {
            setOrbitInputType('tle');
            setOrbitParams({});
        }
      }, [selectedNode, calculateOrbitParams]);

      useEffect(() => {
        console.log("DEBUG: NodeConfigPanel useEffect for data/type change", selectedNode?.id);
        if (selectedNode?.data?.type === 'SAT') {
            const params = calculateOrbitParams(nodeData.tle, nodeData.keplerian, orbitInputType);
            setOrbitParams(params);
        } else {
            setOrbitParams({});
        }
      }, [nodeData.tle, nodeData.keplerian, orbitInputType, selectedNode?.data?.type, calculateOrbitParams]);


      const handleUpdate = useCallback((field: keyof CustomNodeData, value: any) => {
        if (!selectedNode) return;
        let processedValue = value;
        if ((field === 'latitude' || field === 'longitude' || field === 'altitude') && value === '') {
            processedValue = undefined;
        } else if (field === 'latitude' || field === 'longitude' || field === 'altitude') {
            processedValue = parseFloat(value);
            if (isNaN(processedValue)) processedValue = undefined;
        }
        const updates = { [field]: processedValue };
        setNodeData(prev => ({ ...prev, ...updates }));
        onNodeUpdate(selectedNode.id, updates);
      }, [selectedNode, onNodeUpdate]);

       const handleKeplerianUpdate = useCallback((field: keyof KeplerianElements, value: string) => {
        if (!selectedNode) return;
        const numericValue = value.trim() === '' ? undefined : parseFloat(value);
        const currentKeplerian = nodeData.keplerian || {};
        const updatedKeplerian = { ...currentKeplerian, [field]: numericValue };
        Object.keys(updatedKeplerian).forEach(keyStr => {
            const key = keyStr as keyof KeplerianElements;
            if (updatedKeplerian[key] === undefined) { delete updatedKeplerian[key]; }
        });
        const updates = { keplerian: Object.keys(updatedKeplerian).length > 0 ? updatedKeplerian : undefined };
        setNodeData(prev => ({ ...prev, ...updates }));
        onNodeUpdate(selectedNode.id, updates);
      }, [selectedNode, onNodeUpdate, nodeData.keplerian]);

      const handleMapClick = useCallback((coords: { lat: number; lon: number }) => {
          if (!selectedNode || (selectedNode.data.type !== 'GS' && selectedNode.data.type !== 'UE')) return;
          const updates = { latitude: coords.lat, longitude: coords.lon };
          setNodeData(prev => ({ ...prev, ...updates }));
          onNodeUpdate(selectedNode.id, updates);
      }, [selectedNode, onNodeUpdate]);

      const handleSave = useCallback(() => {}, []);

      const getNodeIcon = (type: CustomNodeData['type'] | undefined) => {
        if (!type) return <Settings size={16} className="text-albor-orange"/>;
        switch (type) {
          case 'SAT': return <Satellite size={16} className="text-albor-orange"/>;
          case 'GS': return <RadioTower size={16} className="text-albor-orange"/>;
          case 'UE': return <Smartphone size={16} className="text-albor-orange"/>;
          default: return <Settings size={16} className="text-albor-orange"/>;
        }
      };

      const renderCustomConfig = () => (
        <>
          <ConfigInput id={`nodeName-${selectedNode?.id}`} label="Node Name" value={nodeData.name} onChange={(val) => handleUpdate('name', val)} onSave={handleSave} />
          <div> <span className="text-albor-dark-gray text-xs">Type:</span> <span className="ml-2 text-albor-light-gray text-xs">{nodeData.type}</span> </div>
          <div> <span className="text-albor-dark-gray text-xs">ID:</span> <span className="ml-2 text-albor-light-gray font-mono text-xs break-all">{selectedNode?.id}</span> </div>
          <div> <span className="text-albor-dark-gray text-xs">Position (Canvas):</span> <span className="ml-2 text-albor-light-gray text-xs"> X: {selectedNode?.position.x.toFixed(0)}, Y: {selectedNode?.position.y.toFixed(0)} </span> </div>
          <hr className="border-albor-bg-dark my-2"/>
          <InfoBox>
             In <strong>Custom</strong> mode, node positions are determined by their placement on the canvas. Links must be created manually by dragging between node handles.
          </InfoBox>
        </>
      );

      const renderRealisticConfig = () => {
        if (!selectedNode) return null;
        switch (selectedNode.data.type) {
          case 'SAT':
            return ( <> <ConfigInput id={`nodeName-${selectedNode.id}`} label="Satellite Name" value={nodeData.name} onChange={(val) => handleUpdate('name', val)} onSave={handleSave} /> <div className="my-3"> <label className="block text-albor-dark-gray mb-1 text-xs">Orbit Definition</label> <div className="flex items-center border border-albor-dark-gray rounded text-xs"> <button onClick={() => setOrbitInputType('tle')} className={`flex-1 px-2 py-1 rounded-l transition-colors ${orbitInputType === 'tle' ? 'bg-albor-orange/80 text-white' : 'bg-albor-bg-dark text-albor-dark-gray hover:bg-albor-bg-dark/70 hover:text-albor-light-gray'}`}>TLE</button> <button onClick={() => setOrbitInputType('keplerian')} className={`flex-1 px-2 py-1 rounded-r transition-colors ${orbitInputType === 'keplerian' ? 'bg-albor-orange/80 text-white' : 'bg-albor-bg-dark text-albor-dark-gray hover:bg-albor-bg-dark/70 hover:text-albor-light-gray'}`}>Keplerian</button> </div> </div> {orbitInputType === 'tle' ? ( <ConfigInput id={`nodeTLE-${selectedNode.id}`} label="TLE Data (2-Line Format)" value={nodeData.tle} onChange={(val) => handleUpdate('tle', val)} onSave={handleSave} type="textarea" rows={3} placeholder="Paste TLE here..." /> ) : ( <div className="space-y-2 border border-albor-bg-dark p-2 rounded"> <h5 className="text-xs font-semibold text-albor-dark-gray mb-1">Keplerian Elements</h5> <div className="grid grid-cols-2 gap-x-2 gap-y-1"> <ConfigInput id={`kepSMA-${selectedNode.id}`} label="Semi-Major Axis (km)" value={nodeData.keplerian?.semiMajorAxis} onChange={(val) => handleKeplerianUpdate('semiMajorAxis', val)} onSave={handleSave} type="number" step="any" placeholder="e.g., 6971" /> <ConfigInput id={`kepEcc-${selectedNode.id}`} label="Eccentricity" value={nodeData.keplerian?.eccentricity} onChange={(val) => handleKeplerianUpdate('eccentricity', val)} onSave={handleSave} type="number" step="any" min="0" max="1" placeholder="e.g., 0.001"/> <ConfigInput id={`kepInc-${selectedNode.id}`} label="Inclination (°)" value={nodeData.keplerian?.inclination} onChange={(val) => handleKeplerianUpdate('inclination', val)} onSave={handleSave} type="number" step="any" placeholder="e.g., 51.6"/> <ConfigInput id={`kepRaan-${selectedNode.id}`} label="RAAN (°)" value={nodeData.keplerian?.raan} onChange={(val) => handleKeplerianUpdate('raan', val)} onSave={handleSave} type="number" step="any" placeholder="e.g., 270"/> <ConfigInput id={`kepArgP-${selectedNode.id}`} label="Arg. of Perigee (°)" value={nodeData.keplerian?.argPerigee} onChange={(val) => handleKeplerianUpdate('argPerigee', val)} onSave={handleSave} type="number" step="any" placeholder="e.g., 90"/> <ConfigInput id={`kepTA-${selectedNode.id}`} label="True Anomaly (°)" value={nodeData.keplerian?.trueAnomaly} onChange={(val) => handleKeplerianUpdate('trueAnomaly', val)} onSave={handleSave} type="number" step="any" placeholder="e.g., 0"/> </div> </div> )} <OrbitParamsDisplay params={orbitParams} /> <hr className="border-albor-bg-dark my-3"/> <InfoBox> In <strong>Realistic</strong> mode, satellite orbits are defined by TLE or Keplerian elements. Canvas position is ignored. Links are calculated automatically based on visibility. </InfoBox> </> );
          case 'GS': case 'UE':
            const nodeTypeName = selectedNode.data.type === 'GS' ? 'Ground Station' : 'User Terminal';
            return ( <> <ConfigInput id={`nodeName-${selectedNode.id}`} label={`${nodeTypeName} Name`} value={nodeData.name} onChange={(val) => handleUpdate('name', val)} onSave={handleSave} /> <hr className="border-albor-bg-dark my-3"/> <div className="flex justify-between items-center mb-1"> <h5 className="text-xs font-semibold text-albor-dark-gray">Geographic Position</h5> <button onClick={() => setMapInteractionMode(prev => prev === 'place' ? 'pan' : 'place')} title={mapInteractionMode === 'place' ? 'Switch to Pan/Rotate Map' : 'Switch to Place Marker'} className={`p-1 rounded transition-colors ${mapInteractionMode === 'pan' ? 'bg-albor-orange/20 text-albor-orange' : 'text-albor-dark-gray hover:bg-albor-bg-dark/50 hover:text-albor-light-gray'}`} > <Hand size={14} /> </button> </div> <div className="grid grid-cols-2 gap-x-2 gap-y-1"> <ConfigInput id={`nodeLat-${selectedNode.id}`} label="Latitude (°)" value={nodeData.latitude} onChange={(val) => handleUpdate('latitude', val)} onSave={handleSave} type="number" step="any" min="-90" max="90" placeholder="e.g., 40.4"/> <ConfigInput id={`nodeLon-${selectedNode.id}`} label="Longitude (°)" value={nodeData.longitude} onChange={(val) => handleUpdate('longitude', val)} onSave={handleSave} type="number" step="any" min="-180" max="180" placeholder="e.g., -3.7"/> </div> <ConfigInput id={`nodeAlt-${selectedNode.id}`} label="Altitude (m, ASL)" value={nodeData.altitude} onChange={(val) => handleUpdate('altitude', val)} onSave={handleSave} type="number" step="any" placeholder="e.g., 667"/> <MapPreview latitude={nodeData.latitude} longitude={nodeData.longitude} onMapClick={handleMapClick} interactionMode={mapInteractionMode} /> <hr className="border-albor-bg-dark my-3"/> <InfoBox> In <strong>Realistic</strong> mode, ground asset positions are defined by Latitude/Longitude/Altitude. Canvas position is ignored. Links are calculated automatically based on visibility. </InfoBox> </> );
          default: return <p className="text-albor-dark-gray italic text-xs">Unsupported node type for realistic configuration.</p>;
        }
      };

      if (!selectedNode) {
        return <div className="p-4 text-center text-xs text-albor-dark-gray italic">Select a node to configure.</div>;
      }

      return (
        <div className="flex-1 space-y-3 overflow-y-auto p-1">
          <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-albor-bg-dark flex-shrink-0">
            {getNodeIcon(selectedNode.data.type)}
            <h3 className="text-sm font-semibold text-albor-light-gray truncate" title={nodeData.name || 'Unnamed Node'}>
              {nodeData.name || 'Unnamed Node'}
            </h3>
             <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${scenarioType === 'realistic' ? 'bg-blue-500/30 text-blue-300' : 'bg-purple-500/30 text-purple-300'}`}>
                {scenarioType === 'realistic' ? 'REALISTIC' : 'CUSTOM'}
             </span>
          </div>
          {scenarioType === 'custom' ? renderCustomConfig() : renderRealisticConfig()}
        </div>
      );
    };

    // Ensure the default export is present
    export default NodeConfigPanel;
