import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 調查問卷表
 * 儲存問卷的基本資訊，不包含任何員工身份資訊
 */
export const surveys = mysqlTable("surveys", {
  id: int("id").autoincrement().primaryKey(),
  /** 問卷的唯一標識符（用於分享連結） */
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  /** 問卷標題 */
  title: text("title").notNull(),
  /** 問卷描述 */
  description: text("description"),
  /** 問卷狀態：draft（草稿）、active（進行中）、closed（已結束） */
  status: mysqlEnum("status", ["draft", "active", "closed"]).default("draft").notNull(),
  /** 建立時間 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** 更新時間 */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

/**
 * 調查題目表
 * 儲存每份問卷的題目內容與題型
 */
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  /** 所屬問卷的 ID */
  surveyId: int("surveyId").notNull(),
  /** 題目順序 */
  order: int("order").notNull(),
  /** 題目文本 */
  text: text("text").notNull(),
  /** 題型：single（單選）、multiple（多選）、rating（評分）、text（開放式） */
  type: mysqlEnum("type", ["single", "multiple", "rating", "text"]).notNull(),
  /** 是否必填 */
  required: int("required").default(1).notNull(),
  /** 選項列表（JSON 格式，用於 single、multiple、rating） */
  options: json("options"),
  /** 建立時間 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

/**
 * 匿名回答表
 * 儲存員工的調查回答，完全不記錄身份資訊
 * 設計原則：每份回答都是孤立的匿名記錄
 */
export const responses = mysqlTable("responses", {
  id: int("id").autoincrement().primaryKey(),
  /** 所屬問卷的 ID */
  surveyId: int("surveyId").notNull(),
  /** 所屬題目的 ID */
  questionId: int("questionId").notNull(),
  /** 回答內容（可以是選項值、評分、或文字） */
  answer: text("answer").notNull(),
  /** 提交時間（用於統計回覆進度，不用於身份識別） */
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  /** 注意：此表不包含任何身份識別欄位（無 IP、User-Agent、Cookie 等） */
});

export type Response = typeof responses.$inferSelect;
export type InsertResponse = typeof responses.$inferInsert;

/**
 * 管理員密碼表
 * 儲存管理後台的密碼雜湊值
 */
export const adminPasswords = mysqlTable("adminPasswords", {
  id: int("id").autoincrement().primaryKey(),
  /** 密碼的 bcrypt 雜湊值 */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  /** 建立時間 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** 更新時間 */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminPassword = typeof adminPasswords.$inferSelect;
export type InsertAdminPassword = typeof adminPasswords.$inferInsert;

/**
 * 管理員通知表
 * 記錄員工提交調查回答時的通知
 */
export const adminNotifications = mysqlTable("adminNotifications", {
  id: int("id").autoincrement().primaryKey(),
  /** 所屬問卷的 ID */
  surveyId: int("surveyId").notNull(),
  /** 通知類型：submission（新提交）、milestone（里程碑） */
  type: mysqlEnum("type", ["submission", "milestone"]).notNull(),
  /** 通知標題 */
  title: text("title").notNull(),
  /** 通知內容 */
  content: text("content"),
  /** 是否已讀 */
  isRead: int("isRead").default(0).notNull(),
  /** 建立時間 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

/**
 * 調查分享統計表
 * 記錄調查連結的分享與點擊次數
 */
export const shareStats = mysqlTable("shareStats", {
  id: int("id").autoincrement().primaryKey(),
  /** 所屬問卷的 ID */
  surveyId: int("surveyId").notNull(),
  /** 分享連結 */
  link: text("link").notNull(),
  /** 分享次數 */
  shareCount: int("shareCount").default(0).notNull(),
  /** 點擊次數 */
  clickCount: int("clickCount").default(0).notNull(),
  /** 最後分享時間 */
  lastSharedAt: timestamp("lastSharedAt"),
  /** 建立時間 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** 更新時間 */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShareStat = typeof shareStats.$inferSelect;
export type InsertShareStat = typeof shareStats.$inferInsert;