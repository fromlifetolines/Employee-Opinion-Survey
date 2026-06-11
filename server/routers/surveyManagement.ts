import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { surveys, questions } from "../../drizzle/schema";

export const surveyManagementRouter = router({
  // 建立新調查
  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(3).max(50),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // 檢查 slug 是否已存在
      const existing = await db
        .select()
        .from(surveys)
        .where(eq(surveys.slug, input.slug))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "調查代碼已存在",
        });
      }

      const result = await db.insert(surveys).values({
        slug: input.slug,
        title: input.title,
        description: input.description || "",
        status: "active",
      });

      return {
        id: result[0].insertId,
        slug: input.slug,
        title: input.title,
      };
    }),

  // 更新調查
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: any = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status) updateData.status = input.status;

      await db.update(surveys).set(updateData).where(eq(surveys.id, input.id));

      return { success: true };
    }),

  // 刪除調查
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // 刪除相關的題目
      await db.delete(questions).where(eq(questions.surveyId, input.id));

      // 刪除調查
      await db.delete(surveys).where(eq(surveys.id, input.id));

      return { success: true };
    }),

  // 列出所有調查
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.select().from(surveys);
    return result;
  }),

  // 取得調查詳情
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, input.id))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return result[0];
    }),

  // 新增題目
  addQuestion: protectedProcedure
    .input(
      z.object({
        surveyId: z.number(),
        text: z.string().min(1),
        type: z.enum(["single", "multiple", "rating", "text"]),
        options: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // 取得最大的 order
      const lastQuestion = await db
        .select()
        .from(questions)
        .where(eq(questions.surveyId, input.surveyId));

      const maxOrder = lastQuestion.length > 0
        ? Math.max(...lastQuestion.map((q) => q.order || 0))
        : 0;

      const result = await db.insert(questions).values({
        surveyId: input.surveyId,
        text: input.text,
        type: input.type,
        order: maxOrder + 1,
        options: input.options ? JSON.stringify(input.options) : null,
      });

      return {
        id: result[0].insertId,
        text: input.text,
        type: input.type,
      };
    }),

  // 更新題目
  updateQuestion: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        text: z.string().optional(),
        type: z.enum(["single", "multiple", "rating", "text"]).optional(),
        options: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: any = {};
      if (input.text) updateData.text = input.text;
      if (input.type) updateData.type = input.type;
      if (input.options) updateData.options = JSON.stringify(input.options);

      await db.update(questions).set(updateData).where(eq(questions.id, input.id));

      return { success: true };
    }),

  // 刪除題目
  deleteQuestion: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(questions).where(eq(questions.id, input.id));

      return { success: true };
    }),

  // 取得調查的所有題目
  getQuestions: publicProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db
        .select()
        .from(questions)
        .where(eq(questions.surveyId, input.surveyId));

      return result.map((q) => ({
        ...q,
        options: q.options ? JSON.parse(q.options as string) : [],
      }));
    }),

  // 生成分享連結
  generateShareLink: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const survey = await db
        .select()
        .from(surveys)
        .where(eq(surveys.id, input.surveyId))
        .limit(1);

      if (survey.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const baseUrl = process.env.VITE_FRONTEND_URL || "https://example.com";
      return {
        slug: survey[0].slug,
        link: `/survey/${survey[0].slug}`,
        fullLink: `${baseUrl}/survey/${survey[0].slug}`,
      };
    }),
});
