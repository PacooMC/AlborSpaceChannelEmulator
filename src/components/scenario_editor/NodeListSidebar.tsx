import React from 'react';
    import { Satellite, RadioTower, Smartphone, GripVertical } from 'lucide-react'; // Import GripVertical
    import { NodeType } from './types';

    interface DraggableNodeItemProps {
      name: string;
      icon: React.ElementType;
      type: NodeType;
      onDragStart: (event: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => void;
      onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
    }

    // Component for each draggable node type
    const DraggableNodeItem: React.FC<DraggableNodeItemProps> = ({
      name, icon: Icon, type, onDragStart, onDragEnd
    }) => {
      return (
        <div
          className="flex items-center p-2 border border-albor-bg-dark rounded-md bg-albor-bg-dark/50 hover:bg-albor-bg-dark/80 hover:border-albor-orange/50 cursor-grab transition-all group w-full"
          draggable
          onDragStart={(e) => onDragStart(e, type)}
          onDragEnd={onDragEnd}
          title={`Drag to add ${name}`}
        >
          <Icon size={20} className="text-albor-orange mr-2 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-albor-light-gray">{name}</h4>
            <p className="text-[10px] text-albor-dark-gray group-hover:text-albor-light-gray">Drag onto canvas to add</p>
          </div>
          <GripVertical size={16} className="text-albor-dark-gray group-hover:text-albor-light-gray ml-1 flex-shrink-0 opacity-50 group-hover:opacity-100" />
        </div>
      );
    };


    const NodeListSidebar: React.FC = () => {
      const nodeTypes: { name: string; icon: React.ElementType; type: NodeType }[] = [
        { name: 'Satellite', icon: Satellite, type: 'SAT' },
        { name: 'Ground Station', icon: RadioTower, type: 'GS' },
        { name: 'User Terminal', icon: Smartphone, type: 'UE' },
      ];

      // --- Drag and Drop Handling ---
      const handleDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: NodeType) => {
        event.dataTransfer.setData('application/node-type', nodeType);
        event.dataTransfer.effectAllowed = 'move';
        event.currentTarget.classList.add('opacity-50', 'ring-2', 'ring-albor-orange');
      };

      const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
        event.currentTarget.classList.remove('opacity-50', 'ring-2', 'ring-albor-orange');
      };

      return (
        // *** REMOVED w-48 *** Added h-full to allow vertical filling if needed by parent
        <div className="bg-albor-bg-dark/50 border-r border-albor-bg-dark p-3 flex flex-col space-y-3 flex-shrink-0 h-full">
           <h3 className="text-sm font-semibold text-albor-light-gray mb-1 px-1">Components</h3>
          {nodeTypes.map((item) => (
            <DraggableNodeItem
              key={item.type}
              name={item.name}
              icon={item.icon}
              type={item.type}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
           {/* Add a small helper text at the bottom */}
           <div className="mt-auto pt-3 border-t border-albor-bg-dark/50">
                <p className="text-[10px] text-albor-dark-gray text-center">
                    Configure details (position, orbit, etc.) in the right panel after adding a node.
                </p>
           </div>
        </div>
      );
    };

    export default NodeListSidebar;
