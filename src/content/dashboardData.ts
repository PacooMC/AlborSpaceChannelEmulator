import { LucideIcon } from 'lucide-react'; // Import base type if needed

// Define interfaces for dashboard panel items
export interface NotificationItemData {
  id: number;
  icon: LucideIcon; // Use LucideIcon type
  message: string;
  time: string;
  type: 'info' | 'warning' | 'error';
}

export interface AlertItemData {
    id: number;
    icon: LucideIcon; // Use LucideIcon type
    message: string;
    severity: 'high' | 'medium' | 'low';
    timestamp?: string; // Added timestamp
    source?: string; // Added source
}

// Export dummy data for dashboard panels
export const dummyNotifications: NotificationItemData[] = [
    // Icons are mapped in the component
    { id: 1, icon: null as any, message: 'Link Sat-LEO-01 -> UE-Mobile-A lost.', time: '2m ago', type: 'warning' },
    { id: 2, icon: null as any, message: 'SDR-01 Port TX4 conflict detected.', time: '5m ago', type: 'error' },
    { id: 3, icon: null as any, message: 'Scenario "LEO Constellation Test" loaded.', time: '10m ago', type: 'info' },
    { id: 4, icon: null as any, message: 'Configuration change applied to GS-Madrid.', time: '12m ago', type: 'info' },
];

export const dummyAlerts: AlertItemData[] = [
    // Icons are mapped in the component
    { id: 1, icon: null as any, message: 'SDR-01 temperature critical (85°C).', severity: 'high', timestamp: 'Just now', source: 'HW-Monitor' },
    { id: 2, icon: null as any, message: 'Hardware resource usage high (CPU 95%).', severity: 'medium', timestamp: '1m ago', source: 'System' },
    { id: 3, icon: null as any, message: 'Link quality degraded: Sat-MEO-A -> UE-Aircraft-1.', severity: 'low', timestamp: '3m ago', source: 'LinkMonitor' },
];
