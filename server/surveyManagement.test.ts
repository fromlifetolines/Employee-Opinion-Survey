import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: () => {},
    } as any,
  };
}

describe("Survey Management API", () => {
  describe("surveyManagement.create", () => {
    it("應該需要認證", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.surveyManagement.create({
          slug: "test-survey",
          title: "測試調查",
        });
        expect.fail("應該拋出認證錯誤");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("surveyManagement.list", () => {
    it("應該需要認證", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.surveyManagement.list();
        expect.fail("應該拋出認證錯誤");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("surveyManagement.generateShareLink", () => {
    it("應該需要認證", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.surveyManagement.generateShareLink({
          surveyId: 1,
        });
        expect.fail("應該拋出認證錯誤");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
