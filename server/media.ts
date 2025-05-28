import { Request, Response } from "express";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "cloudinary";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, audio, and documents
    const filetypes = /jpeg|jpg|png|gif|webp|mp4|webm|mp3|wav|ogg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error("File type not supported"));
  },
});

// Configure cloudinary
const configureCloudinary = async () => {
  try {
    const settings = await storage.getSetting("general");
    if (settings && settings.value.mediaProvider === "cloudinary") {
      const cloudinarySettings = await storage.getSetting("cloudinary");
      if (cloudinarySettings && cloudinarySettings.value) {
        cloudinary.v2.config({
          cloud_name: cloudinarySettings.value.cloudName,
          api_key: cloudinarySettings.value.apiKey,
          api_secret: cloudinarySettings.value.apiSecret,
        });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error configuring Cloudinary:", error);
    return false;
  }
};

// Upload to cloudinary
const uploadToCloudinary = (filePath: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(
      filePath,
      {
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// Upload middleware
export const uploadMedia = async (req: Request, res: Response) => {
  try {
    const uploadMiddleware = upload.single("file");
    
    uploadMiddleware(req, res, async (err) => {
      try {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        const user = (req as any).user;
        
        // Check if using cloudinary
        const isCloudinaryConfigured = await configureCloudinary();
        let fileUrl = "";
        
        if (isCloudinaryConfigured) {
          // Upload to cloudinary
          const result = await uploadToCloudinary(req.file.path);
          fileUrl = result.secure_url;
          
          // Delete local file
          fs.unlinkSync(req.file.path);
        } else {
          // Use local file path
          const relativePath = path.relative(process.cwd(), req.file.path);
          fileUrl = `/uploads/${path.basename(req.file.path)}`;
        }
        
        // Save media to database
        const media = await storage.createMedia({
          name: req.file.originalname,
          url: fileUrl,
          type: req.file.mimetype,
          size: req.file.size,
          uploadedBy: user.id,
        });
        
        // Create activity entry
        await storage.createActivity({
          userId: user.id,
          action: "upload",
          entityType: "media",
          entityId: String(media.id),
          details: { name: media.name }
        });
        
        res.status(201).json(media);
      } catch (error) {
        console.error("Upload media error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
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
    
    const media = await storage.getMedia(Number(id));
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
    const media = await storage.getMedia(Number(id));
    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }
    
    // Check if using local storage
    const settings = await storage.getSetting("general");
    if (settings && settings.value.mediaProvider === "local") {
      // Parse the file path from the URL
      const filename = path.basename(media.url);
      const filePath = path.join(uploadsDir, filename);
      
      // Delete the file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else if (settings && settings.value.mediaProvider === "cloudinary") {
      // Delete from cloudinary (optional)
      // This would require extracting the public_id from the URL
      try {
        const publicId = media.url.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.v2.uploader.destroy(publicId);
        }
      } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        // Continue even if Cloudinary delete fails
      }
    }
    
    // Delete from database
    const result = await storage.deleteMedia(Number(id));
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
