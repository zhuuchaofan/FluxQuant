"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { adjustQuotaAction } from "@/lib/actions/matrix";

interface QuotaAdjustDialogProps {
  open: boolean;
  onClose: () => void;
  taskPoolId: number;
  taskPoolName: string;
  currentQuota: number;
  currentProgress: number;
  onSuccess: () => void;
}

export function QuotaAdjustDialog({
  open,
  onClose,
  taskPoolId,
  taskPoolName,
  currentQuota,
  currentProgress,
  onSuccess,
}: QuotaAdjustDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newQuota, setNewQuota] = useState(currentQuota);
  const [reason, setReason] = useState("");

  // 计算预览
  const quotaDiff = newQuota - currentQuota;
  const newProgress = newQuota > 0 
    ? Math.round((currentProgress * currentQuota / 100) / newQuota * 100) 
    : 0;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("请填写变更原因");
      return;
    }

    setIsLoading(true);

    try {
      const result = await adjustQuotaAction(taskPoolId, newQuota, reason);

      if (result.success) {
        toast.success("配额调整成功", {
          description: `${currentQuota} → ${newQuota}`,
        });
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "调整失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle>调整任务总量</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {taskPoolName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 当前配额 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">当前总量</span>
            <span className="font-mono">{currentQuota}</span>
          </div>

          {/* 新配额输入 */}
          <div className="space-y-2">
            <Label className="text-zinc-300">新总量</Label>
            <Input
              type="number"
              min={0}
              value={newQuota}
              onChange={(e) => setNewQuota(Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-zinc-800 border-zinc-600 text-white font-mono text-lg"
            />
            {quotaDiff !== 0 && (
              <p className={`text-sm ${quotaDiff > 0 ? "text-orange-400" : "text-green-400"}`}>
                {quotaDiff > 0 ? `+${quotaDiff}` : quotaDiff} 单位
              </p>
            )}
          </div>

          {/* 进度预览 */}
          {quotaDiff !== 0 && (
            <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-zinc-300">进度影响预览</span>
              </div>
              <p className="text-sm text-zinc-400 mt-2">
                当前进度 <span className="text-white">{currentProgress}%</span> 将变为{" "}
                <span className={newProgress < currentProgress ? "text-orange-400" : "text-green-400"}>
                  {newProgress}%
                </span>
              </p>
            </div>
          )}

          {/* 变更原因 */}
          <div className="space-y-2">
            <Label className="text-zinc-300">变更原因 (必填)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="如：客户追加 1/17 数据包"
              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || quotaDiff === 0 || !reason.trim()}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              "确认调整"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
