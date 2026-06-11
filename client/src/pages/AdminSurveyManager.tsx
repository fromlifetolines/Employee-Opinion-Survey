import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Copy, Edit2, Trash2, Plus } from "lucide-react";

interface Survey {
  id: number;
  slug: string;
  title: string;
  description: string;
  status: "active" | "inactive";
  createdAt: Date;
}

export default function AdminSurveyManager() {
  const [, setLocation] = useLocation();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSurvey, setNewSurvey] = useState({ slug: "", title: "", description: "" });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin");
      return;
    }

    loadSurveys();
  }, [setLocation]);

  const loadSurveys = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/trpc/surveyManagement.list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ json: {} }),
      });

      if (!response.ok) throw new Error("Failed to load surveys");

      const data = await response.json();
      setSurveys(data.result.data);
    } catch (err) {
      console.error("Failed to load surveys:", err);
      toast.error("無法載入調查清單");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSurvey = async () => {
    if (!newSurvey.slug || !newSurvey.title) {
      toast.error("請填寫調查代碼和標題");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/trpc/surveyManagement.create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          json: {
            slug: newSurvey.slug,
            title: newSurvey.title,
            description: newSurvey.description,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create survey");

      toast.success("調查建立成功");
      setNewSurvey({ slug: "", title: "", description: "" });
      setShowCreateForm(false);
      loadSurveys();
    } catch (err) {
      console.error("Failed to create survey:", err);
      toast.error("建立調查失敗");
    }
  };

  const handleCopyLink = (slug: string) => {
    const link = `${window.location.origin}/survey/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("連結已複製");
  };

  const handleDeleteSurvey = async (id: number) => {
    if (!confirm("確定要刪除此調查嗎？")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/trpc/surveyManagement.delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ json: { id } }),
      });

      if (!response.ok) throw new Error("Failed to delete survey");

      toast.success("調查已刪除");
      loadSurveys();
    } catch (err) {
      console.error("Failed to delete survey:", err);
      toast.error("刪除調查失敗");
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
              調查管理
            </h1>
            <p className="text-muted-foreground">
              建立、編輯與管理員工調查問卷
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建調查
          </Button>
        </div>

        <div className="divider-line mb-12"></div>

        {/* 建立表單 */}
        {showCreateForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">新建調查</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  調查代碼 (slug)
                </label>
                <Input
                  placeholder="例: employee-survey-2024-q2"
                  value={newSurvey.slug}
                  onChange={(e) => setNewSurvey({ ...newSurvey, slug: e.target.value })}
                  className="rounded-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  調查標題
                </label>
                <Input
                  placeholder="例: 2024 年第二季員工滿意度調查"
                  value={newSurvey.title}
                  onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                  className="rounded-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  調查描述 (選填)
                </label>
                <Input
                  placeholder="例: 感謝您的寶貴意見"
                  value={newSurvey.description}
                  onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                  className="rounded-sm"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCreateSurvey}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm"
                >
                  建立
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  className="rounded-sm"
                >
                  取消
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 調查清單 */}
        <div className="space-y-4">
          {surveys.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">尚無調查問卷</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm"
              >
                建立第一份調查
              </Button>
            </Card>
          ) : (
            surveys.map((survey) => (
              <Card key={survey.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {survey.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      代碼: <code className="bg-muted px-2 py-1 rounded">{survey.slug}</code>
                    </p>
                    {survey.description && (
                      <p className="text-sm text-muted-foreground">{survey.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCopyLink(survey.slug)}
                      variant="outline"
                      size="sm"
                      className="rounded-sm"
                      title="複製調查連結"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setLocation(`/admin/survey/${survey.id}`)}
                      variant="outline"
                      size="sm"
                      className="rounded-sm"
                      title="編輯調查"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteSurvey(survey.id)}
                      variant="outline"
                      size="sm"
                      className="rounded-sm text-destructive hover:bg-destructive/10"
                      title="刪除調查"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={() => setLocation(`/admin/survey/${survey.id}/results`)}
                    variant="outline"
                    size="sm"
                    className="rounded-sm"
                  >
                    查看結果
                  </Button>
                  <Button
                    onClick={() => setLocation(`/admin/survey/${survey.id}/questions`)}
                    variant="outline"
                    size="sm"
                    className="rounded-sm"
                  >
                    管理題目
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
