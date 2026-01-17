"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListFilter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/features/stream";
import { getMyAllocationsAction } from "@/lib/actions/report";
import { AuthGuard } from "@/components/auth-guard";
import { AppLayout } from "@/components/layout";

type FilterType = "all" | "inProgress" | "completed";

export default function MyStreamPage() {
  return (
    <AuthGuard>
      <MyStreamContent />
    </AuthGuard>
  );
}

function MyStreamContent() {
  const [filter, setFilter] = useState<FilterType>("all");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["myAllocations"],
    queryFn: async () => {
      const result = await getMyAllocationsAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
    refetchInterval: 30000,
  });

  const allocations = useMemo(() => data ?? [], [data]);
  const todayTotal = allocations.reduce((sum, a) => sum + a.currentValid, 0);
  const completedCount = allocations.filter((a) => a.isCompleted).length;
  const inProgressCount = allocations.length - completedCount;

  // 根据筛选条件过滤任务
  const filteredAllocations = useMemo(() => {
    switch (filter) {
      case "inProgress":
        return allocations.filter((a) => !a.isCompleted);
      case "completed":
        return allocations.filter((a) => a.isCompleted);
      default:
        return allocations;
    }
  }, [allocations, filter]);

  return (
    <AppLayout
      variant="employee"
      isFetching={isFetching}
      onRefresh={() => refetch()}
      maxWidth="xl"
      headerActions={
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
          <span className="text-xs text-gray-600">今日产出:</span>
          <span className="text-lg font-bold text-blue-600 font-mono">{todayTotal}</span>
        </div>
      }
    >
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" 
            ? "bg-blue-600 hover:bg-blue-700 text-white" 
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }
        >
          <ListFilter className="w-4 h-4 mr-1" />
          全部任务 ({allocations.length})
        </Button>
        <Button
          variant={filter === "inProgress" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("inProgress")}
          className={filter === "inProgress" 
            ? "bg-blue-600 hover:bg-blue-700 text-white" 
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }
        >
          进行中 ({inProgressCount})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("completed")}
          className={filter === "completed" 
            ? "bg-green-600 hover:bg-green-700 text-white" 
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }
        >
          已完成 ({completedCount})
        </Button>
      </div>

      {/* Task Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      ) : filteredAllocations.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">
            {filter === "all" ? "暂无分配任务" : filter === "inProgress" ? "没有进行中的任务" : "没有已完成的任务"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAllocations.map((allocation) => (
            <TaskCard
              key={allocation.id}
              allocation={allocation}
              onReportSuccess={() => refetch()}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
