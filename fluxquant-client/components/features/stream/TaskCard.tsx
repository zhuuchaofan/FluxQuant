"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { type MyAllocationDto } from "./types";
import { ReportModal } from "./ReportModal";

interface TaskCardProps {
  allocation: MyAllocationDto;
  onReportSuccess?: () => void;
}

export function TaskCard({ allocation, onReportSuccess }: TaskCardProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [optimisticValid, setOptimisticValid] = useState(allocation.currentValid);
  const [optimisticExcluded, setOptimisticExcluded] = useState(allocation.currentExcluded);

  const targetQuota = allocation.targetQuota;
  const currentTotal = optimisticValid + optimisticExcluded;
  const remaining = targetQuota - currentTotal;
  const progressPercent = targetQuota > 0 ? (currentTotal / targetQuota) * 100 : 0;
  const isCompleted = currentTotal >= targetQuota;

  const handleReportSuccess = (validQty: number, excludedQty: number) => {
    // Optimistic UI 更新
    setOptimisticValid((prev) => prev + validQty);
    setOptimisticExcluded((prev) => prev + excludedQty);
    setIsReportOpen(false);
    onReportSuccess?.();
  };

  return (
    <>
      <Card className={`
        bg-zinc-800/50 border-zinc-700/50 backdrop-blur transition-all
        hover:border-zinc-600/50 hover:shadow-lg hover:shadow-blue-500/5
        ${isCompleted ? "border-green-500/30 bg-green-900/10" : ""}
      `}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/30">
                {allocation.stageName}
              </Badge>
              <h3 className="text-lg font-semibold text-white">
                {allocation.taskPoolName}
              </h3>
              <p className="text-sm text-zinc-500">{allocation.projectName}</p>
            </div>
            {isCompleted ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                已达标
              </Badge>
            ) : remaining <= 10 ? (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                即将完成
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">进度</span>
              <span className="text-white font-mono">
                <span className="text-cyan-400">{optimisticValid}</span>
                <span className="text-zinc-500"> + </span>
                <span className="text-orange-400">{optimisticExcluded}</span>
                <span className="text-zinc-500"> / </span>
                <span>{targetQuota}</span>
              </span>
            </div>
            <Progress 
              value={Math.min(progressPercent, 100)} 
              className="h-2 bg-zinc-700"
            />
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>有效: {optimisticValid} | 除外: {optimisticExcluded}</span>
              <span>{progressPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Remaining Info */}
          {!isCompleted && (
            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
              <p className="text-sm text-zinc-400">
                还需 <span className="text-white font-semibold">{remaining}</span> 个单位
              </p>
            </div>
          )}

          {/* Last Report */}
          {allocation.lastReport && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Clock className="w-3 h-3" />
              <span>
                最近填报: {new Date(allocation.lastReport.createdAt).toLocaleString("zh-CN")} 
                (+{allocation.lastReport.validQty} 有效
                {allocation.lastReport.excludedQty > 0 && `, +${allocation.lastReport.excludedQty} 除外`})
              </span>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={() => setIsReportOpen(true)}
            className={`w-full ${
              isCompleted 
                ? "bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30" 
                : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
            }`}
            disabled={isCompleted}
          >
            {isCompleted ? "任务已完成 🎉" : "汇报进度"}
          </Button>
        </CardContent>
      </Card>

      <ReportModal
        open={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        allocation={allocation}
        onSuccess={handleReportSuccess}
      />
    </>
  );
}
