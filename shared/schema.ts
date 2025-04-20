import { pgTable, text, serial, integer, boolean, varchar, date, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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
  'not_started',
  'in_progress',
  'completed',
  'delayed',
  'critical',
  'blocked'
]);

export const subtaskStatusEnum = pgEnum('subtask_status', [
  'not_started',
  'in_progress',
  'completed',
  'blocked'
]);

export const issueStatusEnum = pgEnum('issue_status', [
  'open',
  'in_progress',
  'resolved',
  'closed'
]);

export const issueSeverityEnum = pgEnum('issue_severity', [
  'low',
  'medium',
  'high',
  'critical'
]);

export const issueSourceEnum = pgEnum('issue_source', [
  'manual',
  'ai'
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
  currentPhase: text("current_phase").default("Requirement Gathering").notNull(),
  startDate: date("start_date").default(sql`CURRENT_DATE`).notNull(),
  endDate: date("end_date").default(sql`CURRENT_DATE + INTERVAL '12 weeks'`).notNull(),
  pmName: text("pm_name").default("").notNull(),
  dlName: text("dl_name").default("").notNull(),
  baName: text("ba_name").default("").notNull(),
  tlName: text("tl_name").default("").notNull(),
  uiLeadName: text("ui_lead_name").default("").notNull(),
  dbLeadName: text("db_lead_name").default("").notNull(),
  qaLeadName: text("qa_lead_name").default("").notNull(),
  email: text("email").default("").notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  timelineConfig: jsonb("timeline_config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project People
export const projectPeople = pgTable("project_people", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: integer("user_id"), // FK to users table if available
  name: text("name"), // fallback if no user table
  role: text("role"),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Milestones
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("not_started").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  owner: text("owner"),
  order: integer("order").notNull(),
  durationInWeeks: integer("duration_in_weeks"),
  color: text("color"), // computed or stored for fast queries
  isCritical: boolean("is_critical").default(false),
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
  status: text("status").default("not_started").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  assignedTo: text("assigned_to"),
  dueDate: date("due_date"),
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
  milestoneId: integer("milestone_id").references(() => milestones.id, { onDelete: 'set null' }),
  subtaskId: integer("subtask_id").references(() => subtasks.id, { onDelete: 'set null' }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("open").notNull(),
  severity: text("severity").default("medium").notNull(),
  priority: text("priority").default("Medium").notNull(),
  owner: text("owner"),
  source: text("source").default("manual").notNull(),
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

export const insertProjectSchema = createInsertSchema(projects).omit({
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
