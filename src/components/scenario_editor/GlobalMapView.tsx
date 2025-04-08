import React from 'react';
      import { ComposableMap, Geographies, Geography, Marker, Graticule } from 'react-simple-maps';
      import { RadioTower, Smartphone } from 'lucide-react';
      import { ScenarioNode } from './types'; // Import ScenarioNode type

      const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

      interface GlobalMapViewProps {
        nodes: ScenarioNode[]; // Receive the filtered nodes (GS/UE with coords)
      }

      const GlobalMapView: React.FC<GlobalMapViewProps> = ({ nodes }) => {
        return (
          <div className="w-full h-full bg-albor-deep-space/50 p-1 relative overflow-hidden">
             <h4 className="absolute top-1 left-2 text-[10px] font-semibold text-albor-dark-gray uppercase tracking-wider z-10">Global Placement</h4>
            <ComposableMap
              projection="geoEquirectangular" // Flat map projection
              projectionConfig={{
                scale: 60, // Adjust scale for sidebar view
                center: [0, 0], // Center the map
              }}
              width={400} // Adjust width/height as needed for the container
              height={180}
              style={{ width: "100%", height: "100%" }}
              className="global-map-view" // Add class for styling
            >
              {/* Optional: Add a subtle background gradient or pattern */}
              <rect width="100%" height="100%" fill="url(#globalMapGradient)" />
              <defs>
                <linearGradient id="globalMapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'var(--color-albor-bg-dark)', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--color-albor-deep-space)', stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>

              {/* Graticule lines */}
              <Graticule
                stroke="var(--color-albor-dark-gray)"
                strokeWidth={0.2}
                step={[30, 30]}
                className="global-map-graticule"
              />
              <Graticule
                 stroke="var(--color-albor-dark-gray)"
                 strokeWidth={0.3}
                 step={[90, 90]} // Major lines
                 className="global-map-graticule-major"
              />

              {/* World Geographies */}
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      className="global-map-land" // Class for land styling
                    />
                  ))
                }
              </Geographies>

              {/* Markers for Nodes */}
              {nodes.map(node => {
                // Ensure coordinates exist before rendering marker
                if (node.data.latitude === undefined || node.data.longitude === undefined) {
                  return null;
                }
                const markerCoords: [number, number] = [node.data.longitude, node.data.latitude];
                const nodeType = node.data.type;
                const nodeName = node.data.name;

                return (
                  <Marker key={node.id} coordinates={markerCoords}>
                    <g className="global-map-marker" transform="translate(0, 0)">
                      {nodeType === 'GS' && <RadioTower size={6} className="global-map-marker-icon gs" />}
                      {nodeType === 'UE' && <Smartphone size={5} className="global-map-marker-icon ue" />}
                      {/* Fallback or default icon */}
                      {!['GS', 'UE'].includes(nodeType) && <circle r={2} className="global-map-marker-icon default" />}
                      <title>{`${nodeName} (${nodeType})\n${markerCoords[1].toFixed(2)}°, ${markerCoords[0].toFixed(2)}°`}</title>
                    </g>
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>
        );
      };

      export default GlobalMapView;
