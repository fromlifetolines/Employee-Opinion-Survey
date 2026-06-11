import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import QRCode from "qrcode";

export const qrcodeRouter = router({
  generateSurveyQR: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        size: z.number().optional().default(300),
        baseUrl: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const surveyBaseUrl = input.baseUrl || process.env.VITE_FRONTEND_URL || "";
        if (!surveyBaseUrl) {
          throw new Error("Base URL not provided");
        }
        const surveyUrl = `${surveyBaseUrl}/survey/${input.slug}`;

        const qrDataUrl = await QRCode.toDataURL(surveyUrl, {
          width: input.size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        return {
          qrDataUrl,
          surveyUrl,
          slug: input.slug,
        };
      } catch (error) {
        console.error("[API] Failed to generate QR code:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  generateSurveyQRSvg: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        baseUrl: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const surveyBaseUrl = input.baseUrl || process.env.VITE_FRONTEND_URL || "";
        if (!surveyBaseUrl) {
          throw new Error("Base URL not provided");
        }
        const surveyUrl = `${surveyBaseUrl}/survey/${input.slug}`;

        const qrSvg = await QRCode.toString(surveyUrl, {
          type: "svg",
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        } as any);

        return {
          qrSvg,
          surveyUrl,
          slug: input.slug,
        };
      } catch (error) {
        console.error("[API] Failed to generate QR code SVG:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
