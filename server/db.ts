import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, surveys, questions, responses, adminPasswords, Survey, Question, Response, InsertResponse } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * 調查系統查詢函式
 */

/**
 * 根據 slug 獲取調查問卷
 */
export async function getSurveyBySlug(slug: string): Promise<Survey | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(surveys)
    .where(eq(surveys.slug, slug))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * 根據調查 ID 獲取所有題目
 */
export async function getQuestionsBySurveyId(surveyId: number): Promise<Question[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(questions)
    .where(eq(questions.surveyId, surveyId))
    .orderBy(questions.order);
}

/**
 * 儲存匿名回答（不記錄任何身份資訊）
 */
export async function saveResponse(response: InsertResponse): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save response: database not available");
    return;
  }

  try {
    await db.insert(responses).values(response);
  } catch (error) {
    console.error("[Database] Failed to save response:", error);
    throw error;
  }
}

/**
 * 根據調查 ID 和題目 ID 獲取所有回答
 */
export async function getResponsesByQuestion(
  surveyId: number,
  questionId: number
): Promise<Response[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(responses)
    .where(and(eq(responses.surveyId, surveyId), eq(responses.questionId, questionId)));
}

/**
 * 根據調查 ID 獲取所有回答
 */
export async function getResponsesBySurvey(surveyId: number): Promise<Response[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(responses)
    .where(eq(responses.surveyId, surveyId))
    .orderBy(desc(responses.submittedAt));
}

/**
 * 建立新的調查問卷
 */
export async function createSurvey(
  slug: string,
  title: string,
  description?: string
): Promise<Survey | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(surveys).values({
      slug,
      title,
      description,
      status: "draft",
    });

    return getSurveyBySlug(slug);
  } catch (error) {
    console.error("[Database] Failed to create survey:", error);
    throw error;
  }
}

/**
 * 建立新的題目
 */
export async function createQuestion(
  surveyId: number,
  order: number,
  text: string,
  type: "single" | "multiple" | "rating" | "text",
  options?: unknown,
  required: boolean = true
): Promise<Question | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(questions).values({
      surveyId,
      order,
      text,
      type,
      options,
      required: required ? 1 : 0,
    });

    const questionId = (result as any).insertId;
    const created = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
    return created.length > 0 ? created[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to create question:", error);
    throw error;
  }
}

/**
 * 更新調查狀態
 */
export async function updateSurveyStatus(
  surveyId: number,
  status: "draft" | "active" | "closed"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(surveys).set({ status }).where(eq(surveys.id, surveyId));
  } catch (error) {
    console.error("[Database] Failed to update survey status:", error);
    throw error;
  }
}

/**
 * 驗證管理員密碼
 */
export async function getAdminPasswordHash(): Promise<string | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(adminPasswords).limit(1);
  return result.length > 0 ? result[0].passwordHash : undefined;
}

/**
 * 設定管理員密碼
 */
export async function setAdminPassword(passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // 先刪除舊密碼
    await db.delete(adminPasswords);
    // 插入新密碼
    await db.insert(adminPasswords).values({ passwordHash });
  } catch (error) {
    console.error("[Database] Failed to set admin password:", error);
    throw error;
  }
}
