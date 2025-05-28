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
  Field,
} from "@shared/schema";

// MongoDB connection
export const connectToDatabase = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/corebase";
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
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
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: "viewer" },
  },
  { timestamps: true },
);

const ContentTypeSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true },
    apiId: { type: String, required: true, unique: true },
    description: { type: String },
    fields: { type: Array, required: true },
  },
  { timestamps: true },
);

const MediaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: String, required: true },
  },
  { timestamps: true },
);

const ActivitySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

// MongoDB Models
let UserModel: mongoose.Model<any>;
let ContentTypeModel: mongoose.Model<any>;
let MediaModel: mongoose.Model<any>;
let ActivityModel: mongoose.Model<any>;
let SettingModel: mongoose.Model<any>;

// Initialize models
const initializeModels = () => {
  try {
    UserModel = mongoose.model("User", UserSchema);
    ContentTypeModel = mongoose.model("ContentType", ContentTypeSchema);
    MediaModel = mongoose.model("Media", MediaSchema);
    ActivityModel = mongoose.model("Activity", ActivitySchema);
    SettingModel = mongoose.model("Setting", SettingSchema);
  } catch (error) {
    // Models already exist
    UserModel = mongoose.model("User");
    ContentTypeModel = mongoose.model("ContentType");
    MediaModel = mongoose.model("Media");
    ActivityModel = mongoose.model("Activity");
    SettingModel = mongoose.model("Setting");
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
      password: hashedPassword,
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
    return users.map((user) => this.convertMongoUser(user));
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
  async createContentType(
    contentTypeData: InsertContentType,
  ): Promise<ContentType> {
    const contentType = new ContentTypeModel(contentTypeData);
    const savedContentType = await contentType.save();
    return this.convertMongoContentType(savedContentType);
  }

  async getContentTypes(): Promise<ContentType[]> {
    const contentTypes = await ContentTypeModel.find({});
    return contentTypes.map((ct) => this.convertMongoContentType(ct));
  }

  async getContentType(id: number | string): Promise<ContentType | null> {
    try {
      const contentType = await ContentTypeModel.findById(id);
      return contentType ? this.convertMongoContentType(contentType) : null;
    } catch (error) {
      return null;
    }
  }

  async getContentTypeByApiId(apiId: string): Promise<ContentType | null> {
    const contentType = await ContentTypeModel.findOne({ apiId });
    return contentType ? this.convertMongoContentType(contentType) : null;
  }

  async updateContentType(
    id: number | string,
    contentTypeData: Partial<ContentType>,
  ): Promise<ContentType | null> {
    try {
      const contentType = await ContentTypeModel.findByIdAndUpdate(
        id,
        contentTypeData,
        { new: true },
      );
      return contentType ? this.convertMongoContentType(contentType) : null;
    } catch (error) {
      return null;
    }
  }

  async deleteContentType(id: number | string): Promise<boolean> {
    try {
      const result = await ContentTypeModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  // Media operations
  async createMedia(mediaData: InsertMedia): Promise<Media> {
    const media = new MediaModel(mediaData);
    const savedMedia = await media.save();
    return this.convertMongoMedia(savedMedia);
  }

  async getMedia(): Promise<Media[]> {
    const media = await MediaModel.find({});
    return media.map((m) => this.convertMongoMedia(m));
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
    return activities.map((a) => this.convertMongoActivity(a));
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
    return settings.map((s) => this.convertMongoSetting(s));
  }

  async updateSetting(key: string, value: any): Promise<Setting | null> {
    const setting = await SettingModel.findOneAndUpdate(
      { key },
      { key, value, updatedAt: new Date() },
      { new: true, upsert: true },
    );
    return setting ? this.convertMongoSetting(setting) : null;
  }

  // Content operations for dynamic models
  async createContent(contentType: string, data: any): Promise<any> {
    const Model = modelRegistry.get(contentType);
    if (!Model) {
      throw new Error(`Model for content type '${contentType}' not found`);
    }

    // Clean up empty relation and media fields
    const cleanedData = this.cleanContentData(data);

    const content = new Model(cleanedData);
    const savedContent = await content.save();
    return this.convertMongoContent(savedContent);
  }

  async getContent(
    contentType: string,
    options: { page?: number; limit?: number; search?: string } = {},
  ): Promise<{ entries: any[]; totalCount: number }> {
    const model = modelRegistry.get(contentType);
    if (!model) {
      throw new Error(`Model for content type ${contentType} not found`);
    }

    const { page = 1, limit = 10, search = "" } = options;
    let query: any = {};

    // Add search functionality
    if (search) {
      query = {
        $or: [
          { $text: { $search: search } },
          ...Object.keys(model.schema.paths)
            .filter(
              (key) =>
                model.schema.paths[key].instance === "String" &&
                !key.startsWith("_") &&
                !key.startsWith("_") &&
                key !== "__v",
            )
            .map((key) => ({ [key]: { $regex: search, $options: "i" } })),
        ],
      };
    }

    const totalCount = await model.countDocuments(query);
    const entries = await model
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return { entries, totalCount };
  }

  async getContentEntries(contentType: string): Promise<any[]> {
    const model = modelRegistry.get(contentType);
    if (!model) {
      throw new Error(`Model for content type ${contentType} not found`);
    }
    return await model.find({});
  }

  async getContentById(contentType: string, id: string): Promise<any> {
    const model = modelRegistry.get(contentType);
    if (!model) {
      throw new Error(`Model for content type ${contentType} not found`);
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return await model.findById(id);
  }

  async getContentEntry(contentType: string, id: string): Promise<any> {
    return this.getContentById(contentType, id);
  }

  async updateContent(
    contentType: string,
    id: string,
    data: any,
  ): Promise<any> {
    const Model = modelRegistry.get(contentType);
    if (!Model) {
      throw new Error(`Model for content type '${contentType}' not found`);
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    // Clean up empty relation and media fields
    const cleanedData = this.cleanContentData(data);

    const updatedContent = await Model.findByIdAndUpdate(id, cleanedData, {
      new: true,
    });
    return updatedContent ? this.convertMongoContent(updatedContent) : null;
  }

  async updateContentEntry(
    contentType: string,
    id: string,
    data: any,
  ): Promise<any> {
    return this.updateContent(contentType, id, data);
  }

  async deleteContent(contentType: string, id: string): Promise<boolean> {
    const model = modelRegistry.get(contentType);
    if (!model) {
      console.error(`Model for content type ${contentType} not found`);
      return false;
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`Invalid ObjectId format: ${id}`);
      return false;
    }

    try {
      const result = await model.findByIdAndDelete(id);
      console.log(`Delete result for ${id}:`, !!result);
      return !!result;
    } catch (error) {
      console.error(`Error deleting content ${id}:`, error);
      return false;
    }
  }

  async deleteContentEntry(contentType: string, id: string): Promise<boolean> {
    return this.deleteContent(contentType, id);
  }

  // Helper methods to convert MongoDB documents to our interfaces
  private convertMongoUser(user: any): User {
    return {
      id: user._id.toString(),
      username: user.username,
      password: user.password,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private convertMongoContentType(contentType: any): ContentType {
    return {
      id: contentType._id.toString(),
      displayName: contentType.displayName,
      apiId: contentType.apiId,
      description: contentType.description,
      fields: contentType.fields,
      createdAt: contentType.createdAt,
      updatedAt: contentType.updatedAt,
    };
  }

  private convertMongoMedia(media: any): Media {
    return {
      id: media._id.toString(),
      name: media.name,
      url: media.url,
      type: media.type,
      size: media.size,
      uploadedBy: media.uploadedBy,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }

  private convertMongoActivity(activity: any): Activity {
    return {
      id: activity._id.toString(),
      userId: activity.userId,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      details: activity.details,
      createdAt: activity.createdAt,
    };
  }

  private convertMongoSetting(setting: any): Setting {
    return {
      id: setting._id.toString(),
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updatedAt,
    };
  }

  private convertMongoContent(content: any): any {
    return {
      id: content._id.toString(),
      ...content.toObject(),
      _id: undefined,
      __v: undefined,
    };
  }

  private cleanContentData(data: any): any {
    const cleaned = { ...data };

    // Convert empty strings to null for ObjectId fields (relations and media)
    Object.keys(cleaned).forEach((key) => {
      const value = cleaned[key];

      // Handle empty strings, null, undefined values
      if (
        value === "" ||
        value === null ||
        value === undefined ||
        value === "null" ||
        value === "undefined"
      ) {
        delete cleaned[key]; // Let MongoDB handle defaults
        return;
      }

      // Handle empty arrays
      if (Array.isArray(value) && value.length === 0) {
        delete cleaned[key];
        return;
      }

      // Handle arrays with empty strings or invalid values
      if (Array.isArray(value)) {
        const filteredArray = value.filter((item) => {
          // More thorough filtering for array items
          if (
            item === "" ||
            item === null ||
            item === undefined ||
            item === "null" ||
            item === "undefined"
          ) {
            return false;
          }
          // Check for ObjectId validity if it looks like one
          if (typeof item === "string" && item.length === 24) {
            return mongoose.Types.ObjectId.isValid(item);
          }
          return !!item;
        });

        if (filteredArray.length === 0) {
          delete cleaned[key];
        } else {
          cleaned[key] = filteredArray;
        }
        return;
      }

      // Handle string values that are actually "null" or "undefined"
      if (
        typeof value === "string" &&
        (value === "null" || value === "undefined" || value.trim() === "")
      ) {
        delete cleaned[key];
        return;
      }

      // Validate ObjectId strings for relation/media fields
      if (
        typeof value === "string" &&
        value.length === 24 &&
        !mongoose.Types.ObjectId.isValid(value)
      ) {
        delete cleaned[key];
        return;
      }
    });

    return cleaned;
  }
}

// Initialize storage
let storageInstance: MongoStorage;

export const initializeStorage = async () => {
  const connected = await connectToDatabase();
  if (!connected) {
    throw new Error("Failed to connect to MongoDB");
  }
  storageInstance = new MongoStorage();
  console.log("Using MongoDB storage");
  return storageInstance;
};

export const storage = new Proxy({} as MongoStorage, {
  get(target, prop) {
    if (!storageInstance) {
      throw new Error(
        "Storage not initialized. Call initializeStorage() first.",
      );
    }
    return (storageInstance as any)[prop];
  },
});

//jjeett
