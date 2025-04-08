// Define structure for summary data - Export this interface
export interface SystemSummaryStats {
    satellites: number;
    groundStations: number;
    userTerminals: number;
    activeLinks: number;
    usedPorts: string; // e.g., "45/128"
    uptime: string; // e.g., "7d 04:15:00"
}

// Export global summary data
export const globalSystemSummaryData: SystemSummaryStats = {
    satellites: 5, // Note: These might become less relevant if focusing on per-scenario
    groundStations: 4,
    userTerminals: 50,
    activeLinks: 25, // This is the sum, might differ from per-scenario view
    usedPorts: "45/128",
    uptime: "7d 04:15:00",
};

// Export scenario-specific summary data
export const scenarioSystemSummaryData: { [key: string]: SystemSummaryStats } = {
    'leo-test-1': {
        satellites: 3,
        groundStations: 2,
        userTerminals: 15,
        activeLinks: 8,
        usedPorts: "16/64",
        uptime: "1d 02:30:15",
    },
    'geo-link-sim': {
        satellites: 1,
        groundStations: 1,
        userTerminals: 1,
        activeLinks: 2,
        usedPorts: "8/32",
        uptime: "0d 10:05:00",
    },
    'handover-study': {
        satellites: 1,
        groundStations: 0,
        userTerminals: 1,
        activeLinks: 1,
        usedPorts: "4/16",
        uptime: "0d 01:15:45",
    },
    // Add other scenarios as needed
};

// Function to get summary data based on scenarioId (null for global)
export const getSystemSummary = (scenarioId: string | null): SystemSummaryStats => {
    if (scenarioId === null) {
        // Returning global might be confusing now, maybe return default/empty?
        // Or keep it if some global stats are still shown. Let's return default for clarity.
         return {
            satellites: 0, groundStations: 0, userTerminals: 0,
            activeLinks: 0, usedPorts: "0/0", uptime: "N/A",
        };
        // return globalSystemSummaryData;
    }
    // Return specific scenario data or a default/empty state if not found
    return scenarioSystemSummaryData[scenarioId] || {
        satellites: 0, groundStations: 0, userTerminals: 0,
        activeLinks: 0, usedPorts: "0/0", uptime: "N/A",
    };
};
