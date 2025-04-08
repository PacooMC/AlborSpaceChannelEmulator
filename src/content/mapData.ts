// Define and export shared types related to map markers
    export type NodeType = 'SAT' | 'GS' | 'UE';

    export interface MapMarker {
      id: string;
      name: string;
      type: NodeType;
      coordinates: [number, number];
      scenarioId: string | null; // NEW: Explicit scenario ID (null for global/unassigned)
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

    // Export the dummyMarkers constant with scenarioId
    export const dummyMarkers: MapMarker[] = [
      // Scenario: leo-test-1
      { id: 'sat-leo-1', name: 'Sat-LEO-01', type: 'SAT', coordinates: [-50, 45], scenarioId: 'leo-test-1', initialCoords: [-50, 45], footprintRadius: 15, orbitSpeed: 0.05, altitude: 550, inclination: 53, signalStrength: -95 },
      { id: 'sat-leo-2', name: 'Sat-LEO-02', type: 'SAT', coordinates: [10, 50], scenarioId: 'leo-test-1', initialCoords: [10, 50], footprintRadius: 15, orbitSpeed: 0.06, altitude: 550, inclination: 53, signalStrength: -98 },
      { id: 'gs-madrid', name: 'GS-Madrid', type: 'GS', coordinates: [-3.7, 40.4], scenarioId: 'leo-test-1', locationName: 'Madrid, Spain', connectionStatus: 'Stable' }, // Also used in geo-link-sim? Let's assign to leo for now.
      { id: 'ue-mobile-a', name: 'UE-Mobile-A', type: 'UE', coordinates: [-74, 40.7], scenarioId: 'leo-test-1', locationName: 'New York, USA', connectionStatus: 'Connected (Sat-LEO-01)' },

      // Scenario: geo-link-sim
      { id: 'sat-geo-1', name: 'Sat-GEO-01', type: 'SAT', coordinates: [-70, 0], scenarioId: 'geo-link-sim', initialCoords: [-70, 0], footprintRadius: 40, orbitSpeed: 0.01, altitude: 35786, inclination: 0, signalStrength: -85 },
      // { id: 'gs-madrid', name: 'GS-Madrid', type: 'GS', coordinates: [-3.7, 40.4], scenarioId: 'geo-link-sim', locationName: 'Madrid, Spain', connectionStatus: 'Stable' }, // Duplicate ID, handled above
      { id: 'ue-fixed-b', name: 'UE-Fixed-B', type: 'UE', coordinates: [139.7, 35.7], scenarioId: 'geo-link-sim', locationName: 'Tokyo, Japan', connectionStatus: 'Connected (Sat-GEO-01)' },

       // Scenario: handover-study
      { id: 'sat-meo-a', name: 'Sat-MEO-A', type: 'SAT', coordinates: [20, 25], scenarioId: 'handover-study', initialCoords: [20, 25], footprintRadius: 25, orbitSpeed: 0.03, altitude: 8000, inclination: 45, signalStrength: -90 },
      { id: 'ue-aircraft-1', name: 'UE-Aircraft-1', type: 'UE', coordinates: [-10, 30], scenarioId: 'handover-study', locationName: 'Mid-Atlantic', connectionStatus: 'Handover Pending' },


      // Global / Unassigned
      { id: 'gs-svalbard', name: 'GS-Svalbard', type: 'GS', coordinates: [15.6, 78.2], scenarioId: null, locationName: 'Svalbard, Norway', connectionStatus: 'Intermittent' },
    ];
