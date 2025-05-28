import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Pencil, Trash2, Database } from "lucide-react";

interface ContentTypeListProps {
  contentTypes: any[];
  isLoading: boolean;
  onEdit?: (contentType: any) => void;
  onDelete?: (contentTypeId: string) => void;
  showActions?: boolean;
}

export function ContentTypeList({ 
  contentTypes, 
  isLoading, 
  onEdit, 
  onDelete,
  showActions = false
}: ContentTypeListProps) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin" || user?.role === "administrator";
  
  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg text-gray-800 dark:text-gray-200">Content Types</CardTitle>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Content types that you've created with their API details.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
          ) : contentTypes.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    API ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fields
                  </th>
                  {showActions && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {contentTypes.map((contentType) => (
                  <tr key={contentType.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                          <Database className="h-4 w-4 text-primary" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {contentType.displayName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {contentType.apiId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {contentType.fields?.length || 0} fields
                      </div>
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {canEdit && onEdit && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => onEdit(contentType)}
                              className="text-secondary hover:text-secondary/80"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit && onDelete && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => onDelete(contentType.id)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Content Types Found</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Start by creating your first content type
              </p>
              {canEdit && onEdit && (
                <Button 
                  onClick={() => onEdit(null)}
                  className="bg-secondary text-white hover:bg-secondary/90"
                >
                  Create Content Type
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
