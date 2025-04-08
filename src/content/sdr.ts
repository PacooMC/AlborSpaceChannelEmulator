import { NodeType } from './mapData'; // Import shared NodeType

// Define types specific to SDR/Port data
export type SignalType = 'physical' | 'simulated';
export type PortStatus = 'available' | 'assigned' | 'active' | 'conflict' | 'error';

export interface PortAssignment {
  nodeId: string;
  nodeType: NodeType; // Use imported NodeType
  signalType: SignalType;
  config?: {
    frequency?: string;
    bandwidth?: string;
    power?: number;
  };
}

export interface Port {
  id: string;
  type: 'TX' | 'RX' | 'TXRX';
  status: PortStatus;
  assignment?: PortAssignment;
}

export interface SdrDevice {
  id: string;
  name: string;
  ports: Port[];
}

// Export the dummy SDR data
export const dummySdrData: SdrDevice[] = [
  {
    id: 'sdr-01',
    name: 'SDR-01 (Ettus X310)',
    ports: [
      { id: 'TX1', type: 'TX', status: 'assigned', assignment: { nodeId: 'Sat-LEO-01', nodeType: 'SAT', signalType: 'physical', config: { frequency: '2.1 GHz' } } },
      { id: 'RX1', type: 'RX', status: 'assigned', assignment: { nodeId: 'GS-Madrid', nodeType: 'GS', signalType: 'physical' } },
      { id: 'TX2', type: 'TX', status: 'active', assignment: { nodeId: 'Sat-LEO-01', nodeType: 'SAT', signalType: 'physical' } },
      { id: 'RX2', type: 'RX', status: 'assigned', assignment: { nodeId: 'UE-Mobile-A', nodeType: 'UE', signalType: 'simulated' } },
      { id: 'TX3', type: 'TX', status: 'available' },
      { id: 'RX3', type: 'RX', status: 'available' },
      { id: 'TX4', type: 'TX', status: 'conflict', assignment: { nodeId: 'Sat-GEO-01', nodeType: 'SAT', signalType: 'physical' } },
      { id: 'RX4', type: 'RX', status: 'error' },
    ],
  },
  {
    id: 'sdr-02',
    name: 'SDR-02 (NI USRP-2974)',
    ports: [
      { id: 'P0', type: 'TXRX', status: 'assigned', assignment: { nodeId: 'GS-Madrid', nodeType: 'GS', signalType: 'physical' } },
      { id: 'P1', type: 'TXRX', status: 'available' },
      { id: 'P2', type: 'TXRX', status: 'assigned', assignment: { nodeId: 'UE-Drone-X', nodeType: 'UE', signalType: 'simulated' } },
      { id: 'P3', type: 'TXRX', status: 'available' },
    ],
  },
   {
    id: 'sdr-03',
    name: 'SDR-03 (Simulated)',
    ports: [
      { id: 'SIM-TX1', type: 'TX', status: 'active', assignment: { nodeId: 'Sat-MEO-A', nodeType: 'SAT', signalType: 'simulated' } },
      { id: 'SIM-RX1', type: 'RX', status: 'active', assignment: { nodeId: 'Sat-MEO-A', nodeType: 'SAT', signalType: 'simulated' } },
    ],
  },
];
