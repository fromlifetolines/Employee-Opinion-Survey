import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getSurveyBySlug,
  getQuestionsBySurveyId,
  saveResponse,
  getResponsesByQuestion,
  getResponsesBySurvey,
  createSurvey,
  createQuestion,
  updateSurveyStatus,
  getAdminPasswordHash,
  setAdminPassword,
} from "./db";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { generateAdminToken, verifyAdminToken } from "./_core/adminAuth";

/**
 * 管理員驗證 procedure
 * 檢查請求頭中的 Authorization token
 */
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const authHeader = ctx.req.headers.authorization;
  if (!authHeader) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid authorization header" });
  }

  const isValid = await verifyAdminToken(token);
  if (!isValid) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired token" });
  }

  return next({ ctx });
});

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 管理員路由
  admin: router({
    /**
     * 驗證管理員密碼
     * 公開端點 - 用於初始登入
     * 安全設計：密碼初始化只能進行一次
     */
    verifyPassword: publicProcedure
      .input(z.object({ password: z.string().min(6) }))
      .mutation(async ({ input }) => {
        try {
          const storedHash = await getAdminPasswordHash();

          // 如果已設定密碼，驗證輸入的密碼
          if (storedHash) {
            const isValid = await bcrypt.compare(input.password, storedHash);
            if (!isValid) {
              throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
            }

            // 生成 JWT 令牌
            const token = await generateAdminToken();
            return { success: true, token };
          }

          // 如果未設定密碼，設定新密碼（僅限第一次）
          const hash = await bcrypt.hash(input.password, 10);
          await setAdminPassword(hash);

          // 生成 JWT 令牌
          const token = await generateAdminToken();
          return { success: true, token };
        } catch (error) {
          console.error("[API] Password verification failed:", error);
          throw error instanceof TRPCError
            ? error
            : new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    /**
     * 變更管理員密碼
     * 受保護端點 - 需要有效的管理員令牌
     */
    changePassword: adminProcedure
      .input(z.object({ oldPassword: z.string(), newPassword: z.string().min(6) }))
      .mutation(async ({ input }) => {
        try {
          const storedHash = await getAdminPasswordHash();
          if (!storedHash) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No password set" });
          }

          // 驗證舊密碼
          const isValid = await bcrypt.compare(input.oldPassword, storedHash);
          if (!isValid) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid old password" });
          }

          // 設定新密碼
          const newHash = await bcrypt.hash(input.newPassword, 10);
          await setAdminPassword(newHash);

          return { success: true };
        } catch (error) {
          console.error("[API] Password change failed:", error);
          throw error instanceof TRPCError
            ? error
            : new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),

  // 調查系統路由
  survey: router({
    /**
     * 根據 slug 獲取調查問卷及其題目
     * 公開端點 - 無需驗證
     */
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const survey = await getSurveyBySlug(input.slug);
        if (!survey) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Survey not found" });
        }

        if (survey.status !== "active") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This survey is not currently active",
          });
        }

        const questions = await getQuestionsBySurveyId(survey.id);
        return { survey, questions };
      }),

    /**
     * 提交匿名調查回答
     * 公開端點 - 無需驗證
     * 重要：不記錄任何身份識別資訊（IP、User-Agent 等）
     */
    submitResponse: publicProcedure
      .input(
        z.object({
          slug: z.string(),
          responses: z.array(
            z.object({
              questionId: z.number(),
              answer: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // 驗證調查是否存在且為活躍狀態
          const survey = await getSurveyBySlug(input.slug);
          if (!survey) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Survey not found" });
          }

          if (survey.status !== "active") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "This survey is not currently active",
            });
          }

          // 儲存所有回答（不記錄任何身份識別資訊）
          for (const response of input.responses) {
            await saveResponse({
              surveyId: survey.id,
              questionId: response.questionId,
              answer: response.answer,
            });
          }

          return { success: true };
        } catch (error) {
          console.error("[API] Failed to submit response:", error);
          throw error instanceof TRPCError
            ? error
            : new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),

    /**
     * 獲取調查結果統計
     * 受保護端點 - 需要管理員令牌
     */
    getStats: adminProcedure
      .input(z.object({ surveyId: z.number() }))
      .query(async ({ input }) => {
        try {
          const responses = await getResponsesBySurvey(input.surveyId);
          const questions = await getQuestionsBySurveyId(input.surveyId);

          // 計算每個題目的統計
          const stats = questions.map((question) => {
            const questionResponses = responses.filter((r) => r.questionId === question.id);

            // 根據題型生成統計數據
            let distribution: Record<string, number> = {};

            if (question.type === "single" || question.type === "multiple") {
              // 選項題：計算每個選項的選擇次數
              questionResponses.forEach((r) => {
                const answers = question.type === "multiple" ? r.answer.split(",") : [r.answer];
                answers.forEach((ans) => {
                  distribution[ans] = (distribution[ans] || 0) + 1;
                });
              });
            } else if (question.type === "rating") {
              // 評分題：計算每個評分的次數
              questionResponses.forEach((r) => {
                distribution[r.answer] = (distribution[r.answer] || 0) + 1;
              });
            }

            return {
              questionId: question.id,
              text: question.text,
              type: question.type,
              responseCount: questionResponses.length,
              distribution,
              responses: question.type === "text" ? questionResponses : undefined,
            };
          });

          return {
            surveyId: input.surveyId,
            totalResponses: responses.length,
            stats,
          };
        } catch (error) {
          console.error("[API] Failed to get stats:", error);
          throw error instanceof TRPCError
            ? error
            : new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
