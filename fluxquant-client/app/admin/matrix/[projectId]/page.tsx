"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Zap, ArrowLeft, RefreshCw, Users, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatrixGrid } from "@/components/features/matrix";
import { getMatrixDataAction } from "@/lib/actions/matrix";

export default function MatrixPage() {
  const params = useParams();
  const projectId = parseInt(params.projectId as string);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["matrix", projectId],
    queryFn: async () => {
      const result = await getMatrixDataAction(projectId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    refetchInterval: 5000, // 5 秒轮询
    enabled: !isNaN(projectId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <p className="text-zinc-400">项目不存在</p>
      </div>
    );
  }

  // 计算统计数据
  const totalTasks = data.stages.flatMap((s) => s.taskPools).length;
  const anomalousTasks = data.stages
    .flatMap((s) => s.taskPools)
    .filter((t) => t.isAnomalous).length;
  const totalQuota = data.stages
    .flatMap((s) => s.taskPools)
    .reduce((sum, t) => sum + t.totalQuota, 0);
  const totalValid = data.stages
    .flatMap((s) => s.taskPools)
    .reduce((sum, t) => sum + t.totalValid, 0);
  const overallProgress = totalQuota > 0 ? Math.round((totalValid / totalQuota) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-700/50 backdrop-blur-md bg-zinc-900/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold text-white">{data.projectName}</span>
              <Badge variant="outline" className="text-zinc-400 border-zinc-600">
                {data.projectCode}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50">
              <div className={`w-2 h-2 rounded-full ${isFetching ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
              <span className="text-xs text-zinc-400">
                {isFetching ? "同步中..." : "实时"}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-zinc-800/50 border-zinc-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400">任务池</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{totalTasks}</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400">参与人员</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                <p className="text-2xl font-bold text-white">{data.users.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400">整体进度</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-400">{overallProgress}%</p>
              <p className="text-xs text-zinc-500">{totalValid} / {totalQuota}</p>
            </CardContent>
          </Card>

          <Card className={`border-zinc-700/50 ${anomalousTasks > 0 ? "bg-red-900/20 border-red-500/30" : "bg-zinc-800/50"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-400">异常预警</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {anomalousTasks > 0 && <AlertTriangle className="h-5 w-5 text-red-400" />}
                <p className={`text-2xl font-bold ${anomalousTasks > 0 ? "text-red-400" : "text-green-400"}`}>
                  {anomalousTasks}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matrix Grid */}
        <Card className="bg-zinc-800/50 border-zinc-700/50">
          <CardHeader>
            <CardTitle className="text-white">分配矩阵</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MatrixGrid data={data} onRefresh={() => refetch()} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
