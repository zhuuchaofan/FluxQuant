"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { loginAction, registerAction } from "@/lib/actions/auth";

function LoginForm() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  
  // 表单状态
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (mode === "register") {
        const result = await registerAction({
          username,
          email,
          password,
          displayName: displayName || undefined,
        });
        
        if (result.success) {
          toast.success("注册成功！正在跳转...");
          window.location.href = "/my-stream";
        } else {
          toast.error(result.error || "注册失败");
        }
      } else {
        const result = await loginAction({
          usernameOrEmail: username,
          password,
        });
        
        if (result.success) {
          toast.success("登录成功！正在跳转...");
          // 使用 window.location 确保浏览器刷新获取 Cookie
          window.location.href = "/my-stream";
        } else {
          toast.error(result.error || "登录失败");
        }
      }
    } catch {
      toast.error("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
            FluxQuant
          </span>
        </div>
        <CardTitle className="text-white text-xl">
          {mode === "login" ? "欢迎回来" : "创建账户"}
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {mode === "login" 
            ? "登录您的 FluxQuant 账户" 
            : "加入 FluxQuant，开始追踪生产力"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-zinc-300">
              {mode === "login" ? "用户名或邮箱" : "用户名"}
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === "login" ? "请输入用户名或邮箱" : "请输入用户名"}
              required
              className="bg-zinc-900/50 border-zinc-600 text-white placeholder:text-zinc-500"
            />
          </div>
          
          {mode === "register" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  required
                  className="bg-zinc-900/50 border-zinc-600 text-white placeholder:text-zinc-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-zinc-300">显示名称 (可选)</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="您希望如何被称呼"
                  className="bg-zinc-900/50 border-zinc-600 text-white placeholder:text-zinc-500"
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              className="bg-zinc-900/50 border-zinc-600 text-white placeholder:text-zinc-500"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "login" ? "登录中..." : "注册中..."}
              </>
            ) : (
              mode === "login" ? "登录" : "注册"
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-zinc-400 text-sm">
            {mode === "login" ? "还没有账户？" : "已有账户？"}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="ml-1 text-cyan-400 hover:text-cyan-300 font-medium"
            >
              {mode === "login" ? "立即注册" : "立即登录"}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoginFormFallback() {
  return (
    <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur animate-pulse">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-8 w-8 rounded bg-zinc-700" />
          <div className="h-8 w-32 rounded bg-zinc-700" />
        </div>
        <div className="h-6 w-24 mx-auto rounded bg-zinc-700" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 rounded bg-zinc-700" />
        <div className="h-10 rounded bg-zinc-700" />
        <div className="h-10 rounded bg-zinc-700" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link 
          href="/" 
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>
        
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
