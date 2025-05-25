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
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Check, Database } from "lucide-react";

interface RelationSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (items: string | string[]) => void;
  relationTo: string; // The API ID of the related content type
  multiple?: boolean;
  currentSelection?: string | string[];
}

export function RelationSelectionDialog({ 
  open, 
  onOpenChange, 
  onSelect, 
  relationTo,
  multiple = false,
  currentSelection 
}: RelationSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
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

  // Fetch related content type schema
  const { data: contentTypeData } = useQuery({
    queryKey: [`/api/content-types/${relationTo}`],
    enabled: open && !!relationTo,
  });

  // Fetch content entries
  const { data: entriesData = { entries: [] }, isLoading } = useQuery({
    queryKey: [`/api/content/${relationTo}`, 1, "", "createdAt", "desc"],
    queryFn: async () => {
      const response = await fetch(`/api/content/${relationTo}?page=1&limit=100`);
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }
      return response.json();
    },
    enabled: open && !!relationTo,
  });

  const entries = entriesData?.entries || [];
  
  // Filter entries by search query
  const filteredEntries = searchQuery 
    ? entries.filter((entry: any) => {
        // Search in all text fields
        return Object.keys(entry).some(key => {
          const value = entry[key];
          return typeof value === 'string' && 
                 value.toLowerCase().includes(searchQuery.toLowerCase());
        });
      })
    : entries;

  // Toggle selection of an item
  const toggleSelection = (itemId: string) => {
    if (multiple) {
      // For multiple selection
      setSelectedItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId) 
          : [...prev, itemId]
      );
    } else {
      // For single selection, replace the current selection
      setSelectedItems([itemId]);
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

  // Get display field from content type
  const getDisplayField = () => {
    if (!contentTypeData?.fields) return 'id';
    
    // Find a good candidate for display field
    // Prefer title, name, or first string field
    const fields = contentTypeData.fields;
    const nameField = fields.find((f: any) => 
      ['title', 'name', 'displayName', 'label'].includes(f.name.toLowerCase())
    );
    
    if (nameField) return nameField.name;
    
    // Fall back to first string field
    const firstStringField = fields.find((f: any) => 
      ['text', 'string', 'email'].includes(f.type)
    );
    
    return firstStringField ? firstStringField.name : 'id';
  };

  const displayField = getDisplayField();

  // Generate a preview of the item based on its fields
  const getItemPreview = (item: any) => {
    // Show the display field prominently
    const mainValue = item[displayField] || item.id || 'Unnamed item';
    
    // Get other notable fields (exclude internal or complex fields)
    const excludedFields = ['id', displayField, 'createdAt', 'updatedAt'];
    const detailFields = Object.keys(item)
      .filter(key => 
        !excludedFields.includes(key) && 
        typeof item[key] !== 'object' && 
        item[key] !== null && 
        item[key] !== undefined
      )
      .slice(0, 2); // Only show up to 2 additional fields
    
    return (
      <div>
        <div className="font-medium">{mainValue}</div>
        {detailFields.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {detailFields.map(field => (
              <div key={field} className="truncate">
                {field}: {String(item[field])}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select {contentTypeData?.displayName || relationTo}</DialogTitle>
          <DialogDescription>
            {multiple 
              ? `Select one or more ${contentTypeData?.displayName || relationTo} items` 
              : `Select a ${contentTypeData?.displayName || relationTo} item`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${contentTypeData?.displayName || relationTo}...`}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <p>Loading items...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium">No items found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Try a different search term" 
                  : `No ${contentTypeData?.displayName || relationTo} items available`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry: any) => (
                    <TableRow 
                      key={entry.id}
                      className={selectedItems.includes(entry.id) ? "bg-muted/50" : ""}
                      onClick={() => toggleSelection(entry.id)}
                    >
                      <TableCell className="p-2">
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center ${
                          selectedItems.includes(entry.id) 
                            ? "bg-primary border-primary" 
                            : "border-input"
                        }`}>
                          {selectedItems.includes(entry.id) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getItemPreview(entry)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {entry.id}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <div className="flex-1 text-sm">
            {multiple 
              ? `${selectedItems.length} selected` 
              : selectedItems.length === 1 ? "1 selected" : "None selected"
            }
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={multiple ? false : selectedItems.length === 0}
          >
            {multiple ? "Select Items" : "Select Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}