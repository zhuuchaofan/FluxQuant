"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ChevronDown, ChevronUp, Rocket } from "lucide-react";
import { toast } from "sonner";
import { type MyAllocationDto, type ReportRequest, EXCLUSION_REASONS } from "./types";
import { submitReportAction } from "@/lib/actions/report";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  allocation: MyAllocationDto;
  onSuccess: (validQty: number, excludedQty: number) => void;
}

export function ReportModal({ open, onClose, allocation, onSuccess }: ReportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showExclusion, setShowExclusion] = useState(false);
  
  // 表单状态
  const [validQty, setValidQty] = useState(0);
  const [excludedQty, setExcludedQty] = useState(0);
  const [exclusionReason, setExclusionReason] = useState("");
  const [comment, setComment] = useState("");

  // 计算预览进度
  const currentTotal = allocation.currentValid + allocation.currentExcluded;
  const newTotal = currentTotal + validQty + excludedQty;
  const newProgressPercent = allocation.targetQuota > 0 
    ? Math.round((newTotal / allocation.targetQuota) * 100) 
    : 0;

  const remaining = allocation.targetQuota - newTotal;

  const handleQuickAdd = (amount: number) => {
    setValidQty((prev) => Math.max(0, prev + amount));
  };

  const handleMaxValid = () => {
    const maxRemaining = allocation.targetQuota - currentTotal - excludedQty;
    setValidQty(Math.max(0, maxRemaining));
  };

  const handleSubmit = async () => {
    if (validQty === 0 && excludedQty === 0) {
      toast.error("请输入有效量或除外量");
      return;
    }

    if (excludedQty > 0 && !exclusionReason) {
      toast.error("除外量大于0时必须选择原因");
      return;
    }

    setIsLoading(true);

    try {
      const request: ReportRequest = {
        allocationId: allocation.id,
        logDate: new Date().toISOString().split("T")[0],
        validQty,
        excludedQty,
        exclusionReason: excludedQty > 0 ? exclusionReason : undefined,
        comment: comment || undefined,
        isBackfill: false,
      };

      const result = await submitReportAction(request);

      if (result.success) {
        toast.success(`填报成功！进度 ${newProgressPercent}%`, {
          description: `有效 +${validQty}${excludedQty > 0 ? `，除外 +${excludedQty}` : ""}`,
        });
        onSuccess(validQty, excludedQty);
        // 重置表单
        setValidQty(0);
        setExcludedQty(0);
        setExclusionReason("");
        setComment("");
        setShowExclusion(false);
      } else {
        toast.error(result.error || "填报失败");
      }
    } catch {
      toast.error("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setValidQty(0);
    setExcludedQty(0);
    setExclusionReason("");
    setComment("");
    setShowExclusion(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-white border-gray-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{allocation.taskPoolName}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {allocation.stageName} · {allocation.projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 有效产出 */}
          <div className="space-y-2">
            <Label className="text-gray-700">今天搞定了多少？</Label>
            <Input
              type="number"
              min={0}
              value={validQty}
              onChange={(e) => setValidQty(Math.max(0, parseInt(e.target.value) || 0))}
              className="text-2xl h-14 bg-gray-50 border-gray-300 text-gray-900 text-center font-mono"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd(10)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <Plus className="w-3 h-3 mr-1" />10
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd(50)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <Plus className="w-3 h-3 mr-1" />50
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMaxValid}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                MAX ({Math.max(0, allocation.targetQuota - currentTotal - excludedQty)})
              </Button>
            </div>
          </div>

          {/* 除外/异常 折叠区 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExclusion(!showExclusion)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-600">遇到无法处理的数据？</span>
              {showExclusion ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showExclusion && (
              <div className="p-3 pt-0 space-y-3 border-t border-gray-200">
                {/* 除外数量 */}
                <div className="space-y-1">
                  <Label className="text-gray-600 text-sm">除外数量</Label>
                  <Input
                    type="number"
                    min={0}
                    value={excludedQty}
                    onChange={(e) => setExcludedQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-gray-50 border-gray-300 text-gray-900"
                  />
                </div>

                {/* 除外原因 */}
                <div className="space-y-1">
                  <Label className="text-gray-600 text-sm">原因 (必选)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {EXCLUSION_REASONS.map((reason) => (
                      <Badge
                        key={reason}
                        variant={exclusionReason === reason ? "default" : "outline"}
                        className={`cursor-pointer transition-colors text-xs ${
                          exclusionReason === reason
                            ? "bg-orange-500 text-white"
                            : "border-gray-300 text-gray-600 hover:bg-gray-100"
                        }`}
                        onClick={() => setExclusionReason(reason)}
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 备注 */}
                <div className="space-y-1">
                  <Label className="text-gray-600 text-sm">备注 (可选)</Label>
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="如：损坏文件名..."
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (validQty === 0 && excludedQty === 0)}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                提交 (进度将升至 {Math.min(newProgressPercent, 100)}%)
                <Rocket className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {/* 剩余提示 */}
          {remaining > 0 && newTotal > currentTotal && (
            <p className="text-center text-xs text-gray-500">
              提交后还剩 <span className="text-blue-600">{remaining}</span> 个单位
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
