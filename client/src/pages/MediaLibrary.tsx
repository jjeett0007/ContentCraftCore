import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { MediaUploader } from "@/components/MediaUploader";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Search, Plus, Trash2, File, Image, Film, FileAudio, FileText, X, AlertCircle } from "lucide-react";

export default function MediaLibrary() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State
  const [search, setSearch] = useState("");
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [mediaType, setMediaType] = useState("all");
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch media files
  const { data: media, isLoading } = useQuery({
    queryKey: ["/api/media", mediaType, search],
    enabled: isAuthenticated,
  });

  // Delete media mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "Media file deleted successfully",
      });
      setDeletingMedia(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete media file",
        variant: "destructive",
      });
      setDeletingMedia(null);
    }
  });

  const handleDelete = (id: string) => {
    setDeletingMedia(id);
  };

  const confirmDelete = () => {
    if (deletingMedia) {
      deleteMutation.mutate(deletingMedia);
    }
  };

  const getMediaIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-6 w-6" />;
    if (type.startsWith("video/")) return <Film className="h-6 w-6" />;
    if (type.startsWith("audio/")) return <FileAudio className="h-6 w-6" />;
    if (type.startsWith("text/")) return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  if (!isAuthenticated) {
    return null;
  }

  const canUpload = user?.role === "administrator" || user?.role === "editor";
  const canDelete = user?.role === "administrator";

  return (
    <AdminLayout pageTitle="Media Library">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Media Library</h1>
          <p className="text-gray-600">Manage your uploaded media files</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
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
          {canUpload && (
            <Button 
              className="bg-secondary text-white hover:bg-secondary/90"
              onClick={() => setUploaderOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setMediaType}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="document">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value={mediaType}>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="bg-card">
                  <div className="aspect-square bg-muted animate-pulse rounded-t-lg" />
                  <CardContent className="p-3">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : media && media.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media.map((item: any) => (
                <Card key={item.id} className="overflow-hidden group">
                  <div className="aspect-square bg-muted/30 relative">
                    {item.type.startsWith("image/") ? (
                      <img 
                        src={item.url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getMediaIcon(item.type)}
                      </div>
                    )}
                    
                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <Button 
                          size="icon" 
                          variant="secondary"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <File className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button 
                            size="icon" 
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.size)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Media Files Found</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {search ? `No results found for "${search}"` : "Start by uploading your first media file"}
                </p>
                {canUpload && !search && (
                  <Button 
                    onClick={() => setUploaderOpen(true)}
                    className="bg-secondary text-white hover:bg-secondary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Files
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
        </TabsContent>
      </Tabs>

      {/* Media Uploader */}
      <MediaUploader 
        open={uploaderOpen} 
        onOpenChange={setUploaderOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMedia} onOpenChange={(open) => !open && setDeletingMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this media file.
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

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
