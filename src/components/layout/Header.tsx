import React from 'react';
import { Plus } from 'lucide-react'; // Keep Plus for potential future actions

// Simplified Header Props - Scenario selection is removed
interface HeaderProps {
  // We might still want the App's active view name or similar later
  // For now, keep it minimal
}

const Header: React.FC<HeaderProps> = ({}) => {

  return (
    <header className="flex items-center justify-between p-3 border-b border-albor-bg-dark/50 bg-albor-bg-dark/70 backdrop-blur-sm z-10 flex-shrink-0">
      {/* Left Side: Logo & Title */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="w-8 h-8 bg-albor-orange rounded-full shadow-glow-orange flex-shrink-0"></div>
        <span className="text-xl font-bold text-white tracking-widest-lg flex-shrink-0">
          ALBOR<span className="font-semibold text-albor-dark-gray opacity-80">SPACE</span>
        </span>
        {/* Placeholder for potential view title if needed later */}
        {/* <span className="text-albor-dark-gray ml-6 text-sm truncate">View Title</span> */}
      </div>

      {/* Center: Removed Scenario Selector */}
      <div className="flex-1"></div>

      {/* Right Side: Minimal Actions */}
      <nav className="flex items-center space-x-4 text-sm text-albor-light-gray flex-shrink-0">
        {/* Keep only the Plus button for now, representing 'Add' or 'More' */}
        <button className="p-1.5 rounded-full border border-albor-dark-gray text-albor-dark-gray hover:text-albor-light-gray hover:border-albor-light-gray transition-colors">
          <Plus size={16} />
        </button>
      </nav>
    </header>
  )
}

export default Header;
