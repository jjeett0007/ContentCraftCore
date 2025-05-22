import {
  users, 
  type User, 
  type InsertUser,
  contentTypes,
  type ContentType,
  type InsertContentType,
  media,
  type Media,
  type InsertMedia,
  activities,
  type Activity,
  type InsertActivity,
  settings,
  type Setting,
  type InsertSetting
} from "@shared/schema";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// MongoDB connection
export const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/corebase";
    await mongoose.connect(mongoUri, { 
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    console.log("Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return false;
  }
};

// Dynamically created models cache
export const modelRegistry = new Map<string, mongoose.Model<any>>();

// Clear the model registry
export const clearModelRegistry = () => {
  modelRegistry.clear();
};

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsers(): Promise<User[]>;
  getUsersCount(): Promise<number>;
  
  // Content type methods
  getContentType(id: number): Promise<ContentType | undefined>;
  getContentTypeByApiId(apiId: string): Promise<ContentType | undefined>;
  createContentType(contentType: InsertContentType): Promise<ContentType>;
  updateContentType(id: number, data: Partial<InsertContentType>): Promise<ContentType | undefined>;
  deleteContentType(id: number): Promise<boolean>;
  getContentTypes(): Promise<ContentType[]>;
  
  // Dynamic content methods
  createContent(contentTypeApiId: string, data: any): Promise<any>;
  getContentById(contentTypeApiId: string, id: string): Promise<any>;
  updateContent(contentTypeApiId: string, id: string, data: any): Promise<any>;
  deleteContent(contentTypeApiId: string, id: string): Promise<boolean>;
  getContent(contentTypeApiId: string, options?: any): Promise<any>;
  
  // Media methods
  createMedia(media: InsertMedia): Promise<Media>;
  getMedia(id: number): Promise<Media | undefined>;
  deleteMedia(id: number): Promise<boolean>;
  getMediaList(filters?: any): Promise<Media[]>;
  getMediaCount(): Promise<number>;
  
  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(limit?: number): Promise<Activity[]>;
  
  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: any): Promise<Setting>;
  getSettings(): Promise<Setting[]>;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private contentTypesData: Map<number, ContentType>;
  private mediaData: Map<number, Media>;
  private activitiesData: Map<number, Activity>;
  private settingsData: Map<string, Setting>;
  
  // Counters for ids
  private userIdCounter: number;
  private contentTypeIdCounter: number;
  private mediaIdCounter: number;
  private activityIdCounter: number;
  private settingIdCounter: number;
  
  // Dynamic content storage
  private contentData: Map<string, Map<string, any>>;

  constructor() {
    this.usersData = new Map();
    this.contentTypesData = new Map();
    this.mediaData = new Map();
    this.activitiesData = new Map();
    this.settingsData = new Map();
    this.contentData = new Map();
    
    this.userIdCounter = 1;
    this.contentTypeIdCounter = 1;
    this.mediaIdCounter = 1;
    this.activityIdCounter = 1;
    this.settingIdCounter = 1;
    
    // Initialize with an admin user
    this.createUser({
      username: "admin",
      password: bcrypt.hashSync("password", 10),
      role: "admin"
    });
    
    // Initialize default settings
    this.updateSetting("general", {
      siteName: "Corebase CMS",
      apiPrefix: "/api",
      mediaProvider: "local"
    });
    
    this.updateSetting("permissions", {
      publicRegistration: false,
      defaultRole: "viewer",
      contentApproval: false,
      mediaUploadRoles: {
        admin: true,
        editor: true,
        viewer: false
      }
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.usersData.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...userData,
      id,
      createdAt: now
    };
    this.usersData.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.usersData.delete(id);
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }
  
  async getUsersCount(): Promise<number> {
    return this.usersData.size;
  }
  
  // Content type methods
  async getContentType(id: number): Promise<ContentType | undefined> {
    return this.contentTypesData.get(id);
  }
  
  async getContentTypeByApiId(apiId: string): Promise<ContentType | undefined> {
    for (const contentType of this.contentTypesData.values()) {
      if (contentType.apiId === apiId) {
        return contentType;
      }
    }
    return undefined;
  }
  
  async createContentType(contentTypeData: InsertContentType): Promise<ContentType> {
    const id = this.contentTypeIdCounter++;
    const now = new Date();
    const contentType: ContentType = {
      ...contentTypeData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.contentTypesData.set(id, contentType);
    
    // Create a new collection for this content type
    this.contentData.set(contentType.apiId, new Map());
    
    return contentType;
  }
  
  async updateContentType(id: number, data: Partial<InsertContentType>): Promise<ContentType | undefined> {
    const contentType = await this.getContentType(id);
    if (!contentType) return undefined;
    
    const now = new Date();
    const updatedContentType = { 
      ...contentType, 
      ...data, 
      updatedAt: now 
    };
    
    this.contentTypesData.set(id, updatedContentType);
    return updatedContentType;
  }
  
  async deleteContentType(id: number): Promise<boolean> {
    const contentType = await this.getContentType(id);
    if (!contentType) return false;
    
    // Delete the content collection for this type
    this.contentData.delete(contentType.apiId);
    
    return this.contentTypesData.delete(id);
  }
  
  async getContentTypes(): Promise<ContentType[]> {
    return Array.from(this.contentTypesData.values());
  }
  
  // Dynamic content methods
  async createContent(contentTypeApiId: string, data: any): Promise<any> {
    const contentType = await this.getContentTypeByApiId(contentTypeApiId);
    if (!contentType) {
      throw new Error(`Content type ${contentTypeApiId} not found`);
    }
    
    const collection = this.contentData.get(contentTypeApiId);
    if (!collection) {
      this.contentData.set(contentTypeApiId, new Map());
    }
    
    // Generate unique ID
    const id = Date.now().toString();
    const now = new Date();
    
    const contentItem = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    this.contentData.get(contentTypeApiId)!.set(id, contentItem);
    return contentItem;
  }
  
  async getContentById(contentTypeApiId: string, id: string): Promise<any> {
    const collection = this.contentData.get(contentTypeApiId);
    if (!collection) {
      throw new Error(`Content type ${contentTypeApiId} not found`);
    }
    
    return collection.get(id);
  }
  
  async updateContent(contentTypeApiId: string, id: string, data: any): Promise<any> {
    const collection = this.contentData.get(contentTypeApiId);
    if (!collection) {
      throw new Error(`Content type ${contentTypeApiId} not found`);
    }
    
    const contentItem = collection.get(id);
    if (!contentItem) {
      throw new Error(`Content item with id ${id} not found`);
    }
    
    const now = new Date();
    const updatedItem = {
      ...contentItem,
      ...data,
      updatedAt: now
    };
    
    collection.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteContent(contentTypeApiId: string, id: string): Promise<boolean> {
    const collection = this.contentData.get(contentTypeApiId);
    if (!collection) {
      throw new Error(`Content type ${contentTypeApiId} not found`);
    }
    
    return collection.delete(id);
  }
  
  async getContent(contentTypeApiId: string, options: any = {}): Promise<any> {
    const collection = this.contentData.get(contentTypeApiId);
    if (!collection) {
      throw new Error(`Content type ${contentTypeApiId} not found`);
    }
    
    let entries = Array.from(collection.values());
    
    // Apply search if provided
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      entries = entries.filter((entry) => {
        // Search through all string fields
        for (const [key, value] of Object.entries(entry)) {
          if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
            return true;
          }
        }
        return false;
      });
    }
    
    const totalCount = entries.length;
    
    // Apply pagination
    if (options.page && options.limit) {
      const start = (options.page - 1) * options.limit;
      const end = start + options.limit;
      entries = entries.slice(start, end);
    }
    
    return {
      entries,
      totalCount,
      page: options.page || 1,
      limit: options.limit || totalCount
    };
  }
  
  // Media methods
  async createMedia(mediaData: InsertMedia): Promise<Media> {
    const id = this.mediaIdCounter++;
    const now = new Date();
    const mediaItem: Media = {
      ...mediaData,
      id,
      createdAt: now
    };
    this.mediaData.set(id, mediaItem);
    return mediaItem;
  }
  
  async getMedia(id: number): Promise<Media | undefined> {
    return this.mediaData.get(id);
  }
  
  async deleteMedia(id: number): Promise<boolean> {
    return this.mediaData.delete(id);
  }
  
  async getMediaList(filters: any = {}): Promise<Media[]> {
    let mediaItems = Array.from(this.mediaData.values());
    
    // Apply type filter
    if (filters.type) {
      if (filters.type === 'image') {
        mediaItems = mediaItems.filter(item => item.type.startsWith('image/'));
      } else if (filters.type === 'video') {
        mediaItems = mediaItems.filter(item => item.type.startsWith('video/'));
      } else if (filters.type === 'audio') {
        mediaItems = mediaItems.filter(item => item.type.startsWith('audio/'));
      } else if (filters.type === 'document') {
        mediaItems = mediaItems.filter(item => 
          item.type.includes('pdf') || 
          item.type.includes('document') || 
          item.type.includes('sheet') || 
          item.type.includes('text/')
        );
      }
    }
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      mediaItems = mediaItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
      );
    }
    
    return mediaItems;
  }
  
  async getMediaCount(): Promise<number> {
    return this.mediaData.size;
  }
  
  // Activity methods
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: Activity = {
      ...activityData,
      id,
      createdAt: now
    };
    this.activitiesData.set(id, activity);
    return activity;
  }
  
  async getActivities(limit: number = 10): Promise<Activity[]> {
    const activities = Array.from(this.activitiesData.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return activities.slice(0, limit);
  }
  
  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settingsData.get(key);
  }
  
  async updateSetting(key: string, value: any): Promise<Setting> {
    const now = new Date();
    let setting = this.settingsData.get(key);
    
    if (setting) {
      setting = {
        ...setting,
        value,
        updatedAt: now
      };
    } else {
      const id = this.settingIdCounter++;
      setting = {
        id,
        key,
        value,
        updatedAt: now
      };
    }
    
    this.settingsData.set(key, setting);
    return setting;
  }
  
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settingsData.values());
  }
}

export const storage = new MemStorage();
