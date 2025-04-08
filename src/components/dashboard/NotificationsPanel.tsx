import React from 'react';
import { Bell, WifiOff, AlertCircle } from 'lucide-react';

const NotificationItem: React.FC<{ icon: React.ElementType; message: string; time: string; type: 'info' | 'warning' | 'error' }> = ({ icon: Icon, message, time, type }) => {
  const colorClasses = {
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  };
  return (
    <div className="flex items-start space-x-2 py-1.5 border-b border-albor-bg-dark/50 last:border-b-0">
      <Icon size={16} className={`${colorClasses[type]} mt-0.5`} />
      <div className="flex-1">
        <p className="text-xs text-albor-light-gray">{message}</p>
        <p className="text-xs text-albor-dark-gray">{time}</p>
      </div>
    </div>
  );
};

const NotificationsPanel: React.FC = () => {
  // Dummy notifications
  const notifications = [
    { id: 1, icon: WifiOff, message: 'Link Sat-LEO-01 -> UE-Mobile-A lost.', time: '2m ago', type: 'warning' as const },
    { id: 2, icon: AlertCircle, message: 'SDR-01 Port TX4 conflict detected.', time: '5m ago', type: 'error' as const },
    { id: 3, icon: Bell, message: 'Scenario "LEO Constellation Test" loaded.', time: '10m ago', type: 'info' as const },
  ];

  return (
    <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex flex-col min-h-[200px]">
      <h3 className="text-sm font-semibold text-albor-light-gray mb-2">Notifications</h3>
      <div className="flex-1 overflow-y-auto -mr-2 pr-2"> {/* Allow scrolling */}
        {notifications.map(n => <NotificationItem key={n.id} {...n} />)}
      </div>
    </div>
  );
};

export default NotificationsPanel;
