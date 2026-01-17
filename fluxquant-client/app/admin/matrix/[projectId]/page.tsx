"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Zap, ArrowLeft, RefreshCw, Users, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatrixGrid } from "@/components/features/matrix";
import { AuthGuard } from "@/components/auth-guard";
import { GlobalUserMenu } from "@/components/global-user-menu";
import { getMatrixDataAction } from "@/lib/actions/matrix";

export default function MatrixPage() {
  return (
    <AuthGuard requiredRole="Manager">
      <MatrixContent />
    </AuthGuard>
  );
}

function MatrixContent() {
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
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-600">项目不存在</p>
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 backdrop-blur-md bg-white/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">{data.projectName}</span>
              <Badge variant="outline" className="text-gray-600 border-gray-300">
                {data.projectCode}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200">
              <div className={`w-2 h-2 rounded-full ${isFetching ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
              <span className="text-xs text-gray-600">
                {isFetching ? "同步中..." : "实时"}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>

            <GlobalUserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">任务池</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">参与人员</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-600" />
                <p className="text-2xl font-bold text-gray-900">{data.users.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">整体进度</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-600">{overallProgress}%</p>
              <p className="text-xs text-gray-500">{totalValid} / {totalQuota}</p>
            </CardContent>
          </Card>

          <Card className={`border-gray-200 ${anomalousTasks > 0 ? "bg-red-900/20 border-red-500/30" : "bg-white"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">异常预警</CardTitle>
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
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">分配矩阵</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MatrixGrid data={data} onRefresh={() => refetch()} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
