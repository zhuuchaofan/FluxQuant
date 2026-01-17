"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Zap, LayoutGrid, Loader2, ChevronRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getProjectsAction } from "@/lib/actions/matrix";

export default function AdminDashboard() {
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
          <nav className="flex items-center gap-4">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">项目管理</h1>
          <p className="text-zinc-400">选择项目查看分配矩阵和进度</p>
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
            <p className="text-zinc-400 text-sm max-w-xs">
              请先创建项目和任务池
            </p>
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
