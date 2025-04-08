import React, { useEffect, useRef } from 'react';
          import { Trash2 } from 'lucide-react';

          interface CanvasContextMenuProps {
            x: number;
            y: number;
            type: 'node' | 'edge' | 'pane'; // Changed 'link' to 'edge' for consistency
            itemId?: string; // ID of the node or edge, undefined for pane
            onClose: () => void;
            onDelete: (itemId: string) => void; // Callback to delete the item
            canDeleteEdge?: boolean; // Prop to control edge deletion visibility
          }

          const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
            x,
            y,
            type,
            itemId,
            onClose,
            onDelete,
            canDeleteEdge = true, // Default to true (allow delete)
          }) => {
            const menuRef = useRef<HTMLDivElement>(null);

            // Close menu if clicking outside
            useEffect(() => {
              const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                  onClose();
                }
              };
              document.addEventListener('mousedown', handleClickOutside);
              return () => {
                document.removeEventListener('mousedown', handleClickOutside);
              };
            }, [onClose]);

            const handleDeleteClick = () => {
              if (itemId) {
                onDelete(itemId); // Call the passed delete handler
              }
              onClose(); // Close menu after action
            };

            // Adjust position if menu goes off-screen (basic implementation)
            const style: React.CSSProperties = {
              position: 'fixed',
              top: y,
              left: x,
              zIndex: 1000,
            };
            // Add boundary checks here if needed

            const showDeleteNode = type === 'node' && itemId;
            const showDeleteEdge = type === 'edge' && itemId && canDeleteEdge; // Check canDeleteEdge flag

            return (
              <div
                ref={menuRef}
                style={style}
                className="bg-albor-bg-dark border border-albor-dark-gray rounded shadow-lg py-1 w-32 text-xs"
                // Prevent the context menu itself from triggering the canvas context menu
                onContextMenu={(e) => e.preventDefault()}
              >
                {/* Show delete option only for nodes */}
                {showDeleteNode && (
                  <button
                    onClick={handleDeleteClick} // Connect delete handler
                    className="flex items-center w-full px-2 py-1 text-left text-albor-light-gray hover:bg-albor-orange/20 hover:text-albor-orange"
                  >
                    <Trash2 size={14} className="mr-1.5" /> Delete Node
                  </button>
                )}
                 {/* Show delete option for edges only if allowed */}
                 {showDeleteEdge && (
                  <button
                    onClick={handleDeleteClick} // Connect delete handler
                    className="flex items-center w-full px-2 py-1 text-left text-albor-light-gray hover:bg-albor-orange/20 hover:text-albor-orange"
                  >
                    <Trash2 size={14} className="mr-1.5" /> Delete Edge
                  </button>
                )}
                {/* Add more actions based on type */}
                {type === 'pane' && (
                   <div className="px-2 py-1 text-albor-dark-gray italic">(No actions)</div>
                  /* Add canvas actions like 'Paste', 'Add Node Here' later */
                )}
                {/* Indicate no actions if delete is hidden */}
                {type === 'edge' && itemId && !canDeleteEdge && (
                     <div className="px-2 py-1 text-albor-dark-gray italic">(No actions)</div>
                )}
              </div>
            );
          };

          export default CanvasContextMenu;
