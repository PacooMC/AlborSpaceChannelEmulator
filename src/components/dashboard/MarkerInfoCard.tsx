import React from 'react';
    import { MapPin, TrendingUp, Thermometer, X, Orbit, RadioTower, Smartphone, Wifi } from 'lucide-react';
    // Import types from the new content location
    import { MapMarker, NodeType } from '../../content/mapData';

    interface MarkerInfoCardProps {
      marker: MapMarker;
      onClose: () => void;
      isMaximized: boolean;
    }

    const InfoItem: React.FC<{ icon: React.ElementType; label: string; value: string | number | undefined; isMaximized: boolean }> =
      ({ icon: Icon, label, value, isMaximized }) => (
      <div className={`flex items-center space-x-1.5 ${isMaximized ? 'text-sm' : 'text-xs'}`}>
        <Icon className="text-albor-dark-gray flex-shrink-0" size={isMaximized ? 16 : 14} />
        <span className="text-albor-dark-gray">{label}:</span>
        <span className="text-albor-light-gray font-medium truncate">{value ?? 'N/A'}</span>
      </div>
    );

    const getHeaderIcon = (nodeType: NodeType, isMaximized: boolean) => {
        const size = isMaximized ? 18 : 16;
        switch (nodeType) {
          case 'SAT': return <Orbit size={size} className="mr-2 text-albor-orange"/>;
          case 'GS': return <RadioTower size={size} className="mr-2 text-albor-orange"/>;
          case 'UE': return <Smartphone size={size} className="mr-2 text-albor-orange"/>;
          default: return null;
        }
      };

    const MarkerInfoCard: React.FC<MarkerInfoCardProps> = ({ marker, onClose, isMaximized }) => {

      return (
        <div className={`
          info-card-container absolute bottom-4 left-4 z-20
          bg-albor-bg-dark/90 backdrop-blur-md rounded border border-albor-bg-dark/50 shadow-lg
          text-albor-light-gray animate-fade-in
          transition-all duration-200 ease-in-out
          ${isMaximized ? 'w-72 p-4' : 'w-64 p-3'}
        `}>
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-albor-bg-dark/50">
            <h4 className={`font-semibold flex items-center truncate ${isMaximized ? 'text-base' : 'text-sm'}`}>
              {getHeaderIcon(marker.type, isMaximized)}
              {marker.name}
            </h4>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-albor-dark-gray hover:bg-albor-bg-dark hover:text-albor-light-gray transition-colors flex-shrink-0 ml-1"
              title="Close"
            >
              <X size={isMaximized ? 18 : 16} />
            </button>
          </div>

          <div className={`space-y-${isMaximized ? '2' : '1.5'}`}>
            <InfoItem icon={MapPin} label="Coords" value={`${marker.coordinates[1].toFixed(2)}°, ${marker.coordinates[0].toFixed(2)}°`} isMaximized={isMaximized} />

            {marker.type === 'SAT' && (
              <>
                <InfoItem icon={TrendingUp} label="Altitude" value={marker.altitude ? `${marker.altitude} km` : undefined} isMaximized={isMaximized} />
                <InfoItem icon={Orbit} label="Inclination" value={marker.inclination !== undefined ? `${marker.inclination}°` : undefined} isMaximized={isMaximized} />
                <InfoItem icon={Thermometer} label="Signal" value={marker.signalStrength ? `${marker.signalStrength} dBm` : undefined} isMaximized={isMaximized} />
              </>
            )}

            {marker.type === 'GS' && (
              <>
                <InfoItem icon={MapPin} label="Location" value={marker.locationName} isMaximized={isMaximized} />
                <InfoItem icon={Wifi} label="Status" value={marker.connectionStatus} isMaximized={isMaximized} />
              </>
            )}

            {marker.type === 'UE' && (
              <>
                <InfoItem icon={MapPin} label="Location" value={marker.locationName} isMaximized={isMaximized} />
                <InfoItem icon={Wifi} label="Connection" value={marker.connectionStatus} isMaximized={isMaximized} />
              </>
            )}

          </div>
        </div>
      );
    };

    export default MarkerInfoCard;
