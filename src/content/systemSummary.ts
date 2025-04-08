import { ScenarioType } from '../components/scenario_editor/types'; // Import ScenarioType
import { initialRunningScenarios } from './scenarios'; // *** ADDED IMPORT ***

// Define structure for summary data - Export this interface
export interface SystemSummaryStats {
    satellites: number;
    groundStations: number;
    userTerminals: number;
    totalNodes: number; // SAT + GS + UE
    activeLinks: number;
    linkHealth?: { ok: number; warning: number; error: number }; // Link health summary
    usedPorts: string; // e.g., "45/128"
    uptime: string; // Elapsed time, e.g., "1d 02:30:15"
    startTime?: string; // Start time (e.g., "2023-10-27 10:00:00 UTC")
    endTime?: string; // Optional End time
    scenarioType?: ScenarioType; // 'realistic' or 'custom'
    avgLatency?: number; // Simulated Average Latency (ms)
    // --- NEW FIELDS ---
    description?: string; // Scenario purpose/goal
    configSummary?: string; // e.g., "TLE + Lat/Lon", "Manual Placement"
    throughput?: number; // Simulated Mbps
    packetLoss?: number; // Simulated %
    channelModelsUsed?: string[]; // List of unique channel models
    lastSaved?: string; // Timestamp, e.g., "2023-10-27 11:30:15 UTC"
}

// Default state for missing scenarios or global view placeholder
const defaultStats: SystemSummaryStats = {
    satellites: 0, groundStations: 0, userTerminals: 0, totalNodes: 0,
    activeLinks: 0, linkHealth: { ok: 0, warning: 0, error: 0 },
    usedPorts: "0/0", uptime: "N/A", startTime: "N/A", endTime: undefined,
    scenarioType: 'realistic',
    avgLatency: 0,
    description: "No description available.",
    configSummary: "N/A",
    throughput: 0,
    packetLoss: 0,
    channelModelsUsed: [],
    lastSaved: "Never",
};


// Export scenario-specific summary data (with new fields)
export const scenarioSystemSummaryData: { [key: string]: SystemSummaryStats } = {
    'leo-test-1': {
        satellites: 3, groundStations: 2, userTerminals: 15, totalNodes: 20,
        activeLinks: 8, linkHealth: { ok: 6, warning: 1, error: 1 },
        usedPorts: "16/64", uptime: "1d 02:30:15",
        startTime: "2023-10-26 08:00:00 UTC", endTime: undefined,
        scenarioType: 'realistic',
        avgLatency: 120.5,
        description: "Test basic LEO constellation coverage and link stability.",
        configSummary: "TLE + Lat/Lon/Alt",
        throughput: 150.7,
        packetLoss: 0.1,
        channelModelsUsed: ["Free Space", "Rain Fade"],
        lastSaved: "2023-10-27 09:15:00 UTC",
    },
    'geo-link-sim': {
        satellites: 1, groundStations: 1, userTerminals: 1, totalNodes: 3,
        activeLinks: 2, linkHealth: { ok: 2, warning: 0, error: 0 },
        usedPorts: "8/32", uptime: "0d 10:05:00",
        startTime: "2023-10-27 09:00:00 UTC", endTime: "2023-10-27 19:05:00 UTC",
        scenarioType: 'realistic',
        avgLatency: 550.0,
        description: "Simulate GEO satellite uplink and downlink performance.",
        configSummary: "Keplerian + Lat/Lon/Alt",
        throughput: 85.2,
        packetLoss: 0.01,
        channelModelsUsed: ["AWGN", "Free Space"],
        lastSaved: "2023-10-27 08:55:30 UTC",
    },
    'handover-study': {
        satellites: 1, groundStations: 0, userTerminals: 1, totalNodes: 2,
        activeLinks: 1, linkHealth: { ok: 0, warning: 0, error: 1 },
        usedPorts: "4/16", uptime: "0d 01:15:45",
        startTime: "2023-10-27 11:00:00 UTC", endTime: undefined,
        scenarioType: 'custom',
        avgLatency: 85.2,
        description: "Study link behavior during simulated MEO satellite handover.",
        configSummary: "Manual Placement & Links",
        throughput: 25.0,
        packetLoss: 1.5,
        channelModelsUsed: ["Multipath", "Doppler"],
        lastSaved: "2023-10-27 11:05:10 UTC",
    },
    // Add other scenarios as needed
};

// Function to get summary data based on scenarioId (null for global)
export const getSystemSummary = (scenarioId: string | null): SystemSummaryStats => {
    if (scenarioId === null) {
        // In global view, we might want to aggregate or show a default/placeholder
        // For now, returning defaultStats for the global view case
        return defaultStats; // Or calculate an aggregate summary if needed
    }
    return scenarioSystemSummaryData[scenarioId] || defaultStats;
};


// Helper function to get summary for ALL active scenarios (used in global view list)
// No changes needed here as it already returns the full summary object
export const getAllActiveScenarioSummaries = (activeScenarioIds: string[]): { id: string; name: string; summary: SystemSummaryStats }[] => {
    return activeScenarioIds.map(id => {
        const summary = scenarioSystemSummaryData[id] || defaultStats;
        // Use the imported initialRunningScenarios here
        const runningInfo = initialRunningScenarios.find(r => r.id === id); // Get name/status from running list
        return {
            id,
            name: runningInfo?.name || `Scenario ${id.substring(0,4)}`, // Use name from running list if available
            summary
        };
    }).filter(item => item.summary !== defaultStats); // Filter out scenarios not found in summary data
};
