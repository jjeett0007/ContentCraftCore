import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { DynamicForm } from "@/components/DynamicForm";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  X,
  AlertCircle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ContentEntries() {
  const { contentType } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  
  const limit = 10;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch content type schema
  const { data: contentTypeData, isLoading: contentTypeLoading } = useQuery({
    queryKey: [`/api/content-types/${contentType}`],
    enabled: isAuthenticated,
  });

  // Fetch content entries
  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: [`/api/content/${contentType}`, page, search],
    enabled: isAuthenticated && !!contentType,
  });

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      return apiRequest("POST", `/api/content/${contentType}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentType}`] });
      toast({
        title: "Success",
        description: "Entry created successfully",
      });
      setShowForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create entry",
        variant: "destructive",
      });
    }
  });

  // Update entry mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string, formData: any }) => {
      return apiRequest("PUT", `/api/content/${contentType}/${id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentType}`] });
      toast({
        title: "Success",
        description: "Entry updated successfully",
      });
      setShowForm(false);
      setEditingEntry(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update entry",
        variant: "destructive",
      });
    }
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/content/${contentType}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentType}`] });
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
      setDeletingEntry(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete entry",
        variant: "destructive",
      });
      setDeletingEntry(null);
    }
  });

  const handleSubmit = (formData: any) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeletingEntry(id);
  };

  const confirmDelete = () => {
    if (deletingEntry) {
      deleteMutation.mutate(deletingEntry);
    }
  };

  const isLoading = contentTypeLoading || entriesLoading;
  const entries = entriesData?.entries || [];
  const totalEntries = entriesData?.totalCount || 0;
  const totalPages = Math.ceil(totalEntries / limit);

  if (!isAuthenticated) {
    return null;
  }

  const canCreate = user?.role === "admin" || user?.role === "editor";
  const canEdit = user?.role === "admin" || user?.role === "editor";
  const canDelete = user?.role === "admin";

  return (
    <AdminLayout pageTitle={`${contentTypeData?.displayName || contentType} Entries`}>
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{contentTypeData?.displayName || contentType}</h1>
          <p className="text-gray-600">Manage your {contentTypeData?.displayName?.toLowerCase() || contentType} entries</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {canCreate && (
            <Button 
              className="bg-secondary text-white hover:bg-secondary/90"
              onClick={() => {
                setEditingEntry(null);
                setShowForm(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="h-6 w-1/4 bg-muted rounded animate-pulse" />
              <div className="h-6 w-full bg-muted rounded animate-pulse" />
              <div className="h-6 w-full bg-muted rounded animate-pulse" />
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ) : contentTypeData && entries.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {contentTypeData.fields.slice(0, 5).map((field: any) => (
                      <TableHead key={field.name}>{field.displayName}</TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      {contentTypeData.fields.slice(0, 5).map((field: any) => (
                        <TableCell key={`${entry.id}-${field.name}`}>
                          {formatFieldValue(entry[field.name], field.type)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit className="h-4 w-4 text-secondary" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center py-4">
                <Pagination>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="mx-4 text-sm">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Entries Found</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {search ? `No results found for "${search}"` : "Start by creating your first entry"}
            </p>
            {canCreate && !search && (
              <Button 
                onClick={() => {
                  setEditingEntry(null);
                  setShowForm(true);
                }}
                className="bg-secondary text-white hover:bg-secondary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Entry
              </Button>
            )}
            {search && (
              <Button 
                variant="outline"
                onClick={() => setSearch("")}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Entry Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Entry" : "Create New Entry"}
            </DialogTitle>
            <DialogDescription>
              {editingEntry 
                ? `Update this ${contentTypeData?.displayName?.toLowerCase() || contentType} entry`
                : `Add a new ${contentTypeData?.displayName?.toLowerCase() || contentType} entry`
              }
            </DialogDescription>
          </DialogHeader>
          {contentTypeData && (
            <DynamicForm
              fields={contentTypeData.fields}
              initialData={editingEntry}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingEntry(null);
              }}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEntry} onOpenChange={(open) => !open && setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

// Utility function to format field values based on their type
function formatFieldValue(value: any, type: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'date':
    case 'datetime':
      return new Date(value).toLocaleString();
    case 'json':
      return <span className="text-muted-foreground">[Object]</span>;
    case 'media':
      return <span className="text-primary">View file</span>;
    case 'relation':
      return <span className="text-accent">Related item</span>;
    case 'richtext':
      return value.length > 50 ? `${value.substring(0, 50)}...` : value;
    default:
      return String(value).length > 50 ? `${String(value).substring(0, 50)}...` : String(value);
  }
}
