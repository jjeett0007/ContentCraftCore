import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

export function AdminLayout({
  children,
  pageTitle = "Dashboard",
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-full overflow-hidden md:pl-[70px] md:w-[calc(100%-70px)]">
        {/* Top Navigation */}
        <header className="bg-card shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            {/* Page title - pushed to left on desktop for alignment with collapsed sidebar */}
            <div className="flex-1 md:pl-14">
              <h2 className="text-xl font-semibold">
                {pageTitle}
              </h2>
            </div>
            
            {/* Header actions on the right */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notification Bell */}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>

              {/* Help Button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help</span>
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">
                        {user?.username?.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.username}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {user?.role}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate("/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate("/settings")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
