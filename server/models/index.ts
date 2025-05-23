import mongoose from 'mongoose';
import { FieldTypes } from '@shared/schema';

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'viewer' },
  createdAt: { type: Date, default: Date.now }
});

// Content Type Schema
const contentTypeSchema = new mongoose.Schema({
  displayName: { type: String, required: true },
  apiId: { type: String, required: true, unique: true },
  description: { type: String },
  fields: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Media Schema
const mediaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Activity Schema
const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

// Settings Schema
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});

// Create and export models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const ContentType = mongoose.models.ContentType || mongoose.model('ContentType', contentTypeSchema);
export const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);
export const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

// Helper function to create dynamic content models
export const createContentModel = (contentType: any) => {
  if (!contentType || !contentType.apiId) {
    throw new Error('Invalid content type');
  }

  // Check if model already exists
  const modelName = `Content_${contentType.apiId}`;
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  // Create schema fields based on content type fields
  const schemaFields: Record<string, any> = {
    _contentType: { type: String, required: true, default: contentType.apiId }
  };

  // Add fields based on the content type definition
  contentType.fields.forEach((field: any) => {
    let schemaField: any = {};
    
    switch (field.type) {
      case FieldTypes.TEXT:
      case FieldTypes.RICHTEXT:
      case FieldTypes.EMAIL:
      case FieldTypes.PASSWORD:
      case FieldTypes.ENUM:
        schemaField = { type: String };
        break;
      case FieldTypes.NUMBER:
        schemaField = { type: Number };
        break;
      case FieldTypes.BOOLEAN:
        schemaField = { type: Boolean };
        break;
      case FieldTypes.DATE:
      case FieldTypes.DATETIME:
        schemaField = { type: Date };
        break;
      case FieldTypes.JSON:
        schemaField = { type: mongoose.Schema.Types.Mixed };
        break;
      case FieldTypes.MEDIA:
        if (field.multiple) {
          schemaField = [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }];
        } else {
          schemaField = { type: mongoose.Schema.Types.ObjectId, ref: 'Media' };
        }
        break;
      case FieldTypes.RELATION:
        if (field.relationMany) {
          schemaField = [{ type: mongoose.Schema.Types.ObjectId, ref: `Content_${field.relationTo}` }];
        } else {
          schemaField = { type: mongoose.Schema.Types.ObjectId, ref: `Content_${field.relationTo}` };
        }
        break;
      default:
        schemaField = { type: String };
    }

    // Add required and unique flags if present
    if (field.required) {
      schemaField.required = true;
    }
    if (field.unique) {
      schemaField.unique = true;
    }
    if (field.defaultValue !== undefined) {
      schemaField.default = field.defaultValue;
    }

    schemaFields[field.name] = schemaField;
  });

  // Add state for draft/published workflow
  schemaFields.state = { 
    type: String, 
    enum: ['draft', 'pending_approval', 'published'], 
    default: 'draft' 
  };
  
  // Add createdBy for tracking content ownership
  schemaFields.createdBy = { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  };
  
  // Add timestamps
  schemaFields.createdAt = { type: Date, default: Date.now };
  schemaFields.updatedAt = { type: Date, default: Date.now };

  // Create and return new model
  const schema = new mongoose.Schema(schemaFields);
  return mongoose.model(modelName, schema);
};