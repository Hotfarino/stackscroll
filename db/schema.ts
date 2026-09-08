import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

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
