import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import { Settings, Satellite, RadioTower, Smartphone, MapPin, Orbit, Edit2, Check, X, HelpCircle, Hand } from 'lucide-react'; // Import Hand
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { geoOrthographic, geoPath } from 'd3-geo'; // Use for map projection
import * as satellite from 'satellite.js'; // Import satellite.js

import { ScenarioNode, CustomNodeData, ScenarioType, KeplerianElements } from './types'; // Import types

// --- Constants ---
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const MAP_ROTATION: [number, number, number] = [-10, -40, 0]; // Initial map rotation

// --- Interfaces ---
interface NodeConfigSidebarProps {
  selectedNode: ScenarioNode | null;
  scenarioType: ScenarioType;
  onNodeUpdate: (nodeId: string, updates: Partial<CustomNodeData>) => void;
}

interface CalculatedOrbitParams {
    period?: number; // minutes
    apogee?: number; // km above Earth surface
    perigee?: number; // km above Earth surface
    meanMotion?: number; // revs per day
    error?: string; // To display parsing/calculation errors
}

// --- Helper Components ---

// Input Component (No changes needed)
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

// Map Preview Component (Updated for Pan/Place Mode)
type MapInteraction = 'place' | 'pan';
interface MapPreviewProps {
    latitude?: number;
    longitude?: number;
    onMapClick: (coords: { lat: number; lon: number }) => void;
    interactionMode: MapInteraction; // Receive interaction mode
}
const MapPreview: React.FC<MapPreviewProps> =
    ({ latitude, longitude, onMapClick, interactionMode }) => {
    const [rotation, setRotation] = useState<[number, number, number]>(MAP_ROTATION);
    const [isDraggingMap, setIsDraggingMap] = useState(false);
    const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null); // Ref for the container div

    // Center map on marker ONLY when lat/lon props change externally
    // DO NOT reset rotation after panning (isDraggingMap is removed from dependencies)
    useEffect(() => {
        if (latitude !== undefined && longitude !== undefined) {
            // Only update rotation if the coordinates actually changed
            // This prevents resetting after a pan operation finishes
            setRotation(prevRotation => {
                const newRotation: [number, number, number] = [-longitude, -latitude, 0];
                // Check if rotation actually needs update to avoid unnecessary re-renders
                if (newRotation[0] !== prevRotation[0] || newRotation[1] !== prevRotation[1]) {
                    return newRotation;
                }
                return prevRotation;
            });
        } else {
            // Reset to default if coordinates become undefined (e.g., node deselected)
             setRotation(MAP_ROTATION);
        }
    }, [latitude, longitude]); // Only depend on external lat/lon props

    const projection = geoOrthographic()
        .scale(90) // Smaller scale for sidebar
        .translate([100, 100]) // Center in a 200x200 box
        .rotate(rotation)
        .clipAngle(90);

    // Handle click for placing marker (only in 'place' mode)
    const handleMapInteraction = (event: React.MouseEvent<SVGSVGElement>) => {
        if (interactionMode !== 'place') return; // Only place in 'place' mode

        const svg = event.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedCoords = projection.invert?.([x, y]); // Use optional chaining

        if (clickedCoords && !isNaN(clickedCoords[0]) && !isNaN(clickedCoords[1])) {
            onMapClick({ lon: clickedCoords[0], lat: clickedCoords[1] });
        }
    };

    // --- Handlers for Pan Mode ---
    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (interactionMode === 'pan') {
            setIsDraggingMap(true);
            lastMousePosRef.current = { x: event.clientX, y: event.clientY };
            if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
        }
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (interactionMode === 'pan' && isDraggingMap && lastMousePosRef.current) {
            const dx = event.clientX - lastMousePosRef.current.x;
            const dy = event.clientY - lastMousePosRef.current.y;
            const sensitivity = 0.35; // Adjust sensitivity for sidebar map
            setRotation(prev => [
                prev[0] + dx * sensitivity,
                prev[1] - dy * sensitivity,
                prev[2]
            ]);
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
    // --- End Pan Handlers ---

    const cursorStyle = interactionMode === 'pan'
        ? (isDraggingMap ? 'grabbing' : 'grab')
        : 'pointer';

    return (
        <div
            ref={containerRef}
            className="mt-2 border border-albor-bg-dark rounded overflow-hidden relative aspect-square max-w-[200px] mx-auto"
            title={interactionMode === 'place' ? "Click map to set coordinates" : "Drag map to rotate"}
            style={{ cursor: cursorStyle }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave} // Handle leaving the div while dragging
        >
            <ComposableMap
                projection={projection}
                width={200}
                height={200}
                style={{ width: "100%", height: "100%" }}
                onClick={handleMapInteraction} // This now only works in 'place' mode
            >
                {/* ... defs, circle, geographies ... (no changes needed here) */}
                <defs>
                    <radialGradient id="map-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="var(--color-albor-bg-dark)" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="var(--color-albor-deep-space)" stopOpacity="0.5" />
                    </radialGradient>
                </defs>
                <circle cx={100} cy={100} r={90} fill="url(#map-gradient)" stroke="var(--color-albor-dark-gray)" strokeWidth={0.5} />
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map(geo => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="var(--color-albor-dark-gray)"
                                stroke="var(--color-albor-bg-dark)"
                                strokeWidth={0.3}
                                style={{ opacity: 0.4 }}
                            />
                        ))
                    }
                </Geographies>
                {latitude !== undefined && longitude !== undefined && (
                    <Marker coordinates={[longitude, latitude]}>
                        <circle r={3} fill="var(--color-albor-orange)" stroke="white" strokeWidth={0.5} />
                    </Marker>
                )}
            </ComposableMap>
            <div className="absolute bottom-1 right-1 text-[9px] text-albor-dark-gray/50 bg-albor-deep-space/50 px-1 rounded">
                {interactionMode === 'place' ? 'Click to set' : 'Drag to rotate'}
            </div>
        </div>
    );
};

// Orbit Parameters Display Component (No changes needed)
const OrbitParamsDisplay: React.FC<{ params: CalculatedOrbitParams }> = ({ params }) => {
    if (params.error) {
        return <div className="mt-2 p-2 border border-red-500/50 bg-red-500/10 rounded text-xs text-red-400">{params.error}</div>;
    }
    if (!params.period && !params.apogee && !params.perigee) {
        return <div className="mt-2 p-2 border border-dashed border-albor-dark-gray/50 rounded text-center text-albor-dark-gray text-xs">Enter valid TLE or Keplerian data to calculate parameters.</div>;
    }
    return (
        <div className="mt-2 space-y-1 text-xs border border-albor-bg-dark p-2 rounded">
            <h5 className="text-xs font-semibold text-albor-dark-gray mb-1">Calculated Orbit Parameters:</h5>
            {params.period !== undefined && <div><span className="text-albor-dark-gray">Period:</span> <span className="text-albor-light-gray font-medium">{params.period.toFixed(2)} min</span></div>}
            {params.apogee !== undefined && <div><span className="text-albor-dark-gray">Apogee:</span> <span className="text-albor-light-gray font-medium">{params.apogee.toFixed(0)} km</span></div>}
            {params.perigee !== undefined && <div><span className="text-albor-dark-gray">Perigee:</span> <span className="text-albor-light-gray font-medium">{params.perigee.toFixed(0)} km</span></div>}
            {params.meanMotion !== undefined && <div><span className="text-albor-dark-gray">Mean Motion:</span> <span className="text-albor-light-gray font-medium">{params.meanMotion.toFixed(4)} rev/day</span></div>}
        </div>
    );
};


// --- Main Sidebar Component ---
const NodeConfigSidebar: React.FC<NodeConfigSidebarProps> = ({ selectedNode, scenarioType, onNodeUpdate }) => {
  const [nodeData, setNodeData] = useState<Partial<CustomNodeData>>({});
  const [orbitInputType, setOrbitInputType] = useState<'tle' | 'keplerian'>('tle');
  const [orbitParams, setOrbitParams] = useState<CalculatedOrbitParams>({}); // State for calculated params
  const [mapInteractionMode, setMapInteractionMode] = useState<MapInteraction>('place'); // State for map interaction

  // --- Effects ---

  // Update local state when selected node changes
  useEffect(() => {
    const data = selectedNode?.data || {};
    setNodeData(data);
    setMapInteractionMode('place'); // Reset map mode on node change
    // Reset orbit type preference and calculated params
    if (selectedNode?.data?.type !== 'SAT') {
        setOrbitInputType('tle');
        setOrbitParams({});
    } else {
        // Prefer showing existing data type
        if (data.keplerian && Object.values(data.keplerian).some(v => v !== undefined)) {
            setOrbitInputType('keplerian');
        } else {
            setOrbitInputType('tle');
        }
        // Calculate params on node change
        calculateOrbitParams(data.tle, data.keplerian);
    }
  }, [selectedNode]); // Dependency: selectedNode

  // Recalculate orbit params when TLE or Keplerian data changes in local state
  useEffect(() => {
    if (selectedNode?.data?.type === 'SAT') {
        calculateOrbitParams(nodeData.tle, nodeData.keplerian);
    } else {
        setOrbitParams({}); // Clear params if not a satellite
    }
  }, [nodeData.tle, nodeData.keplerian, selectedNode?.data?.type]); // Dependencies: local nodeData TLE/Keplerian


  // --- Calculation Logic (No changes needed) ---
  const calculateOrbitParams = useCallback((tleString?: string, keplerian?: KeplerianElements) => {
    const GM = 398600.4418; // Earth's gravitational constant km³/s²
    const EARTH_RADIUS_KM = 6371.0; // Mean Earth radius

    let satrec: satellite.SatRec | null = null;
    let errorMsg: string | undefined = undefined;
    let calculatedParams: Partial<CalculatedOrbitParams> = {};

    try {
        // --- TLE Parsing ---
        if (orbitInputType === 'tle' && tleString) {
            const lines = tleString.trim().split('\n');
            if (lines.length >= 2) {
                // Basic TLE format check (very basic)
                if (lines[0].trim().length > 20 && lines[1].trim().length > 60) {
                     satrec = satellite.twoline2satrec(lines[0].trim(), lines[1].trim());
                     if (satrec.error > 0) {
                         errorMsg = `TLE parsing error code: ${satrec.error}`;
                         satrec = null; // Invalidate satrec on error
                     }
                } else {
                    errorMsg = "Invalid TLE format.";
                }
            } else if (tleString.trim() !== '') {
                 errorMsg = "Incomplete TLE data (requires 2 lines).";
            }
        }
        // --- Keplerian Calculation ---
        else if (orbitInputType === 'keplerian' && keplerian) {
            const { semiMajorAxis: a, eccentricity: e, inclination: i } = keplerian;
            // Check if essential elements are present and valid
            if (a !== undefined && e !== undefined && i !== undefined && a > EARTH_RADIUS_KM && e >= 0 && e < 1) {
                const n_rad_per_sec = Math.sqrt(GM / Math.pow(a, 3)); // Mean motion in rad/sec
                const period_min = (2 * Math.PI / n_rad_per_sec) / 60;
                const apogee_alt = (a * (1 + e)) - EARTH_RADIUS_KM;
                const perigee_alt = (a * (1 - e)) - EARTH_RADIUS_KM;
                const meanMotion_rev_day = n_rad_per_sec * (86400 / (2 * Math.PI)); // Convert rad/sec to rev/day

                calculatedParams = {
                    period: period_min,
                    apogee: apogee_alt,
                    perigee: perigee_alt,
                    meanMotion: meanMotion_rev_day,
                };
                // Note: satellite.js doesn't easily convert Keplerian to full satrec for propagation
                // We calculate basic params directly.
            } else if (Object.values(keplerian).some(v => v !== undefined && v !== '')) {
                errorMsg = "Incomplete or invalid Keplerian elements for calculation (requires valid SMA > Earth Radius, Eccentricity [0,1), Inclination).";
            }
        }
    } catch (e: any) {
        console.error("Error parsing orbit data:", e);
        errorMsg = `Error parsing orbit data: ${e.message || 'Unknown error'}`;
        satrec = null; // Ensure satrec is null on error
    }

    // --- Calculate from satrec (if TLE was valid) ---
    if (satrec && !errorMsg) {
        // satellite.js stores mean motion (no_kozai) in radians per minute
        const meanMotion_rad_min = satrec.no_kozai;
        const period_min = (2 * Math.PI) / meanMotion_rad_min;
        const meanMotion_rev_day = meanMotion_rad_min * (1440 / (2 * Math.PI)); // Convert rad/min to rev/day

        // Calculate semi-major axis 'a' from mean motion 'n' (in rad/sec)
        // n (rad/sec) = meanMotion_rad_min / 60
        // a = (GM / n^2)^(1/3)
        const a = Math.cbrt(GM / Math.pow(meanMotion_rad_min / 60, 2));
        const e = satrec.ecco;
        const apogee_alt = (a * (1 + e)) - EARTH_RADIUS_KM;
        const perigee_alt = (a * (1 - e)) - EARTH_RADIUS_KM;

        calculatedParams = {
            period: period_min,
            apogee: apogee_alt,
            perigee: perigee_alt,
            meanMotion: meanMotion_rev_day,
        };
    }

    // --- Set final state ---
    if (errorMsg) {
        setOrbitParams({ error: errorMsg });
    } else if (Object.keys(calculatedParams).length > 0) {
        setOrbitParams(calculatedParams);
    } else {
        // Clear params if no valid data and no error message (e.g., empty inputs)
        setOrbitParams({});
    }

  }, [orbitInputType]); // Dependency: orbitInputType


  // --- Update Handlers (No changes needed) ---
  const handleUpdate = useCallback((field: keyof CustomNodeData, value: any) => {
    if (!selectedNode) return;
    // Special handling for numeric fields that might be cleared
    let processedValue = value;
    if ((field === 'latitude' || field === 'longitude' || field === 'altitude') && value === '') {
        processedValue = undefined;
    } else if (field === 'latitude' || field === 'longitude' || field === 'altitude') {
        processedValue = parseFloat(value);
        if (isNaN(processedValue)) processedValue = undefined; // Ensure NaN becomes undefined
    }

    const updates = { [field]: processedValue };
    setNodeData(prev => ({ ...prev, ...updates })); // Update local state immediately
    onNodeUpdate(selectedNode.id, updates); // Propagate valid updates
  }, [selectedNode, onNodeUpdate]);

   const handleKeplerianUpdate = useCallback((field: keyof KeplerianElements, value: string) => {
    if (!selectedNode) return;
    const numericValue = value === '' ? undefined : parseFloat(value);
    const currentKeplerian = nodeData.keplerian || {};
    const updatedKeplerian = { ...currentKeplerian, [field]: numericValue };

    // Clean up undefined fields
    Object.keys(updatedKeplerian).forEach(key => {
        if (updatedKeplerian[key as keyof KeplerianElements] === undefined) {
            delete updatedKeplerian[key as keyof KeplerianElements];
        }
    });

    const updates = { keplerian: Object.keys(updatedKeplerian).length > 0 ? updatedKeplerian : undefined };
    setNodeData(prev => ({ ...prev, ...updates })); // Update local state
    onNodeUpdate(selectedNode.id, updates); // Propagate
  }, [selectedNode, onNodeUpdate, nodeData.keplerian]);

  // Handle map click for GS/UE (now passed from MapPreview)
  const handleMapClick = useCallback((coords: { lat: number; lon: number }) => {
      if (!selectedNode || (selectedNode.data.type !== 'GS' && selectedNode.data.type !== 'UE')) return;
      console.log("Map clicked coords:", coords);
      const updates = { latitude: coords.lat, longitude: coords.lon };
      setNodeData(prev => ({ ...prev, ...updates })); // Update local state first
      onNodeUpdate(selectedNode.id, updates); // Propagate changes
  }, [selectedNode, onNodeUpdate]);


  // --- Render Logic ---
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
      <ConfigInput
        id={`nodeName-${selectedNode?.id}`}
        label="Node Name"
        value={nodeData.name}
        onChange={(val) => handleUpdate('name', val)}
        onSave={() => {}} // Save is triggered by onBlur/Enter in ConfigInput
      />
      <div>
        <span className="text-albor-dark-gray text-xs">Type:</span>
        <span className="ml-2 text-albor-light-gray text-xs">{nodeData.type}</span>
      </div>
      <div>
        <span className="text-albor-dark-gray text-xs">ID:</span>
        <span className="ml-2 text-albor-light-gray font-mono text-xs">{selectedNode?.id}</span>
      </div>
      <div>
        <span className="text-albor-dark-gray text-xs">Position (Canvas):</span>
        <span className="ml-2 text-albor-light-gray text-xs">
          X: {selectedNode?.position.x.toFixed(0)}, Y: {selectedNode?.position.y.toFixed(0)}
        </span>
      </div>
      <hr className="border-albor-bg-dark my-2"/>
      <p className="text-albor-dark-gray italic text-xs">
        (Custom scenario: Position nodes freely and create links manually on the canvas.)
      </p>
    </>
  );

  const renderRealisticConfig = () => {
    if (!selectedNode) return null;

    switch (selectedNode.data.type) {
      case 'SAT':
        return (
          <>
            <ConfigInput id={`nodeName-${selectedNode.id}`} label="Satellite Name" value={nodeData.name} onChange={(val) => handleUpdate('name', val)} onSave={() => {}} />
             <div className="my-3">
                <label className="block text-albor-dark-gray mb-1 text-xs">Orbit Definition</label>
                <div className="flex items-center border border-albor-dark-gray rounded text-xs">
                    <button onClick={() => setOrbitInputType('tle')} className={`flex-1 px-2 py-1 rounded-l transition-colors ${orbitInputType === 'tle' ? 'bg-albor-orange/80 text-white' : 'bg-albor-bg-dark text-albor-dark-gray hover:bg-albor-bg-dark/70 hover:text-albor-light-gray'}`}>TLE</button>
                    <button onClick={() => setOrbitInputType('keplerian')} className={`flex-1 px-2 py-1 rounded-r transition-colors ${orbitInputType === 'keplerian' ? 'bg-albor-orange/80 text-white' : 'bg-albor-bg-dark text-albor-dark-gray hover:bg-albor-bg-dark/70 hover:text-albor-light-gray'}`}>Keplerian</button>
                </div>
             </div>
            {orbitInputType === 'tle' ? (
              <ConfigInput id={`nodeTLE-${selectedNode.id}`} label="TLE Data (2-Line Format)" value={nodeData.tle} onChange={(val) => handleUpdate('tle', val)} onSave={() => {}} type="textarea" rows={3} placeholder="Paste TLE here..." />
            ) : (
              <div className="space-y-2 border border-albor-bg-dark p-2 rounded">
                <h5 className="text-xs font-semibold text-albor-dark-gray mb-1">Keplerian Elements</h5>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                   <ConfigInput id={`kepSMA-${selectedNode.id}`} label="Semi-Major Axis (km)" value={nodeData.keplerian?.semiMajorAxis} onChange={(val) => handleKeplerianUpdate('semiMajorAxis', val)} onSave={() => {}} type="number" step="any" placeholder="e.g., 6971" />
                   <ConfigInput id={`kepEcc-${selectedNode.id}`} label="Eccentricity" value={nodeData.keplerian?.eccentricity} onChange={(val) => handleKeplerianUpdate('eccentricity', val)} onSave={() => {}} type="number" step="any" min="0" max="1" placeholder="e.g., 0.001"/>
                   <ConfigInput id={`kepInc-${selectedNode.id}`} label="Inclination (°)" value={nodeData.keplerian?.inclination} onChange={(val) => handleKeplerianUpdate('inclination', val)} onSave={() => {}} type="number" step="any" placeholder="e.g., 51.6"/>
                   <ConfigInput id={`kepRaan-${selectedNode.id}`} label="RAAN (°)" value={nodeData.keplerian?.raan} onChange={(val) => handleKeplerianUpdate('raan', val)} onSave={() => {}} type="number" step="any" placeholder="e.g., 270"/>
                   <ConfigInput id={`kepArgP-${selectedNode.id}`} label="Arg. of Perigee (°)" value={nodeData.keplerian?.argPerigee} onChange={(val) => handleKeplerianUpdate('argPerigee', val)} onSave={() => {}} type="number" step="any" placeholder="e.g., 90"/>
                   <ConfigInput id={`kepTA-${selectedNode.id}`} label="True Anomaly (°)" value={nodeData.keplerian?.trueAnomaly} onChange={(val) => handleKeplerianUpdate('trueAnomaly', val)} onSave={() => {}} type="number" step="any" placeholder="e.g., 0"/>
                </div>
              </div>
            )}
            {/* Display Calculated Orbit Params */}
            <OrbitParamsDisplay params={orbitParams} />
            <hr className="border-albor-bg-dark my-3"/>
             <p className="text-albor-dark-gray italic text-xs"> (Realistic scenario: Orbit defined by TLE/Keplerian. Canvas position ignored.) </p>
          </>
        );
      case 'GS':
      case 'UE':
        const nodeTypeName = selectedNode.data.type === 'GS' ? 'Ground Station' : 'User Terminal';
        return (
          <>
            <ConfigInput id={`nodeName-${selectedNode.id}`} label={`${nodeTypeName} Name`} value={nodeData.name} onChange={(val) => handleUpdate('name', val)} onSave={() => {}} />
            <hr className="border-albor-bg-dark my-3"/>
            <div className="flex justify-between items-center mb-1">
                <h5 className="text-xs font-semibold text-albor-dark-gray">Geographic Position</h5>
                {/* Map Interaction Mode Toggle Button */}
                <button
                    onClick={() => setMapInteractionMode(prev => prev === 'place' ? 'pan' : 'place')}
                    title={mapInteractionMode === 'place' ? 'Switch to Pan/Rotate Map' : 'Switch to Place Marker'}
                    className={`p-1 rounded transition-colors ${mapInteractionMode === 'pan' ? 'bg-albor-orange/20 text-albor-orange' : 'text-albor-dark-gray hover:bg-albor-bg-dark/50 hover:text-albor-light-gray'}`}
                >
                    <Hand size={14} />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <ConfigInput id={`nodeLat-${selectedNode.id}`} label="Latitude (°)" value={nodeData.latitude} onChange={(val) => handleUpdate('latitude', val)} onSave={() => {}} type="number" step="any" min="-90" max="90" placeholder="e.g., 40.4"/>
                <ConfigInput id={`nodeLon-${selectedNode.id}`} label="Longitude (°)" value={nodeData.longitude} onChange={(val) => handleUpdate('longitude', val)} onSave={() => {}} type="number" step="any" min="-180" max="180" placeholder="e.g., -3.7"/>
            </div>
             <ConfigInput id={`nodeAlt-${selectedNode.id}`} label="Altitude (m, optional)" value={nodeData.altitude} onChange={(val) => handleUpdate('altitude', val)} onSave={() => {}} type="number" step="any" placeholder="e.g., 667"/>
            {/* Map Preview - Pass interaction mode */}
            <MapPreview
                latitude={nodeData.latitude}
                longitude={nodeData.longitude}
                onMapClick={handleMapClick}
                interactionMode={mapInteractionMode} // Pass the mode state
            />
            <hr className="border-albor-bg-dark my-3"/>
            <p className="text-albor-dark-gray italic text-xs"> (Realistic scenario: Position defined by Lat/Lon. Canvas position ignored.) </p>
          </>
        );
      default:
        return <p className="text-albor-dark-gray italic text-xs">Unsupported node type for realistic configuration.</p>;
    }
  };

  // --- Main Render ---
  if (!selectedNode) {
    return (
      <div className="w-64 bg-albor-bg-dark/50 border-l border-albor-bg-dark p-4 flex flex-col flex-shrink-0">
        <div className="flex items-center space-x-2 mb-4">
          <Settings size={16} className="text-albor-orange"/>
          <h3 className="text-sm font-semibold text-albor-light-gray">Configuration</h3>
        </div>
        <p className="text-xs text-albor-dark-gray italic text-center mt-4 flex-1 flex items-center justify-center">
          Select a node on the canvas to configure its properties.
        </p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-albor-bg-dark/50 border-l border-albor-bg-dark p-3 flex flex-col flex-shrink-0 overflow-y-auto">
      <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-albor-bg-dark flex-shrink-0">
        {getNodeIcon(selectedNode.data.type)}
        <h3 className="text-sm font-semibold text-albor-light-gray truncate" title={nodeData.name || 'Unnamed Node'}>
          {nodeData.name || 'Unnamed Node'}
        </h3>
      </div>
      <div className="space-y-3 flex-1">
        {scenarioType === 'custom' ? renderCustomConfig() : renderRealisticConfig()}
      </div>
    </div>
  );
};

export default NodeConfigSidebar;
