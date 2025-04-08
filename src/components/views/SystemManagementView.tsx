import React from 'react';

const SystemManagementView: React.FC = () => {
  return (
    <div className="text-white">
      <h1 className="text-2xl font-semibold mb-4">System Management</h1>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 h-60">Hardware Status View</div>
          <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 h-60">Latency Monitor</div>
          <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 h-60 md:col-span-2">User Activity Log</div>
       </div>
    </div>
  );
};

export default SystemManagementView;
