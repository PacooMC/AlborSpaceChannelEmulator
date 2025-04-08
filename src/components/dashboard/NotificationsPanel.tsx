import React from 'react';
import { Bell, WifiOff, AlertCircle } from 'lucide-react';
// Import data structure and data from content file
import { NotificationItemData, dummyNotifications } from '../../content/dashboardData';

// Map data types to icons within the component
const iconMap: { [key in NotificationItemData['type']]: React.ElementType } = {
    info: Bell,
    warning: WifiOff, // Example, adjust as needed
    error: AlertCircle,
};

const NotificationItem: React.FC<{ item: NotificationItemData }> = ({ item }) => {
  const Icon = iconMap[item.type] || Bell; // Fallback to Bell icon
  const colorClasses = {
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  };
  return (
    <div className="flex items-start space-x-2 py-1.5 border-b border-albor-bg-dark/50 last:border-b-0">
      <Icon size={16} className={`${colorClasses[item.type]} mt-0.5 flex-shrink-0`} />
      <div className="flex-1">
        <p className="text-xs text-albor-light-gray">{item.message}</p>
        <p className="text-xs text-albor-dark-gray">{item.time}</p>
      </div>
    </div>
  );
};

interface NotificationsPanelProps {
    scenarioId?: string | null; // Add scenarioId if notifications need filtering
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ /* scenarioId */ }) => {
  // Use imported dummy data. Add filtering based on scenarioId if needed.
  const notifications = dummyNotifications;

  return (
    <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex flex-col min-h-[200px]">
      <h3 className="text-sm font-semibold text-albor-light-gray mb-2">Notifications</h3>
      <div className="flex-1 overflow-y-auto -mr-2 pr-2"> {/* Allow scrolling */}
        {notifications.length > 0 ? (
            notifications.map(n => <NotificationItem key={n.id} item={n} />)
        ) : (
            <p className="text-xs text-albor-dark-gray italic">No notifications.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
