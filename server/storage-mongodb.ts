import { 
  User as UserType, 
  InsertUser, 
  ContentType as ContentTypeType, 
  InsertContentType, 
  Media as MediaType, 
  InsertMedia, 
  Activity as ActivityType, 
  InsertActivity, 
  Setting as SettingType, 
  InsertSetting
} from "@shared/schema";
import { IStorage } from "./storage";
import { 
  User, 
  ContentType, 
  Media, 
  Activity, 
  Setting, 
  createContentModel 
} from "./models";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export class MongoDBStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<UserType | undefined> {
    const user = await User.findById(id).lean();
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt
    } as unknown as UserType;
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    const user = await User.findOne({ username }).lean();
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt
    } as unknown as UserType;
  }

  async createUser(userData: InsertUser): Promise<UserType> {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await User.create({
      username: userData.username,
      password: hashedPassword,
      role: userData.role || 'viewer'
    });
    
    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt
    } as unknown as UserType;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<UserType | undefined> {
    const updateData: any = { ...userData };
    
    // Hash password if provided
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).lean();
    
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt
    } as unknown as UserType;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  async getUsers(): Promise<UserType[]> {
    const users = await User.find().lean();
    
    return users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt
    })) as unknown as UserType[];
  }

  async getUsersCount(): Promise<number> {
    return await User.countDocuments();
  }
  
  // Content type methods
  async getContentType(id: number): Promise<ContentTypeType | undefined> {
    const contentType = await ContentType.findById(id).lean();
    if (!contentType) return undefined;
    
    return {
      id: contentType._id.toString(),
      displayName: contentType.displayName,
      apiId: contentType.apiId,
      description: contentType.description,
      fields: contentType.fields,
      createdAt: contentType.createdAt,
      updatedAt: contentType.updatedAt
    } as unknown as ContentTypeType;
  }

  async getContentTypeByApiId(apiId: string): Promise<ContentTypeType | undefined> {
    const contentType = await ContentType.findOne({ apiId }).lean();
    if (!contentType) return undefined;
    
    return {
      id: contentType._id.toString(),
      displayName: contentType.displayName,
      apiId: contentType.apiId,
      description: contentType.description,
      fields: contentType.fields,
      createdAt: contentType.createdAt,
      updatedAt: contentType.updatedAt
    } as unknown as ContentTypeType;
  }

  async createContentType(contentTypeData: InsertContentType): Promise<ContentTypeType> {
    const contentType = await ContentType.create(contentTypeData);
    
    // Create the corresponding Mongoose model
    createContentModel({
      apiId: contentType.apiId,
      fields: contentType.fields
    });
    
    return {
      id: contentType._id.toString(),
      displayName: contentType.displayName,
      apiId: contentType.apiId,
      description: contentType.description,
      fields: contentType.fields,
      createdAt: contentType.createdAt,
      updatedAt: contentType.updatedAt
    } as unknown as ContentTypeType;
  }

  async updateContentType(id: number, data: Partial<InsertContentType>): Promise<ContentTypeType | undefined> {
    const contentType = await ContentType.findByIdAndUpdate(
      id,
      {
        ...data,
        updatedAt: new Date()
      },
      { new: true }
    ).lean();
    
    if (!contentType) return undefined;
    
    // Update the corresponding Mongoose model if necessary
    if (data.fields || data.apiId) {
      createContentModel({
        apiId: contentType.apiId,
        fields: contentType.fields
      });
    }
    
    return {
      id: contentType._id.toString(),
      displayName: contentType.displayName,
      apiId: contentType.apiId,
      description: contentType.description,
      fields: contentType.fields,
      createdAt: contentType.createdAt,
      updatedAt: contentType.updatedAt
    } as unknown as ContentTypeType;
  }

  async deleteContentType(id: number): Promise<boolean> {
    // First get the content type to know its apiId
    const contentType = await ContentType.findById(id).lean();
    if (!contentType) return false;
    
    // Delete all content entries of this type
    const modelName = `Content_${contentType.apiId}`;
    if (mongoose.models[modelName]) {
      await mongoose.models[modelName].deleteMany({});
    }
    
    // Delete the content type
    const result = await ContentType.findByIdAndDelete(id);
    return !!result;
  }

  async getContentTypes(): Promise<ContentTypeType[]> {
    const contentTypes = await ContentType.find().lean();
    
    return contentTypes.map(contentType => ({
      id: contentType._id.toString(),
      displayName: contentType.displayName,
      apiId: contentType.apiId,
      description: contentType.description,
      fields: contentType.fields,
      createdAt: contentType.createdAt,
      updatedAt: contentType.updatedAt
    })) as unknown as ContentTypeType[];
  }
  
  // Dynamic content methods
  async createContent(contentTypeApiId: string, data: any): Promise<any> {
    // Get content type
    const contentType = await ContentType.findOne({ apiId: contentTypeApiId }).lean();
    if (!contentType) {
      throw new Error(`Content type ${contentTypeApiId} not found`);
    }
    
    // Get or create model
    const model = createContentModel(contentType);
    
    // Create content entry
    const entry = await model.create({
      ...data,
      _contentType: contentTypeApiId
    });
    
    return entry.toObject();
  }

  async getContentById(contentTypeApiId: string, id: string): Promise<any> {
    // Get content type
    const contentType = await ContentType.findOne({ apiId: contentTypeApiId }).lean();
    if (!contentType) {
      throw new Error(`Content type ${contentTypeApiId} not found`);
    }
    
    // Get model
    const model = createContentModel(contentType);
    
    // Find entry
    const entry = await model.findById(id).lean();
    if (!entry) return null;
    
    return entry;
  }

  async updateContent(contentTypeApiId: string, id: string, data: any): Promise<any> {
    // Get content type
    const contentType = await ContentType.findOne({ apiId: contentTypeApiId }).lean();
    if (!contentType) {
      throw new Error(`Content type ${contentTypeApiId} not found`);
    }
    
    // Get model
    const model = createContentModel(contentType);
    
    // Update entry
    const entry = await model.findByIdAndUpdate(
      id,
      {
        ...data,
        updatedAt: new Date()
      },
      { new: true }
    ).lean();
    
    if (!entry) return null;
    
    return entry;
  }

  async deleteContent(contentTypeApiId: string, id: string): Promise<boolean> {
    // Get content type
    const contentType = await ContentType.findOne({ apiId: contentTypeApiId }).lean();
    if (!contentType) {
      throw new Error(`Content type ${contentTypeApiId} not found`);
    }
    
    // Get model
    const model = createContentModel(contentType);
    
    // Delete entry
    const result = await model.findByIdAndDelete(id);
    return !!result;
  }

  async getContent(contentTypeApiId: string, options: any = {}): Promise<any> {
    // Get content type
    const contentType = await ContentType.findOne({ apiId: contentTypeApiId }).lean();
    if (!contentType) {
      throw new Error(`Content type ${contentTypeApiId} not found`);
    }
    
    // Get model
    const model = createContentModel(contentType);
    
    // Build query
    let query = model.find();
    
    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    
    query = query.skip(skip).limit(limit);
    
    // Get results
    const entries = await query.lean();
    const total = await model.countDocuments();
    
    return {
      data: entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  // Media methods
  async createMedia(mediaData: InsertMedia): Promise<MediaType> {
    const media = await Media.create(mediaData);
    
    return {
      id: media._id.toString(),
      name: media.name,
      url: media.url,
      type: media.type,
      size: media.size,
      uploadedBy: media.uploadedBy,
      createdAt: media.createdAt
    } as unknown as MediaType;
  }

  async getMedia(id: number): Promise<MediaType | undefined> {
    const media = await Media.findById(id).lean();
    if (!media) return undefined;
    
    return {
      id: media._id.toString(),
      name: media.name,
      url: media.url,
      type: media.type,
      size: media.size,
      uploadedBy: media.uploadedBy,
      createdAt: media.createdAt
    } as unknown as MediaType;
  }

  async deleteMedia(id: number): Promise<boolean> {
    const result = await Media.findByIdAndDelete(id);
    return !!result;
  }

  async getMediaList(filters: any = {}): Promise<MediaType[]> {
    let query = Media.find();
    
    // Apply filters
    if (filters.type) {
      query = query.where('type').equals(filters.type);
    }
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.skip) {
      query = query.skip(filters.skip);
    }
    
    // Apply sorting
    const sortField = filters.sortField || 'createdAt';
    const sortOrder = filters.sortOrder || -1;
    query = query.sort({ [sortField]: sortOrder });
    
    const media = await query.lean();
    
    return media.map(item => ({
      id: item._id.toString(),
      name: item.name,
      url: item.url,
      type: item.type,
      size: item.size,
      uploadedBy: item.uploadedBy,
      createdAt: item.createdAt
    })) as unknown as MediaType[];
  }

  async getMediaCount(): Promise<number> {
    return await Media.countDocuments();
  }
  
  // Activity methods
  async createActivity(activityData: InsertActivity): Promise<ActivityType> {
    const activity = await Activity.create(activityData);
    
    return {
      id: activity._id.toString(),
      userId: activity.userId,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      details: activity.details,
      createdAt: activity.createdAt
    } as unknown as ActivityType;
  }

  async getActivities(limit: number = 10): Promise<ActivityType[]> {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return activities.map(activity => ({
      id: activity._id.toString(),
      userId: activity.userId,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      details: activity.details,
      createdAt: activity.createdAt
    })) as unknown as ActivityType[];
  }
  
  // Settings methods
  async getSetting(key: string): Promise<SettingType | undefined> {
    const setting = await Setting.findOne({ key }).lean();
    if (!setting) return undefined;
    
    return {
      id: setting._id.toString(),
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updatedAt
    } as unknown as SettingType;
  }

  async updateSetting(key: string, value: any): Promise<SettingType> {
    const setting = await Setting.findOneAndUpdate(
      { key },
      { 
        key, 
        value,
        updatedAt: new Date()
      },
      { 
        new: true,
        upsert: true
      }
    ).lean();
    
    return {
      id: setting._id.toString(),
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updatedAt
    } as unknown as SettingType;
  }

  async getSettings(): Promise<SettingType[]> {
    const settings = await Setting.find().lean();
    
    return settings.map(setting => ({
      id: setting._id.toString(),
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updatedAt
    })) as unknown as SettingType[];
  }
}