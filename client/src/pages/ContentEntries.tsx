import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { DynamicForm } from "@/components/DynamicForm";
import { MediaPreview } from "@/components/MediaPreview";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
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
    queryKey: [
      `/api/content/${contentType}`,
      page,
      search,
      sortField,
      sortOrder,
    ],
    queryFn: async () => {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const sortParams = `&sortField=${sortField}&sortOrder=${sortOrder}`;
      const response = await fetch(
        `/api/content/${contentType}?page=${page}&limit=${limit}${searchParam}${sortParams}`,
      );
      return response.json();
    },
    enabled: isAuthenticated && !!contentType,
  });

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      console.log("Creating entry with data:", formData);
      return apiRequest("POST", `/api/content/${contentType}`, formData);
    },
    onSuccess: (data) => {
      console.log("Entry created successfully:", data);
      queryClient.invalidateQueries({
        queryKey: [`/api/content/${contentType}`],
      });
      toast({
        title: "Success",
        description: "Entry created successfully",
      });
      setShowForm(false);
    },
    onError: (error) => {
      console.error("Create entry error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create entry",
        variant: "destructive",
      });
    },
  });

  // Update entry mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: any }) => {
      return apiRequest("PUT", `/api/content/${contentType}/${id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/content/${contentType}`],
      });
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
        description:
          error instanceof Error ? error.message : "Failed to update entry",
        variant: "destructive",
      });
    },
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/content/${contentType}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/content/${contentType}`],
      });
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
      setDeletingEntry(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete entry",
        variant: "destructive",
      });
      setDeletingEntry(null);
    },
  });

  const handleSubmit = (formData: any) => {
    console.log("ContentEntries handleSubmit called with:", formData);
    if (editingEntry) {
      console.log("Updating entry with ID:", editingEntry.id);
      updateMutation.mutate({ id: editingEntry.id, formData });
    } else {
      console.log("Creating new entry");
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (entry: any) => {
    // Ensure we use the correct ID field (_id for MongoDB, id for other)
    const entryWithId = {
      ...entry,
      id: entry.id || entry._id,
    };
    setEditingEntry(entryWithId);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    // Ensure we have a valid ID
    if (id && id !== "undefined" && id !== "null") {
      setDeletingEntry(id);
    } else {
      toast({
        title: "Error",
        description: "Invalid entry ID",
        variant: "destructive",
      });
    }
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

  const canCreate = user?.role === "administrator" || user?.role === "editor";
  const canEdit = user?.role === "administrator" || user?.role === "editor";
  const canDelete = user?.role === "administrator";

  return (
    <AdminLayout
      pageTitle={`${contentTypeData?.displayName || contentType} Entries`}
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {contentTypeData?.displayName || contentType}
          </h1>
          <p className="text-gray-600">
            Manage your{" "}
            {contentTypeData?.displayName?.toLowerCase() || contentType} entries
          </p>
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
                      <TableHead key={field.name}>
                        {field.displayName}
                      </TableHead>
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
                              title="Edit entry"
                            >
                              <Edit className="h-4 w-4 text-secondary" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDelete(entry.id || entry._id)
                              }
                              title="Delete entry"
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
              {search
                ? `No results found for "${search}"`
                : "Start by creating your first entry"}
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
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Entry Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">
              {editingEntry ? "Edit Entry" : "Create New Entry"}
            </DialogTitle>
            <DialogDescription>
              {editingEntry
                ? `Update this ${contentTypeData?.displayName?.toLowerCase() || contentType} entry`
                : `Add a new ${contentTypeData?.displayName?.toLowerCase() || contentType} entry`}
            </DialogDescription>
          </DialogHeader>
          {contentTypeData && (
            <div className="mt-4">
              <DynamicForm
                fields={contentTypeData.fields}
                initialData={editingEntry}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEntry(null);
                }}
                isSubmitting={
                  createMutation.isPending || updateMutation.isPending
                }
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingEntry}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              entry.
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
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (type) {
    case "boolean":
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {value ? "Yes" : "No"}
        </span>
      );
    case "date":
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    case "datetime":
      try {
        return new Date(value).toLocaleString();
      } catch {
        return String(value);
      }
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value);
    case "email":
      return (
        <a 
          href={`mailto:${value}`} 
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {value}
        </a>
      );
    case "url":
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {String(value).length > 30 ? `${String(value).substring(0, 30)}...` : value}
        </a>
      );
    case "json":
      return (
        <span className="text-muted-foreground font-mono text-xs">
          {typeof value === "object" ? "[Object]" : String(value)}
        </span>
      );
    case "media":
      // Check if media is multiple (array) or single value
      if (Array.isArray(value)) {
        return value.length > 0 ? (
          <MediaPreview mediaIds={value} small={true} />
        ) : (
          <span className="text-muted-foreground">No media</span>
        );
      } else {
        return value ? (
          <MediaPreview mediaIds={[value]} small={true} />
        ) : (
          <span className="text-muted-foreground">No media</span>
        );
      }
    case "relation":
      // Display relation differently based on whether it's a single or multiple relation
      if (Array.isArray(value)) {
        return (
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {value.length} {value.length === 1 ? "relation" : "relations"}
            </span>
          </div>
        );
      } else {
        return value ? (
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Related
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">No relation</span>
        );
      }
    case "richtext":
    case "text":
      const textValue = String(value);
      if (textValue.length > 100) {
        return (
          <div className="max-w-xs">
            <span className="block truncate" title={textValue}>
              {textValue.substring(0, 100)}...
            </span>
          </div>
        );
      }
      return textValue;
    default:
      const stringValue = String(value);
      if (stringValue.length > 50) {
        return (
          <div className="max-w-xs">
            <span className="block truncate" title={stringValue}>
              {stringValue.substring(0, 50)}...
            </span>
          </div>
        );
      }
      return stringValue;
  }
}
