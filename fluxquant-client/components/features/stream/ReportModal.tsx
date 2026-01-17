"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="bg-zinc-900 border-zinc-700 h-auto max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-white">{allocation.taskPoolName}</SheetTitle>
          <SheetDescription className="text-zinc-400">
            {allocation.stageName} · {allocation.projectName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 有效产出 */}
          <div className="space-y-3">
            <Label className="text-zinc-300 text-base">今天搞定了多少？</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                value={validQty}
                onChange={(e) => setValidQty(Math.max(0, parseInt(e.target.value) || 0))}
                className="text-3xl h-16 bg-zinc-800 border-zinc-600 text-white text-center font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd(10)}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                <Plus className="w-3 h-3 mr-1" />10
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd(50)}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                <Plus className="w-3 h-3 mr-1" />50
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMaxValid}
                className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/20"
              >
                MAX ({Math.max(0, allocation.targetQuota - currentTotal - excludedQty)})
              </Button>
            </div>
          </div>

          {/* 除外/异常 折叠区 */}
          <div className="border border-zinc-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExclusion(!showExclusion)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-800/50 transition-colors"
            >
              <span className="text-zinc-400">遇到无法处理的数据？</span>
              {showExclusion ? (
                <ChevronUp className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              )}
            </button>

            {showExclusion && (
              <div className="p-4 pt-0 space-y-4 border-t border-zinc-700">
                {/* 除外数量 */}
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-sm">除外数量</Label>
                  <Input
                    type="number"
                    min={0}
                    value={excludedQty}
                    onChange={(e) => setExcludedQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-zinc-800 border-zinc-600 text-white"
                  />
                </div>

                {/* 除外原因 */}
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-sm">原因 (必选)</Label>
                  <div className="flex flex-wrap gap-2">
                    {EXCLUSION_REASONS.map((reason) => (
                      <Badge
                        key={reason}
                        variant={exclusionReason === reason ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          exclusionReason === reason
                            ? "bg-orange-500 text-white"
                            : "border-zinc-600 text-zinc-400 hover:bg-zinc-800"
                        }`}
                        onClick={() => setExclusionReason(reason)}
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 备注 */}
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-sm">备注 (可选)</Label>
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="如：损坏文件名..."
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (validQty === 0 && excludedQty === 0)}
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                提交 (进度将升至 {Math.min(newProgressPercent, 100)}%)
                <Rocket className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* 剩余提示 */}
          {remaining > 0 && newTotal > currentTotal && (
            <p className="text-center text-sm text-zinc-500">
              提交后还剩 <span className="text-cyan-400">{remaining}</span> 个单位
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
