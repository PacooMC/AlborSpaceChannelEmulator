import React, { useState, useRef, useEffect } from 'react';
import { UserCircle, Settings, LogOut } from 'lucide-react'; // Import icons for dropdown

// Simplified Header Props
interface HeaderProps {}

const Header: React.FC<HeaderProps> = ({}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    console.log("Logout action triggered");
    alert("Simulating logout...");
    setIsDropdownOpen(false);
    // Add actual logout logic here (e.g., clear token, redirect)
  };

  // Placeholder function to navigate to settings (replace with actual routing/view change)
  const navigateToSettings = () => {
      console.log("Navigate to settings triggered");
      alert("Simulating navigation to Settings view..."); // Replace with actual navigation
      setIsDropdownOpen(false);
      // Example: setActiveView('settings') if using App state for navigation
  };

  return (
    <header className="flex items-center justify-between p-3 border-b border-albor-bg-dark/50 bg-albor-bg-dark/70 backdrop-blur-sm z-10 flex-shrink-0">
      {/* Left Side: Logo & Title */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="w-8 h-8 bg-albor-orange rounded-full shadow-glow-orange flex-shrink-0"></div>
        <span className="text-xl font-bold text-white tracking-widest-lg flex-shrink-0">
          ALBOR<span className="font-semibold text-albor-dark-gray opacity-80">SPACE</span>
        </span>
      </div>

      {/* Center */}
      <div className="flex-1"></div>

      {/* Right Side: User Profile Dropdown */}
      <nav className="flex items-center space-x-4 text-sm text-albor-light-gray flex-shrink-0">
        <div className="relative" ref={dropdownRef}>
          {/* User Icon Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`p-1.5 rounded-full border transition-colors ${isDropdownOpen ? 'border-albor-light-gray text-albor-light-gray' : 'border-albor-dark-gray text-albor-dark-gray hover:text-albor-light-gray hover:border-albor-light-gray'}`}
            title="User Menu"
          >
            <UserCircle size={18} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-albor-bg-dark border border-albor-dark-gray rounded-md shadow-lg py-1 z-50 animate-fade-in">
              {/* Optional: User Info */}
              <div className="px-3 py-2 border-b border-albor-dark-gray/50 mb-1">
                  <p className="text-sm font-medium text-albor-light-gray truncate">Operator User</p>
                  <p className="text-xs text-albor-dark-gray truncate">operator@albor.example</p>
              </div>
              {/* Menu Items */}
              <button
                onClick={navigateToSettings} // Link to settings view
                className="flex items-center w-full px-3 py-1.5 text-left text-xs text-albor-light-gray hover:bg-albor-orange/20 hover:text-albor-orange transition-colors"
              >
                <Settings size={14} className="mr-2" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-1.5 text-left text-xs text-albor-light-gray hover:bg-albor-orange/20 hover:text-albor-orange transition-colors"
              >
                <LogOut size={14} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Header;
