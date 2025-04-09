import type { Node, Edge, Viewport } from 'reactflow'; // Import Viewport

        // Define shared types for the scenario editor, aligning with React Flow

        export type NodeType = 'SAT' | 'GS' | 'UE';
        export type ScenarioType = 'realistic' | 'custom'; // Add scenario type

        // --- Movement Pattern Types (Simplified) ---
        export type MovementPatternType =
          | 'STATIC' // Default, no movement
          | 'LINEAR' // Straight line path (simple speed/direction or start/end points)
          | 'CIRCULAR_PATH'; // Circular path defined by start/end points and altitude

        // --- NEW: Path Behavior Type ---
        export type PathBehavior = 'loop' | 'bounce';

        // --- Movement Parameter Interfaces ---
        export interface BaseMovementParams {
          speedKmh?: number; // Speed in km/h (used by LINEAR, potentially calculated for CIRCULAR_PATH)
          // *** ADDED: Common position fields for STATIC ***
          latitude?: number;
          longitude?: number;
          altitude?: number; // Altitude (m) above sea level
        }

        // *** ADDED: Specific interface for STATIC (inherits BaseMovementParams) ***
        export interface StaticParams extends BaseMovementParams {}

        export interface LinearMovementParams extends BaseMovementParams {
          angleDegrees?: number; // Optional: Direction angle (0-360) from current position
          startLon?: number;
          startLat?: number;
          endLon?: number;
          endLat?: number;
          pathBehavior?: PathBehavior; // NEW: How to handle path ends
        }

        // --- Circular Path Params ---
        export interface CircularPathParams extends BaseMovementParams {
            startLon?: number;
            startLat?: number;
            endLon?: number;
            endLat?: number;
            altitudeKm?: number; // Altitude above Earth surface (km) - Used for speed calculation
            // clockwise?: boolean; // REMOVED
            pathBehavior?: PathBehavior; // NEW: How to handle path ends
            // speedKmh is optional: calculated from altitude if not provided.
        }

        // Union type for movement parameters (Simplified)
        export type MovementParameters =
          | StaticParams // Use the specific StaticParams type
          | LinearMovementParams
          | CircularPathParams; // Updated


        // --- Keplerian Elements (Still used for Realistic Mode SAT definition) ---
        export interface KeplerianElements {
          semiMajorAxis?: number; // a (km)
          eccentricity?: number; // e
          inclination?: number; // i (degrees)
          raan?: number; // Ω (Right Ascension of the Ascending Node) (degrees)
          argPerigee?: number; // ω (Argument of Perigee) (degrees)
          trueAnomaly?: number; // ν or M (True or Mean Anomaly) (degrees)
        }

        // Extend React Flow's Node type with our custom data
        export interface CustomNodeData {
          type: NodeType;
          name: string;
          // --- Realistic Scenario Data ---
          tle?: string; // Two-Line Element set data (for SAT)
          keplerian?: KeplerianElements; // Keplerian elements object (for SAT)
          latitude?: number; // For GS/UE (also used by STATIC movement)
          longitude?: number; // For GS/UE (also used by STATIC movement)
          altitude?: number; // For GS/UE (optional, meters or km ASL) (also used by STATIC movement)
          // --- Custom Scenario Data ---
          movementPattern?: MovementPatternType; // Type of movement (Simplified)
          movementParams?: MovementParameters; // Parameters for the movement (Simplified)
          // --- Shared ---
          scenarioType?: ScenarioType; // Include scenario type for node rendering logic
        }
        export type ScenarioNode = Node<CustomNodeData>; // Use Node<T> for typed data

        // Extend React Flow's Edge type
        export interface CustomEdgeData {
          // Add link-specific properties
          channelModel?: string;
          frequency?: string; // Use string for now to allow units like 'GHz'
          bandwidth?: string; // Use string for now to allow units like 'MHz'
          // Add more...
        }
        export type ScenarioEdge = Edge<CustomEdgeData>; // Use Edge<T> for typed data

        // Type for context menu state
        export interface ContextMenuData {
            x: number;
            y: number;
            type: 'node' | 'edge' | 'pane'; // Align with React Flow terms
            itemId?: string; // ID of the node or edge clicked
        }

        // Type for undo/redo history entries
        export interface HistoryEntry {
            nodes: ScenarioNode[];
            edges: ScenarioEdge[];
            // Include viewport state for undo/redo
            viewport: Viewport;
        }

        // Type for the overall scenario state (to be saved/loaded)
        export interface ScenarioState {
            scenarioType: ScenarioType; // Include scenario type
            nodes: ScenarioNode[];
            edges: ScenarioEdge[];
            viewport: Viewport; // Use React Flow's Viewport type
            name: string; // Scenario name
        }
