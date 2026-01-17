"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { type MyAllocationDto } from "@/components/features/stream/types";
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
    setOptimisticValid((prev: number) => prev + validQty);
    setOptimisticExcluded((prev: number) => prev + excludedQty);
    setIsReportOpen(false);
    onReportSuccess?.();
  };

  return (
    <>
      <Card className={`
        bg-white border-gray-200 backdrop-blur transition-all
        hover:border-gray-300/50 hover:shadow-lg hover:shadow-blue-500/5
        ${isCompleted ? "border-green-500/30 bg-green-900/10" : ""}
      `}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs text-cyan-600 border-cyan-400/30">
                {allocation.stageName}
              </Badge>
              <h3 className="text-lg font-semibold text-gray-900">
                {allocation.taskPoolName}
              </h3>
              <p className="text-sm text-gray-500">{allocation.projectName}</p>
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
              <span className="text-gray-600">进度</span>
              <span className="text-gray-900 font-mono">
                <span className="text-cyan-600">{optimisticValid}</span>
                <span className="text-gray-500"> + </span>
                <span className="text-orange-400">{optimisticExcluded}</span>
                <span className="text-gray-500"> / </span>
                <span>{targetQuota}</span>
              </span>
            </div>
            <Progress 
              value={Math.min(progressPercent, 100)} 
              className="h-2 bg-zinc-700"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>有效: {optimisticValid} | 除外: {optimisticExcluded}</span>
              <span>{progressPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Remaining Info */}
          {!isCompleted && (
            <div className="p-3 rounded-lg bg-white/50 border border-gray-200">
              <p className="text-sm text-gray-600">
                还需 <span className="text-gray-900 font-semibold">{remaining}</span> 个单位
              </p>
            </div>
          )}

          {/* Last Report */}
          {allocation.lastReport && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
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
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
            }`}
          >
            {isCompleted ? "追加填报 ✨" : "汇报进度"}
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
