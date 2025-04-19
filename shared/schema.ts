import { pgTable, text, serial, integer, boolean, varchar, date, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define enums for statuses
export const projectStatusEnum = pgEnum('project_status', [
  'Not Started', 
  'In Progress', 
  'At Risk', 
  'Completed'
]);

export const milestoneStatusEnum = pgEnum('milestone_status', [
  'Not Started', 
  'In Progress', 
  'Completed'
]);

export const issueStatusEnum = pgEnum('issue_status', [
  'Open', 
  'In Progress', 
  'Resolved', 
  'Closed'
]);

export const issuePriorityEnum = pgEnum('issue_priority', [
  'Low',
  'Medium',
  'High',
  'Critical'
]);

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
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
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
  milestoneId: integer("milestone_id").notNull().references(() => milestones.id, { onDelete: 'cascade' }),
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
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
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
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
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
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Relation definitions
export const projectsRelations = relations(projects, ({ many }) => ({
  milestones: many(milestones),
  issues: many(issues),
  updates: many(updates),
  chatMessages: many(chatMessages)
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  project: one(projects, {
    fields: [milestones.projectId],
    references: [projects.id]
  }),
  subtasks: many(subtasks)
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  milestone: one(milestones, {
    fields: [subtasks.milestoneId],
    references: [milestones.id]
  })
}));

export const issuesRelations = relations(issues, ({ one }) => ({
  project: one(projects, {
    fields: [issues.projectId],
    references: [projects.id]
  })
}));

export const updatesRelations = relations(updates, ({ one }) => ({
  project: one(projects, {
    fields: [updates.projectId],
    references: [projects.id]
  })
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  project: one(projects, {
    fields: [chatMessages.projectId],
    references: [projects.id]
  })
}));

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
