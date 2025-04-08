import React from 'react'
import { Upload, Plus } from 'lucide-react' // Import Plus

// Update Header props to accept the dynamic title
interface HeaderProps {
  selectedScenarioName?: string; // Make it optional or provide a default
}

const Header: React.FC<HeaderProps> = ({ selectedScenarioName = "Channel Emulator" }) => {
  return (
    // Use a semi-transparent dark background, slightly lighter border
    <header className="flex items-center justify-between p-4 border-b border-albor-bg-dark/50 bg-albor-bg-dark/70 backdrop-blur-sm z-10 flex-shrink-0"> {/* Added flex-shrink-0 */}
      <div className="flex items-center space-x-4">
        {/* Logo Placeholder - Use Albor Orange */}
        <div className="w-8 h-8 bg-albor-orange rounded-full shadow-glow-orange flex-shrink-0"></div> {/* Added glow */}
        {/* Apply wide tracking and color mix */}
        <span className="text-xl font-bold text-white tracking-widest-lg flex-shrink-0"> {/* Wider tracking */}
          ALBOR
          <span className="font-semibold text-albor-dark-gray opacity-80">SPACE</span>
        </span>
        {/* Display the dynamic title passed via props */}
        <span className="text-albor-dark-gray ml-6 text-sm truncate" title={selectedScenarioName}>
          {selectedScenarioName}
        </span>
      </div>
      <nav className="flex items-center space-x-6 text-sm text-albor-light-gray flex-shrink-0">
        {/* Buttons with softer hover */}
        <button className="hover:text-white transition-colors px-2 py-1 rounded hover:bg-albor-bg-dark/50">New Scenario</button>
        <button className="hover:text-white transition-colors px-2 py-1 rounded hover:bg-albor-bg-dark/50">Load Config</button> {/* Shortened */}
        <button className="hover:text-white transition-colors px-2 py-1 rounded hover:bg-albor-bg-dark/50">Start Sim</button> {/* Shortened */}
        <button className="flex items-center hover:text-white transition-colors px-2 py-1 rounded hover:bg-albor-bg-dark/50">
          <Upload size={16} className="mr-1" />
          Export
        </button>
        {/* Use Plus icon, styled */}
        <button className="p-1.5 rounded-full border border-albor-dark-gray text-albor-dark-gray hover:text-albor-light-gray hover:border-albor-light-gray transition-colors">
          <Plus size={16} />
        </button>
      </nav>
    </header>
  )
}

export default Header
