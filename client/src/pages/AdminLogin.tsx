import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const verifyPasswordMutation = trpc.admin.verifyPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error("請輸入密碼");
      return;
    }

    if (password.length < 6) {
      toast.error("密碼至少需要 6 個字元");
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyPasswordMutation.mutateAsync({ password });

      if (result.success && result.token) {
        // 儲存 JWT 令牌到 localStorage
        localStorage.setItem("adminToken", result.token);
        toast.success("登入成功");
        setLocation("/admin/dashboard");
      } else {
        toast.error("登入失敗");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err?.data?.code === "UNAUTHORIZED") {
        toast.error("密碼錯誤");
      } else {
        toast.error("登入失敗，請稍後重試");
      }
    } finally {
      setIsLoading(false);
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center editorial-section">
      <div className="container max-w-md">
        <Card className="p-8 md:p-12">
          {/* 標題 */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl text-foreground mb-2">
              管理後台
            </h1>
            <p className="text-muted-foreground">
              請輸入密碼以存取調查結果
            </p>
            <div className="divider-line mt-6"></div>
          </div>

          {/* 登入表單 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                密碼
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入管理密碼（至少 6 個字元）"
                disabled={isLoading}
                className="w-full"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-2">
                首次登入時設定密碼，之後使用此密碼登入
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm font-semibold py-2"
            >
              {isLoading ? "驗證中..." : "登入"}
            </Button>
          </form>

          {/* 隱私提示 */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              此頁面受密碼保護。所有調查數據完全匿名。
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
