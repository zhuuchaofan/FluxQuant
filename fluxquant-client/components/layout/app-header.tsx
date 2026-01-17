"use client";

import Link from "next/link";
import { Zap, ArrowLeft, RefreshCw, LayoutGrid, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobalUserMenu } from "@/components/global-user-menu";

export type HeaderVariant = "default" | "admin" | "employee" | "dashboard";

interface AppHeaderProps {
  /** 页面变体类型 */
  variant?: HeaderVariant;
  /** 页面标题（覆盖默认标题） */
  title?: string;
  /** 页面标识徽章 */
  badge?: {
    text: string;
    className?: string;
  };
  /** 返回链接 */
  backHref?: string;
  /** 自定义操作区域 */
  actions?: React.ReactNode;
  /** 是否正在刷新 */
  isFetching?: boolean;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 是否显示实时指示器 */
  showLiveIndicator?: boolean;
}

export function AppHeader({
  variant = "default",
  title,
  badge,
  backHref,
  actions,
  isFetching,
  onRefresh,
  showLiveIndicator,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 backdrop-blur-md bg-white/80">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* 左侧: Logo + 标题 */}
        <div className="flex items-center gap-4">
          {backHref && (
            <Link href={backHref} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            {title ? (
              <span className="text-xl font-bold text-gray-900">{title}</span>
            ) : (
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text">
                FluxQuant
              </span>
            )}
            {badge && (
              <Badge
                variant="outline"
                className={badge.className || "text-gray-600 border-gray-300"}
              >
                {badge.text}
              </Badge>
            )}
          </div>
        </div>

        {/* 右侧: 导航 + 操作 */}
        <nav className="flex items-center gap-2">
          {/* 变体特定导航 */}
          {variant === "admin" && (
            <>
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
            </>
          )}

          {variant === "dashboard" && (
            <Link href="/admin">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                <LayoutGrid className="mr-2 h-4 w-4" />
                项目管理
              </Button>
            </Link>
          )}

          {/* 实时指示器 */}
          {showLiveIndicator && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200">
              <div
                className={`w-2 h-2 rounded-full ${
                  isFetching ? "bg-yellow-400 animate-pulse" : "bg-green-400"
                }`}
              />
              <span className="text-xs text-gray-600">
                {isFetching ? "同步中..." : "实时"}
              </span>
            </div>
          )}

          {/* 刷新按钮 */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isFetching}
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          )}

          {/* 自定义操作 */}
          {actions}

          {/* 用户菜单 */}
          <GlobalUserMenu />
        </nav>
      </div>
    </header>
  );
}
