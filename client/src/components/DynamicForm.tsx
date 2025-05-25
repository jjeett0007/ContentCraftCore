import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaSelectionDialog } from "@/components/MediaSelectionDialog";
import { MediaPreview } from "@/components/MediaPreview";
import { RelationSelectionDialog } from "@/components/RelationSelectionDialog";
import { RelatedItemDisplay } from "@/components/RelatedItemDisplay";

interface DynamicFormProps {
  fields: any[];
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function DynamicForm({ fields, initialData, onSubmit, onCancel, isSubmitting }: DynamicFormProps) {
  // Build the validation schema dynamically based on the fields
  const buildValidationSchema = () => {
    const schemaObj: any = {};

    fields.forEach(field => {
      let fieldSchema;

      switch (field.type) {
        case "text":
        case "richtext":
          fieldSchema = z.string();
          break;
        case "email":
          fieldSchema = z.string().email("Invalid email address");
          break;
        case "number":
          fieldSchema = z.string().refine(val => !isNaN(Number(val)), {
            message: "Must be a valid number",
          }).transform(val => Number(val));
          break;
        case "boolean":
          fieldSchema = z.boolean().default(false);
          break;
        case "date":
        case "datetime":
          fieldSchema = z.date().optional();
          break;
        case "json":
          fieldSchema = z.string().refine(val => {
            try {
              JSON.parse(val);
              return true;
            } catch {
              return false;
            }
          }, {
            message: "Must be valid JSON",
          });
          break;
        case "enum":
          if (field.options && field.options.length > 0) {
            fieldSchema = z.string().refine(val => field.options.includes(val), {
              message: "Invalid option selected",
            });
          } else {
            fieldSchema = z.string();
          }
          break;
        case "media":
          // Handle different validation for single vs multiple media uploads
          fieldSchema = field.multiple 
            ? z.array(z.string()).optional() 
            : z.string().optional();
          break;
        case "relation":
          fieldSchema = field.relationMany 
            ? z.array(z.string()).optional() 
            : z.string().optional();
          break;
        default:
          fieldSchema = z.string();
      }

      // Add required validation if field is required
      if (field.required) {
        if (field.type === "date" || field.type === "datetime") {
          fieldSchema = z.date({
            required_error: `${field.displayName} is required`,
          });
        } else if (field.type === "boolean") {
          // Boolean fields don't need required modifier
        } else if ((field.type === "relation" && field.relationMany) || (field.type === "media" && field.multiple)) {
          fieldSchema = z.array(z.string()).min(1, `At least one ${field.displayName} is required`);
        } else if (typeof fieldSchema.min === 'function') {
          fieldSchema = fieldSchema.min(1, `${field.displayName} is required`);
        } else {
          // If min isn't available, use refine instead
          fieldSchema = fieldSchema.refine(val => !!val, {
            message: `${field.displayName} is required`
          });
        }
      }

      schemaObj[field.name] = fieldSchema;
    });

    return z.object(schemaObj);
  };

  const schema = buildValidationSchema();

  // Format initial data
  const formatInitialData = () => {
    if (!initialData) return {};

    const formattedData: any = { ...initialData };

    // Convert dates to Date objects
    fields.forEach(field => {
      if ((field.type === "date" || field.type === "datetime") && formattedData[field.name]) {
        formattedData[field.name] = new Date(formattedData[field.name]);
      }

      // Format JSON fields
      if (field.type === "json" && formattedData[field.name]) {
        if (typeof formattedData[field.name] === "object") {
          formattedData[field.name] = JSON.stringify(formattedData[field.name], null, 2);
        }
      }
    });

    return formattedData;
  };

  // Initialize form
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: formatInitialData(),
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(formatInitialData());
    }
  }, [initialData, form]);

  // Format data before submission
  const handleSubmit = (data: any) => {
    const formattedData: any = { ...data };

    // Format dates to ISO strings
    fields.forEach(field => {
      if ((field.type === "date" || field.type === "datetime") && formattedData[field.name]) {
        formattedData[field.name] = formattedData[field.name].toISOString();
      }

      // Parse JSON fields
      if (field.type === "json" && formattedData[field.name]) {
        try {
          formattedData[field.name] = JSON.parse(formattedData[field.name]);
        } catch (error) {
          // Form validation should catch this, but just in case
          console.error("JSON parse error:", error);
        }
      }
    });

    onSubmit(formattedData);
  };

  // Render field based on its type
  const renderField = (field: any) => {
    switch (field.type) {
      case "text":
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.displayName}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={`Enter ${field.displayName.toLowerCase()}`}
                    {...formField}
                    value={formField.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "richtext":
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.displayName}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={`Enter ${field.displayName.toLowerCase()}`}
                    className="min-h-[150px]"
                    {...formField}
                    value={formField.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "email":
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.displayName}</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder={`Enter ${field.displayName.toLowerCase()}`}
                    {...formField}
                    value={formField.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "number":
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.displayName}</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder={`Enter ${field.displayName.toLowerCase()}`}
                    {...formField}
                    value={formField.value?.toString() || ""}
                    onChange={(e) => formField.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "boolean":
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{field.displayName}</FormLabel>
                  <FormDescription>
                    Toggle this checkbox to enable or disable
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        );

      case "date":
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{field.displayName}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formField.value && "text-muted-foreground"
                        )}
                      >
                        {formField.value ? (
                          format(formField.value, "PPP")
                        ) : (
                          <span>Select a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formField.value}
                      onSelect={formField.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "datetime":
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{field.displayName}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !formField.value && "text-muted-foreground"
                        )}
                      >
                        {formField.value ? (
                          format(formField.value, "PPP HH:mm:ss")
                        ) : (
                          <span>Select date and time</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formField.value}
                      onSelect={(date) => {
                        // Preserve the time when changing the date
                        if (date && formField.value) {
                          const newDate = new Date(date);
                          newDate.setHours(formField.value.getHours());
                          newDate.setMinutes(formField.value.getMinutes());
                          newDate.setSeconds(formField.value.getSeconds());
                          formField.onChange(newDate);
                        } else {
                          formField.onChange(date);
                        }
                      }}
                      initialFocus
                    />
                    {formField.value && (
                      <div className="p-3 border-t border-border">
                        <div className="flex justify-between items-center space-x-2">
                          <Input
                            type="time"
                            step="1"
                            value={
                              formField.value
                                ? format(formField.value, "HH:mm:ss")
                                : ""
                            }
                            onChange={(e) => {
                              if (formField.value) {
                                const [hours, minutes, seconds] = e.target.value.split(":");
                                const newDate = new Date(formField.value);
                                newDate.setHours(parseInt(hours || "0"));
                                newDate.setMinutes(parseInt(minutes || "0"));
                                newDate.setSeconds(parseInt(seconds || "0"));
                                formField.onChange(newDate);
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "json":
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.displayName}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={`{ "example": "Enter valid JSON" }`}
                    className="min-h-[200px] font-mono"
                    {...formField}
                    value={formField.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Enter valid JSON data
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "enum":
        if (field.options && field.options.length > 0) {
          return (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>{field.displayName}</FormLabel>
                  <Select
                    onValueChange={formField.onChange}
                    defaultValue={formField.value}
                    value={formField.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.displayName.toLowerCase()}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {field.options.map((option: string) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        } else {
          return (
            <FormItem key={field.name}>
              <FormLabel>{field.displayName}</FormLabel>
              <FormDescription className="text-destructive">
                No options defined for this enum field
              </FormDescription>
            </FormItem>
          );
        }

      // For media and relation fields, we'll use simplified versions
      // since we don't have the full implementation here
      case "media":
        // Handle single or multiple media uploads based on field configuration
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => {
              // State for media selection dialog
              const [mediaDialogOpen, setMediaDialogOpen] = useState(false);

              // Show selected media
              const renderSelectedMedia = () => {
                if (field.multiple) {
                  // Display multiple media items
                  return (
                    <div className="space-y-4 mt-2">
                      {Array.isArray(formField.value) && formField.value.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {formField.value.map((mediaId, index) => (
                              <div key={index} className="relative rounded border p-2 flex items-center justify-between">
                                <span className="text-sm truncate">{mediaId}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newValue = [...formField.value];
                                    newValue.splice(index, 1);
                                    formField.onChange(newValue);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          {/* Preview of selected media files */}
                          <div className="border rounded-md p-3 bg-muted/20">
                            <h4 className="text-sm font-medium mb-2">Media Preview</h4>
                            <MediaPreview mediaIds={formField.value} />
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">No media files selected</div>
                      )}
                    </div>
                  );
                } else {
                  // Display single media item
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Select media file..."
                          readOnly
                          value={formField.value || ""}
                          onClick={() => setMediaDialogOpen(true)}
                          className="cursor-pointer"
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setMediaDialogOpen(true)}
                        >
                          Select
                        </Button>
                        {formField.value && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formField.onChange("")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Preview of selected media */}
                      {formField.value && (
                        <div className="border rounded-md p-2 bg-muted/20">
                          <MediaPreview mediaIds={formField.value} />
                        </div>
                      )}
                    </div>
                  );
                }
              };

              return (
                <FormItem>
                  <FormLabel>{field.displayName}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.multiple && (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setMediaDialogOpen(true)}
                        >
                          Select Media Files
                        </Button>
                      )}

                      {renderSelectedMedia()}

                      {/* Media Selection Dialog */}
                      <MediaSelectionDialog
                        open={mediaDialogOpen}
                        onOpenChange={setMediaDialogOpen}
                        multiple={field.multiple}
                        currentSelection={formField.value}
                        onSelect={(selectedMedia) => {
                          formField.onChange(selectedMedia);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {field.multiple
                      ? "Select one or more media files from the library"
                      : "Select a media file from the library"
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );

      case "relation":
        return (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => {
              const [relationDialogOpen, setRelationDialogOpen] = useState(false);
              const { data: relatedContentType } = useQuery({
                queryKey: [`/api/content-types/${field.relationTo}`],
                enabled: !!field.relationTo,
              });

              // Function to render related item preview
              const renderRelatedItemPreview = () => {
                // For single relation (default)
                if (!field.relationMany) {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder={`Select ${field.relationTo} item...`}
                          readOnly
                          value={formField.value || ""}
                          onClick={() => setRelationDialogOpen(true)}
                          className="cursor-pointer"
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setRelationDialogOpen(true)}
                        >
                          Select
                        </Button>
                        {formField.value && formField.value !== "" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => formField.onChange("")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Preview of selected related item */}
                      {formField.value && (
                        <RelatedItemDisplay
                          itemId={formField.value}
                          contentType={field.relationTo}
                          onRemove={() => formField.onChange("")}
                        />
                      )}
                    </div>
                  );
                }

                // For multiple relations
                return (
                  <div className="space-y-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setRelationDialogOpen(true)}
                    >
                      Select {relatedContentType?.displayName || field.relationTo} Items
                    </Button>

                    {/* Display selected related items */}
                    <div className="space-y-2">
                      {Array.isArray(formField.value) && formField.value.length > 0 ? (
                        <div className="space-y-2">
                          {formField.value.map((itemId, index) => (
                            <RelatedItemDisplay
                              key={index}
                              itemId={itemId}
                              contentType={field.relationTo}
                              onRemove={() => {
                                const newValue = [...formField.value];
                                newValue.splice(index, 1);
                                formField.onChange(newValue);
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground py-2">
                          No {relatedContentType?.displayName || field.relationTo} items selected
                        </div>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <FormItem>
                  <FormLabel>{field.displayName}</FormLabel>
                  <FormControl>
                    {renderRelatedItemPreview()}
                  </FormControl>
                  <FormDescription>
                    {field.relationMany 
                      ? `Select one or more related ${field.relationTo || "items"}`
                      : `Select a related ${field.relationTo || "item"}`
                    }
                  </FormDescription>
                  <FormMessage />

                  {/* Relation Selection Dialog */}
                  <RelationSelectionDialog
                    open={relationDialogOpen}
                    onOpenChange={setRelationDialogOpen}
                    multiple={!!field.relationMany}
                    relationTo={field.relationTo || ""}
                    currentSelection={formField.value}
                    onSelect={(selectedItems) => {
                      formField.onChange(selectedItems);
                    }}
                  />
                </FormItem>
              );
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.map(renderField)}
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? "Saving..." 
              : initialData 
                ? "Update" 
                : "Create"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}