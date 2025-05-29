import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Image, Check } from "lucide-react";

interface MediaSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mediaIds: string | string[]) => void;
  multiple?: boolean;
  currentSelection?: string | string[];
}

export function MediaSelectionDialog({ 
  open, 
  onOpenChange, 
  onSelect, 
  multiple = false,
  currentSelection 
}: MediaSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("browse");

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      if (multiple && Array.isArray(currentSelection)) {
        setSelectedItems(currentSelection);
      } else if (!multiple && typeof currentSelection === "string") {
        setSelectedItems(currentSelection ? [currentSelection] : []);
      } else {
        setSelectedItems([]);
      }
    }
  }, [open, currentSelection, multiple]);

  // Define the type for a media item
  interface MediaItem {
    id: string | number;
    name: string;
    url: string;
    size?: number;
    [key: string]: any;
  }

  // Fetch media items
  const { data: mediaItems = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ["/api/media"],
    enabled: open,
  });

  // Filter media by search query
  const filteredMedia = searchQuery 
    ? mediaItems.filter((item: any) => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mediaItems;

  // Toggle selection of a media item
  const toggleSelection = (mediaId: string) => {
    if (multiple) {
      // For multiple selection
      setSelectedItems(prev => 
        prev.includes(mediaId) 
          ? prev.filter(id => id !== mediaId) 
          : [...prev, mediaId]
      );
    } else {
      // For single selection, replace the current selection
      setSelectedItems([mediaId]);
    }
  };

  const handleConfirm = () => {
    if (multiple) {
      onSelect(selectedItems);
    } else {
      onSelect(selectedItems[0] || "");
    }
    onOpenChange(false);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
          <DialogDescription>
            {multiple ? "Select one or more media files" : "Select a media file"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                className="pl-8 w-[240px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="browse" className="flex-1 overflow-hidden flex flex-col mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <p>Loading media...</p>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Image className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">No media found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Upload some media to get started"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 overflow-y-auto p-1 max-h-[300px]">
                {filteredMedia.map((media: any) => (
                  <div
                    key={media.id}
                    className={`relative rounded-md overflow-hidden border cursor-pointer transition-all ${
                      selectedItems.includes(media.id.toString()) 
                        ? "ring-2 ring-primary" 
                        : "hover:border-primary"
                    }`}
                    onClick={() => toggleSelection(media.id.toString())}
                  >
                    <div className="relative aspect-square bg-muted">
                      <img
                        src={media.url}
                        alt={media.name}
                        className="object-cover w-full h-full"
                      />
                      {selectedItems.includes(media.id.toString()) && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-xs truncate">
                      <p className="font-medium truncate">{media.name}</p>
                      <p className="text-muted-foreground">
                        {formatFileSize(media.size || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="flex-1">
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md">
              <div className="text-center">
                <Image className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <Label 
                    htmlFor="media-upload" 
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90"
                  >
                    Select File
                  </Label>
                  <Input 
                    id="media-upload" 
                    type="file" 
                    className="hidden" 
                    onChange={() => {
                      // Will implement file upload later
                      setActiveTab("browse");
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag and drop or click to upload
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <div className="flex-1 text-sm">
            {multiple ? `${selectedItems.length} selected` : selectedItems.length === 1 ? "1 selected" : "None selected"}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedItems.length === 0}>
            {multiple ? "Select Files" : "Select File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}