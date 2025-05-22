import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Content type model
export const contentTypes = pgTable("content_types", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull(),
  apiId: text("api_id").notNull().unique(),
  description: text("description"),
  fields: jsonb("fields").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContentTypeSchema = createInsertSchema(contentTypes).pick({
  displayName: true,
  apiId: true,
  description: true,
  fields: true,
});

export type InsertContentType = z.infer<typeof insertContentTypeSchema>;
export type ContentType = typeof contentTypes.$inferSelect;

// Media model
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMediaSchema = createInsertSchema(media).pick({
  name: true,
  url: true,
  type: true,
  size: true,
  uploadedBy: true,
});

export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof media.$inferSelect;

// Activity model
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Settings model
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

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
