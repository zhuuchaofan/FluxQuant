"use server";

import { cookies } from "next/headers";
import type {
  ProjectDetailDto,
  CreateProjectRequest,
  UpdateProjectRequest,
  StageDto,
  CreateStageRequest,
  UpdateStageRequest,
  TaskPoolDto,
  CreateTaskPoolRequest,
  UpdateTaskPoolRequest,
  UserListDto,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/components/features/admin/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

/**
 * 带认证的 API 请求
 */
async function authFetch<T>(path: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fluxquant_token")?.value;
    
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || `请求失败: ${response.status}` };
    }

    // DELETE 请求可能没有响应体
    if (response.status === 204 || options.method === "DELETE") {
      return { success: true };
    }

    const data: T = await response.json();
    return { success: true, data };
  } catch {
    return { success: false, error: "网络错误" };
  }
}

// ==================== 项目管理 ====================

export async function getAllProjectsAction() {
  return await authFetch<ProjectDetailDto[]>("/api/v1/admin/projects/all");
}

export async function getProjectByIdAction(id: number) {
  return await authFetch<ProjectDetailDto>(`/api/v1/admin/projects/${id}`);
}

export async function createProjectAction(request: CreateProjectRequest) {
  return await authFetch<ProjectDetailDto>("/api/v1/admin/projects", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function updateProjectAction(id: number, request: UpdateProjectRequest) {
  return await authFetch<ProjectDetailDto>(`/api/v1/admin/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export async function deleteProjectAction(id: number) {
  return await authFetch<void>(`/api/v1/admin/projects/${id}`, {
    method: "DELETE",
  });
}

// ==================== 阶段管理 ====================

export async function createStageAction(request: CreateStageRequest) {
  return await authFetch<StageDto>("/api/v1/admin/stages", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function updateStageAction(id: number, request: UpdateStageRequest) {
  return await authFetch<StageDto>(`/api/v1/admin/stages/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export async function deleteStageAction(id: number) {
  return await authFetch<void>(`/api/v1/admin/stages/${id}`, {
    method: "DELETE",
  });
}

// ==================== 任务池管理 ====================

export async function getTaskPoolsAction(stageId?: number) {
  const url = stageId ? `/api/v1/admin/pools?stageId=${stageId}` : "/api/v1/admin/pools";
  return await authFetch<TaskPoolDto[]>(url);
}

export async function createTaskPoolAction(request: CreateTaskPoolRequest) {
  return await authFetch<TaskPoolDto>("/api/v1/admin/pools", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function updateTaskPoolAction(id: number, request: UpdateTaskPoolRequest) {
  return await authFetch<TaskPoolDto>(`/api/v1/admin/pools/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export async function deleteTaskPoolAction(id: number) {
  return await authFetch<void>(`/api/v1/admin/pools/${id}`, {
    method: "DELETE",
  });
}

// ==================== 用户管理 ====================

export async function getUsersAction() {
  return await authFetch<UserListDto[]>("/api/v1/admin/users");
}

export async function createUserAction(request: CreateUserRequest) {
  return await authFetch<UserListDto>("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function updateUserAction(id: number, request: UpdateUserRequest) {
  return await authFetch<UserListDto>(`/api/v1/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export async function resetPasswordAction(id: number, newPassword: string) {
  return await authFetch<{ message: string }>(`/api/v1/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export async function deleteUserAction(id: number) {
  return await authFetch<void>(`/api/v1/admin/users/${id}`, {
    method: "DELETE",
  });
}
