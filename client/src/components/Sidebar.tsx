import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Menu,
  LayoutDashboard,
  Settings,
  FileCode,
  Image,
  Database,
  Users,
  Code,
  FileText,
  Rocket,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
}

export function Sidebar({ open, onClose, collapsed: externalCollapsed }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Use externally provided collapsed state if provided, otherwise use internal state
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  // Get content types for sidebar
  const { data: contentTypes = [] } = useQuery({
    queryKey: ["/api/content-types"],
    queryFn: async () => {
      const res = await fetch("/api/content-types");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });

  const sidebarItems = [
    {
      title: "General",
      items: [
        {
          name: "Dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          path: "/",
        },
        {
          name: "Content-Type Builder",
          icon: <Database className="h-5 w-5" />,
          path: "/content-type-builder",
          requiredRole: "administrator",
        },
        {
          name: "Content Manager",
          icon: <FileText className="h-5 w-5" />,
          path: "/content-manager",
        },
        {
          name: "Deployment Templates",
          icon: <Rocket className="h-5 w-5" />,
          path: "/deployment-templates",
          requiredRole: "administrator",
        },
      ],
    },
    {
      title: "Content",
      items:
        contentTypes?.map((contentType: any) => ({
          name: contentType.displayName,
          icon: <FileText className="h-5 w-5" />,
          path: `/content/${contentType.apiId}`,
        })) || [],
      dynamicSection: true,
    },
    {
      title: "Media",
      items: [
        {
          name: "Media Library",
          icon: <Image className="h-5 w-5" />,
          path: "/media",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          name: "User Management",
          icon: <Users className="h-5 w-5" />,
          path: "/users",
          requiredRole: "administrator",
        },
        {
          name: "Settings",
          icon: <Settings className="h-5 w-5" />,
          path: "/settings",
          requiredRole: "administrator",
        },
        {
          name: "API Documentation",
          icon: <Code className="h-5 w-5" />,
          path: "/api-docs",
          requiredRole: "administrator",
        },
      ],
    },
  ];

  // Determine if an item should be shown based on user role
  const canShowItem = (item: any) => {
    if (!item.requiredRole) return true;
    if (!user) return false;

    if (item.requiredRole === "administrator") {
      return user.role === "administrator" || user.role === "administrator";
    } else if (item.requiredRole === "editor") {
      return user.role === "administrator" || user.role === "administrator" || user.role === "editor";
    }

    return true;
  };

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      // On mobile, automatically collapse the sidebar when the screen is small
      if (window.innerWidth < 768) {
        if (!collapsed && !open) {
          setInternalCollapsed(true);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize on mount
    return () => window.removeEventListener("resize", handleResize);
  }, [collapsed, open]);

  // Close sidebar on navigation (mobile)
  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  // Toggle sidebar collapse state
  const toggleCollapsed = () => {
    // Only use the internal collapsed state setter when external state isn't provided
    if (externalCollapsed === undefined) {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  return (
    <>
      {/* Mobile hamburger menu button - fixed at the top left */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={onClose}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open sidebar</span>
      </Button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 h-full overflow-hidden bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-0 md:overflow-hidden" : "md:w-64",
        )}
      >
        {/* Logo and sidebar header */}
        <div className={cn(
          "flex items-center px-4 h-16 border-b border-border",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <span className="text-primary-foreground text-sm font-bold">C</span>
              </div>
              <h1 className="text-lg font-bold">Corebase</h1>
            </div>
          )}

          {collapsed && (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <span className="text-primary-foreground text-sm font-bold">C</span>
            </div>
          )}

          {/* Close button (mobile only) */}
          {!collapsed && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close sidebar</span>
              </Button>

              {/* Collapse button (desktop only) */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={toggleCollapsed}
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Collapse sidebar</span>
              </Button>
            </div>
          )}

          {/* Expand button when collapsed (desktop only) */}
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex mt-4"
              onClick={toggleCollapsed}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Expand sidebar</span>
            </Button>
          )}
        </div>

        {/* Sidebar Navigation */}
        <ScrollArea className="flex-1">
          <TooltipProvider delayDuration={0}>
            <nav className={cn("p-2 space-y-2", collapsed && "flex flex-col items-center")}>
              {sidebarItems.map((section, idx) => {
                // Filter items based on role permissions
                const visibleItems = section.items.filter(canShowItem);

                // Skip empty sections
                if (visibleItems.length === 0 && !section.dynamicSection) {
                  return null;
                }

                return (
                  <div key={idx} className={cn("mb-4", collapsed ? "w-full flex flex-col items-center" : "")}>
                    {!collapsed && (
                      <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {section.title}
                      </p>
                    )}

                    {/* Show placeholder if content types are loading */}
                    {!collapsed && section.dynamicSection && contentTypes?.length === 0 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground italic">
                        No {section.title.toLowerCase()} types available
                      </div>
                    )}

                    {visibleItems.map((item, itemIdx) => (
                      <Tooltip key={itemIdx}>
                        <TooltipTrigger asChild>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigation(item.path);
                            }}
                            className={cn(
                              "flex items-center rounded-md w-full",
                              collapsed ? "justify-center p-2 mx-auto" : "px-2 py-2",
                              location === item.path 
                                ? "bg-accent text-accent-foreground" 
                                : "text-foreground hover:bg-accent/50 hover:text-accent-foreground",
                            )}
                          >
                            <span className={cn("flex-shrink-0", !collapsed && "mr-3")}>
                              {item.icon}
                            </span>
                            {!collapsed && (
                              <span className="text-sm font-medium">{item.name}</span>
                            )}
                          </a>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            {item.name}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                );
              })}
            </nav>
          </TooltipProvider>
        </ScrollArea>

        {/* User profile */}
        {user && (
          <div className={cn(
            "border-t border-border p-2",
            collapsed ? "items-center justify-center" : "px-4 py-3"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center",
                  collapsed ? "flex-col" : ""
                )}>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">
                        {user.username.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {!collapsed && (
                    <>
                      <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        onClick={() => {
                          // Handle logout here
                          navigate("/login");
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Logout</span>
                      </Button>
                    </>
                  )}

                  {collapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-2"
                      onClick={() => {
                        // Handle logout here
                        navigate("/login");
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">Logout</span>
                    </Button>
                  )}
                </div>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  {user.username} ({user.role})
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}
      </aside>
    </>
  );
}