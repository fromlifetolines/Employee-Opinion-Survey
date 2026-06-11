import { getDb } from "./db";
import { adminNotifications, shareStats } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * 建立新通知
 */
export async function createNotification(data: {
  surveyId: number;
  type: "submission" | "milestone";
  title: string;
  content?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(adminNotifications).values({
    surveyId: data.surveyId,
    type: data.type,
    title: data.title,
    content: data.content || null,
  });

  return result;
}

/**
 * 取得未讀通知
 */
export async function getUnreadNotifications() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(adminNotifications)
    .where(eq(adminNotifications.isRead, 0));

  return result;
}

/**
 * 標記通知為已讀
 */
export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(adminNotifications)
    .set({ isRead: 1 })
    .where(eq(adminNotifications.id, notificationId));
}

/**
 * 取得調查的所有通知
 */
export async function getSurveyNotifications(surveyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(adminNotifications)
    .where(eq(adminNotifications.surveyId, surveyId));

  return result;
}

/**
 * 建立或更新分享統計
 */
export async function upsertShareStat(surveyId: number, link: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(shareStats)
    .where(and(eq(shareStats.surveyId, surveyId), eq(shareStats.link, link)))
    .limit(1);

  if (existing.length > 0) {
    // 更新現有記錄
    await db
      .update(shareStats)
      .set({
        shareCount: existing[0].shareCount + 1,
        lastSharedAt: new Date(),
      })
      .where(eq(shareStats.id, existing[0].id));
  } else {
    // 建立新記錄
    await db.insert(shareStats).values({
      surveyId,
      link,
      shareCount: 1,
    });
  }
}

/**
 * 記錄分享連結點擊
 */
export async function recordShareClick(surveyId: number, link: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(shareStats)
    .where(and(eq(shareStats.surveyId, surveyId), eq(shareStats.link, link)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(shareStats)
      .set({ clickCount: existing[0].clickCount + 1 })
      .where(eq(shareStats.id, existing[0].id));
  }
}

/**
 * 取得調查的分享統計
 */
export async function getSurveyShareStats(surveyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(shareStats)
    .where(eq(shareStats.surveyId, surveyId));

  return result;
}
