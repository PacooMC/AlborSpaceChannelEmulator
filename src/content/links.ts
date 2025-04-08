export interface LinkData {
  id: number;
  scenarioId: string; // Keep scenarioId to filter later if needed
  source: string;
  dest: string;
  freq: string;
  bw: string;
  model: string;
  port: string;
  snr: number;
  status: 'ok' | 'warning' | 'error';
}

export const allLinksData: LinkData[] = [
  { id: 1, scenarioId: 'leo-test-1', source: 'Sat-LEO-01', dest: 'GS-Madrid', freq: '2.1 GHz', bw: '20 MHz', model: 'Rain Fade', port: 'SDR1:TX1->SDR2:RX1', snr: 15.2, status: 'ok' },
  { id: 2, scenarioId: 'leo-test-1', source: 'Sat-LEO-01', dest: 'UE-Mobile-A', freq: '1.8 GHz', bw: '10 MHz', model: 'Doppler', port: 'SDR1:TX2->SDR3:RX1', snr: 8.1, status: 'warning' },
  { id: 3, scenarioId: 'geo-link-sim', source: 'GS-Madrid', dest: 'Sat-GEO-01', freq: '14 GHz', bw: '50 MHz', model: 'AWGN', port: 'SDR2:TX1->SDR4:RX1', snr: 22.5, status: 'ok' },
  { id: 4, scenarioId: 'geo-link-sim', source: 'Sat-GEO-01', dest: 'UE-Fixed-B', freq: '12 GHz', bw: '30 MHz', model: 'Free Space', port: 'SDR4:TX1->SDR5:RX1', snr: 18.0, status: 'ok' },
  { id: 5, scenarioId: 'handover-study', source: 'Sat-MEO-A', dest: 'UE-Aircraft-1', freq: '1.5 GHz', bw: '5 MHz', model: 'Multipath', port: 'SDR6:TX1->SDR7:RX1', snr: 5.5, status: 'error' },
  // Add more global links if needed, or filter based on scenarioId in the component
];
