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
}

// Export dummy data for dashboard panels
export const dummyNotifications: NotificationItemData[] = [
    // Need to import actual icons here or pass them in the component
    // For simplicity, we'll keep icons in the component for now,
    // but store the rest of the data.
    { id: 1, icon: null as any, message: 'Link Sat-LEO-01 -> UE-Mobile-A lost.', time: '2m ago', type: 'warning' },
    { id: 2, icon: null as any, message: 'SDR-01 Port TX4 conflict detected.', time: '5m ago', type: 'error' },
    { id: 3, icon: null as any, message: 'Scenario "LEO Constellation Test" loaded.', time: '10m ago', type: 'info' },
];

export const dummyAlerts: AlertItemData[] = [
    { id: 1, icon: null as any, message: 'SDR-01 temperature critical (85°C).', severity: 'high' },
    { id: 2, icon: null as any, message: 'Hardware resource usage high (CPU 95%).', severity: 'medium' },
];

// Note: Icons are set to null here because importing them directly (like WifiOff)
// makes this file depend on React components. It's often better to map data to
// icons within the rendering component itself. We'll adjust the panels accordingly.
