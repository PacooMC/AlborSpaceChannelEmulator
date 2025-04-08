import React from 'react';
import { Layers, Search, Maximize } from 'lucide-react'; // Added Maximize
import HologramMap from './HologramMap'; // Import the new map component

const OrbitMapTile: React.FC = () => {
  return (
    <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex flex-col min-h-[250px] lg:min-h-[300px]"> {/* Increased min height */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold text-albor-light-gray">Live Orbit Map</h3>
        <div className="flex space-x-1.5">
           <button className="p-1.5 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors"><Layers size={16} /></button>
           <button className="p-1.5 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors"><Search size={16} /></button>
           <button className="p-1.5 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors"><Maximize size={16} /></button>
        </div>
      </div>
      {/* Replace placeholder with the HologramMap component */}
      <div className="flex-1 bg-albor-deep-space/30 rounded border border-albor-bg-dark/50 overflow-hidden relative">
         <HologramMap />
      </div>
       {/* Placeholder for time scrubbing - kept for context */}
       <div className="mt-2 text-center text-xs text-albor-dark-gray">Time Scrub Bar Area</div>
    </div>
  );
};

export default OrbitMapTile;
