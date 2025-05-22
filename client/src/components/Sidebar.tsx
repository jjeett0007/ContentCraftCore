import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  
  // Get content types for sidebar
  const { data: contentTypes } = useQuery({
    queryKey: ["/api/content-types"],
    enabled: !!user,
  });
  
  const sidebarItems = [
    {
      title: "General",
      items: [
        {
          name: "Dashboard",
          icon: "dashboard",
          path: "/",
        },
        {
          name: "Content-Type Builder",
          icon: "build",
          path: "/content-type-builder",
          requiredRole: "admin",
        },
        {
          name: "Content Manager",
          icon: "extension",
          path: "/content-manager",
        },
      ],
    },
    {
      title: "Content",
      items: contentTypes?.map((contentType: any) => ({
        name: contentType.displayName,
        icon: "article",
        path: `/content/${contentType.apiId}`,
      })) || [],
      dynamicSection: true,
    },
    {
      title: "Media",
      items: [
        {
          name: "Media Library",
          icon: "perm_media",
          path: "/media",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          name: "User Management",
          icon: "admin_panel_settings",
          path: "/users",
          requiredRole: "admin",
        },
        {
          name: "Settings",
          icon: "settings",
          path: "/settings",
          requiredRole: "admin",
        },
      ],
    },
  ];
  
  // Determine if an item should be shown based on user role
  const canShowItem = (item: any) => {
    if (!item.requiredRole) return true;
    if (!user) return false;
    
    if (item.requiredRole === "admin") {
      return user.role === "admin";
    } else if (item.requiredRole === "editor") {
      return user.role === "admin" || user.role === "editor";
    }
    
    return true;
  };
  
  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && open) {
        onClose();
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, onClose]);
  
  // Close sidebar on navigation (mobile)
  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 flex-shrink-0 overflow-hidden bg-sidebar-background text-sidebar-foreground transition-transform duration-300 ease-in-out transform md:translate-x-0 md:static md:inset-0 custom-scrollbar",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo and sidebar header */}
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <span className="text-sidebar-primary-foreground text-xl font-bold">C</span>
            </div>
            <h1 className="text-xl font-bold">Corebase</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-sidebar-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <ScrollArea className="flex-1 px-2">
          <nav className="mt-5 space-y-6">
            {sidebarItems.map((section, idx) => {
              // Filter items based on role permissions
              const visibleItems = section.items.filter(canShowItem);
              
              // Skip empty sections
              if (visibleItems.length === 0 && !section.dynamicSection) {
                return null;
              }
              
              return (
                <div key={idx} className="mb-6">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </p>
                  
                  {/* Show placeholder if content types are loading */}
                  {section.dynamicSection && contentTypes?.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-400 italic">
                      No {section.title.toLowerCase()} types available
                    </div>
                  )}
                  
                  {visibleItems.map((item, itemIdx) => (
                    <a
                      key={itemIdx}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(item.path);
                      }}
                      className={cn(
                        "sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md mt-1",
                        location === item.path && "active"
                      )}
                    >
                      <span className="material-icons mr-3 text-xl">{item.icon}</span>
                      {item.name}
                    </a>
                  ))}
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User profile */}
        {user && (
          <div className="flex items-center px-4 py-3 mt-auto border-t border-sidebar-border">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white">
                <span className="text-sm font-medium">
                  {user.username.substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-sidebar-foreground">{user.username}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto text-gray-400 hover:text-gray-100"
              onClick={() => {
                // Handle logout here
                navigate("/login");
              }}
            >
              <span className="material-icons text-sm">logout</span>
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
