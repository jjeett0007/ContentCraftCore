import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { ContentTypeForm } from "@/components/ContentTypeForm";
import { ContentTypeList } from "@/components/ContentTypeList";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ContentTypeBuilder() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingContentType, setEditingContentType] = useState<any>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access the Content Type Builder",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, navigate, user, toast]);

  // Fetch content types
  const { data: contentTypes, isLoading } = useQuery({
    queryKey: ["/api/content-types"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Create content type mutation
  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      return apiRequest("POST", "/api/content-types", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-types"] });
      toast({
        title: "Success",
        description: "Content type created successfully",
      });
      setShowForm(false);
      setEditingContentType(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create content type",
        variant: "destructive",
      });
    }
  });

  // Update content type mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: any }) => {
      return apiRequest("PUT", `/api/content-types/${id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-types"] });
      toast({
        title: "Success",
        description: "Content type updated successfully",
      });
      setShowForm(false);
      setEditingContentType(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update content type",
        variant: "destructive",
      });
    }
  });

  // Delete content type mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/content-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-types"] });
      toast({
        title: "Success",
        description: "Content type deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete content type",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (formData: any) => {
    if (editingContentType) {
      updateMutation.mutate({ id: editingContentType.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (contentType: any) => {
    setEditingContentType(contentType);
    setShowForm(true);
  };

  const handleDelete = (contentTypeId: string) => {
    if (confirm("Are you sure you want to delete this content type? All associated content will be permanently removed.")) {
      deleteMutation.mutate(contentTypeId);
    }
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <AdminLayout pageTitle="Content-Type Builder">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Content-Type Builder</h1>
          <p className="text-gray-600">Define the structure of your content types</p>
        </div>
        {!showForm && (
          <Button 
            className="bg-secondary text-white hover:bg-secondary/90"
            onClick={() => {
              setEditingContentType(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Content Type
          </Button>
        )}
      </div>

      {showForm ? (
        <ContentTypeForm 
          initialData={editingContentType}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingContentType(null);
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      ) : (
        <ContentTypeList 
          contentTypes={contentTypes || []} 
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showActions={true}
        />
      )}
    </AdminLayout>
  );
}
