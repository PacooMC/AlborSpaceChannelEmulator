import React from 'react';

// Simple wrapper component for the main content area
// Ensures consistent padding and allows content to scroll
const MainContentArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <main className="flex-1 p-6 overflow-y-auto bg-albor-deep-space"> {/* Use deep space bg, add padding */}
      {children}
    </main>
  );
};

export default MainContentArea;
