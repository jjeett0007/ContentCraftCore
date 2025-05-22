import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldTypeSelector } from "@/components/FieldTypeSelector";
import { AlertCircle, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ContentTypeFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

// Field type options
const fieldTypeOptions = [
  { value: "text", label: "Text" },
  { value: "richtext", label: "Rich Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Date & Time" },
  { value: "media", label: "Media" },
  { value: "json", label: "JSON" },
  { value: "relation", label: "Relation" },
  { value: "email", label: "Email" },
  { value: "enum", label: "Enumeration" },
];

// Content type form schema
const contentTypeSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  apiId: z.string().min(1, "API ID is required")
    .refine(value => /^[a-z][a-z0-9_]*$/.test(value), {
      message: "API ID must start with a lowercase letter and contain only lowercase letters, numbers, and underscores"
    }),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string().min(1, "Field name is required")
      .refine(value => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value), {
        message: "Field name must start with a letter and contain only letters, numbers, and underscores"
      }),
    displayName: z.string().min(1, "Display name is required"),
    type: z.string().min(1, "Field type is required"),
    required: z.boolean().default(false),
    unique: z.boolean().default(false),
    defaultValue: z.any().optional(),
    options: z.array(z.string()).optional(), // For enum fields
    relationTo: z.string().optional(), // For relation fields
    relationMany: z.boolean().optional().default(false), // For relation fields
  })).min(1, "At least one field is required"),
});

type ContentTypeFormValues = z.infer<typeof contentTypeSchema>;

export function ContentTypeForm({ initialData, onSubmit, onCancel, isSubmitting }: ContentTypeFormProps) {
  const [activeTab, setActiveTab] = useState("general");

  // Initialize the form
  const form = useForm<ContentTypeFormValues>({
    resolver: zodResolver(contentTypeSchema),
    defaultValues: initialData || {
      displayName: "",
      apiId: "",
      description: "",
      fields: [
        {
          name: "title",
          displayName: "Title",
          type: "text",
          required: true,
          unique: false,
        }
      ],
    },
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  // Auto-generate API ID from display name
  const generateApiId = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");
  };

  // Generate field name from display name
  const generateFieldName = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");
  };

  // Handle display name change
  const handleDisplayNameChange = (value: string) => {
    const currentApiId = form.getValues("apiId");
    if (!currentApiId || currentApiId === generateApiId(form.getValues("displayName"))) {
      form.setValue("apiId", generateApiId(value));
    }
  };

  // Handle field display name change
  const handleFieldDisplayNameChange = (value: string, index: number) => {
    const fields = form.getValues("fields");
    if (!fields[index].name || fields[index].name === generateFieldName(fields[index].displayName)) {
      form.setValue(`fields.${index}.name`, generateFieldName(value));
    }
  };

  // Add a new field
  const addField = () => {
    const fields = form.getValues("fields") || [];
    form.setValue("fields", [
      ...fields,
      {
        name: "",
        displayName: "",
        type: "text",
        required: false,
        unique: false,
      }
    ]);
  };

  // Remove a field
  const removeField = (index: number) => {
    const fields = form.getValues("fields");
    form.setValue("fields", fields.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-lg text-gray-800 dark:text-gray-200">
          {initialData ? "Edit Content Type" : "Create Content Type"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="general">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Blog Post" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              handleDisplayNameChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          The name that will be displayed in the admin interface
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="apiId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. blog_post" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The ID used in API routes and database. Must be lowercase with underscores.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your content type..." 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onCancel}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setActiveTab("fields")}
                    >
                      Continue to Fields
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="fields">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Fields</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addField}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Field
                    </Button>
                  </div>

                  {form.formState.errors.fields?.message && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {form.formState.errors.fields?.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {form.getValues("fields").map((field, index) => (
                    <div key={index} className="p-4 border rounded-md space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Field {index + 1}</h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeField(index)}
                          disabled={form.getValues("fields").length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`fields.${index}.displayName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. Title" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleFieldDisplayNameChange(e.target.value, index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`fields.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. title" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FieldTypeSelector 
                        fieldIndex={index} 
                        control={form.control} 
                        contentTypes={[]} // Will be populated with actual content types for relation fields
                        fieldTypeOptions={fieldTypeOptions} 
                      />
                    </div>
                  ))}
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab("general")}
                    >
                      Back to General
                    </Button>
                    <div className="space-x-2">
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
                            ? "Update Content Type" 
                            : "Create Content Type"
                        }
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
