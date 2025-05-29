import { useQuery } from "@tanstack/react-query";
import { Database, Globe, FileImage, Users } from "lucide-react";

interface DashboardCardsProps {
  contentTypes: any[];
}

export function DashboardCards({ contentTypes }: DashboardCardsProps) {
  // Define the expected shape of the count response
  interface CountResponse {
    count: number;
  }

  // Fetch media count
  const { data: mediaData, isLoading: mediaLoading } = useQuery<CountResponse>({
    queryKey: ["/api/media/count"],
  });
  
  // Fetch user count
  const { data: userData, isLoading: userLoading } = useQuery<CountResponse>({
    queryKey: ["/api/users/count"],
  });
  
  // Calculate API endpoint count (4 endpoints per content type)
  const apiEndpointCount = contentTypes.length * 4;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Content Types Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-md bg-primary/10">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Content Types</h3>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {contentTypes.length}
            </p>
          </div>
        </div>
      </div>

      {/* API Endpoints Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-md bg-secondary/10">
            <Globe className="w-6 h-6 text-secondary" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">API Endpoints</h3>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {apiEndpointCount}
            </p>
          </div>
        </div>
      </div>

      {/* Media Files Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-md bg-accent/10">
            <FileImage className="w-6 h-6 text-accent" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Media Files</h3>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {mediaLoading ? "..." : mediaData?.count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Users Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-md bg-dark/10">
            <Users className="w-6 h-6 text-dark" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Users</h3>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {userLoading ? "..." : userData?.count || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
