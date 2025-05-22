import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image, FileText, File, ChevronRight } from "lucide-react";

interface MediaPreviewProps {
  mediaIds: string | string[];
  small?: boolean;
}

export function MediaPreview({ mediaIds, small = false }: MediaPreviewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isMultiple = Array.isArray(mediaIds);
  
  // Convert single ID to array for consistent handling
  const ids = isMultiple ? mediaIds : [mediaIds];
  
  // Fetch media data
  const { data: mediaItems = [] } = useQuery({
    queryKey: ["/api/media"],
  });
  
  // Find media items by ID
  const mediaData = ids
    .map(id => mediaItems.find((item: any) => item.id.toString() === id.toString()))
    .filter(Boolean);
  
  // Function to determine if file is an image
  const isImage = (filename: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };
  
  // Function to render media thumbnail
  const renderThumbnail = (media: any, size: number) => {
    if (!media) return <File className="h-full w-full text-muted-foreground" />;
    
    if (isImage(media.name)) {
      return (
        <img 
          src={media.url} 
          alt={media.name}
          className="object-cover h-full w-full rounded-sm"
        />
      );
    } else {
      return <FileText className="h-full w-full text-primary" />;
    }
  };
  
  // If no media IDs or data, show placeholder
  if (ids.length === 0 || mediaData.length === 0) {
    return <span className="text-muted-foreground">No media</span>;
  }
  
  // For single media in small view
  if (!isMultiple && small) {
    return (
      <div 
        className="h-8 w-8 bg-muted rounded-sm flex items-center justify-center overflow-hidden"
        title={mediaData[0]?.name || "Media"}
      >
        {renderThumbnail(mediaData[0], 8)}
      </div>
    );
  }
  
  // For multiple media in small view (show up to 3)
  if (isMultiple && small) {
    const displayCount = Math.min(3, mediaData.length);
    const hasMore = mediaData.length > 3;
    
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <div className="flex items-center cursor-pointer">
            <div className="flex -space-x-2">
              {mediaData.slice(0, displayCount).map((media, index) => (
                <div 
                  key={index}
                  className="h-8 w-8 bg-muted rounded-sm flex items-center justify-center overflow-hidden border"
                  style={{ zIndex: displayCount - index }}
                >
                  {renderThumbnail(media, 8)}
                </div>
              ))}
            </div>
            {hasMore && (
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Media Files</DialogTitle>
            <DialogDescription>
              {mediaData.length} media {mediaData.length === 1 ? 'file' : 'files'} attached
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {mediaData.map((media, index) => (
              <div key={index} className="relative overflow-hidden border rounded-md">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {renderThumbnail(media, 24)}
                </div>
                <div className="p-2 text-xs truncate">
                  <p className="font-medium truncate">{media?.name || "Unknown"}</p>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  // For regular view (non-small), show media preview with dialog
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center">
          <Image className="h-4 w-4 mr-2" />
          {isMultiple 
            ? `View ${mediaData.length} files` 
            : "View file"
          }
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Media Files</DialogTitle>
          <DialogDescription>
            {mediaData.length} media {mediaData.length === 1 ? 'file' : 'files'} attached
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {mediaData.map((media, index) => (
            <div key={index} className="relative overflow-hidden border rounded-md">
              <div className="aspect-square bg-muted flex items-center justify-center">
                {renderThumbnail(media, 24)}
              </div>
              <div className="p-2 text-xs truncate">
                <p className="font-medium truncate">{media?.name || "Unknown"}</p>
              </div>
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}