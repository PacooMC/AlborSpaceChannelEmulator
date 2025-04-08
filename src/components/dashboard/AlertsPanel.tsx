import React from 'react';
import { AlertTriangle, Thermometer, ServerCrash } from 'lucide-react';

const AlertItem: React.FC<{ icon: React.ElementType; message: string; severity: 'high' | 'medium' | 'low' }> = ({ icon: Icon, message, severity }) => {
  const severityClasses = {
    high: 'text-red-500 border-red-500/50 bg-red-500/10',
    medium: 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10',
    low: 'text-blue-400 border-blue-400/50 bg-blue-400/10',
  };
  return (
    <div className={`flex items-center space-x-2 p-2 rounded border ${severityClasses[severity]}`}>
      <Icon size={16} />
      <p className="text-xs text-albor-light-gray flex-1">{message}</p>
    </div>
  );
};

const AlertsPanel: React.FC = () => {
   // Dummy alerts
  const alerts = [
    { id: 1, icon: Thermometer, message: 'SDR-01 temperature critical (85°C).', severity: 'high' as const },
    { id: 2, icon: ServerCrash, message: 'Hardware resource usage high (CPU 95%).', severity: 'medium' as const },
  ];

  return (
    <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex flex-col min-h-[150px]">
      <h3 className="text-sm font-semibold text-albor-light-gray mb-2">Active Alerts</h3>
       <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2"> {/* Allow scrolling */}
         {alerts.map(a => <AlertItem key={a.id} {...a} />)}
         {alerts.length === 0 && <p className="text-xs text-albor-dark-gray italic">No active alerts.</p>}
      </div>
    </div>
  );
};

export default AlertsPanel;
