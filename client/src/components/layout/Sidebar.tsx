import React from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ContentType } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Fetch content types
  const { data: contentTypes } = useQuery<ContentType[]>({
    queryKey: ['/api/content-types'],
    enabled: !!user,
  });

  const sidebarClass = `fixed inset-y-0 left-0 z-20 flex-shrink-0 w-64 overflow-y-auto bg-dark text-white transition-all duration-300 ease-in-out transform ${
    isOpen ? "translate-x-0" : "-translate-x-full"
  } md:translate-x-0 md:static md:inset-0 custom-scrollbar sidebar`;

  // Check if a route is active
  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };

  return (
    <aside className={sidebarClass} id="sidebar">
      {/* Logo and sidebar header */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <span className="text-dark text-xl font-bold">C</span>
          </div>
          <h1 className="text-xl font-bold">Corebase</h1>
        </div>
        <button 
          className="p-1 rounded-md hover:bg-gray-700 md:hidden" 
          onClick={onClose}
        >
          <span className="material-icons">close</span>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="mt-5 px-2 space-y-1">
        <div className="mb-6">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">General</p>
          <Link href="/dashboard">
            <a className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md mt-1 ${isActive('/dashboard') ? 'active' : ''}`}>
              <span className="material-icons mr-3 text-xl">dashboard</span>
              Dashboard
            </a>
          </Link>
          {user?.role === 'administrator' && (
            <Link href="/content-type-builder">
              <a className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md mt-1 ${isActive('/content-type-builder') ? 'active' : ''}`}>
                <span className="material-icons mr-3 text-xl">build</span>
                Content-Type Builder
              </a>
            </Link>
          )}
        </div>

        {contentTypes && contentTypes.length > 0 && (
          <div className="mb-6">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</p>
            {contentTypes.map((contentType) => (
              <Link key={contentType.id} href={`/content/${contentType.apiId}`}>
                <a className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md mt-1 ${isActive(`/content/${contentType.apiId}`) ? 'active' : ''}`}>
                  <span className="material-icons mr-3 text-xl">article</span>
                  {contentType.name}
                </a>
              </Link>
            ))}
            <Link href="/media">
              <a className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md mt-1 ${isActive('/media') ? 'active' : ''}`}>
                <span className="material-icons mr-3 text-xl">perm_media</span>
                Media Library
              </a>
            </Link>
          </div>
        )}

        {user?.role === 'administrator' && (
          <div className="mb-6">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Settings</p>
            <Link href="/users">
              <a className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md mt-1 ${isActive('/users') ? 'active' : ''}`}>
                <span className="material-icons mr-3 text-xl">admin_panel_settings</span>
                User Management
              </a>
            </Link>
            <Link href="/roles">
              <a className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md mt-1 ${isActive('/roles') ? 'active' : ''}`}>
                <span className="material-icons mr-3 text-xl">security</span>
                Roles & Permissions
              </a>
            </Link>
            <Link href="/settings">
              <a className={`sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md mt-1 ${isActive('/settings') ? 'active' : ''}`}>
                <span className="material-icons mr-3 text-xl">settings</span>
                Global Settings
              </a>
            </Link>
          </div>
        )}
      </nav>

      {/* User profile */}
      {user && (
        <div className="flex items-center px-4 py-3 mt-auto border-t border-gray-700">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white">
              <span className="text-sm font-medium">
                {user.firstName?.[0] || user.username[0].toUpperCase()}
                {user.lastName?.[0] || user.username[1]?.toUpperCase() || ''}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user.firstName || user.username}</p>
            <p className="text-xs text-gray-400">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
          </div>
          <button 
            className="ml-auto p-1 rounded-full hover:bg-gray-700"
            onClick={logout}
          >
            <span className="material-icons text-gray-400">logout</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;