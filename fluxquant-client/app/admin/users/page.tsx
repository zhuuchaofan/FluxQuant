"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Zap, Plus, ArrowLeft, Loader2, Pencil, Trash2, 
  Key, Users, Shield, UserCog, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth-guard";
import {
  getUsersAction,
  createUserAction,
  updateUserAction,
  resetPasswordAction,
  deleteUserAction,
} from "@/lib/actions/admin";
import type { UserListDto, CreateUserRequest, UpdateUserRequest } from "@/components/features/admin/types";

const roleLabels: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  Admin: { label: "管理员", color: "text-red-400 border-red-400/30", icon: Shield },
  Manager: { label: "经理", color: "text-orange-400 border-orange-400/30", icon: UserCog },
  Employee: { label: "员工", color: "text-blue-400 border-blue-400/30", icon: UserCheck },
};

export default function UsersManagePage() {
  return (
    <AuthGuard requiredRole="Admin">
      <UsersManageContent />
    </AuthGuard>
  );
}

function UsersManageContent() {
  const queryClient = useQueryClient();
  const [userDialog, setUserDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    user?: UserListDto;
  }>({ open: false, mode: "create" });
  const [passwordDialog, setPasswordDialog] = useState<{
    open: boolean;
    userId?: number;
    username?: string;
  }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    userId?: number;
    username?: string;
  }>({ open: false });

  const { data: users, isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const result = await getUsersAction();
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUserAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("用户创建成功");
        queryClient.invalidateQueries({ queryKey: ["allUsers"] });
        setUserDialog({ open: false, mode: "create" });
      } else {
        toast.error(result.error);
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      updateUserAction(id, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("用户更新成功");
        queryClient.invalidateQueries({ queryKey: ["allUsers"] });
        setUserDialog({ open: false, mode: "create" });
      } else {
        toast.error(result.error);
      }
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      resetPasswordAction(id, password),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("密码重置成功");
        setPasswordDialog({ open: false });
      } else {
        toast.error(result.error);
      }
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUserAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("用户删除成功");
        queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      } else {
        toast.error(result.error);
      }
      setDeleteDialog({ open: false });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-700/50 backdrop-blur-md bg-zinc-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold text-white">用户管理</span>
            </div>
          </div>
          <Button 
            onClick={() => setUserDialog({ open: true, mode: "create" })} 
            className="bg-blue-600 hover:bg-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建用户
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
        ) : !users || users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">暂无用户</h3>
            <p className="text-zinc-400 mb-6">点击上方的新建用户按钮创建账户</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => {
              const roleInfo = roleLabels[user.role] || roleLabels.Employee;
              const RoleIcon = roleInfo.icon;
              
              return (
                <Card key={user.id} className="bg-zinc-800/50 border-zinc-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <RoleIcon className={`h-5 w-5 ${roleInfo.color.split(" ")[0]}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {user.displayName || user.username}
                          </p>
                          <p className="text-xs text-zinc-500">@{user.username}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={roleInfo.color}>
                        {roleInfo.label}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm mb-4">
                      <p className="text-zinc-400">{user.email}</p>
                      <p className="text-zinc-500">
                        {user.allocationCount} 个任务分配
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-700/50">
                      <Badge 
                        variant="outline" 
                        className={user.isActive 
                          ? "text-green-400 border-green-400/30" 
                          : "text-zinc-500 border-zinc-600"
                        }
                      >
                        {user.isActive ? "活跃" : "已禁用"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPasswordDialog({ 
                            open: true, 
                            userId: user.id, 
                            username: user.username 
                          })}
                          className="text-zinc-400 hover:text-white h-8 w-8"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setUserDialog({ open: true, mode: "edit", user })}
                          className="text-zinc-400 hover:text-white h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog({ 
                            open: true, 
                            userId: user.id, 
                            username: user.username 
                          })}
                          className="text-zinc-400 hover:text-red-400 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* User Dialog */}
      <UserFormDialog
        open={userDialog.open}
        mode={userDialog.mode}
        user={userDialog.user}
        isLoading={createUserMutation.isPending || updateUserMutation.isPending}
        onClose={() => setUserDialog({ open: false, mode: "create" })}
        onSubmit={(data) => {
          if (userDialog.mode === "create") {
            createUserMutation.mutate(data as CreateUserRequest);
          } else if (userDialog.user) {
            updateUserMutation.mutate({ 
              id: userDialog.user.id, 
              data: data as UpdateUserRequest 
            });
          }
        }}
      />

      {/* Password Reset Dialog */}
      <PasswordResetDialog
        open={passwordDialog.open}
        username={passwordDialog.username}
        isLoading={resetPasswordMutation.isPending}
        onClose={() => setPasswordDialog({ open: false })}
        onSubmit={(password) => {
          if (passwordDialog.userId) {
            resetPasswordMutation.mutate({ id: passwordDialog.userId, password });
          }
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => !open && setDeleteDialog({ open: false })}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">确认删除用户？</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              确定要删除用户「{deleteDialog.username}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.userId && deleteUserMutation.mutate(deleteDialog.userId)}
              className="bg-red-600 hover:bg-red-500"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 用户表单对话框
function UserFormDialog({
  open,
  mode,
  user,
  isLoading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  user?: UserListDto;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => void;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"Admin" | "Manager" | "Employee">("Employee");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    if (mode === "edit" && user) {
      setUsername(user.username);
      setEmail(user.email);
      setDisplayName(user.displayName || "");
      setRole(user.role as "Admin" | "Manager" | "Employee");
      setIsActive(user.isActive);
      setPassword("");
    } else {
      setUsername("");
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("Employee");
      setIsActive(true);
    }
  };

  const handleSubmit = () => {
    if (mode === "create") {
      onSubmit({ username, email, password, displayName, role });
    } else {
      onSubmit({ displayName, email, role, isActive });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); else resetForm(); }}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新建用户" : "编辑用户"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {mode === "create" ? "创建新用户账户" : `编辑用户 @${user?.username}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {mode === "create" && (
            <div className="space-y-2">
              <Label className="text-zinc-300">用户名</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="登录用户名"
                className="bg-zinc-800 border-zinc-600 text-white"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-zinc-300">邮箱</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>
          {mode === "create" && (
            <div className="space-y-2">
              <Label className="text-zinc-300">密码</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="初始密码"
                className="bg-zinc-800 border-zinc-600 text-white"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-zinc-300">显示名称</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="用户昵称"
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">角色</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="Admin" className="text-red-400">管理员</SelectItem>
                <SelectItem value="Manager" className="text-orange-400">经理</SelectItem>
                <SelectItem value="Employee" className="text-blue-400">员工</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "edit" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-600"
              />
              <Label htmlFor="isActive" className="text-zinc-300">账户启用</Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (mode === "create" && (!username || !email || !password))}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "create" ? "创建" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 密码重置对话框
function PasswordResetDialog({
  open,
  username,
  isLoading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  username?: string;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setPassword(""); } }}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle>重置密码</DialogTitle>
          <DialogDescription className="text-zinc-400">
            为用户 @{username} 设置新密码
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">新密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入新密码"
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button
            onClick={() => { onSubmit(password); setPassword(""); }}
            disabled={isLoading || !password}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "重置"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
