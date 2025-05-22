import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { DashboardCards } from "@/components/DashboardCards";
import { ContentTypeList } from "@/components/ContentTypeList";
import { ActivityFeed } from "@/components/ActivityFeed";
import { QuickActions } from "@/components/QuickActions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch content types
  const { data: contentTypes, isLoading: contentTypesLoading } = useQuery({
    queryKey: ["/api/content-types"],
    enabled: isAuthenticated,
  });

  // Fetch recent activity
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/activity"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout pageTitle="Dashboard">
      {/* Welcome Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Welcome to Corebase CMS</h2>
            <p className="mt-1 text-gray-600">Build and manage content types easily with our powerful admin interface.</p>
          </div>
          <Button
            className="bg-primary text-dark font-medium hover:bg-primary/90"
            onClick={() => navigate("/content-type-builder")}
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardCards contentTypes={contentTypes || []} />

      {/* Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Content Types Section */}
        <div className="lg:col-span-2">
          <ContentTypeList 
            contentTypes={contentTypes || []} 
            isLoading={contentTypesLoading} 
          />
        </div>

        {/* Activity & Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
          <ActivityFeed activity={activity || []} isLoading={activityLoading} />
        </div>
      </div>
    </AdminLayout>
  );
}
