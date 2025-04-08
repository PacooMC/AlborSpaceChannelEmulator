import type { Node, Edge, Viewport } from 'reactflow'; // Import Viewport

    // Define shared types for the scenario editor, aligning with React Flow

    export type NodeType = 'SAT' | 'GS' | 'UE';
    export type ScenarioType = 'realistic' | 'custom'; // Add scenario type

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
      altitude?: number; // For GS/UE (optional, meters or km)
      // --- Custom Scenario Data (Implicitly uses node position) ---
      // Add other node-specific properties later as needed
      // e.g., antennaConfig?: any, etc.
      scenarioType?: ScenarioType; // Include scenario type for node rendering logic
    }
    export type ScenarioNode = Node<CustomNodeData>; // Use Node<T> for typed data

    // Extend React Flow's Edge type if needed (optional for now)
    export interface CustomEdgeData {
      // Add link-specific properties later
      channelModel?: string;
      frequency?: number;
      bandwidth?: number;
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
