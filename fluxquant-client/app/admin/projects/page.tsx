"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Zap, Plus, ArrowLeft, Loader2, Pencil, Trash2, 
  ChevronDown, ChevronRight, FolderPlus, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth-guard";
import {
  getAllProjectsAction,
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  createStageAction,
  deleteStageAction,
  createTaskPoolAction,
} from "@/lib/actions/admin";
import type { ProjectDetailDto, StageDto } from "@/components/features/admin/types";

export default function ProjectsManagePage() {
  return (
    <AuthGuard requiredRole="Manager">
      <ProjectsManageContent />
    </AuthGuard>
  );
}

function ProjectsManageContent() {
  const queryClient = useQueryClient();
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [projectDialog, setProjectDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    project?: ProjectDetailDto;
  }>({ open: false, mode: "create" });
  const [stageDialog, setStageDialog] = useState<{
    open: boolean;
    projectId?: number;
  }>({ open: false });
  const [poolDialog, setPoolDialog] = useState<{
    open: boolean;
    stageId?: number;
    stageName?: string;
  }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "project" | "stage";
    id?: number;
    name?: string;
  }>({ open: false, type: "project" });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["allProjects"],
    queryFn: async () => {
      const result = await getAllProjectsAction();
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: createProjectAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("项目创建成功");
        queryClient.invalidateQueries({ queryKey: ["allProjects"] });
        setProjectDialog({ open: false, mode: "create" });
      } else {
        toast.error(result.error);
      }
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateProjectAction>[1] }) =>
      updateProjectAction(id, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("项目更新成功");
        queryClient.invalidateQueries({ queryKey: ["allProjects"] });
        setProjectDialog({ open: false, mode: "create" });
      } else {
        toast.error(result.error);
      }
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteProjectAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("项目删除成功");
        queryClient.invalidateQueries({ queryKey: ["allProjects"] });
      } else {
        toast.error(result.error);
      }
      setDeleteDialog({ open: false, type: "project" });
    },
  });

  const createStageMutation = useMutation({
    mutationFn: createStageAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("阶段创建成功");
        queryClient.invalidateQueries({ queryKey: ["allProjects"] });
        setStageDialog({ open: false });
      } else {
        toast.error(result.error);
      }
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: deleteStageAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("阶段删除成功");
        queryClient.invalidateQueries({ queryKey: ["allProjects"] });
      } else {
        toast.error(result.error);
      }
      setDeleteDialog({ open: false, type: "stage" });
    },
  });

  const createPoolMutation = useMutation({
    mutationFn: createTaskPoolAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("任务池创建成功");
        queryClient.invalidateQueries({ queryKey: ["allProjects"] });
        setPoolDialog({ open: false });
      } else {
        toast.error(result.error);
      }
    },
  });

  const toggleProject = (id: number) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
              <span className="text-xl font-bold text-white">项目管理</span>
            </div>
          </div>
          <Button onClick={() => setProjectDialog({ open: true, mode: "create" })} className="bg-blue-600 hover:bg-blue-500">
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-20">
            <FolderPlus className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">暂无项目</h3>
            <p className="text-zinc-400 mb-6">点击上方的新建项目按钮创建第一个项目</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="bg-zinc-800/50 border-zinc-700/50">
                <CardHeader 
                  className="cursor-pointer" 
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedProjects.has(project.id) ? (
                        <ChevronDown className="h-5 w-5 text-zinc-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-zinc-400" />
                      )}
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          {project.name}
                          <Badge variant="outline" className="text-zinc-400 border-zinc-600">
                            {project.code}
                          </Badge>
                          {!project.isActive && (
                            <Badge className="bg-zinc-700 text-zinc-400">已归档</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-zinc-500 mt-1">
                          {project.stages.length} 个阶段 · 
                          {project.stages.reduce((sum, s) => sum + s.taskPoolCount, 0)} 个任务池
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProjectDialog({ open: true, mode: "edit", project })}
                        className="text-zinc-400 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ 
                          open: true, 
                          type: "project", 
                          id: project.id, 
                          name: project.name 
                        })}
                        className="text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedProjects.has(project.id) && (
                  <CardContent className="pt-0">
                    <div className="border-t border-zinc-700 pt-4 space-y-3">
                      {project.stages.map((stage) => (
                        <StageItem
                          key={stage.id}
                          stage={stage}
                          onAddPool={() => setPoolDialog({ 
                            open: true, 
                            stageId: stage.id, 
                            stageName: stage.name 
                          })}
                          onDelete={() => setDeleteDialog({ 
                            open: true, 
                            type: "stage", 
                            id: stage.id, 
                            name: stage.name 
                          })}
                        />
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStageDialog({ open: true, projectId: project.id })}
                        className="border-dashed border-zinc-600 text-zinc-400 hover:text-white w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        添加阶段
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Project Dialog */}
      <ProjectFormDialog
        open={projectDialog.open}
        mode={projectDialog.mode}
        project={projectDialog.project}
        isLoading={createProjectMutation.isPending || updateProjectMutation.isPending}
        onClose={() => setProjectDialog({ open: false, mode: "create" })}
        onSubmit={(data) => {
          if (projectDialog.mode === "create") {
            createProjectMutation.mutate(data);
          } else if (projectDialog.project) {
            updateProjectMutation.mutate({ 
              id: projectDialog.project.id, 
              data: { ...data, isActive: projectDialog.project.isActive } 
            });
          }
        }}
      />

      {/* Stage Dialog */}
      <StageFormDialog
        open={stageDialog.open}
        projectId={stageDialog.projectId}
        isLoading={createStageMutation.isPending}
        onClose={() => setStageDialog({ open: false })}
        onSubmit={(data) => createStageMutation.mutate(data)}
      />

      {/* Pool Dialog */}
      <PoolFormDialog
        open={poolDialog.open}
        stageId={poolDialog.stageId}
        stageName={poolDialog.stageName}
        isLoading={createPoolMutation.isPending}
        onClose={() => setPoolDialog({ open: false })}
        onSubmit={(data) => createPoolMutation.mutate(data)}
      />

      {/* Delete Confirmation */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: "project" })}
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              确认删除{deleteDialog.type === "project" ? "项目" : "阶段"}？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              确定要删除「{deleteDialog.name}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.id) {
                  if (deleteDialog.type === "project") {
                    deleteProjectMutation.mutate(deleteDialog.id);
                  } else {
                    deleteStageMutation.mutate(deleteDialog.id);
                  }
                }
              }}
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

// 阶段项组件
function StageItem({ 
  stage, 
  onAddPool, 
  onDelete 
}: { 
  stage: StageDto; 
  onAddPool: () => void; 
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
      <div className="flex items-center gap-3">
        <Layers className="h-4 w-4 text-cyan-400" />
        <div>
          <p className="text-white text-sm">{stage.name}</p>
          <p className="text-xs text-zinc-500">
            {stage.taskPoolCount} 个任务池 · {stage.totalQuota} 总配额
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onAddPool} className="text-zinc-400 hover:text-white">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-zinc-400 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// 项目表单对话框
function ProjectFormDialog({
  open,
  mode,
  project,
  isLoading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  project?: ProjectDetailDto;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; code: string; description?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  // 重置表单
  const resetForm = () => {
    if (mode === "edit" && project) {
      setName(project.name);
      setCode(project.code);
      setDescription(project.description || "");
    } else {
      setName("");
      setCode("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); else resetForm(); }}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新建项目" : "编辑项目"}</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {mode === "create" ? "创建一个新项目来组织任务" : "修改项目信息"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">项目名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：2026年Q1数据处理项目"
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">项目代码</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="如：DP-2026Q1"
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">描述（可选）</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="项目描述..."
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">
            取消
          </Button>
          <Button
            onClick={() => onSubmit({ name, code, description })}
            disabled={isLoading || !name || !code}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "create" ? "创建" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 阶段表单对话框
function StageFormDialog({
  open,
  projectId,
  isLoading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  projectId?: number;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: { projectId: number; name: string; order: number }) => void;
}) {
  const [name, setName] = useState("");
  const [order, setOrder] = useState(1);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle>添加阶段</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">阶段名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：数据清洗"
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">排序</Label>
            <Input
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button
            onClick={() => projectId && onSubmit({ projectId, name, order })}
            disabled={isLoading || !name}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 任务池表单对话框
function PoolFormDialog({
  open,
  stageId,
  stageName,
  isLoading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  stageId?: number;
  stageName?: string;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: { stageId: number; name: string; totalQuota: number }) => void;
}) {
  const [name, setName] = useState("");
  const [quota, setQuota] = useState(100);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle>添加任务池</DialogTitle>
          <DialogDescription className="text-zinc-400">
            添加到阶段：{stageName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">任务池名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：客户A历史订单"
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">总配额</Label>
            <Input
              type="number"
              min={1}
              value={quota}
              onChange={(e) => setQuota(parseInt(e.target.value) || 0)}
              className="bg-zinc-800 border-zinc-600 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button
            onClick={() => stageId && onSubmit({ stageId, name, totalQuota: quota })}
            disabled={isLoading || !name || quota <= 0}
            className="bg-blue-600 hover:bg-blue-500"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
