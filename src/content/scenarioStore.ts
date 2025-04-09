import { nanoid } from 'nanoid';
        // Import updated types
        import { ScenarioState, ScenarioNode, ScenarioEdge, CustomNodeData, CustomEdgeData, Viewport, MovementPatternType } from '../components/scenario_editor/types';

        // --- Initial Data (Simulating stored JSON files) ---
        const initialNodesLeo: ScenarioNode[] = [
          { id: 'sat-leo-default', type: 'SAT', position: { x: 200, y: 150 }, data: { type: 'SAT', name: 'Sat-Default-LEO', tle: "1 25544U 98067A   23310.56318310  .00016717  00000-0  30306-3 0  9999\n2 25544  51.6410 218.9064 0006703 148.7738 211.3391 15.49013835396839" } },
          { id: 'gs-default', type: 'GS', position: { x: 450, y: 350 }, data: { type: 'GS', name: 'GS-Default', latitude: 40.4168, longitude: -3.7038, altitude: 650 } },
          { id: 'ue-default', type: 'UE', position: { x: 650, y: 200 }, data: { type: 'UE', name: 'UE-Default', latitude: 48.8566, longitude: 2.3522, altitude: 35 } },
        ];
        const initialEdgesLeo: ScenarioEdge[] = [];
        const initialViewportLeo: Viewport = { x: 0, y: 0, zoom: 0.9 };

        const initialNodesGeo: ScenarioNode[] = [
           { id: 'sat-geo-1', type: 'SAT', position: { x: 300, y: 100 }, data: { type: 'SAT', name: 'Sat-GEO-01', keplerian: { semiMajorAxis: 42164, eccentricity: 0.0005, inclination: 0.05, raan: 120, argPerigee: 90, trueAnomaly: 0 } } },
           { id: 'gs-madrid', type: 'GS', position: { x: 200, y: 300 }, data: { type: 'GS', name: 'GS-Madrid', latitude: 40.4168, longitude: -3.7038, altitude: 650 } },
           { id: 'ue-london', type: 'UE', position: { x: 500, y: 300 }, data: { type: 'UE', name: 'UE-London', latitude: 51.5074, longitude: -0.1278, altitude: 35 } },
        ];
        const initialEdgesGeo: ScenarioEdge[] = [];
        const initialViewportGeo: Viewport = { x: 50, y: 20, zoom: 0.8 };


        // --- In-Memory Store (Simulates File System / DB) ---
        let scenariosData: Record<string, ScenarioState> = {
          'leo-test-1': {
            name: 'LEO Constellation Test',
            scenarioType: 'realistic',
            nodes: initialNodesLeo,
            edges: initialEdgesLeo,
            viewport: initialViewportLeo,
          },
          'geo-link-sim': {
            name: 'GEO Uplink Simulation',
            scenarioType: 'realistic',
            nodes: initialNodesGeo,
            edges: initialEdgesGeo,
            viewport: initialViewportGeo,
          },
          'custom-basic': {
            name: 'Custom Basic Example',
            scenarioType: 'custom',
            nodes: [
                // Example with updated movement types
                { id: 'c-sat-1', type: 'SAT', position: { x: 100, y: 100 }, data: { type: 'SAT', name: 'CustomSat1', movementPattern: 'CIRCULAR_PATH', movementParams: { altitudeKm: 600, startLon: 0, startLat: 0, endLon: 90, endLat: 0 } } }, // Example Circular Path
                { id: 'c-gs-1', type: 'GS', position: { x: 300, y: 300 }, data: { type: 'GS', name: 'CustomGS1', movementPattern: 'STATIC' } },
                { id: 'c-ue-1', type: 'UE', position: { x: 500, y: 150 }, data: { type: 'UE', name: 'MobileUE', movementPattern: 'LINEAR', movementParams: { speedKmh: 50, startLon: -5, startLat: 45, endLon: 10, endLat: 50 } } },
            ],
            edges: [
                { id: 'c-edge-1', source: 'c-sat-1', target: 'c-gs-1', data: { channelModel: 'AWGN', frequency: '2GHz', bandwidth: '10MHz' } }
            ],
            viewport: { x: 0, y: 0, zoom: 1 },
          }
        };

        // --- Store API ---

        export interface SavedScenarioInfo {
          id: string;
          name: string;
        }

        /** Simulates fetching the list of available scenarios. */
        export const getScenarioList = async (): Promise<SavedScenarioInfo[]> => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 50));
          const list = Object.entries(scenariosData).map(([id, state]) => ({
            id,
            name: state.name || `Unnamed (${id.substring(0, 4)}...)`,
          }));
          return list.sort((a, b) => a.name.localeCompare(b.name));
        };

        /** Simulates loading a specific scenario's state. */
        export const loadScenario = async (id: string): Promise<ScenarioState | null> => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 100));
          if (scenariosData[id]) {
            // Return a deep copy to prevent direct mutation of the store
            return JSON.parse(JSON.stringify(scenariosData[id]));
          }
          return null;
        };

        /** Simulates saving (creating or updating) a scenario. */
        export const saveScenario = async (id: string, state: ScenarioState): Promise<void> => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 80));
          // Save a deep copy
          scenariosData[id] = JSON.parse(JSON.stringify(state));
          console.log(`STORE: Scenario '${id}' (${state.name}) saved/updated.`);
        };

        /** Simulates deleting a scenario. */
        export const deleteScenario = async (id: string): Promise<void> => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 60));
          if (scenariosData[id]) {
            delete scenariosData[id];
            console.log(`STORE: Scenario '${id}' deleted.`);
          } else {
            console.warn(`STORE: Attempted to delete non-existent scenario '${id}'.`);
          }
        };

        /** Generates a unique ID for new scenarios. */
        export const generateNewScenarioId = (): string => {
          return `scenario_${nanoid(8)}`;
        };

        /** Gets the initial state for a brand new scenario. */
        export const getNewScenarioDefaultState = (): ScenarioState => ({
            name: "New Scenario",
            // *** REVERTED: Default back to realistic ***
            scenarioType: 'realistic',
            nodes: [], // Start with empty canvas
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
        });
