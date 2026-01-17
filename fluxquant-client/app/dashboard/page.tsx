"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Zap, LayoutGrid, RefreshCw, TrendingUp, Users, 
  AlertTriangle, Clock, CheckCircle2, BarChart3, Loader2,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AuthGuard } from "@/components/auth-guard";
import { GlobalUserMenu } from "@/components/global-user-menu";
import { getDashboardStatsAction } from "@/lib/actions/dashboard";

export default function DashboardPage() {
  return (
    <AuthGuard requiredRole="Manager">
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const result = await getDashboardStatsAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    refetchInterval: 10000, // 10 秒轮询
    retry: 1, // 只重试一次
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // 错误状态处理 - 当后端不可用时
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">无法连接到服务器</h2>
          <p className="text-gray-600 mb-6">
            {error?.message || "请确保后端服务已启动 (http://localhost:5555)"}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-500"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              重试
            </Button>
            <Link href="/admin">
              <Button variant="outline" className="border-gray-300 text-gray-700">
                项目管理
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 backdrop-blur-md bg-white/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
              FluxQuant
            </span>
            <Badge variant="outline" className="text-cyan-600 border-cyan-400/30 ml-2">
              Dashboard
            </Badge>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                <LayoutGrid className="mr-2 h-4 w-4" />
                项目管理
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <GlobalUserMenu />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                活跃项目
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats?.activeProjects ?? 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                活跃员工
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-cyan-600">{stats?.activeEmployees ?? 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                整体进度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-green-400">{stats?.overallProgress ?? 0}%</p>
                <Progress value={stats?.overallProgress ?? 0} className="h-2 flex-1 bg-zinc-700" />
              </div>
            </CardContent>
          </Card>

          <Card className={`border-gray-200 ${(stats?.anomalousPoolCount ?? 0) > 0 ? "bg-red-900/20 border-red-500/30" : "bg-white"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                异常任务
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${(stats?.anomalousPoolCount ?? 0) > 0 ? "text-red-400" : "text-green-400"}`}>
                {stats?.anomalousPoolCount ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today Stats */}
        <Card className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-600" />
              今日统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900 font-mono">{stats?.todayReportCount ?? 0}</p>
                <p className="text-sm text-gray-600 mt-1">填报次数</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-cyan-600 font-mono">{stats?.todayValidOutput ?? 0}</p>
                <p className="text-sm text-gray-600 mt-1">有效产出</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-orange-400 font-mono">{stats?.todayExcludedOutput ?? 0}</p>
                <p className="text-sm text-gray-600 mt-1">除外数量</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">最近活动</CardTitle>
              <CardDescription className="text-gray-600">实时填报动态</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivities.slice(0, 6).map((activity) => (
                    <div 
                      key={activity.logId} 
                      className="flex items-center justify-between p-2 rounded-lg bg-white/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{activity.userName}</p>
                          <p className="text-xs text-gray-500">{activity.taskPoolName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">
                          <span className="text-cyan-600">+{activity.validQty}</span>
                          {activity.excludedQty > 0 && (
                            <span className="text-orange-400 ml-1">-{activity.excludedQty}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleTimeString("zh-CN", { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">暂无活动记录</p>
              )}
            </CardContent>
          </Card>

          {/* Anomaly Hotspots */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                异常热点
              </CardTitle>
              <CardDescription className="text-gray-600">除外率异常的任务池</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.anomalyHotspots && stats.anomalyHotspots.length > 0 ? (
                <div className="space-y-3">
                  {stats.anomalyHotspots.map((hotspot) => (
                    <Link 
                      key={hotspot.taskPoolId}
                      href={`/admin/matrix/1`} // TODO: 使用实际项目ID
                      className="block"
                    >
                      <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20 hover:border-red-500/40 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-900 font-medium">{hotspot.taskPoolName}</p>
                            <p className="text-xs text-gray-500">{hotspot.projectName} › {hotspot.stageName}</p>
                          </div>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            {hotspot.exclusionRate}%
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                            {hotspot.topReason}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {hotspot.totalExcluded}/{hotspot.totalQuota} 除外
                          </span>
                        </div>
                        <ArrowUpRight className="absolute top-3 right-3 w-4 h-4 text-gray-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400">一切正常！</p>
                  <p className="text-gray-500 text-sm">没有检测到异常任务池</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
