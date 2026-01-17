"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Settings2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { MatrixDataDto, MatrixRowDto, MatrixCellDto, MatrixUserDto } from "./types";
import { QuotaAdjustDialog } from "./QuotaAdjustDialog";
import { updateAllocationAction } from "@/lib/actions/matrix";

interface MatrixGridProps {
  data: MatrixDataDto;
  onRefresh: () => void;
}

export function MatrixGrid({ data, onRefresh }: MatrixGridProps) {
  const [expandedStages, setExpandedStages] = useState<Set<number>>(
    new Set(data.stages.map((s) => s.stageId))
  );
  const [editingCell, setEditingCell] = useState<{ allocationId: number; value: string } | null>(null);
  const [quotaDialog, setQuotaDialog] = useState<{
    taskPoolId: number;
    taskPoolName: string;
    currentQuota: number;
    currentProgress: number;
  } | null>(null);

  const toggleStage = (stageId: number) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const handleCellEdit = async (allocationId: number, newValue: string) => {
    const numValue = parseInt(newValue);
    if (isNaN(numValue) || numValue < 0) {
      toast.error("请输入有效数字");
      return;
    }

    const result = await updateAllocationAction(allocationId, numValue);
    if (result.success) {
      toast.success("更新成功");
      onRefresh();
    } else {
      toast.error(result.error || "更新失败");
    }
    setEditingCell(null);
  };

  // 扁平化所有用户列
  const allUsers = useMemo(() => {
    const userMap = new Map<number, MatrixUserDto>();
    data.users.forEach((u) => userMap.set(u.id, u));
    return Array.from(userMap.values());
  }, [data.users]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-zinc-700">
            <th className="sticky left-0 z-10 bg-zinc-900 px-4 py-3 text-left text-sm font-medium text-zinc-400 min-w-[200px]">
              任务池
            </th>
            <th className="px-3 py-3 text-center text-sm font-medium text-zinc-400 min-w-[80px]">
              总量
            </th>
            <th className="px-3 py-3 text-center text-sm font-medium text-zinc-400 min-w-[80px]">
              未分配
            </th>
            <th className="px-3 py-3 text-center text-sm font-medium text-zinc-400 min-w-[100px]">
              进度
            </th>
            {allUsers.map((user) => (
              <th
                key={user.id}
                className="px-3 py-3 text-center text-sm font-medium text-zinc-300 min-w-[100px]"
              >
                {user.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.stages.map((stage) => (
            <>
              {/* Stage Header Row */}
              <tr
                key={`stage-${stage.stageId}`}
                className="bg-zinc-800/50 cursor-pointer hover:bg-zinc-800"
                onClick={() => toggleStage(stage.stageId)}
              >
                <td
                  colSpan={4 + allUsers.length}
                  className="sticky left-0 px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    {expandedStages.has(stage.stageId) ? (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    )}
                    <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                      {stage.stageName}
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      {stage.taskPools.length} 个任务池
                    </span>
                  </div>
                </td>
              </tr>

              {/* Task Pool Rows */}
              {expandedStages.has(stage.stageId) &&
                stage.taskPools.map((pool) => (
                  <TaskPoolRow
                    key={pool.taskPoolId}
                    pool={pool}
                    users={allUsers}
                    editingCell={editingCell}
                    onStartEdit={(allocationId, value) =>
                      setEditingCell({ allocationId, value: value.toString() })
                    }
                    onEditChange={(value) =>
                      setEditingCell((prev) => (prev ? { ...prev, value } : null))
                    }
                    onSaveEdit={() => {
                      if (editingCell) {
                        handleCellEdit(editingCell.allocationId, editingCell.value);
                      }
                    }}
                    onCancelEdit={() => setEditingCell(null)}
                    onOpenQuotaDialog={() =>
                      setQuotaDialog({
                        taskPoolId: pool.taskPoolId,
                        taskPoolName: pool.taskPoolName,
                        currentQuota: pool.totalQuota,
                        currentProgress: pool.progressPercent,
                      })
                    }
                  />
                ))}
            </>
          ))}
        </tbody>
      </table>

      {/* Quota Adjust Dialog */}
      {quotaDialog && (
        <QuotaAdjustDialog
          open={true}
          onClose={() => setQuotaDialog(null)}
          taskPoolId={quotaDialog.taskPoolId}
          taskPoolName={quotaDialog.taskPoolName}
          currentQuota={quotaDialog.currentQuota}
          currentProgress={quotaDialog.currentProgress}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

interface TaskPoolRowProps {
  pool: MatrixRowDto;
  users: MatrixUserDto[];
  editingCell: { allocationId: number; value: string } | null;
  onStartEdit: (allocationId: number, value: number) => void;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onOpenQuotaDialog: () => void;
}

function TaskPoolRow({
  pool,
  users,
  editingCell,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onOpenQuotaDialog,
}: TaskPoolRowProps) {
  // 构建用户到分配的映射
  const allocationMap = useMemo(() => {
    const map = new Map<number, MatrixCellDto>();
    pool.allocations.forEach((a) => map.set(a.userId, a));
    return map;
  }, [pool.allocations]);

  return (
    <tr className="border-b border-zinc-800 hover:bg-zinc-800/30">
      {/* Task Pool Name */}
      <td className="sticky left-0 z-10 bg-zinc-900 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm">{pool.taskPoolName}</span>
          {pool.isAnomalous && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              异常
            </Badge>
          )}
        </div>
      </td>

      {/* Total Quota */}
      <td className="px-3 py-3 text-center">
        <button
          onClick={onOpenQuotaDialog}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-sm transition-colors"
        >
          {pool.totalQuota}
          <Settings2 className="w-3 h-3 text-zinc-400" />
        </button>
      </td>

      {/* Unassigned */}
      <td className="px-3 py-3 text-center">
        <span
          className={`font-mono text-sm ${
            pool.unassigned < 0
              ? "text-red-400"
              : pool.unassigned === 0
              ? "text-green-400"
              : "text-zinc-300"
          }`}
        >
          {pool.unassigned}
        </span>
      </td>

      {/* Progress */}
      <td className="px-3 py-3">
        <div className="flex flex-col items-center gap-1">
          <Progress value={Math.min(pool.progressPercent, 100)} className="h-2 w-16 bg-zinc-700" />
          <span className="text-xs text-zinc-400">{pool.progressPercent}%</span>
        </div>
      </td>

      {/* User Cells */}
      {users.map((user) => {
        const allocation = allocationMap.get(user.id);
        const isEditing = editingCell?.allocationId === allocation?.allocationId;

        if (!allocation) {
          return (
            <td key={user.id} className="px-3 py-3 text-center">
              <span className="text-zinc-600">-</span>
            </td>
          );
        }

        return (
          <td key={user.id} className="px-3 py-3 text-center">
            {isEditing && editingCell ? (
              <Input
                value={editingCell.value}
                onChange={(e) => onEditChange(e.target.value)}
                onBlur={onSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
                autoFocus
                className="w-16 h-8 text-center bg-zinc-800 border-blue-500 text-white font-mono text-sm"
              />
            ) : (
              <button
                onClick={() => onStartEdit(allocation.allocationId, allocation.targetQuota)}
                className={`
                  px-2 py-1 rounded font-mono text-sm transition-colors
                  ${allocation.isCompleted 
                    ? "bg-green-500/20 text-green-400 border-b-2 border-green-500" 
                    : allocation.isLagging 
                    ? "bg-yellow-500/10 text-yellow-400" 
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }
                `}
              >
                {allocation.targetQuota}
                <span className="text-xs text-zinc-500 ml-1">
                  ({allocation.currentValid}/{allocation.targetQuota})
                </span>
              </button>
            )}
          </td>
        );
      })}
    </tr>
  );
}
