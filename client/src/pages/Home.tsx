import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background editorial-section">
      {/* 英雄區域 */}
      <div className="container max-w-4xl py-16 md:py-24 lg:py-32">
        <div className="mb-12 md:mb-16">
          <h1 className="text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 leading-tight">
            員工滿意度調查
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
            完全匿名、高度安全的線上調查系統。您的意見對我們很重要，且您的身份將完全保密。
          </p>
          <div className="divider-line mb-8"></div>
        </div>

        {/* 特色卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6">
            <div className="mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-sm flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">完全匿名</h3>
            <p className="text-sm text-muted-foreground">
              我們不記錄任何身份識別資訊。您的回答完全匿名。
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-sm flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">快速填寫</h3>
            <p className="text-sm text-muted-foreground">
              平均只需 5-10 分鐘。無需登入或帳號。
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-sm flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">即時統計</h3>
            <p className="text-sm text-muted-foreground">
              管理員可即時查看結果統計與數據分析。
            </p>
          </Card>
        </div>

        {/* 行動呼籲 */}
        <div className="bg-muted rounded-sm p-8 md:p-12 mb-16">
          <h2 className="text-3xl md:text-4xl text-foreground mb-4">
            開始填寫調查
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl">
            如果您收到調查連結，請直接點擊該連結。或者，您可以在下方輸入調查代碼。
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="輸入調查代碼（例：survey-2024-q1）"
              className="flex-1 px-4 py-3 bg-background border border-border rounded-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const slug = (e.target as HTMLInputElement).value;
                  if (slug) setLocation(`/survey/${slug}`);
                }
              }}
            />
            <Button
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                if (input?.value) setLocation(`/survey/${input.value}`);
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm font-semibold px-6"
            >
              前往調查
            </Button>
          </div>
        </div>

        {/* 常見問題 */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl text-foreground mb-8">
            常見問題
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                我的回答會被誰看到？
              </h3>
              <p className="text-muted-foreground">
                只有授權的管理員可以查看調查結果統計。所有數據都是完全匿名的，無法追蹤到個人。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                我可以修改已提交的回答嗎？
              </h3>
              <p className="text-muted-foreground">
                一旦提交，回答無法修改。但您可以重新填寫調查以提交新的回答。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                這個系統是否安全？
              </h3>
              <p className="text-muted-foreground">
                是的。我們採用業界標準的加密技術，且不儲存任何可識別您身份的資訊。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                我需要帳號或登入嗎？
              </h3>
              <p className="text-muted-foreground">
                不需要。填寫調查完全無需登入或建立帳號。
              </p>
            </div>
          </div>
        </div>

        {/* 管理員入口 */}
        <div className="border-t border-border pt-12">
          <h2 className="text-2xl text-foreground mb-4">
            管理員？
          </h2>
          <p className="text-muted-foreground mb-6">
            如果您是調查管理員，請使用密碼登入以查看結果統計。
          </p>
          <Button
            onClick={() => setLocation("/admin")}
            variant="outline"
            className="rounded-sm"
          >
            管理員登入
          </Button>
        </div>
      </div>

      {/* 頁腳 */}
      <div className="border-t border-border mt-16 py-8">
        <div className="container max-w-4xl">
          <p className="text-sm text-muted-foreground text-center">
            From Life To Lines | 匿名調查系統
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            隱私是我們的首要考量。所有數據完全匿名且受到保護。
          </p>
        </div>
      </div>
    </div>
  );
}
