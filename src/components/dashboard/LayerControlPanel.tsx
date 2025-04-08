import React from 'react';
    // Import necessary icons - Added MapPin
    import { X, Eye, EyeOff, Satellite, Radio, Smartphone, MapPin, Orbit } from 'lucide-react';
    import { LayerVisibility } from './HologramMap'; // Import visibility type

    interface LayerControlPanelProps {
      visibility: LayerVisibility;
      setVisibility: React.Dispatch<React.SetStateAction<LayerVisibility>>;
      onClose: () => void;
    }

    const LayerToggle: React.FC<{ label: string; icon: React.ElementType; isVisible: boolean; onToggle: () => void }> =
      ({ label, icon: Icon, isVisible, onToggle }) => (
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-2 py-1.5 text-xs rounded hover:bg-albor-bg-dark/50 transition-colors"
      >
        <div className="flex items-center space-x-1.5">
           <Icon size={14} className={isVisible ? 'text-albor-orange' : 'text-albor-dark-gray'}/>
           <span className={isVisible ? 'text-albor-light-gray' : 'text-albor-dark-gray line-through'}>{label}</span>
        </div>
        {isVisible ? <Eye size={14} className="text-green-500" /> : <EyeOff size={14} className="text-albor-dark-gray" />}
      </button>
    );

    const LayerControlPanel: React.FC<LayerControlPanelProps> = ({ visibility, setVisibility, onClose }) => {

      // Ensure toggleLayer uses the correct keys from LayerVisibility type
      const toggleLayer = (layer: keyof LayerVisibility) => {
        setVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
      };

      return (
        <div className="absolute top-12 right-2 z-20 w-48 bg-albor-bg-dark/90 backdrop-blur-md rounded border border-albor-bg-dark/50 shadow-lg p-2 text-albor-light-gray animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-center mb-1 pb-1 border-b border-albor-bg-dark/50">
            <h4 className="text-xs font-semibold">Layers</h4>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-albor-dark-gray hover:bg-albor-bg-dark hover:text-albor-light-gray transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Toggles - Use correct keys and icons */}
          <div className="space-y-1">
            {/* Use the imported MapPin icon */}
            <LayerToggle label="Countries" icon={MapPin} isVisible={visibility.countries} onToggle={() => toggleLayer('countries')} />
            {/* Graticule toggle removed as it's always on in HologramMap */}
            {/* <LayerToggle label="Graticule" icon={Grid} isVisible={visibility.graticule} onToggle={() => toggleLayer('graticule')} /> */}
            <LayerToggle label="Satellites" icon={Satellite} isVisible={visibility.satellites} onToggle={() => toggleLayer('satellites')} />
            <LayerToggle label="Ground Stations" icon={Radio} isVisible={visibility.groundStations} onToggle={() => toggleLayer('groundStations')} />
            <LayerToggle label="User Terminals" icon={Smartphone} isVisible={visibility.userTerminals} onToggle={() => toggleLayer('userTerminals')} />
            <LayerToggle label="Footprints" icon={Orbit} isVisible={visibility.footprints} onToggle={() => toggleLayer('footprints')} />
          </div>
        </div>
      );
    };

    export default LayerControlPanel;
