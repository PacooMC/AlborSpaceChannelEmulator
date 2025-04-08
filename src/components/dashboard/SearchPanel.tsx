import React, { useState, useEffect } from 'react';
    import { X, Search, Satellite, RadioTower, Smartphone } from 'lucide-react';
    // Import marker data and types from the new content location
    import { dummyMarkers, MapMarker, NodeType } from '../../content/mapData';

    interface SearchPanelProps {
      onClose: () => void;
      // onResultSelect?: (marker: MapMarker) => void;
    }

    const getNodeIcon = (nodeType: NodeType) => {
        switch (nodeType) {
          case 'SAT': return <Satellite size={12} className="text-albor-dark-gray mr-1.5 flex-shrink-0" />;
          case 'GS': return <RadioTower size={12} className="text-albor-dark-gray mr-1.5 flex-shrink-0" />;
          case 'UE': return <Smartphone size={12} className="text-albor-dark-gray mr-1.5 flex-shrink-0" />;
          default: return null;
        }
      };


    const SearchPanel: React.FC<SearchPanelProps> = ({ onClose /*, onResultSelect */ }) => {
      const [searchTerm, setSearchTerm] = useState('');
      const [searchResults, setSearchResults] = useState<MapMarker[]>([]);

      useEffect(() => {
        const term = searchTerm.trim();
        if (term === '') {
          setSearchResults([]);
          return;
        }

        const lowerCaseSearch = term.toLowerCase();
        // Use the imported dummyMarkers for filtering
        const filtered = (dummyMarkers || []).filter(marker =>
          marker.name.toLowerCase().includes(lowerCaseSearch)
        );
        setSearchResults(filtered);
      }, [searchTerm]);

      const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
      };

      const handleResultClick = (marker: MapMarker) => {
        console.log("Selected:", marker.name);
        // if (onResultSelect) {
        //   onResultSelect(marker);
        // }
        setSearchTerm('');
        setSearchResults([]);
        onClose();
      };


      return (
        <div className="absolute top-12 right-2 z-20 w-60 bg-albor-bg-dark/90 backdrop-blur-md rounded border border-albor-bg-dark/50 shadow-lg p-2 text-albor-light-gray animate-fade-in flex flex-col max-h-[calc(100%-4rem)]">
          <div className="flex justify-between items-center mb-1 pb-1 border-b border-albor-bg-dark/50 flex-shrink-0">
            <h4 className="text-xs font-semibold">Search Map</h4>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-albor-dark-gray hover:bg-albor-bg-dark hover:text-albor-light-gray transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="relative mt-1 flex-shrink-0">
             <input
               type="text"
               placeholder="Search satellites, GS, UE..."
               value={searchTerm}
               onChange={handleInputChange}
               className="w-full bg-albor-deep-space/50 border border-albor-bg-dark rounded px-2 py-1 text-xs placeholder-albor-dark-gray focus:outline-none focus:ring-1 focus:ring-albor-orange"
             />
             <Search size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-albor-dark-gray pointer-events-none"/>
          </div>

           <div className="mt-2 overflow-y-auto flex-grow">
             {searchTerm && (
                <>
                  {searchResults.length > 0 ? (
                    <ul className="space-y-1">
                      {searchResults.map(marker => (
                        <li key={marker.id}>
                          <button
                            onClick={() => handleResultClick(marker)}
                            className="w-full text-left flex items-center px-1.5 py-1 text-xs rounded hover:bg-albor-orange/20 transition-colors"
                          >
                            {getNodeIcon(marker.type)}
                            <span className="truncate">{marker.name}</span>
                            <span className="ml-auto text-albor-dark-gray text-[10px] uppercase">({marker.type})</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-xs text-albor-dark-gray italic px-1 py-2">
                        No results found for "{searchTerm}".
                    </p>
                  )}
                </>
             )}
           </div>
        </div>
      );
    };

    export default SearchPanel;
