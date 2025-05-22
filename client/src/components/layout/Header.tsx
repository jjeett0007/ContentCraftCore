import React from "react";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title: string;
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onOpenSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {/* Mobile menu button */}
        <button 
          className="p-1 rounded-md text-gray-600 md:hidden" 
          onClick={onOpenSidebar}
        >
          <span className="material-icons">menu</span>
        </button>
        
        <div className="flex-1 px-4 flex justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          <div className="ml-4 flex items-center md:ml-6">
            {/* Notification Bell */}
            <button className="p-2 text-gray-600 hover:text-gray-800 rounded-full">
              <span className="material-icons">notifications</span>
            </button>
            
            {/* Help Button */}
            <button className="ml-2 p-2 text-gray-600 hover:text-gray-800 rounded-full">
              <span className="material-icons">help_outline</span>
            </button>
            
            {/* Profile Avatar */}
            {user && (
              <div className="ml-3 relative">
                <div>
                  <button className="flex items-center max-w-xs rounded-full focus:outline-none">
                    <span className="sr-only">Open user menu</span>
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white">
                      <span className="text-sm font-medium">
                        {user.firstName?.[0] || user.username[0].toUpperCase()}
                        {user.lastName?.[0] || user.username[1]?.toUpperCase() || ''}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
