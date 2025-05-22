import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Admin Pages
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ContentTypeBuilder from "@/pages/ContentTypeBuilder";
import ContentManager from "@/pages/ContentManager";
import ContentEntries from "@/pages/ContentEntries";
import UserManagement from "@/pages/UserManagement";
import MediaLibrary from "@/pages/MediaLibrary";
import Settings from "@/pages/Settings";

// Auth Provider
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  const [location] = useLocation();
  
  // Check if the current route is a login or register page
  const isAuthPage = location === "/login" || location === "/register";
  
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Admin Routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/content-type-builder" component={ContentTypeBuilder} />
      <Route path="/content-manager" component={ContentManager} />
      <Route path="/content/:contentType" component={ContentEntries} />
      <Route path="/users" component={UserManagement} />
      <Route path="/media" component={MediaLibrary} />
      <Route path="/settings" component={Settings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
