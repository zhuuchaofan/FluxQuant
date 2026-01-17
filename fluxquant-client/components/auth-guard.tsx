"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getCurrentUserAction } from "@/lib/actions/auth";
import type { UserDto } from "@/lib/types";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "Admin" | "Manager" | "Employee";
}

/**
 * 认证保护组件
 * 检查用户是否已登录，未登录则跳转到登录页
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await getCurrentUserAction();
        
        if (!result.success || !result.data) {
          router.push("/login");
          return;
        }

        // 检查角色权限
        if (requiredRole) {
          const roleHierarchy = { Admin: 3, Manager: 2, Employee: 1 };
          const userLevel = roleHierarchy[result.data.role as keyof typeof roleHierarchy] || 0;
          const requiredLevel = roleHierarchy[requiredRole] || 0;

          if (userLevel < requiredLevel) {
            router.push("/my-stream"); // 权限不足，跳转到员工页
            return;
          }
        }

        setUser(result.data);
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

/**
 * 认证上下文 - 可选，用于在子组件中获取用户信息
 */
export { type UserDto } from "@/lib/types";
