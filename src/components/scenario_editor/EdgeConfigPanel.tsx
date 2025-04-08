import React, { useState, useEffect, useCallback } from 'react';
    import { Link, Settings } from 'lucide-react'; // Import Link icon
    import { ScenarioEdge, CustomEdgeData } from './types'; // Import types

    // --- Helper Input Component (Similar to NodeConfigSidebar's) ---
    const ConfigInput: React.FC<{ id: string; label: string; value: string | number | undefined; onChange: (value: string) => void; onSave: () => void; type?: string; placeholder?: string; step?: string | number; rows?: number; min?: string | number; max?: string | number; }> =
      ({ id, label, value, onChange, onSave, type = "text", placeholder, step, rows, min, max }) => {
        const [currentValue, setCurrentValue] = useState(value ?? '');
        useEffect(() => { setCurrentValue(value ?? ''); }, [value]);
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setCurrentValue(e.target.value); };
        const handleBlur = () => { if (currentValue !== (value ?? '')) { onChange(String(currentValue)); onSave(); } }; // Trigger update on blur
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => { if (e.key === 'Enter' && type !== 'textarea') { handleBlur(); e.currentTarget.blur(); } else if (e.key === 'Escape') { setCurrentValue(value ?? ''); e.currentTarget.blur(); } };
        const commonProps = { id, value: currentValue, onChange: handleChange, onBlur: handleBlur, onKeyDown: handleKeyDown, placeholder: placeholder || label, className: "w-full bg-albor-deep-space/50 border border-albor-bg-dark rounded px-2 py-1 text-xs placeholder-albor-dark-gray focus:outline-none focus:ring-1 focus:ring-albor-orange", };
        return ( <div> <label htmlFor={id} className="block text-albor-dark-gray mb-1 text-xs">{label}</label> {type === 'textarea' ? <textarea {...commonProps} rows={rows || 3}></textarea> : <input {...commonProps} type={type} step={step} min={min} max={max} />} </div> );
    };
    // --- End Helper Input Component ---

    interface EdgeConfigPanelProps {
      selectedEdge: ScenarioEdge; // Expect a non-null edge
      onEdgeUpdate: (edgeId: string, updates: Partial<CustomEdgeData>) => void;
    }

    const EdgeConfigPanel: React.FC<EdgeConfigPanelProps> = ({ selectedEdge, onEdgeUpdate }) => {
      const [edgeData, setEdgeData] = useState<Partial<CustomEdgeData>>(selectedEdge.data || {});

      // Update local state if the selected edge changes externally
      useEffect(() => {
        setEdgeData(selectedEdge.data || {});
      }, [selectedEdge]);

      // Handle updates to edge data fields
      const handleUpdate = useCallback((field: keyof CustomEdgeData, value: any) => {
        if (!selectedEdge) return;
        const updates = { [field]: value };
        setEdgeData(prev => ({ ...prev, ...updates })); // Update local state immediately
        onEdgeUpdate(selectedEdge.id, updates); // Propagate valid updates (will be debounced by parent)
      }, [selectedEdge, onEdgeUpdate]);

      // Placeholder save function for ConfigInput (actual save is debounced in parent)
      const handleSave = useCallback(() => {
        // The actual save is handled by the debounced auto-save in the parent component
        // triggered by the state change from onEdgeUpdate.
      }, []);

      return (
        <div className="flex-1 space-y-3 overflow-y-auto p-1">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-albor-bg-dark flex-shrink-0">
            <Link size={16} className="text-albor-orange"/>
            <h3 className="text-sm font-semibold text-albor-light-gray truncate" title={`Edge: ${selectedEdge.id}`}>
              Edge Configuration
            </h3>
          </div>

          {/* Edge Info */}
          <div>
            <span className="text-albor-dark-gray text-xs">ID:</span>
            <span className="ml-2 text-albor-light-gray font-mono text-xs break-all">{selectedEdge.id}</span>
          </div>
           <div>
            <span className="text-albor-dark-gray text-xs">Source Node:</span>
            <span className="ml-2 text-albor-light-gray font-mono text-xs">{selectedEdge.source}</span>
          </div>
           <div>
            <span className="text-albor-dark-gray text-xs">Target Node:</span>
            <span className="ml-2 text-albor-light-gray font-mono text-xs">{selectedEdge.target}</span>
          </div>

          <hr className="border-albor-bg-dark my-3"/>

          {/* Configurable Properties */}
          <h4 className="text-xs font-semibold text-albor-dark-gray">Link Properties</h4>
          <ConfigInput
            id={`edgeChannelModel-${selectedEdge.id}`}
            label="Channel Model"
            value={edgeData.channelModel}
            onChange={(val) => handleUpdate('channelModel', val)}
            onSave={handleSave}
            placeholder="e.g., AWGN, Rain Fade"
          />
          <ConfigInput
            id={`edgeFrequency-${selectedEdge.id}`}
            label="Frequency"
            value={edgeData.frequency}
            onChange={(val) => handleUpdate('frequency', val)}
            onSave={handleSave}
            placeholder="e.g., 2.4 GHz, 14.5 GHz"
          />
           <ConfigInput
            id={`edgeBandwidth-${selectedEdge.id}`}
            label="Bandwidth"
            value={edgeData.bandwidth}
            onChange={(val) => handleUpdate('bandwidth', val)}
            onSave={handleSave}
            placeholder="e.g., 20 MHz, 100 MHz"
          />

          {/* Add more configuration inputs as needed */}

          <hr className="border-albor-bg-dark my-3"/>
          <p className="text-albor-dark-gray italic text-xs">
            (Link properties are used for simulation in Custom mode.)
          </p>
        </div>
      );
    };

    export default EdgeConfigPanel;
