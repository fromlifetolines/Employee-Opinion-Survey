import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { z } from "zod";

interface FormResponse {
  [questionId: number]: string;
}

export default function SurveyForm() {
  const { slug } = useParams<{ slug: string }>();
  const [formResponses, setFormResponses] = useState<FormResponse>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 獲取調查問卷及其題目
  const { data: surveyData, isLoading, error } = trpc.survey.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const submitMutation = trpc.survey.submitResponse.useMutation();

  const handleResponseChange = (questionId: number, answer: string) => {
    setFormResponses((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!surveyData) return;

    // 驗證必填題目
    const unansweredRequired = surveyData.questions.filter(
      (q) => q.required && !formResponses[q.id]
    );

    if (unansweredRequired.length > 0) {
      toast.error(`請填寫所有必填題目 (${unansweredRequired.length} 題)`);
      return;
    }

    setIsSubmitting(true);

    try {
      const responses = surveyData.questions.map((q) => ({
        questionId: q.id,
        answer: formResponses[q.id] || "",
      }));

      await submitMutation.mutateAsync({
        slug: slug || "",
        responses,
      });

      toast.success("感謝您的回答！調查已成功提交。");
      setFormResponses({});
    } catch (err) {
      console.error("Failed to submit survey:", err);
      toast.error("提交失敗，請稍後重試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error || !surveyData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">調查不可用</h2>
          <p className="text-muted-foreground">
            此調查可能已結束或不存在。請確認連結是否正確。
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background editorial-section">
      <div className="container max-w-3xl">
        {/* 標題區域 - 精緻編輯美學 */}
        <div className="mb-12 md:mb-16 lg:mb-20">
          <h1 className="text-foreground mb-4">{surveyData.survey.title}</h1>
          {surveyData.survey.description && (
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {surveyData.survey.description}
            </p>
          )}
          <div className="divider-line mt-8"></div>
        </div>

        {/* 表單 */}
        <form onSubmit={handleSubmit} className="space-y-12">
          {surveyData.questions.map((question, index) => (
            <div key={question.id} className="editorial-section py-8">
              {/* 題號與題目 */}
              <div className="mb-6">
                <div className="text-sm text-muted-foreground mb-2">
                  第 {index + 1} 題 {question.required && <span className="text-destructive">*</span>}
                </div>
                <h3 className="text-foreground">{question.text}</h3>
              </div>

              {/* 根據題型渲染不同的輸入控制項 */}
              {question.type === "single" && (
                <div className="space-y-3">
                  {(question.options as string[])?.map((option) => (
                    <label key={option} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={formResponses[question.id] === option}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        className="w-4 h-4 accent-accent"
                      />
                      <span className="text-foreground group-hover:text-accent transition-colors">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === "multiple" && (
                <div className="space-y-3">
                  {(question.options as string[])?.map((option) => {
                    const selected = (formResponses[question.id] || "").split(",").includes(option);
                    return (
                      <label key={option} className="flex items-center space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          value={option}
                          checked={selected}
                          onChange={(e) => {
                            const current = (formResponses[question.id] || "").split(",").filter(Boolean);
                            if (e.target.checked) {
                              current.push(option);
                            } else {
                              current.splice(current.indexOf(option), 1);
                            }
                            handleResponseChange(question.id, current.join(","));
                          }}
                          className="w-4 h-4 accent-accent"
                        />
                        <span className="text-foreground group-hover:text-accent transition-colors">
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {question.type === "rating" && (
                <div className="flex gap-2 md:gap-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleResponseChange(question.id, rating.toString())}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-sm border-2 transition-all ${
                        formResponses[question.id] === rating.toString()
                          ? "bg-accent border-accent text-accent-foreground"
                          : "border-border text-foreground hover:border-accent"
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "text" && (
                <textarea
                  value={formResponses[question.id] || ""}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  placeholder="請輸入您的回答..."
                  className="w-full min-h-32 p-4 bg-input border border-border rounded-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                />
              )}

              <div className="divider-line mt-8"></div>
            </div>
          ))}

          {/* 提交按鈕 */}
          <div className="flex justify-center pt-8">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  提交中...
                </span>
              ) : (
                "提交調查"
              )}
            </Button>
          </div>
        </form>

        {/* 隱私提示 */}
        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            此調查完全匿名。我們不會收集您的任何身份識別資訊。
          </p>
        </div>
      </div>
    </div>
  );
}
