import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface QRCodeDisplayProps {
  slug: string;
  title?: string;
}

export default function QRCodeDisplay({ slug, title }: QRCodeDisplayProps) {
  const [showQR, setShowQR] = useState(false);

  const { data: qrData, isLoading } = trpc.qrcode.generateSurveyQR.useQuery(
    { 
      slug, 
      size: 300,
      baseUrl: typeof window !== 'undefined' ? window.location.origin : undefined
    },
    { enabled: showQR }
  );

  const handleDownload = async () => {
    if (!qrData?.qrDataUrl) return;

    try {
      const link = document.createElement("a");
      link.href = qrData.qrDataUrl;
      link.download = `survey-qr-${slug}.png`;
      link.click();
      toast.success("二維碼已下載");
    } catch (error) {
      console.error("Failed to download QR code:", error);
      toast.error("下載失敗");
    }
  };

  const handleCopyUrl = () => {
    if (!qrData?.surveyUrl) return;
    navigator.clipboard.writeText(qrData.surveyUrl);
    toast.success("連結已複製");
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowQR(!showQR)}
        variant="outline"
        className="rounded-sm"
      >
        {showQR ? "隱藏" : "顯示"}二維碼
      </Button>

      {showQR && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            調查二維碼
            {title && ` - ${title}`}
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="w-6 h-6" />
            </div>
          ) : qrData ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={qrData.qrDataUrl}
                  alt="Survey QR Code"
                  className="border border-border rounded-sm"
                />
              </div>

              <div className="bg-muted p-3 rounded-sm">
                <p className="text-xs text-muted-foreground mb-2">調查連結：</p>
                <p className="text-sm text-foreground break-all font-mono">
                  {qrData.surveyUrl}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="rounded-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下載二維碼
                </Button>
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  size="sm"
                  className="rounded-sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  複製連結
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-background p-3 rounded-sm">
                <p className="font-semibold mb-2">使用說明：</p>
                <ul className="space-y-1">
                  <li>• 員工可掃描二維碼進入調查表單</li>
                  <li>• 或直接複製連結分享給員工</li>
                  <li>• 下載二維碼用於列印或電子文件</li>
                </ul>
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
