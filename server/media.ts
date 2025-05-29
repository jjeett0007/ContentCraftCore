import { Request, Response } from "express";
import { storage } from "./storage";
import { put, del } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

// Upload media using Vercel Blob
export const uploadMedia = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { file, name, mimeType, size } = (req as any).body;
    // const file = (req as any).body.file;

    if (!file) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];

    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({ message: "File type not supported" });
    }

    // Check file size (10MB limit)
    if (size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: "File size too large (max 10MB)" });
    }

    try {
      const base64Body = file.split(',')[1]; // Remove "data:image/...;base64,"
      const buffer = Buffer.from(base64Body, 'base64');
      // Upload to Vercel Blob
      const blob = await put(`public/${name}`, buffer, {
        access: 'public',
        addRandomSuffix: true,
        token: "vercel_blob_rw_R3lQvFxNdAB7AQl2_9D0Z7A5PZ1DuUnjIiJ71qf5mJGErkm",
      });

      // Save media to database
      const media = await storage.createMedia({
        name: name,
        url: blob.url,
        type: mimeType,
        size: size,
        uploadedBy: user.id,
      });

      console.log("Media uploaded:", media);

      // Create activity entry
      await storage.createActivity({
        userId: user.id,
        action: "upload",
        entityType: "media",
        entityId: String(media.id),
        details: { name: media.name }
      });

      res.status(201).json(media);
    } catch (blobError) {
      console.error("Blob upload error:", blobError);
      return res.status(500).json({ message: "Failed to upload file to blob storage" });
    }
  } catch (error) {
    console.error("Upload media error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all media
export const getMedia = async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string;
    const search = req.query.search as string;

    const media = await storage.getMedia();
    res.status(200).json(media);
  } catch (error) {
    console.error("Get media error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get media count
export const getMediaCount = async (req: Request, res: Response) => {
  try {
    const count = await storage.getMediaCount();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Get media count error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get media by ID
export const getMediaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const media = await storage.getMediaById(id);
    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    res.status(200).json(media);
  } catch (error) {
    console.error("Get media error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete media
export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Find media
    const media = await storage.getMediaById(id);
    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Delete from Vercel Blob if pathname is available
    if (media.blobPathname) {
      try {
        await del(media.url);
      } catch (blobError) {
        console.error("Error deleting from Vercel Blob:", blobError);
        // Continue even if blob delete fails
      }
    }

    // Delete from database
    const result = await storage.deleteMedia(id);
    if (!result) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Create activity entry
    await storage.createActivity({
      userId: user.id,
      action: "delete",
      entityType: "media",
      entityId: String(id),
      details: { name: media.name }
    });

    res.status(200).json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Delete media error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};