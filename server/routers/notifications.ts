import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getUnreadNotifications,
  markNotificationAsRead,
  getSurveyNotifications,
  getSurveyShareStats,
  recordShareClick,
} from "../db-notifications";

export const notificationsRouter = router({
  // 取得未讀通知
  getUnread: protectedProcedure.query(async () => {
    try {
      const notifications = await getUnreadNotifications();
      return notifications;
    } catch (error) {
      console.error("[API] Failed to get unread notifications:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  // 標記通知為已讀
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await markNotificationAsRead(input.notificationId);
        return { success: true };
      } catch (error) {
        console.error("[API] Failed to mark notification as read:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // 取得調查的所有通知
  getSurveyNotifications: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      try {
        const notifications = await getSurveyNotifications(input.surveyId);
        return notifications;
      } catch (error) {
        console.error("[API] Failed to get survey notifications:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // 取得調查的分享統計
  getShareStats: protectedProcedure
    .input(z.object({ surveyId: z.number() }))
    .query(async ({ input }) => {
      try {
        const stats = await getSurveyShareStats(input.surveyId);
        return stats;
      } catch (error) {
        console.error("[API] Failed to get share stats:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  // 記錄分享連結點擊（公開端點）
  recordClick: publicProcedure
    .input(
      z.object({
        surveyId: z.number(),
        link: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await recordShareClick(input.surveyId, input.link);
        return { success: true };
      } catch (error) {
        console.error("[API] Failed to record share click:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
