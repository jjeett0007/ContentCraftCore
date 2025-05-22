import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activity: any[];
  isLoading: boolean;
}

export function ActivityFeed({ activity, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg text-gray-800 dark:text-gray-200">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <Card>
        <CardHeader className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg text-gray-800 dark:text-gray-200">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <User className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the user's initials for the avatar
  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  // Get background color for the avatar based on role
  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-accent';
      case 'editor':
        return 'bg-primary';
      case 'viewer':
        return 'bg-secondary';
      default:
        return 'bg-muted';
    }
  };

  // Format the activity message
  const formatActivityMessage = (activity: any) => {
    const { action, entityType, details } = activity;
    
    switch (action) {
      case 'create':
        if (entityType === 'content_type') {
          return <>created a new content type <span className="font-medium text-gray-900 dark:text-gray-100">{details?.name}</span></>;
        } else if (entityType === 'user') {
          return <>registered as a new user</>;
        } else {
          return <>created a new {entityType.replace(/_/g, ' ')} entry</>;
        }
      case 'update':
        if (entityType === 'content_type') {
          return <>updated the schema for <span className="font-medium text-gray-900 dark:text-gray-100">{details?.name}</span></>;
        } else {
          return <>updated a {entityType.replace(/_/g, ' ')}</>;
        }
      case 'delete':
        return <>deleted a {entityType.replace(/_/g, ' ')}</>;
      case 'upload':
        return <>uploaded <span className="font-medium text-gray-900 dark:text-gray-100">{details?.name}</span> to the media library</>;
      default:
        return <>performed an action on {entityType.replace(/_/g, ' ')}</>;
    }
  };

  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg text-gray-800 dark:text-gray-200">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-5 sm:p-6">
        <ul className="space-y-4">
          {activity.map((item) => (
            <li key={item.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full ${getAvatarColor(item.user?.role)} flex items-center justify-center text-white`}>
                  <span className="text-sm font-medium">
                    {item.user ? getUserInitials(item.user.username) : "?"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.user?.username || "Unknown User"}
                  </span>{" "}
                  {formatActivityMessage(item)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : "some time ago"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
