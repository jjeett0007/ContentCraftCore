import type { Express } from "express";
import { createServer, type Server } from "http";
import { initializeStorage } from "./storage";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
import path from "path";

// Import controllers
import { 
  login, 
  register, 
  logout, 
  getCurrentUser, 
  authenticate, 
  authorize 
} from "./auth";

import { 
  createContentType, 
  getContentTypes, 
  getContentTypeById, 
  updateContentType, 
  deleteContentType,
  initializeContentTypeModels
} from "./content-types";

import { 
  createContent, 
  getContentEntries, 
  getContentEntryById, 
  updateContentEntry, 
  deleteContentEntry 
} from "./content";

import { 
  uploadMedia, 
  getMedia, 
  getMediaById, 
  deleteMedia,
  getMediaCount
} from "./media";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage (MongoDB or fallback to memory)
  await initializeStorage();

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Middleware
  app.use(cookieParser());
  app.use(cors({
    origin: process.env.NODE_ENV === "production" ? false : true,
    credentials: true
  }));

  // Serve uploads directory
  app.use("/uploads", express.static(uploadsDir));

  // Initialize content type models
  await initializeContentTypeModels();

  // Auth routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/register", register);
  app.post("/api/auth/logout", logout);
  app.get("/api/auth/me", authenticate, getCurrentUser);

  // User routes
  app.get("/api/users", authenticate, authorize(["administrator"]), async (req, res) => {
    try {
      const { storage } = await import("./storage");
      const users = await storage.getUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/count", authenticate, async (req, res) => {
    try {
      const { storage } = await import("./storage");
      const count = await storage.getUsersCount();
      res.status(200).json({ count });
    } catch (error) {
      console.error("Get users count error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", authenticate, authorize(["administrator"]), async (req, res) => {
    try {
      const { username, password, role } = req.body;
      const { storage } = await import("./storage");
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Hash password
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        role: role || "viewer"
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", authenticate, authorize(["administrator"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, role } = req.body;
      const { storage } = await import("./storage");
      
      // Find user
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if username is being changed and already exists
      if (username && username !== user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(409).json({ message: "Username already exists" });
        }
      }
      
      // Update data
      const updateData: any = {};
      if (username) updateData.username = username;
      if (role) updateData.role = role;
      
      // Hash password if provided
      if (password) {
        const bcrypt = require("bcryptjs");
        updateData.password = await bcrypt.hash(password, 10);
      }
      
      // Update user
      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", authenticate, authorize(["administrator"]), async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { storage } = await import("./storage");
      
      // Prevent deleting yourself
      if (Number(id) === user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Delete user
      const result = await storage.deleteUser(id);
      if (!result) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Content type routes
  app.get("/api/content-types", authenticate, getContentTypes);
  app.post("/api/content-types", authenticate, authorize(["administrator"]), createContentType);
  app.get("/api/content-types/:id", authenticate, getContentTypeById);
  app.put("/api/content-types/:id", authenticate, authorize(["administrator"]), updateContentType);
  app.delete("/api/content-types/:id", authenticate, authorize(["administrator"]), deleteContentType);

  // Dynamic content routes
  app.get("/api/content/:contentType", authenticate, getContentEntries);
  app.post("/api/content/:contentType", authenticate, authorize(["administrator", "editor"]), createContent);
  app.get("/api/content/:contentType/:id", authenticate, getContentEntryById);
  app.put("/api/content/:contentType/:id", authenticate, authorize(["administrator", "editor"]), updateContentEntry);
  app.delete("/api/content/:contentType/:id", authenticate, authorize(["administrator"]), deleteContentEntry);

  // Media routes
  app.get("/api/media", authenticate, getMedia);
  app.post("/api/media", authenticate, authorize(["administrator", "editor"]), uploadMedia);
  app.get("/api/media/count", authenticate, getMediaCount);
  app.get("/api/media/:id", authenticate, getMediaById);
  app.delete("/api/media/:id", authenticate, authorize(["administrator"]), deleteMedia);

  // Activity routes
  app.get("/api/activity", authenticate, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { storage } = await import("./storage");
      const activities = await storage.getActivities(limit);
      
      // Get user info for each activity
      const activitiesWithUsers = await Promise.all(activities.map(async (activity) => {
        const user = await storage.getUser(activity.userId);
        return {
          ...activity,
          user: user ? {
            id: user.id,
            username: user.username,
            role: user.role
          } : null
        };
      }));
      
      res.status(200).json(activitiesWithUsers);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Settings routes
  app.get("/api/settings", authenticate, authorize(["administrator"]), async (req, res) => {
    try {
      // Combine all settings into one response
      const { storage } = await import("./storage");
      const generalSettings = await storage.getSetting("general");
      const permissionsSettings = await storage.getSetting("permissions");
      const cloudinarySettings = await storage.getSetting("cloudinary");
      
      const settings = {
        ...(generalSettings ? generalSettings.value : {}),
        permissions: permissionsSettings ? permissionsSettings.value : {},
        cloudinary: cloudinarySettings ? cloudinarySettings.value : {}
      };
      
      res.status(200).json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/settings", authenticate, authorize(["administrator"]), async (req, res) => {
    try {
      const { 
        siteName, 
        apiPrefix, 
        mediaProvider, 
        cloudinary, 
        permissions 
      } = req.body;
      const { storage } = await import("./storage");
      
      // Update general settings
      if (siteName || apiPrefix || mediaProvider) {
        const generalSettings = {
          siteName: siteName || "Corebase CMS",
          apiPrefix: apiPrefix || "/api",
          mediaProvider: mediaProvider || "local"
        };
        
        await storage.updateSetting("general", generalSettings);
      }
      
      // Update permissions settings
      if (permissions) {
        await storage.updateSetting("permissions", permissions);
      }
      
      // Update cloudinary settings
      if (cloudinary) {
        await storage.updateSetting("cloudinary", cloudinary);
      }
      
      res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const server = createServer(app);
  return server;
}