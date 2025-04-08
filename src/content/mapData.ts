// Define and export shared types related to map markers
export type NodeType = 'SAT' | 'GS' | 'UE';

export interface MapMarker {
  id: string;
  name: string;
  type: NodeType;
  coordinates: [number, number];
  status?: 'ok' | 'warning' | 'error';
  footprintRadius?: number;
  initialCoords?: [number, number];
  orbitSpeed?: number;
  // SAT specific
  altitude?: number; // km
  inclination?: number; // degrees
  signalStrength?: number; // dBm
  // GS/UE specific (example)
  locationName?: string;
  connectionStatus?: string;
}

// Export the dummyMarkers constant
export const dummyMarkers: MapMarker[] = [
  { id: 'sat-leo-1', name: 'Sat-LEO-01', type: 'SAT', coordinates: [-50, 45], initialCoords: [-50, 45], footprintRadius: 15, orbitSpeed: 0.05, altitude: 550, inclination: 53, signalStrength: -95 },
  { id: 'sat-leo-2', name: 'Sat-LEO-02', type: 'SAT', coordinates: [10, 50], initialCoords: [10, 50], footprintRadius: 15, orbitSpeed: 0.06, altitude: 550, inclination: 53, signalStrength: -98 },
  { id: 'sat-geo-1', name: 'Sat-GEO-01', type: 'SAT', coordinates: [-70, 0], initialCoords: [-70, 0], footprintRadius: 40, orbitSpeed: 0.01, altitude: 35786, inclination: 0, signalStrength: -85 },
  { id: 'gs-madrid', name: 'GS-Madrid', type: 'GS', coordinates: [-3.7, 40.4], locationName: 'Madrid, Spain', connectionStatus: 'Stable' },
  { id: 'gs-svalbard', name: 'GS-Svalbard', type: 'GS', coordinates: [15.6, 78.2], locationName: 'Svalbard, Norway', connectionStatus: 'Intermittent' },
  { id: 'ue-mobile-a', name: 'UE-Mobile-A', type: 'UE', coordinates: [-74, 40.7], locationName: 'New York, USA', connectionStatus: 'Connected (Sat-LEO-01)' },
  { id: 'ue-fixed-b', name: 'UE-Fixed-B', type: 'UE', coordinates: [139.7, 35.7], locationName: 'Tokyo, Japan', connectionStatus: 'Connected (Sat-GEO-01)' },
];
