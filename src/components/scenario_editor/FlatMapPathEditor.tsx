import React, { useState, useEffect, useRef } from 'react'; // Import useRef
    import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
    import { geoEquirectangular } from 'd3-geo'; // Use a flat projection

    const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

    interface Point { lon: number; lat: number; }

    interface FlatMapPathEditorProps {
      startPoint?: Point | null;
      endPoint?: Point | null;
      onPointSet: (type: 'start' | 'end', point: Point) => void;
      mapWidth?: number; // Allow custom width
      mapHeight?: number; // Allow custom height
      projectionScale?: number; // Allow custom scale
    }

    const FlatMapPathEditor: React.FC<FlatMapPathEditorProps> = ({
      startPoint,
      endPoint,
      onPointSet,
      mapWidth = 200, // Default width
      mapHeight = 120, // Default height
      projectionScale = 65, // Default scale
    }) => {
      const [settingMode, setSettingMode] = useState<'start' | 'end'>('start');
      const svgRef = useRef<SVGSVGElement>(null); // Ref for the SVG element

      const projection = geoEquirectangular()
        .scale(projectionScale)
        .translate([mapWidth / 2, mapHeight / 2]); // Center based on width/height

      const handleMapClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;

        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        // Calculate click coordinates relative to the SVG container
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Use projection.invert to get geographic coordinates
        const coords = projection.invert([x, y]);

        if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
          // Clamp coordinates to valid ranges
          const lon = Math.max(-180, Math.min(180, coords[0]));
          const lat = Math.max(-90, Math.min(90, coords[1]));

          console.log(`Map clicked (${settingMode}): Lon=${lon.toFixed(2)}, Lat=${lat.toFixed(2)}`);
          onPointSet(settingMode, { lon, lat });
          // Optional: Automatically switch mode after setting a point
          // setSettingMode(prev => prev === 'start' ? 'end' : 'start');
        } else {
          console.warn("Could not invert map coordinates from click.");
        }
      };

      return (
        <div className="border border-albor-bg-dark rounded overflow-hidden relative bg-albor-deep-space/50" style={{ width: mapWidth, height: mapHeight }}>
           {/* Mode Indicator */}
           <div className="absolute top-1 left-1 z-10 bg-albor-bg-dark/70 px-1.5 py-0.5 rounded text-[10px] text-albor-light-gray pointer-events-none">
             Click map to set: <span className="font-semibold text-albor-orange">{settingMode === 'start' ? 'Start Point' : 'End Point'}</span>
           </div>

          <ComposableMap
            ref={svgRef} // Assign ref to the map component
            projection={projection}
            width={mapWidth}
            height={mapHeight}
            style={{ width: "100%", height: "100%", cursor: 'crosshair' }}
            onClick={handleMapClick} // Attach click handler to the map SVG
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="var(--color-albor-dark-gray)"
                    stroke="var(--color-albor-bg-dark)"
                    strokeWidth={0.3}
                    style={{ opacity: 0.6, pointerEvents: 'none' }} // Disable pointer events on land masses
                  />
                ))
              }
            </Geographies>

            {/* Draw Line between points */}
            {startPoint && endPoint && (
              <Line
                from={[startPoint.lon, startPoint.lat]}
                to={[endPoint.lon, endPoint.lat]}
                stroke="var(--color-albor-orange)"
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
            )}

            {/* Start Point Marker */}
            {startPoint && (
              <Marker coordinates={[startPoint.lon, startPoint.lat]}>
                <circle r={3} fill="var(--color-albor-orange)" stroke="#fff" strokeWidth={0.5} />
                <text x="5" y="3" fontSize="8" fill="#fff" style={{ pointerEvents: 'none' }}>S</text>
              </Marker>
            )}

            {/* End Point Marker */}
            {endPoint && (
              <Marker coordinates={[endPoint.lon, endPoint.lat]}>
                <circle r={3} fill="var(--color-albor-orange)" stroke="#fff" strokeWidth={0.5} />
                 <text x="5" y="3" fontSize="8" fill="#fff" style={{ pointerEvents: 'none' }}>E</text>
              </Marker>
            )}
          </ComposableMap>

           {/* Buttons to explicitly switch mode */}
           <div className="absolute bottom-1 right-1 z-10 flex space-x-1">
                <button
                    onClick={(e) => { e.stopPropagation(); setSettingMode('start'); }} // Prevent map click through
                    className={`px-1 py-0.5 rounded text-[9px] border ${settingMode === 'start' ? 'bg-albor-orange text-white border-albor-orange' : 'bg-albor-bg-dark text-albor-dark-gray border-albor-dark-gray hover:border-albor-light-gray'}`}
                >
                    Set Start
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setSettingMode('end'); }} // Prevent map click through
                    className={`px-1 py-0.5 rounded text-[9px] border ${settingMode === 'end' ? 'bg-albor-orange text-white border-albor-orange' : 'bg-albor-bg-dark text-albor-dark-gray border-albor-dark-gray hover:border-albor-light-gray'}`}
                >
                    Set End
                </button>
           </div>
        </div>
      );
    };

    export default FlatMapPathEditor;
