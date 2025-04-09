import type { Node, Edge, Viewport } from 'reactflow'; // Import Viewport

    // Define shared types for the scenario editor, aligning with React Flow

    export type NodeType = 'SAT' | 'GS' | 'UE';
    export type ScenarioType = 'realistic' | 'custom'; // Add scenario type

    // --- Movement Pattern Types ---
    export type MovementPatternType =
      | 'STATIC' // Default, no movement
      | 'LINEAR' // Straight line path (simple speed/direction for now)
      | 'CIRCULAR' // Circular path around a point (canvas coords)
      | 'ELLIPTICAL' // Elliptical path around a point (canvas coords) - NEW
      // | 'SINUSOIDAL' // Sinusoidal path along an axis
      | 'GROUND_TRACK_LOOP'; // Specific for SAT in custom mode (geographic coords)

    // --- Movement Parameter Interfaces ---
    export interface BaseMovementParams {
      speedKmh?: number; // Speed in km/h (used by most patterns)
    }

    export interface LinearMovementParams extends BaseMovementParams {
      // For now, only speed. Direction could be added later (e.g., angle).
      // Start/end points are implicit based on node position and simulation time.
      angleDegrees?: number; // Optional: Direction angle (0-360)
    }

    export interface CircularMovementParams extends BaseMovementParams {
      centerX?: number; // Canvas X coordinate
      centerY?: number; // Canvas Y coordinate
      radius?: number; // Canvas units
      clockwise?: boolean; // Direction
    }

    // --- NEW: Elliptical Movement Params ---
    export interface EllipticalMovementParams extends BaseMovementParams {
        centerX?: number; // Canvas X coordinate
        centerY?: number; // Canvas Y coordinate
        semiMajorAxis?: number; // Canvas units (longer radius)
        semiMinorAxis?: number; // Canvas units (shorter radius)
        angleDegrees?: number; // Rotation angle of the ellipse (0-360)
        clockwise?: boolean; // Direction
    }

    // Add Sinusoidal later if needed

    export interface GroundTrackLoopParams {
      // No speed here by default, derived from altitude or set directly
      startLon?: number;
      startLat?: number;
      endLon?: number;
      endLat?: number;
      altitudeKm?: number; // Altitude above ground (used to calculate speed)
      speedKmh?: number; // OR define speed directly (km/h) - one must be chosen
    }

    // Union type for movement parameters
    export type MovementParameters =
      | BaseMovementParams // For STATIC
      | LinearMovementParams
      | CircularMovementParams
      | EllipticalMovementParams // Added Elliptical
      // | SinusoidalMovementParams
      | GroundTrackLoopParams;


    // --- Keplerian Elements ---
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
      latitude?: number; // For GS/UE
      longitude?: number; // For GS/UE
      altitude?: number; // For GS/UE (optional, meters or km ASL)
      // --- Custom Scenario Data ---
      movementPattern?: MovementPatternType; // Type of movement
      movementParams?: MovementParameters; // Parameters for the movement
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
