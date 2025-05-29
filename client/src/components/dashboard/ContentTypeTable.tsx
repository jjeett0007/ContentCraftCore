import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ContentType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ContentTypeTable: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();

  const { data: contentTypes, isLoading, refetch } = useQuery<ContentType[]>({
    queryKey: ['/api/content-types'],
  });

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;

    if (!confirm("Are you sure you want to delete this content type? All associated content will be permanently removed.")) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/content-types/${id}`);
      toast({
        title: "Content type deleted",
        description: "The content type has been successfully deleted.",
        variant: "default",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete content type",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-6">Loading content types...</div>;
  }

  if (!contentTypes || contentTypes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium text-gray-800">Content Types</h3>
          <p className="mt-1 text-sm text-gray-500">
            No content types found. Create your first content type to get started.
          </p>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
          {isAdmin && (
            <Link href="/content-type-builder">
              <Button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary/90">
                <span className="material-icons mr-2">add</span>
                Create Content Type
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium text-gray-800">Content Types</h3>
        <p className="mt-1 text-sm text-gray-500">
          Content types that you've created with their API details.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                API ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fields
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contentTypes.map((contentType) => (
              <tr key={contentType.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                      <span className="material-icons text-primary text-sm">article</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{contentType.name || contentType.displayName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{contentType.apiId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {Array.isArray(contentType.fields) ? contentType.fields.length : 0} fields
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {isAdmin && (
                      <>
                        <Link href={`/content-type-builder/edit/${contentType.id}`}>
                          <button className="text-secondary hover:text-secondary/80">
                            <span className="material-icons">edit</span>
                          </button>
                        </Link>
                        <button
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => handleDelete(contentType.id!)}
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </>
                    )}
                    <Link href={`/content/${contentType.apiId}`}>
                      <button className="text-info hover:text-info/80">
                        <span className="material-icons">visibility</span>
                      </button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
        {isAdmin && (
          <Link href="/content-type-builder">
            <Button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary/90">
              <span className="material-icons mr-2">add</span>
              Create Content Type
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ContentTypeTable;
