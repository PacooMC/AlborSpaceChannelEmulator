import React from 'react';
      import { Handle, Position, NodeProps } from 'reactflow';
      import { Smartphone } from 'lucide-react';
      import { CustomNodeData, ScenarioType } from '../types'; // Import ScenarioType

      // Extend CustomNodeData to potentially include scenarioType if passed via data
      interface UeNodeData extends CustomNodeData {
        scenarioType?: ScenarioType;
      }

      const UeNode: React.FC<NodeProps<UeNodeData>> = ({ data, isConnectable }) => {
        // Determine connectability based on scenarioType passed in data
        const allowConnections = data.scenarioType === 'custom' && isConnectable;

        return (
          <div className="albor-node">
             {/* Render handles only if connections are allowed */}
             {allowConnections && (
               <>
                 <Handle type="target" position={Position.Top} id="t-in" isConnectable={allowConnections} />
                 <Handle type="source" position={Position.Bottom} id="s-out" isConnectable={allowConnections} />
                 <Handle type="target" position={Position.Left} id="l-in" isConnectable={allowConnections} />
                 <Handle type="source" position={Position.Left} id="l-out" isConnectable={allowConnections} />
                 <Handle type="target" position={Position.Right} id="r-in" isConnectable={allowConnections} />
                 <Handle type="source" position={Position.Right} id="r-out" isConnectable={allowConnections} />
               </>
             )}

            <div className="albor-node-header">
              <Smartphone size={14} className="albor-node-icon" />
              <div className="albor-node-name">{data.name}</div>
            </div>
            <div className="albor-node-body">
              Type: {data.type}
            </div>
          </div>
        );
      };

      export default UeNode;
