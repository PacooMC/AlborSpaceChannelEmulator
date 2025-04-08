import React from 'react';
    import { Satellite, RadioTower, Smartphone, Plus } from 'lucide-react';
    import { NodeType } from './types';

    const NodeListSidebar: React.FC = () => {
      const nodeTypes: { name: string; icon: React.ElementType; type: NodeType }[] = [
        { name: 'Satellites', icon: Satellite, type: 'SAT' },
        { name: 'Ground Stations', icon: RadioTower, type: 'GS' },
        { name: 'User Terminals', icon: Smartphone, type: 'UE' },
      ];

      // --- Drag and Drop Handling ---
      const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, nodeType: NodeType) => {
        // Set the data type and the node type being dragged
        event.dataTransfer.setData('application/node-type', nodeType);
        event.dataTransfer.effectAllowed = 'move';
        // Add a visual cue - using Tailwind classes for ghost effect
        event.currentTarget.classList.add('opacity-50', 'cursor-grabbing');
        // Optional: Create a custom drag image (more complex)
        // const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
        // document.body.appendChild(dragImage);
        // event.dataTransfer.setDragImage(dragImage, 0, 0);
        // setTimeout(() => document.body.removeChild(dragImage), 0);
      };

      const handleDragEnd = (event: React.DragEvent<HTMLButtonElement>) => {
        // Reset visual cue and cursor
         event.currentTarget.classList.remove('opacity-50', 'cursor-grabbing');
      };

      return (
        <div className="w-48 bg-albor-bg-dark/50 border-r border-albor-bg-dark p-2 flex flex-col space-y-4 flex-shrink-0">
          {nodeTypes.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center space-x-1">
                  <item.icon size={14} className="text-albor-dark-gray" />
                  <h4 className="text-xs font-semibold text-albor-dark-gray uppercase tracking-wider">{item.name}</h4>
                </div>
                {/* Make the button draggable */}
                <button
                  className="p-0.5 rounded text-albor-dark-gray hover:bg-albor-bg-dark hover:text-albor-light-gray cursor-grab transition-opacity duration-150" // Added transition
                  draggable // Make it draggable
                  onDragStart={(event) => handleDragStart(event, item.type)}
                  onDragEnd={handleDragEnd}
                  title={`Drag to add ${item.name} to the canvas`}
                >
                  <Plus size={14} />
                </button>
              </div>
              {/* Placeholder for listing existing nodes - can be added later */}
               <p className="text-xs text-albor-dark-gray italic px-1 py-1">Drag '+' to canvas to add.</p>
            </div>
          ))}
           {/* Add a small helper text at the bottom */}
           <div className="mt-auto pt-2 border-t border-albor-bg-dark/50">
                <p className="text-[10px] text-albor-dark-gray text-center">
                    Configure node details (position, orbit, etc.) in the right panel after adding.
                </p>
           </div>
        </div>
      );
    };

    export default NodeListSidebar;
