"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Zap, LayoutGrid, Loader2, ChevronRight, BarChart3, 
  FolderPlus, Users, Settings, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/auth-guard";
import { getProjectsAction } from "@/lib/actions/matrix";

export default function AdminDashboard() {
  return (
    <AuthGuard requiredRole="Manager">
      <AdminDashboardContent />
    </AuthGuard>
  );
}

function AdminDashboardContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const result = await getProjectsAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
  });

  const projects = data ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-700/50 backdrop-blur-md bg-zinc-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
              FluxQuant
            </span>
            <Badge variant="outline" className="text-orange-400 border-orange-400/30 ml-2">
              管理后台
            </Badge>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-zinc-300 hover:text-white">
                <BarChart3 className="mr-2 h-4 w-4" />
                统计面板
              </Button>
            </Link>
            <Link href="/my-stream">
              <Button variant="ghost" className="text-zinc-300 hover:text-white">
                <LayoutGrid className="mr-2 h-4 w-4" />
                员工视图
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/admin/projects">
            <Card className="bg-zinc-800/50 border-zinc-700/50 hover:border-blue-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FolderPlus className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">项目管理</p>
                  <p className="text-xs text-zinc-500">创建与配置项目</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="bg-zinc-800/50 border-zinc-700/50 hover:border-cyan-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">用户管理</p>
                  <p className="text-xs text-zinc-500">账户与权限</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard">
            <Card className="bg-zinc-800/50 border-zinc-700/50 hover:border-green-500/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">统计报表</p>
                  <p className="text-xs text-zinc-500">数据可视化</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-zinc-800/30 border-zinc-700/30 border-dashed">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                <Settings className="h-5 w-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-zinc-500 font-medium">系统设置</p>
                <p className="text-xs text-zinc-600">即将推出</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">项目概览</h2>
            <p className="text-zinc-400">选择项目查看分配矩阵和进度</p>
          </div>
          <Link href="/admin/projects">
            <Button className="bg-blue-600 hover:bg-blue-500">
              <Plus className="mr-2 h-4 w-4" />
              新建项目
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">暂无项目</h3>
            <p className="text-zinc-400 text-sm max-w-xs mb-6">
              点击上方的新建项目按钮创建第一个项目
            </p>
            <Link href="/admin/projects">
              <Button className="bg-blue-600 hover:bg-blue-500">
                <Plus className="mr-2 h-4 w-4" />
                创建项目
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/admin/matrix/${project.id}`}>
                <Card className="bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600 transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white group-hover:text-cyan-400 transition-colors">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                          {project.code}
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">整体进度</span>
                          <span className="text-cyan-400 font-mono">{project.overallProgress}%</span>
                        </div>
                        <Progress value={project.overallProgress} className="h-2 bg-zinc-700" />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-zinc-400">
                          <span className="text-white">{project.stageCount}</span> 个阶段
                        </div>
                        <div className="text-zinc-400">
                          <span className="text-white">{project.taskPoolCount}</span> 个任务池
                        </div>
                      </div>

                      {/* Status */}
                      <Badge 
                        variant="outline" 
                        className={project.isActive 
                          ? "text-green-400 border-green-400/30" 
                          : "text-zinc-400 border-zinc-600"
                        }
                      >
                        {project.isActive ? "进行中" : "已归档"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
