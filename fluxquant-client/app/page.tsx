import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, BarChart3, Users, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-700/50 backdrop-blur-sm bg-zinc-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
              FluxQuant
            </span>
            <span className="text-sm text-zinc-400">量流</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-300 hover:text-white">
                登录
              </Button>
            </Link>
            <Link href="/login?mode=register">
              <Button className="bg-blue-600 hover:bg-blue-500">
                开始使用
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 text-transparent bg-clip-text">
            重新定义
          </span>
          <br />
          <span className="text-white">生产力追踪</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
          告别传统的任务完成状态切换，拥抱<strong className="text-cyan-400">数值累积</strong>的进度计算方式。
          <br />
          动态配额 · 异常归因 · 实时洞察
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login?mode=register">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-lg px-8">
              免费开始
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="text-lg px-8 border-zinc-600 text-zinc-300 hover:bg-zinc-800">
              查看演示
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          核心特性
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-blue-400 mb-2" />
              <CardTitle className="text-white">动态配额</CardTitle>
              <CardDescription className="text-zinc-400">
                任务总量随业务变化实时调整，进度计算始终精确
              </CardDescription>
            </CardHeader>
            <CardContent className="text-zinc-300 text-sm">
              进度 = 有效产出 / (当前总量 - 除外量)
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur">
            <CardHeader>
              <Shield className="h-10 w-10 text-cyan-400 mb-2" />
              <CardTitle className="text-white">异常归因</CardTitle>
              <CardDescription className="text-zinc-400">
                坏数据不再是员工的责任，系统自动标记并追溯根因
              </CardDescription>
            </CardHeader>
            <CardContent className="text-zinc-300 text-sm">
              源文件损坏 · 数据重复 · 信息缺失
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur">
            <CardHeader>
              <Users className="h-10 w-10 text-teal-400 mb-2" />
              <CardTitle className="text-white">分配矩阵</CardTitle>
              <CardDescription className="text-zinc-400">
                一目了然的资源分配视图，拖拽即可重新平衡工作量
              </CardDescription>
            </CardHeader>
            <CardContent className="text-zinc-300 text-sm">
              批量分配 · 实时同步 · 审计追踪
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Formula Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-2xl p-8 md:p-12 border border-blue-500/20">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">
            核心公式
          </h3>
          <div className="text-center text-3xl md:text-4xl font-mono text-cyan-400 mb-4">
            进度 = ValidOutput / (TotalQuota - Excluded)
          </div>
          <p className="text-zinc-400 text-center max-w-xl mx-auto">
            不存储百分比，永远实时计算。分母动态调整，进度公正透明。
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-700/50 py-8">
        <div className="container mx-auto px-4 text-center text-zinc-500">
          <p>© 2026 FluxQuant. 动态配额生产力追踪系统</p>
        </div>
      </footer>
    </div>
  );
}
