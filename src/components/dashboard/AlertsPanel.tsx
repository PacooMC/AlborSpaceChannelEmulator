import React from 'react';
import { AlertTriangle, Thermometer, ServerCrash } from 'lucide-react';
// Import data structure and data from content file
import { AlertItemData, dummyAlerts } from '../../content/dashboardData';

// Map data severity/type to icons within the component
// This mapping might need refinement based on actual alert messages/types
const alertIconMap: { [key: string]: React.ElementType } = {
    'temperature': Thermometer,
    'resource': ServerCrash,
    'default': AlertTriangle, // Fallback
};

// Helper function to determine icon based on message content (simple example)
const getAlertIcon = (message: string): React.ElementType => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('temperature')) return alertIconMap['temperature'];
    if (lowerMessage.includes('resource') || lowerMessage.includes('cpu')) return alertIconMap['resource'];
    return alertIconMap['default'];
}

const AlertItem: React.FC<{ item: AlertItemData }> = ({ item }) => {
  const Icon = getAlertIcon(item.message);
  const severityClasses = {
    high: 'text-red-500 border-red-500/50 bg-red-500/10',
    medium: 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10',
    low: 'text-blue-400 border-blue-400/50 bg-blue-400/10',
  };
  return (
    <div className={`flex items-center space-x-2 p-2 rounded border ${severityClasses[item.severity]}`}>
      <Icon size={16} className="flex-shrink-0" />
      <p className="text-xs text-albor-light-gray flex-1">{item.message}</p>
    </div>
  );
};

interface AlertsPanelProps {
    scenarioId?: string | null; // Add scenarioId if alerts need filtering
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ /* scenarioId */ }) => {
   // Use imported dummy data. Add filtering based on scenarioId if needed.
  const alerts = dummyAlerts;

  return (
    <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex flex-col min-h-[150px]">
      <h3 className="text-sm font-semibold text-albor-light-gray mb-2">Active Alerts</h3>
       <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2"> {/* Allow scrolling */}
         {alerts.length > 0 ? (
            alerts.map(a => <AlertItem key={a.id} item={a} />)
         ) : (
            <p className="text-xs text-albor-dark-gray italic">No active alerts.</p>
         )}
      </div>
    </div>
  );
};

export default AlertsPanel;
