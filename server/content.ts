import { Request, Response } from "express";
import { storage } from "./storage";
import { modelRegistry } from "./storage";
import mongoose from "mongoose";

// Create content entry
export const createContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { contentType } = req.params;
    
    // Check if content type exists
    const contentTypeData = await storage.getContentTypeByApiId(contentType);
    if (!contentTypeData) {
      return res.status(404).json({ message: `Content type '${contentType}' not found` });
    }
    
    // Validate required fields
    const requiredFields = contentTypeData.fields.filter(field => field.required);
    for (const field of requiredFields) {
      if (req.body[field.name] === undefined) {
        return res.status(400).json({ 
          message: `Field '${field.name}' is required` 
        });
      }
    }
    
    // Create content entry
    const contentEntry = await storage.createContent(contentType, req.body);
    
    // Create activity entry
    await storage.createActivity({
      userId: user.id,
      action: "create",
      entityType: contentType,
      entityId: String(contentEntry.id),
      details: { contentType }
    });
    
    res.status(201).json(contentEntry);
  } catch (error) {
    console.error("Create content error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all content entries
export const getContentEntries = async (req: Request, res: Response) => {
  try {
    const { contentType } = req.params;
    
    // Check if content type exists
    const contentTypeData = await storage.getContentTypeByApiId(contentType);
    if (!contentTypeData) {
      return res.status(404).json({ message: `Content type '${contentType}' not found` });
    }
    
    // Get query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    
    // Get content entries
    const result = await storage.getContent(contentType, { page, limit, search });
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Get content entries error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get content entry by ID
export const getContentEntryById = async (req: Request, res: Response) => {
  try {
    const { contentType, id } = req.params;
    
    // Validate ID format
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ message: "Invalid content entry ID" });
    }
    
    // Check if content type exists
    const contentTypeData = await storage.getContentTypeByApiId(contentType);
    if (!contentTypeData) {
      return res.status(404).json({ message: `Content type '${contentType}' not found` });
    }
    
    // Get content entry
    const contentEntry = await storage.getContentById(contentType, id);
    if (!contentEntry) {
      return res.status(404).json({ message: "Content entry not found" });
    }
    
    res.status(200).json(contentEntry);
  } catch (error) {
    console.error("Get content entry error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update content entry
export const updateContentEntry = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { contentType, id } = req.params;
    
    // Validate ID format
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ message: "Invalid content entry ID" });
    }
    
    // Check if content type exists
    const contentTypeData = await storage.getContentTypeByApiId(contentType);
    if (!contentTypeData) {
      return res.status(404).json({ message: `Content type '${contentType}' not found` });
    }
    
    // Check if content entry exists
    const existingEntry = await storage.getContentById(contentType, id);
    if (!existingEntry) {
      return res.status(404).json({ message: "Content entry not found" });
    }
    
    // Update content entry
    const updatedEntry = await storage.updateContent(contentType, id, req.body);
    
    // Create activity entry
    await storage.createActivity({
      userId: user.id,
      action: "update",
      entityType: contentType,
      entityId: id,
      details: { contentType }
    });
    
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error("Update content entry error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete content entry
export const deleteContentEntry = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { contentType, id } = req.params;
    
    // Validate ID format
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ message: "Invalid content entry ID" });
    }
    
    // Check if content type exists
    const contentTypeData = await storage.getContentTypeByApiId(contentType);
    if (!contentTypeData) {
      return res.status(404).json({ message: `Content type '${contentType}' not found` });
    }
    
    // Check if content entry exists
    const existingEntry = await storage.getContentById(contentType, id);
    if (!existingEntry) {
      return res.status(404).json({ message: "Content entry not found" });
    }
    
    // Delete content entry
    const result = await storage.deleteContent(contentType, id);
    if (!result) {
      return res.status(404).json({ message: "Content entry not found" });
    }
    
    // Create activity entry
    await storage.createActivity({
      userId: user.id,
      action: "delete",
      entityType: contentType,
      entityId: id,
      details: { contentType }
    });
    
    res.status(200).json({ message: "Content entry deleted successfully" });
  } catch (error) {
    console.error("Delete content entry error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
