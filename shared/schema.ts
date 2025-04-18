import { pgTable, text, serial, integer, boolean, varchar, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Project
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  number: text("number"),
  moduleName: text("module_name"),
  description: text("description"),
  status: text("status").default("Not Started").notNull(),
  progress: integer("progress").default(0),
  startDate: date("start_date"),
  endDate: date("end_date"),
  pmName: text("pm_name"),
  dlName: text("dl_name"),
  baName: text("ba_name"),
  tlName: text("tl_name"),
  uiLeadName: text("ui_lead_name"),
  dbLeadName: text("db_lead_name"),
  qaLeadName: text("qa_lead_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

// Milestones
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("Not Started").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  owner: text("owner"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
});

// Subtasks
export const subtasks = pgTable("subtasks", {
  id: serial("id").primaryKey(),
  milestoneId: integer("milestone_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("Not Started").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  owner: text("owner"),
  emailToSend: text("email_to_send"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubtaskSchema = createInsertSchema(subtasks).omit({
  id: true,
  createdAt: true,
});

// Issues
export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("Open").notNull(),
  priority: text("priority").default("Medium").notNull(),
  owner: text("owner"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  reportedBy: text("reported_by"),
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Updates
export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  content: text("content").notNull(),
  processedContent: jsonb("processed_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by"),
});

export const insertUpdateSchema = createInsertSchema(updates).omit({
  id: true,
  processedContent: true,
  createdAt: true,
});

// Chat
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;

export type Update = typeof updates.$inferSelect;
export type InsertUpdate = z.infer<typeof insertUpdateSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
