import { Control, Controller, useWatch } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

interface FieldTypeSelectorProps {
  fieldIndex: number;
  control: Control<any>;
  contentTypes: any[];
  fieldTypeOptions: { value: string; label: string }[];
}

export function FieldTypeSelector({ fieldIndex, control, contentTypes, fieldTypeOptions }: FieldTypeSelectorProps) {
  const [newEnumValue, setNewEnumValue] = useState("");
  
  // Watch the current field type
  const fieldType = useWatch({
    control,
    name: `fields.${fieldIndex}.type`,
    defaultValue: "text",
  });
  
  // Add enum option
  const addEnumOption = () => {
    if (!newEnumValue.trim()) return;
    
    const currentOptions = control._getWatch(`fields.${fieldIndex}.options`) || [];
    control._formValues.fields[fieldIndex].options = [...currentOptions, newEnumValue.trim()];
    control._subjects.state.next({
      name: `fields.${fieldIndex}.options`,
      values: [...currentOptions, newEnumValue.trim()],
    });
    
    setNewEnumValue("");
  };
  
  // Remove enum option
  const removeEnumOption = (index: number) => {
    const currentOptions = control._getWatch(`fields.${fieldIndex}.options`) || [];
    const newOptions = currentOptions.filter((_: any, i: number) => i !== index);
    
    control._formValues.fields[fieldIndex].options = newOptions;
    control._subjects.state.next({
      name: `fields.${fieldIndex}.options`,
      values: newOptions,
    });
  };
  
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name={`fields.${fieldIndex}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fieldTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The type of data this field will store
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {fieldType === "relation" && (
          <FormField
            control={control}
            name={`fields.${fieldIndex}.relationTo`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Content Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a content type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contentTypes.map(contentType => (
                      <SelectItem key={contentType.apiId} value={contentType.apiId}>
                        {contentType.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The content type this field relates to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
      
      {fieldType === "relation" && (
        <FormField
          control={control}
          name={`fields.${fieldIndex}.relationMany`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Allow multiple relations</FormLabel>
                <FormDescription>
                  Enable this to allow selecting multiple related items
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
      
      {fieldType === "media" && (
        <FormField
          control={control}
          name={`fields.${fieldIndex}.multiple`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Allow multiple media files</FormLabel>
                <FormDescription>
                  Enable this to allow uploading multiple media files
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
      
      {fieldType === "enum" && (
        <div className="space-y-3">
          <FormLabel>Enum Options</FormLabel>
          <div className="flex gap-2">
            <Input 
              placeholder="Add option value..." 
              value={newEnumValue}
              onChange={(e) => setNewEnumValue(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addEnumOption}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          
          <Controller
            control={control}
            name={`fields.${fieldIndex}.options`}
            defaultValue={[]}
            render={({ field }) => (
              <div className="mt-2">
                {(field.value || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No options added yet</p>
                ) : (
                  <div className="space-y-2">
                    {(field.value || []).map((option: string, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <span className="text-sm">{option}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeEnumOption(i)}
                          className="h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {(field.value || []).length === 0 && (
                  <FormMessage>
                    At least one option is required for enum fields
                  </FormMessage>
                )}
              </div>
            )}
          />
        </div>
      )}
      
      <Separator className="my-2" />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`fields.${fieldIndex}.required`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Required</FormLabel>
                <FormDescription>
                  This field must have a value
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name={`fields.${fieldIndex}.unique`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Unique</FormLabel>
                <FormDescription>
                  Values must be unique
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
