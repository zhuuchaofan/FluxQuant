"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, RefreshCw, LogOut, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskCard } from "@/components/features/stream";
import { getMyAllocationsAction } from "@/lib/actions/report";
import { logoutAction } from "@/lib/actions/auth";
import { toast } from "sonner";

export default function MyStreamPage() {
  const router = useRouter();
  
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["myAllocations"],
    queryFn: async () => {
      const result = await getMyAllocationsAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
    refetchInterval: 30000, // 30 秒轮询
  });

  const allocations = data ?? [];
  const todayTotal = allocations.reduce((sum, a) => sum + a.currentValid, 0);
  const completedCount = allocations.filter((a) => a.isCompleted).length;

  const handleLogout = async () => {
    const result = await logoutAction();
    if (result.success) {
      toast.success("已退出登录");
      router.push("/login");
    } else {
      toast.error("退出失败");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-700/50 backdrop-blur-md bg-zinc-900/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
              FluxQuant
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Today's Output Counter */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
              <span className="text-xs text-zinc-400">今日产出:</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">{todayTotal}</span>
            </div>

            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-sm">U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                <DropdownMenuItem asChild className="text-zinc-300 focus:bg-zinc-700 focus:text-white cursor-pointer">
                  <Link href="/admin">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    管理后台
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-zinc-300 focus:bg-zinc-700 focus:text-white cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-xl">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-white bg-zinc-800"
          >
            全部任务 ({allocations.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
          >
            进行中 ({allocations.length - completedCount})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
          >
            已完成 ({completedCount})
          </Button>
        </div>

        {/* Task Cards */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-4" />
            <p className="text-zinc-400">加载任务中...</p>
          </div>
        ) : allocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">暂无任务</h3>
            <p className="text-zinc-400 text-sm max-w-xs">
              您目前没有分配的任务，请联系管理员分配工作
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allocations.map((allocation) => (
              <TaskCard
                key={allocation.id}
                allocation={allocation}
                onReportSuccess={() => refetch()}
              />
            ))}
          </div>
        )}
      </main>

      {/* Mobile Today Output */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:hidden">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 shadow-lg">
          <span className="text-xs text-zinc-400">今日:</span>
          <span className="text-xl font-bold text-cyan-400 font-mono">{todayTotal}</span>
        </div>
      </div>
    </div>
  );
}
