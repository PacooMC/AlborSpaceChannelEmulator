// Define Scenario type
export type ScenarioStatus = 'running' | 'paused' | 'stopped';
export interface Scenario {
  id: string;
  name: string;
  status: ScenarioStatus;
}

export const initialRunningScenarios: Scenario[] = [
  { id: 'leo-test-1', name: 'LEO Constellation Test', status: 'running' },
  { id: 'geo-link-sim', name: 'GEO Uplink Simulation', status: 'running' },
  { id: 'handover-study', name: 'MEO Handover Study', status: 'paused' },
  // Removed 'global-overview' as it's represented by selectedScenarioId === null
];
