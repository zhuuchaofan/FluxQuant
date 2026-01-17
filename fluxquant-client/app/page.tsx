import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, BarChart3, Users, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 backdrop-blur-sm bg-white/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text">
              FluxQuant
            </span>
            <span className="text-sm text-gray-500">量流</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                登录
              </Button>
            </Link>
            <Link href="/login?mode=register">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                开始使用
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-transparent bg-clip-text">
            重新定义
          </span>
          <br />
          <span className="text-gray-900">生产力追踪</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          告别传统的任务完成状态切换，拥抱<strong className="text-blue-600">数值累积</strong>的进度计算方式。
          <br />
          动态配额 · 异常归因 · 实时洞察
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login?mode=register">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg px-8">
              免费开始
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="text-lg px-8 border-gray-300 text-gray-700 hover:bg-gray-100">
              查看演示
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          核心特性
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle className="text-gray-900">动态配额</CardTitle>
              <CardDescription className="text-gray-600">
                任务总量随业务变化实时调整，进度计算始终精确
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700 text-sm">
              进度 = 有效产出 / (当前总量 - 除外量)
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <Shield className="h-10 w-10 text-cyan-600 mb-2" />
              <CardTitle className="text-gray-900">异常归因</CardTitle>
              <CardDescription className="text-gray-600">
                坏数据不再是员工的责任，系统自动标记并追溯根因
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700 text-sm">
              源文件损坏 · 数据重复 · 信息缺失
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <Users className="h-10 w-10 text-teal-600 mb-2" />
              <CardTitle className="text-gray-900">分配矩阵</CardTitle>
              <CardDescription className="text-gray-600">
                一目了然的资源分配视图，拖拽即可重新平衡工作量
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700 text-sm">
              批量分配 · 实时同步 · 审计追踪
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Formula Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 md:p-12 border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            核心公式
          </h3>
          <div className="text-center text-3xl md:text-4xl font-mono text-blue-600 mb-4">
            进度 = ValidOutput / (TotalQuota - Excluded)
          </div>
          <p className="text-gray-600 text-center max-w-xl mx-auto">
            不存储百分比，永远实时计算。分母动态调整，进度公正透明。
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© 2026 FluxQuant. 动态配额生产力追踪系统</p>
        </div>
      </footer>
    </div>
  );
}
