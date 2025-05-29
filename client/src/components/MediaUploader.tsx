import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { AlertCircle, File, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaUploader({ open, onOpenChange }: MediaUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !uploading) {
      setFiles([]);
      setUploadProgress({});
    }
    onOpenChange(newOpen);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles([...files, ...selectedFiles]);

      // Reset the input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle drag & drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles([...files, ...droppedFiles]);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Remove file from list
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    let successful = 0;

    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // Create a unique key for tracking progress
          const fileKey = `${file.name}-${Date.now()}`;
          setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

          // Simulate progress during upload
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const currentProgress = prev[fileKey] || 0;
              if (currentProgress < 90) {
                return { ...prev, [fileKey]: currentProgress + 10 };
              }
              return prev;
            });
          }, 300);

          // Convert file to base64 for upload
          const base64File = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              // Remove data URL prefix (data:image/png;base64,)
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(file);
          });
          
          // Upload the file using the new approach
          const token = localStorage.getItem("auth-token");
          const response = await fetch("/api/media", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              file: base64File,
              fileName: file.name
            }),
            credentials: "include",
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Upload failed");
          }

          // Set progress to 100%
          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
          successful++;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast({
            title: `Failed to upload ${file.name}`,
            description: error instanceof Error ? error.message : "An unknown error occurred",
            variant: "destructive",
          });
        }
      }

      // Invalidate queries to refresh the media library
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/count"] });

      // Show success message
      if (successful > 0) {
        toast({
          title: "Upload complete",
          description: `Successfully uploaded ${successful} of ${files.length} files`,
        });
      }

      // Close dialog if all files were uploaded successfully
      if (successful === files.length) {
        setTimeout(() => {
          handleOpenChange(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Upload images, videos, audio, or documents to your media library
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="url" disabled>From URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            {/* Drag & drop area */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                "hover:border-primary hover:bg-primary/5",
                "flex flex-col items-center justify-center"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-lg font-medium">Drag & drop files here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Button variant="outline" type="button" disabled={uploading}>
                Select Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>

            {/* Selected files list */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Selected Files ({files.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <Card key={index} className="p-0">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <File className="h-5 w-5 text-primary" />
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        {uploadProgress[`${file.name}-${Date.now()}`] !== undefined ? (
                          <Progress 
                            value={uploadProgress[`${file.name}-${Date.now()}`]} 
                            className="w-20 h-2" 
                          />
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={uploadFiles}
                disabled={files.length === 0 || uploading}
                className="bg-secondary text-white hover:bg-secondary/90"
              >
                {uploading ? "Uploading..." : "Upload Files"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url">
            {/* URL upload (disabled for now) */}
            <div className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                URL upload is not available in this version
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
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