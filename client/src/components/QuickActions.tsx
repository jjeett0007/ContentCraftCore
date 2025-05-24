import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Upload, UserPlus, Settings } from "lucide-react";

export function QuickActions() {
  const [, navigate] = useLocation();

  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg text-gray-800 dark:text-gray-200">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <a 
          href="#" 
          className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
          onClick={(e) => {
            e.preventDefault();
            navigate("/content-type-builder");
          }}
        >
          <div className="flex-shrink-0 p-2 rounded-md bg-primary/10">
            <PlusCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Content Type</p>
          </div>
        </a>
        
        <a 
          href="#" 
          className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
          onClick={(e) => {
            e.preventDefault();
            navigate("/media");
          }}
        >
          <div className="flex-shrink-0 p-2 rounded-md bg-secondary/10">
            <Upload className="h-5 w-5 text-secondary" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Media</p>
          </div>
        </a>
        
        <a 
          href="#" 
          className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
          onClick={(e) => {
            e.preventDefault();
            navigate("/users");
          }}
        >
          <div className="flex-shrink-0 p-2 rounded-md bg-accent/10">
            <UserPlus className="h-5 w-5 text-accent" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add User</p>
          </div>
        </a>
        
        <a 
          href="#" 
          className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
          onClick={(e) => {
            e.preventDefault();
            navigate("/settings");
          }}
        >
          <div className="flex-shrink-0 p-2 rounded-md bg-dark/10">
            <Settings className="h-5 w-5 text-dark" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Configure Settings</p>
          </div>
        </a>
      </CardContent>
    </Card>
  );
}
