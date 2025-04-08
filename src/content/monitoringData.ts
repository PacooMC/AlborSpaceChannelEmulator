import { Scenario } from './scenarios'; // Assuming Scenario type is defined here or in App.tsx

// --- Data Structures ---

export interface TimeDataPoint {
  time: number; // Timestamp (e.g., Date.now() or simulation time)
  value: number;
}

export interface SpectrumDataPoint {
  frequency: number; // Hz or MHz
  power: number; // dBm or similar unit
}

export interface SignalMetrics {
  timestamp: number;
  delay: number; // ms
  doppler: number; // Hz
  snr: number; // dB
  receivedPower: number; // dBm
}

// --- NEW: Log Entry Structure ---
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export interface LogEntry {
  id: string; // Unique ID for React key
  timestamp: number;
  level: LogLevel;
  message: string;
  source?: string; // e.g., 'Link-Sat1-GS2', 'SDR-1', 'ScenarioControl'
}

// --- Placeholder Data Generation ---

let simTime = Date.now();
const TIME_STEP = 1000; // ms for metrics update
const LOG_EVENT_PROBABILITY = 0.15; // Chance of a log event per second

// Helper to get a deterministic offset based on scenario ID
const getIdOffset = (id: string | null, maxOffset = 10): number => {
    if (!id) return 0;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return (hash % maxOffset) - maxOffset / 2;
};


// Generate a single point for signal metrics, varying by scenarioId
export const generateSignalMetrics = (scenarioId: string | null, prevMetrics?: SignalMetrics): SignalMetrics => {
  simTime += TIME_STEP;

  const idOffsetSnr = getIdOffset(scenarioId, 6);
  const idOffsetDelay = getIdOffset(scenarioId, 20);
  const idOffsetPower = getIdOffset(scenarioId, 10);
  const idOffsetDoppler = getIdOffset(scenarioId, 1000);

  const baseSnr = 15 + idOffsetSnr;
  const baseDelay = 50 + idOffsetDelay;
  const basePower = -80 + idOffsetPower;
  const baseDoppler = 1000 + idOffsetDoppler;

  return {
    timestamp: simTime,
    snr: baseSnr + (Math.random() - 0.5) * 5,
    delay: Math.max(5, baseDelay + (Math.random() - 0.2) * 10),
    receivedPower: basePower + (Math.random() - 0.5) * 10,
    doppler: baseDoppler + (Math.random() - 0.5) * 500,
  };
};

// Generate data for the spectrum chart, varying by scenarioId
export const generateSpectrumData = (scenarioId: string | null, numPoints = 100): SpectrumDataPoint[] => {
  const idOffsetFreq = getIdOffset(scenarioId, 10);
  const idOffsetPower = getIdOffset(scenarioId, 10);

  const baseCenterFreq = 2.4e9;
  const bandwidth = 20e6;

  const centerFreq = baseCenterFreq + idOffsetFreq * 1e6;
  const peakPowerBase = -50 + idOffsetPower;

  const data: SpectrumDataPoint[] = [];
  const freqStep = bandwidth / numPoints;
  const peakFreq = centerFreq + (Math.random() - 0.5) * (bandwidth / 4);
  const peakPower = peakPowerBase + Math.random() * 5;
  const noiseFloor = -95;

  for (let i = 0; i < numPoints; i++) {
    const freq = centerFreq - bandwidth / 2 + i * freqStep;
    let power = noiseFloor + Math.random() * 5;
    const distFromPeak = Math.abs(freq - peakFreq);
    const peakWidthFactor = 10 + getIdOffset(scenarioId, 4);
    const signalStrength = peakPower * Math.exp(-Math.pow(distFromPeak / (bandwidth / peakWidthFactor), 2));
    power = 10 * Math.log10(Math.pow(10, power / 10) + Math.pow(10, signalStrength / 10));
    power += (Math.random() - 0.5) * 2;
    data.push({ frequency: freq / 1e6, power: parseFloat(power.toFixed(1)) });
  }
  return data;
};

// Generate initial history for signal metrics, varying by scenarioId
export const generateInitialSignalHistory = (scenarioId: string | null, count = 50): SignalMetrics[] => {
  let metrics: SignalMetrics[] = [];
  let lastMetric: SignalMetrics | undefined = undefined;
  const initialSimTime = Date.now() - count * TIME_STEP + getIdOffset(scenarioId, 500);
  simTime = initialSimTime; // Reset simTime for this generation run

  for (let i = 0; i < count; i++) {
    lastMetric = generateSignalMetrics(scenarioId, lastMetric);
    metrics.push(lastMetric);
  }
  return metrics;
};

// --- NEW: Generate a potential log entry ---
let logCounter = 0;
const satelliteNames = ["Sat-A", "Sat-B", "Sat-C"]; // Example names
const groundStationNames = ["GS-1", "GS-2"];

export const generateLogEntry = (scenarioId: string | null): LogEntry | null => {
    if (!scenarioId || Math.random() > LOG_EVENT_PROBABILITY) {
        return null; // No log event this time
    }

    logCounter++;
    const timestamp = Date.now(); // Use real time for logs for simplicity
    const levels: LogLevel[] = ['info', 'info', 'info', 'warn', 'error']; // Weighted probability
    const level = levels[Math.floor(Math.random() * levels.length)];
    let message = "";
    let source = "";

    const satIndex = Math.floor(Math.random() * satelliteNames.length);
    const gsIndex = Math.floor(Math.random() * groundStationNames.length);
    const satName = `${satelliteNames[satIndex]}_${scenarioId.slice(-3)}`; // Make names scenario-specific
    const gsName = `${groundStationNames[gsIndex]}_${scenarioId.slice(-3)}`;

    const eventType = Math.random();
    if (level === 'info') {
        if (eventType < 0.5) {
            message = `AOS ${gsName}`; // Acquisition of Signal
            source = satName;
        } else {
            message = `LOS ${gsName}`; // Loss of Signal
            source = satName;
        }
    } else if (level === 'warn') {
        message = `High latency detected on link ${satName} <-> ${gsName}`;
        source = `LinkMonitor`;
    } else { // error
        message = `Link failure between ${satName} and ${gsName}`;
        source = `LinkMonitor`;
    }

    return {
        id: `log-${timestamp}-${logCounter}`,
        timestamp,
        level,
        message,
        source,
    };
};

// Generate initial logs
export const generateInitialLogs = (scenarioId: string | null, count = 15): LogEntry[] => {
    const logs: LogEntry[] = [];
    for (let i = 0; i < count; i++) {
        // Simulate logs appearing over the last minute
        const log = generateLogEntry(scenarioId);
        if (log) {
            log.timestamp = Date.now() - Math.floor(Math.random() * 60000);
            logs.push(log);
        }
    }
    // Sort by timestamp ascending
    return logs.sort((a, b) => a.timestamp - b.timestamp);
};
