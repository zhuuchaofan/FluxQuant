"use client";

import { useState, useMemo } from "react";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createAllocationAction } from "@/lib/actions/matrix";

interface UserOption {
  userId: number;
  displayName: string;
}

interface CreateAllocationDialogProps {
  open: boolean;
  onClose: () => void;
  taskPoolId: number;
  taskPoolName: string;
  totalQuota: number;
  assignedTotal: number;
  existingUserIds: number[];
  availableUsers: UserOption[];
  onSuccess: () => void;
}

export function CreateAllocationDialog({
  open,
  onClose,
  taskPoolId,
  taskPoolName,
  totalQuota,
  assignedTotal,
  existingUserIds,
  availableUsers,
  onSuccess,
}: CreateAllocationDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [targetQuota, setTargetQuota] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 过滤掉已分配的用户
  const unassignedUsers = availableUsers.filter(
    (user) => !existingUserIds.includes(user.userId)
  );

  // 计算是否会超额
  const quotaNum = parseInt(targetQuota) || 0;
  const willExceed = useMemo(() => {
    return assignedTotal + quotaNum > totalQuota;
  }, [assignedTotal, quotaNum, totalQuota]);

  const remainingQuota = totalQuota - assignedTotal;

  const handleSubmit = async () => {
    if (!selectedUserId || !targetQuota) {
      toast.error("请选择员工并输入配额");
      return;
    }

    const quota = parseInt(targetQuota);
    if (isNaN(quota) || quota <= 0) {
      toast.error("配额必须是正整数");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAllocationAction({
        taskPoolId,
        userId: parseInt(selectedUserId),
        targetQuota: quota,
      });

      if (result.success) {
        if (willExceed) {
          toast.warning("分配已创建，但总分配额度超过了任务池总量");
        } else {
          toast.success("分配创建成功");
        }
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || "创建失败");
      }
    } catch {
      toast.error("创建失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId("");
    setTargetQuota("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">创建新分配</DialogTitle>
          <DialogDescription className="text-gray-600">
            为任务池「{taskPoolName}」分配员工
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 配额信息 */}
          <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="text-gray-500">总量:</span>
              <span className="ml-1 font-medium text-gray-900">{totalQuota}</span>
            </div>
            <div>
              <span className="text-gray-500">已分配:</span>
              <span className="ml-1 font-medium text-gray-900">{assignedTotal}</span>
            </div>
            <div>
              <span className="text-gray-500">剩余:</span>
              <span className={`ml-1 font-medium ${remainingQuota < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {remainingQuota}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user" className="text-gray-700">
              选择员工
            </Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                <SelectValue placeholder="请选择员工..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {unassignedUsers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    所有员工都已分配
                  </div>
                ) : (
                  unassignedUsers.map((user) => (
                    <SelectItem
                      key={user.userId}
                      value={user.userId.toString()}
                      className="text-gray-900"
                    >
                      {user.displayName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quota" className="text-gray-700">
              目标配额
            </Label>
            <Input
              id="quota"
              type="number"
              min="1"
              value={targetQuota}
              onChange={(e) => setTargetQuota(e.target.value)}
              placeholder="请输入配额数量"
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* 超额警告 */}
          {willExceed && quotaNum > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                此分配将导致总分配额度超出任务池总量 {assignedTotal + quotaNum - totalQuota}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedUserId || !targetQuota}
            className={willExceed && quotaNum > 0 
              ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {willExceed && quotaNum > 0 ? "确认超额分配" : "创建分配"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
