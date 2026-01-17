"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LayoutGrid, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getCurrentUserAction, logoutAction } from "@/lib/actions/auth";

interface UserInfo {
  id: number;
  username: string;
  displayName?: string | null;
  role: string;
}

export function GlobalUserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await getCurrentUserAction();
        if (result.success && result.data) {
          setUser(result.data);
        }
      } catch {
        // 用户未登录
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const result = await logoutAction();
    if (result.success) {
      toast.success("已退出登录");
      router.push("/login");
    } else {
      toast.error("退出失败");
    }
  };

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700">
          登录
        </Button>
      </Link>
    );
  }

  const roleLabel = {
    Admin: "管理员",
    Manager: "经理",
    Employee: "员工",
  }[user.role] || user.role;

  const roleColor = {
    Admin: "bg-red-100 text-red-700 border-red-200",
    Manager: "bg-orange-100 text-orange-700 border-orange-200",
    Employee: "bg-blue-100 text-blue-700 border-blue-200",
  }[user.role] || "bg-gray-100 text-gray-700";

  const initials = (user.displayName || user.username).slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-600 text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start text-left">
            <span className="text-sm font-medium text-gray-900">
              {user.displayName || user.username}
            </span>
            <Badge variant="outline" className={`text-xs px-1 py-0 ${roleColor}`}>
              {roleLabel}
            </Badge>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
        <div className="px-3 py-2 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            {user.displayName || user.username}
          </p>
          <p className="text-xs text-gray-500">@{user.username}</p>
        </div>
        
        <DropdownMenuItem asChild className="text-gray-700 focus:bg-gray-100 cursor-pointer">
          <Link href="/my-stream" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            我的任务
          </Link>
        </DropdownMenuItem>

        {(user.role === "Admin" || user.role === "Manager") && (
          <DropdownMenuItem asChild className="text-gray-700 focus:bg-gray-100 cursor-pointer">
            <Link href="/admin" className="flex items-center">
              <LayoutGrid className="mr-2 h-4 w-4" />
              管理后台
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-gray-100" />

        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
