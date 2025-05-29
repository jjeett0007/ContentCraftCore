
import { z } from "zod";

// User model schema
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().default("viewer"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export interface User {
  _id?: string;
  id?: string;
  username: string;
  password: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Content type model schema
export const insertContentTypeSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  apiId: z.string().min(1, "API ID is required"),
  description: z.string().optional(),
  fields: z.array(z.any()),
});

export type InsertContentType = z.infer<typeof insertContentTypeSchema>;

export interface ContentType {
  name?: string;
  _id?: string;
  id?: string;
  displayName: string;
  apiId: string;
  description?: string;
  fields: Field[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Media model schema
export const insertMediaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().min(1, "URL is required"),
  type: z.string().min(1, "Type is required"),
  size: z.number().min(1, "Size is required"),
  uploadedBy: z.string().min(1, "Uploaded by is required"),
});

export type InsertMedia = z.infer<typeof insertMediaSchema>;

export interface Media {
  _id?: string;
  id?: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  blobPathname?: string;
}

// Activity model schema
export const insertActivitySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  action: z.string().min(1, "Action is required"),
  entityType: z.string().min(1, "Entity type is required"),
  entityId: z.string().optional(),
  details: z.any().optional(),
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;

export interface Activity {
  _id?: string;
  id?: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  createdAt?: Date;
}

// Settings model schema
export const insertSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.any(),
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;

export interface Setting {
  _id?: string;
  id?: string;
  key: string;
  value: any;
  updatedAt?: Date;
}

// Field type enum for content type fields
export const FieldTypes = {
  TEXT: "text",
  RICHTEXT: "richtext",
  NUMBER: "number",
  BOOLEAN: "boolean",
  DATE: "date",
  DATETIME: "datetime",
  MEDIA: "media",
  JSON: "json",
  RELATION: "relation",
  EMAIL: "email",
  PASSWORD: "password",
  ENUM: "enum",
} as const;

// Field schema for content type builder
export const fieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  displayName: z.string().min(1, "Display name is required"),
  type: z.string().min(1, "Field type is required"),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  defaultValue: z.any().optional(),
  options: z.any().optional(), // For enum fields
  relationTo: z.string().optional(), // For relation fields
  relationMany: z.boolean().optional(), // For relation fields
  multiple: z.boolean().optional(), // For media fields to allow multiple uploads
});

export type Field = z.infer<typeof fieldSchema>;
