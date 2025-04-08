import React from 'react'
import { Upload, Plus } from 'lucide-react' // Import Plus

const Header: React.FC = () => {
  return (
    // Use a semi-transparent dark background, slightly lighter border
    <header className="flex items-center justify-between p-4 border-b border-albor-bg-dark/50 bg-albor-bg-dark/70 backdrop-blur-sm z-10"> {/* Added backdrop blur */}
      <div className="flex items-center space-x-4">
        {/* Logo Placeholder - Use Albor Orange */}
        <div className="w-8 h-8 bg-albor-orange rounded-full shadow-glow-orange"></div> {/* Added glow */}
        {/* Apply wide tracking and color mix */}
        <span className="text-xl font-bold text-white tracking-widest-lg"> {/* Wider tracking */}
          ALBOR
          <span className="font-semibold text-albor-dark-gray opacity-80">SPACE</span>
        </span>
        <span className="text-albor-dark-gray ml-6 text-sm">Channel Emulator</span> {/* Smaller text */}
      </div>
      <nav className="flex items-center space-x-6 text-sm text-albor-light-gray">
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
