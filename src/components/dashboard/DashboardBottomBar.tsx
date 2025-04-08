import React from 'react';
import { Play, Pause, FastForward, Clock, Save, Terminal } from 'lucide-react';

const DashboardBottomBar: React.FC = () => {
  return (
    <div className="bg-albor-bg-dark/90 backdrop-blur-sm border-t border-albor-bg-dark/50 px-4 py-1.5 flex items-center justify-between text-xs mt-auto"> {/* Ensure it sticks to bottom */}
      {/* Left Side: Emulation Speed & Time */}
      <div className="flex items-center space-x-4">
        <span className="text-albor-dark-gray">Speed:</span>
        <div className="flex items-center space-x-1">
          <button className="p-1 rounded hover:bg-albor-bg-dark text-albor-light-gray"><Pause size={14} /></button>
          <button className="p-1 rounded bg-albor-orange/30 text-albor-orange"><Play size={14} /></button>
          <button className="p-1 rounded hover:bg-albor-bg-dark text-albor-light-gray"><FastForward size={14} /></button>
          <span className="ml-1 text-albor-light-gray font-medium">1x</span>
        </div>
        <div className="h-4 border-l border-albor-dark-gray/50"></div>
        <div className="flex items-center space-x-1">
           <Clock size={14} className="text-albor-dark-gray" />
           <span className="text-albor-light-gray">Sim Time: 12:34:56 UTC</span>
           <button className="ml-1 text-albor-orange hover:underline">(Real-time)</button>
        </div>
      </div>

      {/* Right Side: Actions & Logs */}
      <div className="flex items-center space-x-4">
         <button className="flex items-center space-x-1 text-albor-dark-gray hover:text-albor-light-gray">
           <Save size={14} />
           <span>Save Draft</span>
         </button>
          <div className="h-4 border-l border-albor-dark-gray/50"></div>
         <button className="flex items-center space-x-1 text-albor-dark-gray hover:text-albor-light-gray">
           <Terminal size={14} />
           <span>Script Log</span>
         </button>
      </div>
    </div>
  );
};

export default DashboardBottomBar;
