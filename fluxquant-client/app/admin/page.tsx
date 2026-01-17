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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 backdrop-blur-md bg-white/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text">
              FluxQuant
            </span>
            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 ml-2">
              管理后台
            </Badge>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                <BarChart3 className="mr-2 h-4 w-4" />
                统计面板
              </Button>
            </Link>
            <Link href="/my-stream">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
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
            <Card className="bg-white border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FolderPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">项目管理</p>
                  <p className="text-xs text-gray-500">创建与配置项目</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="bg-white border-gray-200 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">用户管理</p>
                  <p className="text-xs text-gray-500">账户与权限</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard">
            <Card className="bg-white border-gray-200 hover:border-green-400 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">统计报表</p>
                  <p className="text-xs text-gray-500">数据可视化</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-gray-50 border-gray-200 border-dashed">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                <Settings className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-400 font-medium">系统设置</p>
                <p className="text-xs text-gray-400">即将推出</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">项目概览</h2>
            <p className="text-gray-600">选择项目查看分配矩阵和进度</p>
          </div>
          <Link href="/admin/projects">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              新建项目
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无项目</h3>
            <p className="text-gray-600 text-sm max-w-xs mb-6">
              点击上方的新建项目按钮创建第一个项目
            </p>
            <Link href="/admin/projects">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                创建项目
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/admin/matrix/${project.id}`}>
                <Card className="bg-white border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-gray-900 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          {project.code}
                        </CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">整体进度</span>
                          <span className="text-blue-600 font-mono">{project.overallProgress}%</span>
                        </div>
                        <Progress value={project.overallProgress} className="h-2 bg-gray-200" />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600">
                          <span className="text-gray-900">{project.stageCount}</span> 个阶段
                        </div>
                        <div className="text-gray-600">
                          <span className="text-gray-900">{project.taskPoolCount}</span> 个任务池
                        </div>
                      </div>

                      {/* Status */}
                      <Badge 
                        variant="outline" 
                        className={project.isActive 
                          ? "text-green-600 border-green-300 bg-green-50" 
                          : "text-gray-500 border-gray-300"
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
