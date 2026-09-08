import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";

export const contentReports = sqliteTable("content_reports", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  videoId: text("video_id").notNull(),
  category: text("category").notNull(),
  details: text("details").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, table => [index("reports_user_created").on(table.userId, table.createdAt), index("reports_status_created").on(table.status, table.createdAt)]);

export const videoModeration = sqliteTable("video_moderation", {
  videoId: text("video_id").primaryKey(),
  blocked: integer("blocked").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

export const stackSessions = sqliteTable("stack_sessions", {
  userId: text("user_id").notNull(),
  stackId: text("stack_id").notNull(),
  data: text("data").notNull(),
  revision: integer("revision").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, table => [primaryKey({columns:[table.userId,table.stackId]})]);

export const topicFeedback = sqliteTable("topic_feedback", {
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  preference: text("preference").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, table => [primaryKey({columns:[table.userId,table.topic]})]);

export const stackAccounts = sqliteTable("stack_accounts", {
  userId: text("user_id").primaryKey(),
  agePolicy: text("age_policy").notNull(),
  ageMethod: text("age_method").notNull(),
  attestedAt: integer("attested_at").notNull(),
});

export const personalStacks = sqliteTable("personal_stacks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  draft: text("draft").notNull(),
  revision: integer("revision").notNull(),
  activeVersion: integer("active_version"),
  lastOperationId: text("last_operation_id").notNull(),
  lastOperationHash: text("last_operation_hash").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, table => [index("personal_stacks_user_updated").on(table.userId, table.updatedAt)]);

export const personalStackVersions = sqliteTable("personal_stack_versions", {
  stackId: text("stack_id").notNull().references(() => personalStacks.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  userId: text("user_id").notNull(),
  edition: text("edition").notNull(),
  createdAt: integer("created_at").notNull(),
}, table => [primaryKey({ columns: [table.stackId, table.version] })]);
