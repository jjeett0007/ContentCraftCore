import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RelatedItemDisplayProps {
  itemId: string;
  contentType: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export function RelatedItemDisplay({ 
  itemId, 
  contentType, 
  onRemove, 
  showRemoveButton = true 
}: RelatedItemDisplayProps) {
  // Define a type for content type data
  interface ContentTypeField {
    name: string;
    type: string;
    [key: string]: any;
  }

  interface ContentTypeData {
    fields: ContentTypeField[];
    displayName?: string;
    [key: string]: any;
  }

  // Fetch the related content type to get field information
  const { data: contentTypeData } = useQuery<ContentTypeData>({
    queryKey: [`/api/content-types/${contentType}`],
    enabled: !!contentType,
  });

  // Fetch the actual related item data
  const { data: itemData, isLoading } = useQuery<Record<string, any>>({
    queryKey: [`/api/content/${contentType}/${itemId}`],
    enabled: !!contentType && !!itemId,
  });

  // Get the best display field for this content type
  const getDisplayValue = () => {
    if (!itemData || !contentTypeData?.fields) {
      return itemId; // Fallback to ID
    }

    // Look for common display fields
    const displayFields = ['title', 'name', 'displayName', 'label', 'subject'];
    
    for (const fieldName of displayFields) {
      if (itemData[fieldName]) {
        return itemData[fieldName];
      }
    }

    // Look for the first text/string field
    const textField = contentTypeData.fields.find((f: any) => 
      ['text', 'string', 'email'].includes(f.type) && itemData[f.name]
    );

    if (textField && itemData[textField.name]) {
      return itemData[textField.name];
    }

    // Fallback to ID
    return itemId;
  };

  const getSecondaryInfo = () => {
    if (!itemData || !contentTypeData?.fields) return null;

    // Look for secondary fields like description, email, etc.
    const secondaryFields = ['description', 'email', 'bio', 'summary'];
    
    for (const fieldName of secondaryFields) {
      if (itemData[fieldName]) {
        return itemData[fieldName];
      }
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="border rounded-md p-3 bg-muted/20 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="h-3 bg-muted rounded w-20"></div>
          </div>
          {showRemoveButton && onRemove && (
            <div className="h-6 w-6 bg-muted rounded"></div>
          )}
        </div>
      </div>
    );
  }

  const displayValue = getDisplayValue();
  const secondaryInfo = getSecondaryInfo();

  return (
    <div className="border rounded-md p-3 bg-muted/20">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">
              {displayValue}
            </span>
            <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
              {contentTypeData?.displayName || contentType}
            </span>
          </div>
          {secondaryInfo && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {secondaryInfo}
            </p>
          )}
          <p className="text-xs text-muted-foreground/70 mt-1">
            ID: {itemId}
          </p>
        </div>
        {showRemoveButton && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 hover:bg-destructive/10"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}