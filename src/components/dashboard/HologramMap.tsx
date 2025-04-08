import React, { useState, useEffect, useRef, useCallback } from 'react';
    import {
      ComposableMap,
      Geographies,
      Geography,
      Graticule,
      ZoomableGroup,
      Marker,
    } from 'react-simple-maps';
    import { geoOrthographic, geoPath, geoCircle } from 'd3-geo'; // Import d3-geo functions
    import { Satellite, RadioTower, Smartphone } from 'lucide-react'; // Icons for markers

    // GeoJSON data for world map (can be fetched or imported)
    const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

    // --- Types ---
    type NodeType = 'SAT' | 'GS' | 'UE';

    interface MapMarker {
      id: string;
      name: string;
      type: NodeType;
      coordinates: [number, number]; // [longitude, latitude]
      status?: 'ok' | 'warning' | 'error'; // Optional status for coloring
      footprintRadius?: number; // Optional radius in degrees for satellite footprint
    }

    // --- Dummy Data ---
    const dummyMarkers: MapMarker[] = [
      { id: 'sat-leo-1', name: 'Sat-LEO-01', type: 'SAT', coordinates: [-50, 45], footprintRadius: 15 }, // Over Atlantic
      { id: 'sat-leo-2', name: 'Sat-LEO-02', type: 'SAT', coordinates: [10, 50], footprintRadius: 15 }, // Over Europe
      { id: 'sat-geo-1', name: 'Sat-GEO-01', type: 'SAT', coordinates: [-70, 0], footprintRadius: 40 }, // Geostationary over S. America
      { id: 'gs-madrid', name: 'GS-Madrid', type: 'GS', coordinates: [-3.7, 40.4] }, // Madrid
      { id: 'gs-svalbard', name: 'GS-Svalbard', type: 'GS', coordinates: [15.6, 78.2] }, // Svalbard
      { id: 'ue-mobile-a', name: 'UE-Mobile-A', type: 'UE', coordinates: [-74, 40.7] }, // New York
      { id: 'ue-fixed-b', name: 'UE-Fixed-B', type: 'UE', coordinates: [139.7, 35.7] }, // Tokyo
    ];

    // --- Component ---
    const HologramMap: React.FC = () => {
      const [rotation, setRotation] = useState<[number, number, number]>([0, -30, 0]); // Initial rotation [lambda, phi, gamma]
      const [markers, setMarkers] = useState<MapMarker[]>(dummyMarkers);
      const mapContainerRef = useRef<HTMLDivElement>(null);
      const [dimensions, setDimensions] = useState({ width: 800, height: 600 }); // Default dimensions

      // Update dimensions on resize
      useEffect(() => {
        const updateSize = () => {
          if (mapContainerRef.current) {
            // Ensure dimensions are positive
            const width = Math.max(1, mapContainerRef.current.offsetWidth);
            const height = Math.max(1, mapContainerRef.current.offsetHeight);
            setDimensions({ width, height });
          }
        };
        window.addEventListener('resize', updateSize);
        updateSize(); // Initial size
        return () => window.removeEventListener('resize', updateSize);
      }, []);


      // Auto-rotate effect
      useEffect(() => {
        const interval = setInterval(() => {
          setRotation(prev => [prev[0] + 0.3, prev[1], prev[2]]); // Rotate lambda (longitude)
        }, 50); // Adjust speed as needed
        return () => clearInterval(interval);
      }, []);

      // Projection setup using d3-geo
      const projection = geoOrthographic()
        .scale(Math.max(1, Math.min(dimensions.width, dimensions.height) / 2 - 10)) // Ensure scale is positive
        .translate([dimensions.width / 2, dimensions.height / 2])
        .rotate(rotation)
        .clipAngle(90); // Only show front hemisphere

      // Path generator for footprints
      const pathGenerator = geoPath().projection(projection);

      // Function to generate footprint circle GeoJSON
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

      return (
        <div ref={mapContainerRef} className="w-full h-full relative">
          {/* Render map only when dimensions are valid */}
          {dimensions.width > 0 && dimensions.height > 0 && (
            <ComposableMap
              projection={projection} // Pass the d3 projection object here
              width={dimensions.width}
              height={dimensions.height}
              projectionConfig={{
                rotate: rotation, // Keep rotation config if needed by ComposableMap
                scale: Math.max(1, Math.min(dimensions.width, dimensions.height) / 2 - 10) // Ensure scale is positive
              }}
              style={{ width: "100%", height: "100%" }}
              className="hologram-map"
            >
              {/* Define gradients and filters */}
              <defs>
                <radialGradient id="footprint-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" style={{ stopColor: 'var(--color-hologram-accent)', stopOpacity: 0.5 }} />
                  <stop offset="60%" style={{ stopColor: 'var(--color-hologram-accent)', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--color-hologram-blue)', stopOpacity: 0.05 }} />
                </radialGradient>
                {/* Optional: Glow filter */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Graticule (Grid Lines) - Removed explicit projection prop */}
              <g className="graticule-group">
                <Graticule
                  stroke="var(--color-hologram-blue-dark)"
                  strokeWidth={0.3}
                  step={[15, 15]} // Grid line spacing
                  className="graticule-line"
                 />
                 {/* Draw Equator separately for emphasis - Use pathGenerator */}
                 <path
                   d={pathGenerator({ type: 'LineString', coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]] }) || undefined}
                   className="graticule-line equator"
                 />
              </g>

              {/* World Geographies */}
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      // No explicit projection needed here either
                      className="world-path"
                      // style={{ filter: 'url(#glow)' }} // Apply glow filter
                    />
                  ))
                }
              </Geographies>

               {/* Satellite Footprints */}
               <g className="footprints-group">
                 {markers
                   .filter(m => m.type === 'SAT' && m.footprintRadius)
                   .map(marker => {
                     const footprintGeoJson = generateFootprint(marker.coordinates[0], marker.coordinates[1], marker.footprintRadius!);
                     const pathData = pathGenerator(footprintGeoJson);
                     // Only render if pathData is generated (i.e., footprint is visible)
                     return pathData ? (
                       <path
                         key={`${marker.id}-footprint`}
                         d={pathData}
                         className="satellite-footprint"
                       />
                     ) : null;
                   })}
               </g>

              {/* Markers */}
              <g className="markers-group">
                {markers.map(marker => {
                  // Use the projection from ComposableMap context for markers
                  return (
                    <Marker key={marker.id} coordinates={marker.coordinates}>
                      {/* Use a group for easier hover effects */}
                      <g className="marker" transform="translate(0, -5)"> {/* Offset slightly above point */}
                        <circle r={6} className="marker-bg" />
                        {getMarkerIcon(marker.type)}
                        {/* Optional: Tooltip on hover */}
                        <title>{`${marker.name} (${marker.type})\nCoords: ${marker.coordinates[1].toFixed(2)}°, ${marker.coordinates[0].toFixed(2)}°`}</title>
                      </g>
                    </Marker>
                  );
                })}
              </g>
            </ComposableMap>
          )}
        </div>
      );
    };

    export default HologramMap;
