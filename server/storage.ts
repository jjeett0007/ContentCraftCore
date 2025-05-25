
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import type { 
  User, 
  InsertUser,
  ContentType,
  InsertContentType,
  Media,
  InsertMedia,
  Activity,
  InsertActivity,
  Setting,
  InsertSetting,
  Field
} from "@shared/schema";

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

// MongoDB Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: "viewer" }
}, { timestamps: true });

const ContentTypeSchema = new mongoose.Schema({
  displayName: { type: String, required: true },
  apiId: { type: String, required: true, unique: true },
  description: { type: String },
  fields: { type: Array, required: true }
}, { timestamps: true });

const MediaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: String, required: true }
}, { timestamps: true });

const ActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

// MongoDB Models
let UserModel: mongoose.Model<any>;
let ContentTypeModel: mongoose.Model<any>;
let MediaModel: mongoose.Model<any>;
let ActivityModel: mongoose.Model<any>;
let SettingModel: mongoose.Model<any>;

// Initialize models
const initializeModels = () => {
  try {
    UserModel = mongoose.model('User', UserSchema);
    ContentTypeModel = mongoose.model('ContentType', ContentTypeSchema);
    MediaModel = mongoose.model('Media', MediaSchema);
    ActivityModel = mongoose.model('Activity', ActivitySchema);
    SettingModel = mongoose.model('Setting', SettingSchema);
  } catch (error) {
    // Models already exist
    UserModel = mongoose.model('User');
    ContentTypeModel = mongoose.model('ContentType');
    MediaModel = mongoose.model('Media');
    ActivityModel = mongoose.model('Activity');
    SettingModel = mongoose.model('Setting');
  }
};

// Storage class for MongoDB operations
export class MongoStorage {
  constructor() {
    initializeModels();
  }

  // User operations
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new UserModel({
      ...userData,
      password: hashedPassword
    });
    const savedUser = await user.save();
    return this.convertMongoUser(savedUser);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await UserModel.findOne({ username });
    return user ? this.convertMongoUser(user) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user ? this.convertMongoUser(user) : null;
  }

  async getUsers(): Promise<User[]> {
    const users = await UserModel.find({});
    return users.map(user => this.convertMongoUser(user));
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    const user = await UserModel.findByIdAndUpdate(id, userData, { new: true });
    return user ? this.convertMongoUser(user) : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async getUser(id: number): Promise<User | null> {
    const user = await UserModel.findById(id.toString());
    return user ? this.convertMongoUser(user) : null;
  }

  async getUsersCount(): Promise<number> {
    return await UserModel.countDocuments();
  }

  // Content Type operations
  async createContentType(contentTypeData: InsertContentType): Promise<ContentType> {
    const contentType = new ContentTypeModel(contentTypeData);
    const savedContentType = await contentType.save();
    return this.convertMongoContentType(savedContentType);
  }

  async getContentTypes(): Promise<ContentType[]> {
    const contentTypes = await ContentTypeModel.find({});
    return contentTypes.map(ct => this.convertMongoContentType(ct));
  }

  async getContentType(id: number): Promise<ContentType | null> {
    const contentType = await ContentTypeModel.findById(id);
    return contentType ? this.convertMongoContentType(contentType) : null;
  }

  async getContentTypeByApiId(apiId: string): Promise<ContentType | null> {
    const contentType = await ContentTypeModel.findOne({ apiId });
    return contentType ? this.convertMongoContentType(contentType) : null;
  }

  async updateContentType(id: number, contentTypeData: Partial<ContentType>): Promise<ContentType | null> {
    const contentType = await ContentTypeModel.findByIdAndUpdate(id, contentTypeData, { new: true });
    return contentType ? this.convertMongoContentType(contentType) : null;
  }

  async deleteContentType(id: number): Promise<boolean> {
    const result = await ContentTypeModel.findByIdAndDelete(id);
    return !!result;
  }

  // Media operations
  async createMedia(mediaData: InsertMedia): Promise<Media> {
    const media = new MediaModel(mediaData);
    const savedMedia = await media.save();
    return this.convertMongoMedia(savedMedia);
  }

  async getMedia(): Promise<Media[]> {
    const media = await MediaModel.find({});
    return media.map(m => this.convertMongoMedia(m));
  }

  async getMediaById(id: string): Promise<Media | null> {
    const media = await MediaModel.findById(id);
    return media ? this.convertMongoMedia(media) : null;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const result = await MediaModel.findByIdAndDelete(id);
    return !!result;
  }

  async getMediaCount(): Promise<number> {
    return await MediaModel.countDocuments();
  }

  // Activity operations
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const activity = new ActivityModel(activityData);
    const savedActivity = await activity.save();
    return this.convertMongoActivity(savedActivity);
  }

  async getActivities(limit?: number): Promise<Activity[]> {
    const query = ActivityModel.find({}).sort({ createdAt: -1 });
    if (limit) {
      query.limit(limit);
    }
    const activities = await query.exec();
    return activities.map(a => this.convertMongoActivity(a));
  }

  // Settings operations
  async createSetting(settingData: InsertSetting): Promise<Setting> {
    const setting = new SettingModel(settingData);
    const savedSetting = await setting.save();
    return this.convertMongoSetting(savedSetting);
  }

  async getSetting(key: string): Promise<Setting | null> {
    const setting = await SettingModel.findOne({ key });
    return setting ? this.convertMongoSetting(setting) : null;
  }

  async getSettings(): Promise<Setting[]> {
    const settings = await SettingModel.find({});
    return settings.map(s => this.convertMongoSetting(s));
  }

  async updateSetting(key: string, value: any): Promise<Setting | null> {
    const setting = await SettingModel.findOneAndUpdate(
      { key },
      { key, value, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    return setting ? this.convertMongoSetting(setting) : null;
  }

  // Content operations for dynamic models
  async createContent(contentType: string, data: any): Promise<any> {
    const model = modelRegistry.get(contentType);
    if (!model) {
      throw new Error(`Model for content type ${contentType} not found`);
    }
    const content = new model(data);
    return await content.save();
  }

  async getContentEntries(contentType: string): Promise<any[]> {
    const model = modelRegistry.get(contentType);
    if (!model) {
      throw new Error(`Model for content type ${contentType} not found`);
    }
    return await model.find({});
  }

  async getContentEntry(contentType: string, id: string): Promise<any> {
    const model = modelRegistry.get(contentType);
    if (!model) {
      throw new Error(`Model for content type ${contentType} not found`);
    }
    return await model.findById(id);
  }

  async updateContentEntry(contentType: string, id: string, data: any): Promise<any> {
    const model = modelRegistry.get(contentType);
    if (!model) {
      throw new Error(`Model for content type ${contentType} not found`);
    }
    return await model.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteContentEntry(contentType: string, id: string): Promise<boolean> {
    const model = modelRegistry.get(contentType);
    if (!model) {
      throw new Error(`Model for content type ${contentType} not found`);
    }
    const result = await model.findByIdAndDelete(id);
    return !!result;
  }

  // Helper methods to convert MongoDB documents to our interfaces
  private convertMongoUser(mongoUser: any): User {
    return {
      id: mongoUser._id.toString(),
      username: mongoUser.username,
      password: mongoUser.password,
      role: mongoUser.role,
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt
    };
  }

  private convertMongoContentType(mongoContentType: any): ContentType {
    return {
      id: mongoContentType._id.toString(),
      displayName: mongoContentType.displayName,
      apiId: mongoContentType.apiId,
      description: mongoContentType.description,
      fields: mongoContentType.fields,
      createdAt: mongoContentType.createdAt,
      updatedAt: mongoContentType.updatedAt
    };
  }

  private convertMongoMedia(mongoMedia: any): Media {
    return {
      id: mongoMedia._id.toString(),
      name: mongoMedia.name,
      url: mongoMedia.url,
      type: mongoMedia.type,
      size: mongoMedia.size,
      uploadedBy: mongoMedia.uploadedBy,
      createdAt: mongoMedia.createdAt,
      updatedAt: mongoMedia.updatedAt
    };
  }

  private convertMongoActivity(mongoActivity: any): Activity {
    return {
      id: mongoActivity._id.toString(),
      userId: mongoActivity.userId,
      action: mongoActivity.action,
      entityType: mongoActivity.entityType,
      entityId: mongoActivity.entityId,
      details: mongoActivity.details,
      createdAt: mongoActivity.createdAt
    };
  }

  private convertMongoSetting(mongoSetting: any): Setting {
    return {
      id: mongoSetting._id.toString(),
      key: mongoSetting.key,
      value: mongoSetting.value,
      updatedAt: mongoSetting.updatedAt
    };
  }
}

// Memory storage fallback
export class MemStorage {
  private users = new Map<string, User>();
  private contentTypes = new Map<string, ContentType>();
  private media = new Map<string, Media>();
  private activities: Activity[] = [];
  private settings = new Map<string, Setting>();
  private content = new Map<string, Map<string, any>>();

  // User operations
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const id = Math.random().toString(36).substr(2, 9);
    const user: User = {
      id,
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const updatedUser = { ...user, ...userData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUser(id: number): Promise<User | null> {
    return this.users.get(id.toString()) || null;
  }

  async getUsersCount(): Promise<number> {
    return this.users.size;
  }

  // Content Type operations
  async createContentType(contentTypeData: InsertContentType): Promise<ContentType> {
    const id = Math.random().toString(36).substr(2, 9);
    const contentType: ContentType = {
      id,
      ...contentTypeData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contentTypes.set(id, contentType);
    return contentType;
  }

  async getContentTypes(): Promise<ContentType[]> {
    return Array.from(this.contentTypes.values());
  }

  async getContentType(id: number): Promise<ContentType | null> {
    return this.contentTypes.get(id.toString()) || null;
  }

  async getContentTypeByApiId(apiId: string): Promise<ContentType | null> {
    for (const contentType of this.contentTypes.values()) {
      if (contentType.apiId === apiId) {
        return contentType;
      }
    }
    return null;
  }

  async updateContentType(id: number, contentTypeData: Partial<ContentType>): Promise<ContentType | null> {
    const contentType = this.contentTypes.get(id.toString());
    if (!contentType) return null;
    
    const updatedContentType = { ...contentType, ...contentTypeData, updatedAt: new Date() };
    this.contentTypes.set(id.toString(), updatedContentType);
    return updatedContentType;
  }

  async deleteContentType(id: number): Promise<boolean> {
    return this.contentTypes.delete(id.toString());
  }

  // Media operations
  async createMedia(mediaData: InsertMedia): Promise<Media> {
    const id = Math.random().toString(36).substr(2, 9);
    const media: Media = {
      id,
      ...mediaData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.media.set(id, media);
    return media;
  }

  async getMedia(): Promise<Media[]> {
    return Array.from(this.media.values());
  }

  async getMediaById(id: string): Promise<Media | null> {
    return this.media.get(id) || null;
  }

  async deleteMedia(id: string): Promise<boolean> {
    return this.media.delete(id);
  }

  async getMediaCount(): Promise<number> {
    return this.media.size;
  }

  // Activity operations
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = Math.random().toString(36).substr(2, 9);
    const activity: Activity = {
      id,
      ...activityData,
      createdAt: new Date()
    };
    this.activities.push(activity);
    return activity;
  }

  async getActivities(limit?: number): Promise<Activity[]> {
    const sorted = this.activities.sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // Settings operations
  async createSetting(settingData: InsertSetting): Promise<Setting> {
    const id = Math.random().toString(36).substr(2, 9);
    const setting: Setting = {
      id,
      ...settingData,
      updatedAt: new Date()
    };
    this.settings.set(settingData.key, setting);
    return setting;
  }

  async getSetting(key: string): Promise<Setting | null> {
    return this.settings.get(key) || null;
  }

  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  async updateSetting(key: string, value: any): Promise<Setting | null> {
    const existing = this.settings.get(key);
    const setting: Setting = {
      id: existing?.id || Math.random().toString(36).substr(2, 9),
      key,
      value,
      updatedAt: new Date()
    };
    this.settings.set(key, setting);
    return setting;
  }

  // Content operations
  async createContent(contentType: string, data: any): Promise<any> {
    if (!this.content.has(contentType)) {
      this.content.set(contentType, new Map());
    }
    const contentMap = this.content.get(contentType)!;
    const id = Math.random().toString(36).substr(2, 9);
    const content = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    contentMap.set(id, content);
    return content;
  }

  async getContentEntries(contentType: string): Promise<any[]> {
    const contentMap = this.content.get(contentType);
    return contentMap ? Array.from(contentMap.values()) : [];
  }

  async getContentEntry(contentType: string, id: string): Promise<any> {
    const contentMap = this.content.get(contentType);
    return contentMap?.get(id) || null;
  }

  async updateContentEntry(contentType: string, id: string, data: any): Promise<any> {
    const contentMap = this.content.get(contentType);
    if (!contentMap) return null;
    
    const existing = contentMap.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...data, updatedAt: new Date() };
    contentMap.set(id, updated);
    return updated;
  }

  async deleteContentEntry(contentType: string, id: string): Promise<boolean> {
    const contentMap = this.content.get(contentType);
    return contentMap ? contentMap.delete(id) : false;
  }
}

// Initialize storage
let storageInstance: MongoStorage | MemStorage;

export const initializeStorage = async () => {
  const connected = await connectToDatabase();
  if (connected) {
    storageInstance = new MongoStorage();
    console.log("Using MongoDB storage");
  } else {
    storageInstance = new MemStorage();
    console.log("Using memory storage");
  }
  return storageInstance;
};

export const storage = new Proxy({} as MongoStorage | MemStorage, {
  get(target, prop) {
    if (!storageInstance) {
      throw new Error("Storage not initialized. Call initializeStorage() first.");
    }
    return (storageInstance as any)[prop];
  }
});
