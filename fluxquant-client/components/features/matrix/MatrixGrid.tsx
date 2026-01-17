"use client";

import { useState, useMemo, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Settings2, AlertTriangle, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import type { MatrixDataDto, MatrixRowDto, MatrixCellDto, MatrixUserDto } from "./types";
import { QuotaAdjustDialog } from "./QuotaAdjustDialog";
import { CreateAllocationDialog } from "./CreateAllocationDialog";
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
  
  const [createDialog, setCreateDialog] = useState<{
    taskPoolId: number;
    taskPoolName: string;
    existingUserIds: number[];
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
          <tr className="border-b border-gray-200">
            <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[200px]">
              任务池
            </th>
            <th className="px-3 py-3 text-center text-sm font-medium text-gray-700 min-w-[80px]">
              总量
            </th>
            <th className="px-3 py-3 text-center text-sm font-medium text-gray-700 min-w-[80px]">
              待分配
            </th>
            <th className="px-3 py-3 text-center text-sm font-medium text-gray-700 min-w-[100px]">
              进度
            </th>
            {allUsers.map((user) => (
              <th
                key={user.id}
                className="px-3 py-3 text-center text-sm font-medium text-gray-700 min-w-[120px]"
              >
                {user.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.stages.map((stage) => (
            <Fragment key={`stage-${stage.stageId}`}>
              {/* Stage Header Row */}
              <tr
                className="bg-gray-100 cursor-pointer hover:bg-gray-200"
                onClick={() => toggleStage(stage.stageId)}
              >
                <td
                  colSpan={4 + allUsers.length}
                  className="sticky left-0 px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    {expandedStages.has(stage.stageId) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                      {stage.stageName}
                    </Badge>
                    <span className="text-xs text-gray-500">
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
                    onOpenCreateDialog={() =>
                      setCreateDialog({
                        taskPoolId: pool.taskPoolId,
                        taskPoolName: pool.taskPoolName,
                        existingUserIds: pool.allocations.map(a => a.userId),
                      })
                    }
                  />
                ))}
            </Fragment>
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
      
      {/* Create Allocation Dialog */}
      {createDialog && (
        <CreateAllocationDialog
          open={true}
          onClose={() => setCreateDialog(null)}
          taskPoolId={createDialog.taskPoolId}
          taskPoolName={createDialog.taskPoolName}
          existingUserIds={createDialog.existingUserIds}
          availableUsers={allUsers.map(u => ({ userId: u.id, displayName: u.name }))}
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
  onOpenCreateDialog: () => void;
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
  onOpenCreateDialog,
}: TaskPoolRowProps) {
  // 构建用户到分配的映射
  const allocationMap = useMemo(() => {
    const map = new Map<number, MatrixCellDto>();
    pool.allocations.forEach((a) => map.set(a.userId, a));
    return map;
  }, [pool.allocations]);

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      {/* Task Pool Name */}
      <td className="sticky left-0 z-10 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-900 text-sm">{pool.taskPoolName}</span>
          {pool.isAnomalous && (
            <Badge className="bg-red-100 text-red-600 border-red-200 text-xs">
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
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-900 font-mono text-sm transition-colors"
        >
          {pool.totalQuota}
          <Settings2 className="w-3 h-3 text-gray-500" />
        </button>
      </td>

      {/* Unassigned */}
      <td className="px-3 py-3 text-center">
        <span
          className={`font-mono text-sm ${
            pool.unassigned < 0
              ? "text-red-600"
              : pool.unassigned === 0
              ? "text-green-600"
              : "text-gray-700"
          }`}
        >
          {pool.unassigned}
        </span>
      </td>

      {/* Progress */}
      <td className="px-3 py-3">
        <div className="flex flex-col items-center gap-1">
          <Progress value={Math.min(pool.progressPercent, 100)} className="h-2 w-16 bg-gray-200" />
          <span className="text-xs text-gray-500">{pool.progressPercent}%</span>
        </div>
      </td>

      {/* User Cells */}
      {users.map((user) => {
        const allocation = allocationMap.get(user.id);
        const isEditing = editingCell?.allocationId === allocation?.allocationId;

        if (!allocation) {
          return (
            <td key={user.id} className="px-3 py-3 text-center">
              <button
                onClick={onOpenCreateDialog}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                title={`为 ${user.name} 创建分配`}
              >
                <Plus className="w-4 h-4" />
              </button>
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
                className="w-16 h-8 text-center bg-white border-blue-500 text-gray-900 font-mono text-sm"
              />
            ) : (
              <button
                onClick={() => onStartEdit(allocation.allocationId, allocation.targetQuota)}
                className={`
                  px-2 py-1 rounded font-mono text-sm transition-colors
                  ${allocation.isCompleted 
                    ? "bg-green-100 text-green-700 border-b-2 border-green-500" 
                    : allocation.isLagging 
                    ? "bg-yellow-100 text-yellow-700" 
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }
                `}
              >
                {allocation.targetQuota}
                <span className="text-xs text-gray-500 ml-1">
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
