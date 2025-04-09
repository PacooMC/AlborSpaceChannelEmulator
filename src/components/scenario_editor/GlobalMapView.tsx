import React, { useRef, useEffect, useState, useCallback } from 'react';
            import { ComposableMap, Geographies, Geography, Marker, Graticule } from 'react-simple-maps';
            import { geoOrthographic, geoPath, GeoPath, GeoPermissibleObjects } from 'd3-geo'; // Import GeoPath, GeoPermissibleObjects
            // *** ADDED Satellite icon ***
            import { RadioTower, Smartphone, Satellite, Play, Pause, Plus, Minus, RotateCcw } from 'lucide-react'; // Import icons
            // *** Import necessary types ***
            import { ScenarioNode, ScenarioType, MovementPatternType, LinearMovementParams, CircularPathParams, StaticParams } from './types'; // Added StaticParams

            const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
            const ROTATION_SPEED_STEP = 0.05;
            const MIN_ROTATION_SPEED = 0.05;
            const MAX_ROTATION_SPEED = 0.5;

            interface GlobalMapViewProps {
              nodes: ScenarioNode[]; // Receive ALL nodes
              scenarioType: ScenarioType; // *** ADDED: Receive scenario type ***
            }

            const GlobalMapView: React.FC<GlobalMapViewProps> = ({ nodes, scenarioType }) => {
              const containerRef = useRef<HTMLDivElement>(null);
              const [dimensions, setDimensions] = useState({ width: 200, height: 200 }); // Initial guess
              const [rotation, setRotation] = useState<[number, number, number]>([-10, -40, 0]); // Default rotation
              const [isRotating, setIsRotating] = useState(true); // Auto-rotate by default
              const [rotationSpeed, setRotationSpeed] = useState(0.1); // Initial speed
              const [isDragging, setIsDragging] = useState(false);
              const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
              const animationFrameRef = useRef<number>();

              // Filter nodes for map display (GS/UE with coords OR custom nodes with movement paths)
              const mapNodes = nodes.filter(node =>
                  (node.data.latitude !== undefined && node.data.longitude !== undefined) || // GS/UE in realistic OR static in custom
                  (scenarioType === 'custom' && node.data.movementPattern && node.data.movementParams) // Custom nodes with movement
              );

              // Update dimensions on resize
              useEffect(() => {
                const updateSize = () => {
                  if (containerRef.current) {
                    // Use the smaller dimension for scale calculation
                    const size = Math.min(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
                    setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
                  }
                };
                const resizeObserver = new ResizeObserver(updateSize);
                if (containerRef.current) {
                    resizeObserver.observe(containerRef.current);
                    updateSize(); // Initial size
                }
                return () => resizeObserver.disconnect();
              }, []);

               // Animation loop for rotation
               useEffect(() => {
                 const animate = () => {
                   if (isRotating && !isDragging) {
                     setRotation(prev => [prev[0] + rotationSpeed, prev[1], prev[2]]);
                   }
                   animationFrameRef.current = requestAnimationFrame(animate);
                 };
                 animationFrameRef.current = requestAnimationFrame(animate);
                 return () => {
                   if (animationFrameRef.current) {
                     cancelAnimationFrame(animationFrameRef.current);
                   }
                 };
               }, [isRotating, isDragging, rotationSpeed]);

              const projection = geoOrthographic()
                // Scale based on the smaller dimension
                .scale(Math.max(1, Math.min(dimensions.width, dimensions.height) / 2 - 10))
                .translate([dimensions.width / 2, dimensions.height / 2])
                .rotate(rotation)
                .clipAngle(90);

              // *** Create a geoPath generator ***
              const pathGenerator: GeoPath<any, GeoPermissibleObjects> = geoPath().projection(projection);

              // --- Interaction Handlers ---
              const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
                  // Allow dragging only on the map area, not controls
                  if ((event.target as HTMLElement).closest('.map-controls')) return;
                  setIsDragging(true);
                  lastMousePosRef.current = { x: event.clientX, y: event.clientY };
                  if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
              };
              const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
                  if (isDragging && lastMousePosRef.current) {
                      const dx = event.clientX - lastMousePosRef.current.x;
                      const dy = event.clientY - lastMousePosRef.current.y;
                      const sensitivity = 0.25; // Adjust sensitivity as needed
                      setRotation(prev => [ prev[0] + dx * sensitivity, prev[1] - dy * sensitivity, prev[2] ]);
                      lastMousePosRef.current = { x: event.clientX, y: event.clientY };
                  }
              };
              const handleMouseUpOrLeave = () => {
                  if (isDragging) {
                      setIsDragging(false);
                      lastMousePosRef.current = null;
                      if (containerRef.current) containerRef.current.style.cursor = 'grab';
                  }
              };

              // --- Control Button Handlers ---
              const toggleRotation = () => setIsRotating(!isRotating);
              const increaseSpeed = () => setRotationSpeed(prev => Math.min(MAX_ROTATION_SPEED, prev + ROTATION_SPEED_STEP));
              const decreaseSpeed = () => setRotationSpeed(prev => Math.max(MIN_ROTATION_SPEED, prev - ROTATION_SPEED_STEP));
              const resetRotation = () => setRotation([-10, -40, 0]); // Reset to default

              return (
                <div
                    ref={containerRef}
                    className="w-full h-full bg-albor-deep-space/70 relative overflow-hidden border border-albor-bg-dark/50 rounded-sm cursor-grab" // Grab cursor by default
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                >
                   {/* Updated Title */}
                   <h4 className="absolute top-1 left-2 text-[10px] font-semibold text-albor-dark-gray uppercase tracking-wider z-10 bg-albor-deep-space/50 px-1 rounded">Placement Map</h4>

                   {/* Map Controls Overlay */}
                   <div className="map-controls absolute bottom-2 left-2 z-10 flex items-center space-x-1 bg-albor-bg-dark/60 backdrop-blur-sm p-1 rounded-md shadow">
                        <button onClick={toggleRotation} title={isRotating ? "Pause Rotation" : "Resume Rotation"} className="p-1 rounded hover:bg-albor-orange/20 text-albor-light-gray hover:text-albor-orange transition-colors">
                            {isRotating ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button onClick={decreaseSpeed} title="Decrease Speed" className="p-1 rounded hover:bg-albor-orange/20 text-albor-light-gray hover:text-albor-orange transition-colors" disabled={rotationSpeed <= MIN_ROTATION_SPEED}>
                            <Minus size={14} />
                        </button>
                         <span className="text-xs text-albor-light-gray font-mono w-8 text-center" title="Current Speed">{rotationSpeed.toFixed(2)}</span>
                        <button onClick={increaseSpeed} title="Increase Speed" className="p-1 rounded hover:bg-albor-orange/20 text-albor-light-gray hover:text-albor-orange transition-colors" disabled={rotationSpeed >= MAX_ROTATION_SPEED}>
                            <Plus size={14} />
                        </button>
                         <button onClick={resetRotation} title="Reset View" className="p-1 rounded hover:bg-albor-orange/20 text-albor-light-gray hover:text-albor-orange transition-colors ml-1">
                            <RotateCcw size={14} />
                        </button>
                   </div>

                   {dimensions.width > 0 && dimensions.height > 0 && (
                      <ComposableMap
                        projection={projection}
                        width={dimensions.width} // Use dynamic width
                        height={dimensions.height} // Use dynamic height
                        style={{ width: "100%", height: "100%" }}
                        className="global-map-view" // Add class for styling
                      >
                        {/* Optional: Add a subtle background gradient or pattern */}
                        <defs>
                          <radialGradient id="globalMapGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" style={{ stopColor: 'var(--color-albor-bg-dark)', stopOpacity: 0.6 }} />
                            <stop offset="100%" style={{ stopColor: 'var(--color-albor-deep-space)', stopOpacity: 0.8 }} />
                          </radialGradient>
                        </defs>
                         {/* Globe Background Circle */}
                         <circle
                            cx={dimensions.width / 2}
                            cy={dimensions.height / 2}
                            r={Math.max(1, Math.min(dimensions.width, dimensions.height) / 2 - 10)} // Match projection scale
                            fill="url(#globalMapGradient)"
                            stroke="var(--color-albor-dark-gray)"
                            strokeWidth={0.3}
                         />

                        {/* Graticule lines */}
                        <Graticule
                          stroke="var(--color-albor-dark-gray)"
                          strokeWidth={0.2} // Thinner lines
                          step={[30, 30]}
                          className="global-map-graticule"
                        />

                        {/* World Geographies */}
                        <Geographies geography={geoUrl}>
                          {({ geographies }) =>
                            geographies.map(geo => (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                className="global-map-land" // Class for land styling
                                style={{
                                    // Style land features
                                    fill: "var(--color-albor-dark-gray)",
                                    stroke: "var(--color-albor-bg-dark)",
                                    strokeWidth: 0.2,
                                    opacity: 0.3,
                                }}
                              />
                            ))
                          }
                        </Geographies>

                        {/* *** Draw Custom Movement Paths *** */}
                        {scenarioType === 'custom' && mapNodes.map(node => {
                            const pattern = node.data.movementPattern;
                            const params = node.data.movementParams;
                            if (!params || pattern === 'STATIC') return null;

                            let startCoords: [number, number] | null = null;
                            let endCoords: [number, number] | null = null;

                            if (pattern === 'LINEAR' || pattern === 'CIRCULAR_PATH') {
                                const pathParams = params as LinearMovementParams | CircularPathParams;
                                if (pathParams.startLon !== undefined && pathParams.startLat !== undefined) {
                                    startCoords = [pathParams.startLon, pathParams.startLat];
                                }
                                if (pathParams.endLon !== undefined && pathParams.endLat !== undefined) {
                                    endCoords = [pathParams.endLon, pathParams.endLat];
                                }
                            }

                            if (startCoords && endCoords) {
                                const lineData = { type: "LineString", coordinates: [startCoords, endCoords] } as const;
                                const pathD = pathGenerator(lineData);
                                if (!pathD) return null; // Don't render if path is not visible

                                return (
                                    <path
                                        key={`${node.id}-path`}
                                        d={pathD}
                                        fill="none"
                                        stroke="var(--color-hologram-blue)" // Use a different color for paths
                                        strokeWidth={0.8}
                                        strokeDasharray="3 2" // Dashed line
                                        strokeOpacity={0.7}
                                        className="custom-movement-path"
                                    />
                                );
                            }
                            return null;
                        })}

                        {/* Markers for Nodes */}
                        {mapNodes.map(node => {
                          // *** UPDATED Coordinate Prioritization Logic ***
                          let markerCoords: [number, number] | null = null;
                          const params = node.data.movementParams;
                          const pattern = node.data.movementPattern;

                          if (scenarioType === 'custom' && pattern && pattern !== 'STATIC' && params) {
                              // Prioritize movement start point in custom mode with movement
                              const pathParams = params as LinearMovementParams | CircularPathParams;
                              if (pathParams.startLon !== undefined && pathParams.startLat !== undefined) {
                                  markerCoords = [pathParams.startLon, pathParams.startLat];
                              }
                          }

                          // Fallback to static lat/lon if no movement start point or not custom movement
                          if (!markerCoords && node.data.latitude !== undefined && node.data.longitude !== undefined) {
                              markerCoords = [node.data.longitude, node.data.latitude];
                          }
                          // *** End Update ***

                          if (!markerCoords) return null; // Skip if no coordinates found

                          const nodeType = node.data.type;
                          const nodeName = node.data.name;

                          // Check if the marker is visible on the current projection
                          const projectedPoint = projection(markerCoords);
                          if (!projectedPoint) return null; // Don't render if off-globe

                          const iconSize = nodeType === 'GS' ? 8 : 7; // Larger icons
                          const circleRadius = iconSize / 2 + 1; // Slightly larger circle bg

                          return (
                            <Marker key={node.id} coordinates={markerCoords}>
                              <g className="global-map-marker" transform="translate(0, 0)">
                                 {/* Add a background circle for better visibility */}
                                 <circle r={circleRadius} fill="var(--color-albor-deep-space)" opacity="0.5"/>
                                {/* *** UPDATED Icon Rendering *** */}
                                {nodeType === 'SAT' && <Satellite size={iconSize} className="global-map-marker-icon sat" />}
                                {nodeType === 'GS' && <RadioTower size={iconSize} className="global-map-marker-icon gs" />}
                                {nodeType === 'UE' && <Smartphone size={iconSize} className="global-map-marker-icon ue" />}
                                {/* Fallback for unknown types (shouldn't happen with current types) */}
                                {!['SAT', 'GS', 'UE'].includes(nodeType) && <circle r={iconSize / 2} className="global-map-marker-icon default" />}
                                {/* *** End Update *** */}
                                <title>{`${nodeName} (${nodeType})\n${markerCoords[1].toFixed(2)}°, ${markerCoords[0].toFixed(2)}°`}</title>
                              </g>
                            </Marker>
                          );
                        })}
                      </ComposableMap>
                   )}
                </div>
              );
            };

            export default GlobalMapView;
