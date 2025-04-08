import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
    import {
      ComposableMap,
      Geographies,
      Geography,
      Graticule,
      Marker,
    } from 'react-simple-maps';
    import { geoOrthographic, geoPath, geoCircle } from 'd3-geo';
    import { Satellite, RadioTower, Smartphone, Pause, Play } from 'lucide-react';
    import MarkerInfoCard from './MarkerInfoCard';
    // Import types and data from the content file
    import { MapMarker, NodeType, dummyMarkers } from '../../content/mapData';
    // Removed scenarioSystemSummaryData import as filtering is now direct

    const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

    // Keep LayerVisibility here as it's specific to this component's state/props
    export interface LayerVisibility {
        footprints: boolean;
        countries: boolean;
        satellites: boolean;
        groundStations: boolean;
        userTerminals: boolean;
    }

    interface HologramMapProps {
      layerVisibility: LayerVisibility;
      isMaximized: boolean;
      scenarioId: string | null; // Null for global view
    }

    // Removed getMarkerScenarioId helper

    const HologramMap: React.FC<HologramMapProps> = ({ layerVisibility, isMaximized, scenarioId }) => {
      const [rotation, setRotation] = useState<[number, number, number]>([0, -30, 0]);
      // Use the imported dummyMarkers for the initial state
      const [markers, setMarkers] = useState<MapMarker[]>(dummyMarkers);
      const mapContainerRef = useRef<HTMLDivElement>(null);
      const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
      const [isRotating, setIsRotating] = useState(true);
      const [isDragging, setIsDragging] = useState(false);
      const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null);
      const animationFrameRef = useRef<number>();
      const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

       // Update dimensions on resize
      useEffect(() => {
        const updateSize = () => {
          if (mapContainerRef.current) {
            const width = Math.max(1, mapContainerRef.current.offsetWidth);
            const height = Math.max(1, mapContainerRef.current.offsetHeight);
            setDimensions({ width, height });
          }
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
      }, []);

      // Animation loop
      useEffect(() => {
        const animate = () => {
          if (isRotating && !isDragging) {
            setRotation(prev => [prev[0] + 0.15, prev[1], prev[2]]);
          }

          // Update marker positions (keep this logic)
          setMarkers(prevMarkers =>
            prevMarkers.map(marker => {
              if (marker.type === 'SAT' && marker.orbitSpeed) {
                let newLon = marker.coordinates[0] + marker.orbitSpeed;
                if (newLon > 180) newLon -= 360;
                if (newLon < -180) newLon += 360;
                let newLat = marker.coordinates[1];
                if (marker.initialCoords && marker.id !== 'sat-geo-1') {
                   const timeFactor = Date.now() * 0.0001 * (marker.orbitSpeed || 0.05) * 5;
                   newLat = marker.initialCoords[1] + Math.sin(timeFactor + marker.initialCoords[0]) * 2;
                }
                return { ...marker, coordinates: [newLon, newLat] };
              }
              return marker;
            })
          );

          animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };
      }, [isRotating, isDragging]);


      const projection = geoOrthographic()
        .scale(Math.max(1, Math.min(dimensions.width, dimensions.height) / 2 - 10))
        .translate([dimensions.width / 2, dimensions.height / 2])
        .rotate(rotation)
        .clipAngle(90);

      const pathGenerator = geoPath().projection(projection);

      const generateFootprint = useCallback((lon: number, lat: number, radius: number) => {
        const circleGenerator = geoCircle().center([lon, lat]).radius(radius);
        return circleGenerator();
      }, []);

      const getMarkerIcon = (type: NodeType) => {
        switch (type) {
          case 'SAT': return <Satellite size={10} className="marker-icon" />;
          case 'GS': return <RadioTower size={10} className="marker-icon" />;
          case 'UE': return <Smartphone size={10} className="marker-icon" />;
          default: return null;
        }
      };

      const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        if (!isRotating && !target.closest('.info-card-container, .map-controls')) {
          setIsDragging(true);
          setLastMousePos({ x: event.clientX, y: event.clientY });
        }
      };

      const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging && lastMousePos) {
          const dx = event.clientX - lastMousePos.x;
          const dy = event.clientY - lastMousePos.y;
          const sensitivity = 0.25;
          setRotation(prev => [
            prev[0] + dx * sensitivity,
            prev[1] - dy * sensitivity,
            prev[2]
          ]);
          setLastMousePos({ x: event.clientX, y: event.clientY });
        }
      };

      const handleMouseUpOrLeave = () => {
        if (isDragging) {
          setIsDragging(false);
          setLastMousePos(null);
        }
      };

      const toggleRotation = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRotating(!isRotating);
        if (!isRotating) {
            setIsDragging(false);
            setLastMousePos(null);
        }
      };

      const handleMarkerClick = (marker: MapMarker, event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedMarker(marker);
      };

      const closeInfoCard = () => {
        setSelectedMarker(null);
      };

      // --- UPDATED: Filter markers based on scenarioId using marker.scenarioId ---
      const filteredMarkers = useMemo(() => {
        if (scenarioId === null) {
            // Show all markers + markers explicitly marked as global (scenarioId === null)
            return markers;
        }
        // Filter markers based on the scenario mapping
        return markers.filter(marker => marker.scenarioId === scenarioId);
      }, [markers, scenarioId]);
      // --- End Update ---

      // Filter the component's state `markers`, not the imported `dummyMarkers`
      // --- UPDATED: Use filteredMarkers for visibility check ---
      const visibleMarkers = filteredMarkers.filter(marker => {
        if (marker.type === 'SAT') return layerVisibility.satellites;
        if (marker.type === 'GS') return layerVisibility.groundStations;
        if (marker.type === 'UE') return layerVisibility.userTerminals;
        return false;
      });
      // --- End Update ---

      return (
        <div
          ref={mapContainerRef}
          className="w-full h-full relative overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          style={{ cursor: isDragging ? 'grabbing' : (isRotating ? 'default' : 'grab') }}
        >
          <div className="map-controls absolute top-2 right-2 z-10">
            <button
              onClick={toggleRotation}
              className="p-1.5 rounded bg-albor-bg-dark/60 backdrop-blur-sm text-albor-light-gray hover:bg-albor-orange/80 transition-colors shadow-md"
              title={isRotating ? "Pause Rotation" : "Resume Rotation"}
            >
              {isRotating ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>

          {dimensions.width > 0 && dimensions.height > 0 && (
            <ComposableMap
              projection={projection}
              width={dimensions.width}
              height={dimensions.height}
              projectionConfig={{
                rotate: rotation,
                scale: Math.max(1, Math.min(dimensions.width, dimensions.height) / 2 - 10)
              }}
              style={{ width: "100%", height: "100%" }}
              className="hologram-map"
            >
              {/* ... defs, graticule, geographies ... */}
               <defs>
                <radialGradient id="footprint-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" style={{ stopColor: 'var(--color-hologram-accent)', stopOpacity: 0.5 }} />
                  <stop offset="60%" style={{ stopColor: 'var(--color-hologram-accent)', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--color-hologram-blue)', stopOpacity: 0.05 }} />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <g className="graticule-group">
                <Graticule
                  stroke="var(--color-hologram-blue-dark)"
                  strokeWidth={0.3}
                  step={[15, 15]}
                  className="graticule-line"
                />
                <path
                  d={pathGenerator({ type: 'LineString', coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]] }) || undefined}
                  className="graticule-line equator"
                />
              </g>

              {layerVisibility.countries && (
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        className="world-path"
                      />
                    ))
                  }
                </Geographies>
              )}


               {/* Render footprints based on component's state `markers` */}
               {/* --- UPDATED: Use filteredMarkers for footprints --- */}
               {layerVisibility.footprints && layerVisibility.satellites && (
                 <g className="footprints-group">
                   {filteredMarkers // Use filteredMarkers
                     .filter(m => m.type === 'SAT' && m.footprintRadius)
                     .map(marker => {
                       const footprintGeoJson = generateFootprint(marker.coordinates[0], marker.coordinates[1], marker.footprintRadius!);
                       const pathData = pathGenerator(footprintGeoJson);
                       return pathData ? (
                         <path
                           key={`${marker.id}-footprint`}
                           d={pathData}
                           className="satellite-footprint"
                         />
                       ) : null;
                     })}
                 </g>
               )}
               {/* --- End Update --- */}

              {/* Render markers based on `visibleMarkers` */}
              <g className="markers-group">
                {visibleMarkers.map(marker => (
                  <Marker
                    key={marker.id}
                    coordinates={marker.coordinates}
                    onClick={(e) => handleMarkerClick(marker, e)}
                  >
                    <g className="marker" transform="translate(0, -5)">
                      <circle r={6} className="marker-bg" />
                      {getMarkerIcon(marker.type)}
                      <title>{`${marker.name} (${marker.type})\nCoords: ${marker.coordinates[1].toFixed(2)}°, ${marker.coordinates[0].toFixed(2)}°`}</title>
                    </g>
                  </Marker>
                ))}
              </g>
            </ComposableMap>
          )}

          {selectedMarker && (
            <MarkerInfoCard
              marker={selectedMarker}
              onClose={closeInfoCard}
              isMaximized={isMaximized}
            />
          )}
        </div>
      );
    };

    export default HologramMap;
