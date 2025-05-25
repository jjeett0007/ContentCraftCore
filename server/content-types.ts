import { Request, Response } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { fieldSchema } from "@shared/schema";
import mongoose from "mongoose";
import { modelRegistry } from "./storage";

// Validate field name format
const isValidFieldName = (name: string): boolean => {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
};

// Validate api ID format
const isValidApiId = (id: string): boolean => {
  return /^[a-z][a-z0-9_]*$/.test(id);
};

// Content type schema
const contentTypeSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  apiId: z.string().min(1, "API ID is required")
    .refine(isValidApiId, "API ID must start with a lowercase letter and contain only lowercase letters, numbers, and underscores"),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1, "At least one field is required"),
});

// Create content type
export const createContentType = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Validate request body
    const validationResult = contentTypeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid content type data", 
        errors: validationResult.error.errors 
      });
    }
    
    const contentTypeData = validationResult.data;
    
    // Validate field names
    for (const field of contentTypeData.fields) {
      if (!isValidFieldName(field.name)) {
        return res.status(400).json({
          message: `Invalid field name: ${field.name}. Field names must start with a letter and contain only letters, numbers, and underscores.`
        });
      }
    }
    
    // Check for duplicate field names
    const fieldNames = contentTypeData.fields.map(field => field.name);
    if (new Set(fieldNames).size !== fieldNames.length) {
      return res.status(400).json({
        message: "Duplicate field names are not allowed"
      });
    }
    
    // Check if content type with same apiId already exists
    const existingContentType = await storage.getContentTypeByApiId(contentTypeData.apiId);
    if (existingContentType) {
      return res.status(409).json({
        message: `A content type with API ID '${contentTypeData.apiId}' already exists`
      });
    }
    
    // Create content type
    const contentType = await storage.createContentType(contentTypeData);
    
    // Create Mongoose schema and register model
    createMongooseModel(contentType);
    
    // Create activity entry
    await storage.createActivity({
      userId: user.id,
      action: "create",
      entityType: "content_type",
      entityId: String(contentType.id),
      details: { name: contentType.displayName }
    });
    
    res.status(201).json(contentType);
  } catch (error) {
    console.error("Create content type error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all content types
export const getContentTypes = async (req: Request, res: Response) => {
  try {
    const contentTypes = await storage.getContentTypes();
    
    // Add field count for each content type
    const contentTypesWithCount = contentTypes.map(ct => ({
      ...ct,
      fieldCount: ct.fields.length
    }));
    
    res.status(200).json(contentTypesWithCount);
  } catch (error) {
    console.error("Get content types error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get content type by ID
export const getContentTypeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try to get by ID first (handles both MongoDB ObjectId and numeric ID)
    let contentType = await storage.getContentType(id);
    
    // If not found, try to get by apiId
    if (!contentType) {
      contentType = await storage.getContentTypeByApiId(id);
    }
    
    if (!contentType) {
      return res.status(404).json({ message: "Content type not found" });
    }
    
    res.status(200).json(contentType);
  } catch (error) {
    console.error("Get content type error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update content type
export const updateContentType = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    // Validate request body
    const validationResult = contentTypeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid content type data", 
        errors: validationResult.error.errors 
      });
    }
    
    const contentTypeData = validationResult.data;
    
    // Validate field names
    for (const field of contentTypeData.fields) {
      if (!isValidFieldName(field.name)) {
        return res.status(400).json({
          message: `Invalid field name: ${field.name}. Field names must start with a letter and contain only letters, numbers, and underscores.`
        });
      }
    }
    
    // Check for duplicate field names
    const fieldNames = contentTypeData.fields.map(field => field.name);
    if (new Set(fieldNames).size !== fieldNames.length) {
      return res.status(400).json({
        message: "Duplicate field names are not allowed"
      });
    }
    
    // Find content type
    const contentType = await storage.getContentType(id);
    if (!contentType) {
      return res.status(404).json({ message: "Content type not found" });
    }
    
    // Check if apiId is being changed and if new apiId already exists
    if (contentTypeData.apiId !== contentType.apiId) {
      const existingContentType = await storage.getContentTypeByApiId(contentTypeData.apiId);
      if (existingContentType) {
        return res.status(409).json({
          message: `A content type with API ID '${contentTypeData.apiId}' already exists`
        });
      }
    }
    
    // Update content type
    const updatedContentType = await storage.updateContentType(id, contentTypeData);
    if (!updatedContentType) {
      return res.status(404).json({ message: "Content type not found" });
    }
    
    // Update Mongoose schema and model
    createMongooseModel(updatedContentType);
    
    // Create activity entry
    await storage.createActivity({
      userId: user.id,
      action: "update",
      entityType: "content_type",
      entityId: String(contentType.id),
      details: { name: updatedContentType.displayName }
    });
    
    res.status(200).json(updatedContentType);
  } catch (error) {
    console.error("Update content type error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete content type
export const deleteContentType = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    // Find content type
    const contentType = await storage.getContentType(id);
    if (!contentType) {
      return res.status(404).json({ message: "Content type not found" });
    }
    
    // Delete content type
    const result = await storage.deleteContentType(id);
    if (!result) {
      return res.status(404).json({ message: "Content type not found" });
    }
    
    // Remove model from registry
    modelRegistry.delete(contentType.apiId);
    
    // Create activity entry
    await storage.createActivity({
      userId: user.id,
      action: "delete",
      entityType: "content_type",
      entityId: String(contentType.id),
      details: { name: contentType.displayName }
    });
    
    res.status(200).json({ message: "Content type deleted successfully" });
  } catch (error) {
    console.error("Delete content type error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Convert field type to Mongoose schema type
const fieldTypeToMongooseType = (field: any) => {
  switch (field.type) {
    case 'text':
    case 'richtext':
    case 'email':
    case 'password':
    case 'enum':
      return { type: String };
    case 'number':
      return { type: Number };
    case 'boolean':
      return { type: Boolean };
    case 'date':
    case 'datetime':
      return { type: Date };
    case 'json':
      return { type: mongoose.Schema.Types.Mixed };
    case 'media':
      return field.multiple
        ? [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }]
        : { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null };
    case 'relation':
      return field.relationMany 
        ? [{ type: mongoose.Schema.Types.ObjectId, ref: field.relationTo }]
        : { type: mongoose.Schema.Types.ObjectId, ref: field.relationTo, default: null };
    default:
      return { type: String };
  }
};

// Create Mongoose schema and model from content type
export const createMongooseModel = (contentType: any) => {
  try {
    // Create schema definition
    const schemaDefinition: any = {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    };
    
    // Add fields from content type
    for (const field of contentType.fields) {
      const fieldConfig = fieldTypeToMongooseType(field);
      
      // Add required flag if specified
      if (field.required) {
        fieldConfig.required = true;
      }
      
      // Add unique flag if specified
      if (field.unique) {
        fieldConfig.unique = true;
      }
      
      // Add default value if specified
      if (field.defaultValue !== undefined) {
        fieldConfig.default = field.defaultValue;
      }
      
      // Add enum values if specified for enum type
      if (field.type === 'enum' && field.options) {
        fieldConfig.enum = field.options;
      }
      
      schemaDefinition[field.name] = fieldConfig;
    }
    
    // Create schema
    const schema = new mongoose.Schema(schemaDefinition, { timestamps: true });
    
    // Delete existing model if it exists to avoid overwrite warning
    if (modelRegistry.has(contentType.apiId)) {
      modelRegistry.delete(contentType.apiId);
    }
    
    // Create model
    try {
      if (mongoose.connection.readyState === 1) { // Check if connected to MongoDB
        const model = mongoose.model(contentType.apiId, schema);
        modelRegistry.set(contentType.apiId, model);
        console.log(`Model created for content type: ${contentType.apiId}`);
      } else {
        console.log(`MongoDB not connected, skipping model creation for: ${contentType.apiId}`);
      }
    } catch (error) {
      console.error(`Error creating model for content type ${contentType.apiId}:`, error);
    }
  } catch (error) {
    console.error("Error creating Mongoose model:", error);
  }
};

// Initialize all content type models
export const initializeContentTypeModels = async () => {
  try {
    const contentTypes = await storage.getContentTypes();
    for (const contentType of contentTypes) {
      createMongooseModel(contentType);
    }
    console.log(`Initialized ${contentTypes.length} content type models`);
  } catch (error) {
    console.error("Error initializing content type models:", error);
  }
};
