import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SurveyStats {
  questionId: number;
  text: string;
  type: string;
  responseCount: number;
  distribution: Record<string, number>;
  responses?: Array<{ answer: string }>;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [surveyId] = useState(1);
  const [stats, setStats] = useState<SurveyStats[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin");
      return;
    }

    const loadStats = async () => {
      try {
        const response = await fetch("/api/trpc/survey.getStats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            json: { surveyId },
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("adminToken");
            setLocation("/admin");
            return;
          }
          throw new Error("Failed to fetch stats");
        }

        const data = await response.json();
        const result = data.result.data;
        setStats(result.stats);
        setTotalResponses(result.totalResponses);
      } catch (err) {
        console.error("Failed to load stats:", err);
        toast.error("無法載入統計數據");
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [surveyId, setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    toast.success("已登出");
    setLocation("/admin");
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "題目,題型,回答數\n";

      stats.forEach((stat) => {
        csvContent += `"${stat.text}","${stat.type}",${stat.responseCount}\n`;

        if (stat.type === "text") {
          stat.responses?.forEach((r) => {
            csvContent += `,"","${r.answer}"\n`;
          });
        } else {
          Object.entries(stat.distribution).forEach(([option, count]) => {
            csvContent += `,"${option}",${count}\n`;
          });
        }
      });

      const element = document.createElement("a");
      element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
      element.setAttribute("download", `survey-results-${new Date().toISOString().split("T")[0]}.csv`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success("CSV 已匯出");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("匯出失敗");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background editorial-section">
      <div className="container max-w-6xl">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl text-foreground mb-2">
              調查結果
            </h1>
            <p className="text-muted-foreground">
              即時統計與數據分析
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="rounded-sm"
            >
              匯出 CSV
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="rounded-sm"
            >
              登出
            </Button>
          </div>
        </div>

        <div className="divider-line mb-12"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">總回覆數</p>
            <p className="text-4xl font-bold text-foreground">{totalResponses}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">題目數量</p>
            <p className="text-4xl font-bold text-foreground">{stats.length}</p>
          </Card>
        </div>

        <div className="space-y-8">
          {stats.map((stat, index) => {
            const chartData = Object.entries(stat.distribution).map(([label, value]) => ({
              name: label,
              value,
            }));

            return (
              <Card key={stat.questionId} className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    第 {index + 1} 題：{stat.text}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    題型：{stat.type} | 回答數：{stat.responseCount}
                  </p>
                </div>

                {(stat.type === "single" || stat.type === "multiple" || stat.type === "rating") && chartData.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-4">分佈圖</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-4">比例圖</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.map((_, i) => (
                              <Cell key={`cell-${i}`} fill={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][i % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {stat.type === "text" && stat.responses && stat.responses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-4">回答列表</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {stat.responses.map((r, i) => (
                        <div key={i} className="p-3 bg-muted rounded-sm">
                          <p className="text-sm text-foreground">{r.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stat.type === "text" && (!stat.responses || stat.responses.length === 0) && (
                  <p className="text-sm text-muted-foreground">暫無回答</p>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            所有數據完全匿名。此儀表板受密碼保護。
          </p>
        </div>
      </div>
    </div>
  );
}
