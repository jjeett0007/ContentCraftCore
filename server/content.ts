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
    
    // Add user and state information to the content
    const contentData = {
      ...req.body,
      createdBy: user.id,
      state: 'draft' // Default to draft state
    };
    
    // Create content entry
    const contentEntry = await storage.createContent(contentType, contentData);
    
    // Create activity entry
    await storage.createActivity({
      userId: user.id,
      action: "create",
      entityType: contentType,
      entityId: String(contentEntry.id),
      details: { contentType, state: 'draft' }
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
    
    // Check if the user is the creator or has appropriate permissions
    const isCreator = existingEntry.createdBy && existingEntry.createdBy.toString() === user.id;
    const isAdmin = user.role === 'administrator';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: "You don't have permission to update this content" });
    }
    
    // Get settings to check if content approval is required
    const settings = await storage.getSetting('permissions');
    const requireApproval = settings?.value?.contentApproval === true;
    
    // Handle state changes if included in the request
    let updatedState = req.body.state;
    const currentState = existingEntry.state || 'draft';
    
    // Create a copy of the request body to avoid mutating it directly
    const updateData = { ...req.body };
    
    if (updatedState) {
      // Only admins can publish directly if approval is required
      if (requireApproval && updatedState === 'published' && !isAdmin) {
        updatedState = 'pending_approval';
        updateData.state = 'pending_approval';
      }
      
      // If transitioning from a published state to draft, no approval needed
      if (currentState === 'published' && updatedState === 'draft') {
        updateData.state = 'draft';
      }
      
      // If admin is approving content
      if (isAdmin && currentState === 'pending_approval' && updatedState === 'published') {
        updateData.state = 'published';
      }
    }
    
    // Update content entry
    const updatedEntry = await storage.updateContent(contentType, id, updateData);
    
    // Create activity entry with state information
    await storage.createActivity({
      userId: user.id,
      action: "update",
      entityType: contentType,
      entityId: id,
      details: { 
        contentType,
        previousState: currentState,
        newState: updatedEntry.state 
      }
    });
    
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error("Update content entry error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get pending content entries for approval
export const getPendingContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Only administrators can view pending content
    if (user.role !== 'administrator') {
      return res.status(403).json({ message: "You don't have permission to access pending content" });
    }
    
    // Get all content types
    const contentTypes = await storage.getContentTypes();
    
    // Fetch pending content from each content type
    const pendingContentByType = [];
    
    for (const contentType of contentTypes) {
      const model = modelRegistry.get(`Content_${contentType.apiId}`);
      
      if (model) {
        // Find all content entries with state 'pending_approval'
        const pendingEntries = await model.find({ state: 'pending_approval' })
          .populate('createdBy', 'username')
          .sort({ updatedAt: -1 });
        
        if (pendingEntries.length > 0) {
          pendingContentByType.push({
            contentType: {
              id: contentType.id,
              apiId: contentType.apiId,
              displayName: contentType.displayName
            },
            entries: pendingEntries.map((entry: any) => ({
              id: entry._id,
              createdBy: entry.createdBy,
              createdAt: entry.createdAt,
              updatedAt: entry.updatedAt
            }))
          });
        }
      }
    }
    
    res.status(200).json(pendingContentByType);
  } catch (error) {
    console.error("Get pending content error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Approve or reject content entry
export const updateContentState = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { contentType, id } = req.params;
    const { state } = req.body;
    
    // Only administrators can approve content
    if (user.role !== 'administrator' && state === 'published') {
      return res.status(403).json({ message: "You don't have permission to approve content" });
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
    
    // Only process valid state changes
    if (!['draft', 'pending_approval', 'published'].includes(state)) {
      return res.status(400).json({ message: "Invalid state provided" });
    }
    
    // Update the state
    const updateData = { state };
    const updatedEntry = await storage.updateContent(contentType, id, updateData);
    
    // Create activity log
    await storage.createActivity({
      userId: user.id,
      action: state === 'published' ? 'approve' : state === 'pending_approval' ? 'request_approval' : 'revert_to_draft',
      entityType: contentType,
      entityId: id,
      details: { 
        contentType,
        previousState: existingEntry.state,
        newState: state
      }
    });
    
    res.status(200).json(updatedEntry);
  } catch (error) {
    console.error("Update content state error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteContentEntry = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { contentType, id } = req.params;
    
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
