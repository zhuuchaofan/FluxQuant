"use server";

import { cookies } from "next/headers";
import type {
  ProjectDetailDto,
  StageDto,
  TaskPoolDto,
  UserListDto,
} from "@/components/features/admin/types";
import {
  createProjectSchema,
  updateProjectSchema,
  createStageSchema,
  updateStageSchema,
  createTaskPoolSchema,
  updateTaskPoolSchema,
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  idParamSchema,
} from "@/lib/validations/admin";

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

export async function getProjectByIdAction(id: unknown) {
  const parsed = idParamSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<ProjectDetailDto>(`/api/v1/admin/projects/${parsed.data}`);
}

export async function createProjectAction(request: unknown) {
  const parsed = createProjectSchema.safeParse(request);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<ProjectDetailDto>("/api/v1/admin/projects", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}

export async function updateProjectAction(id: unknown, request: unknown) {
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || "ID验证失败" };
  }
  const dataParsed = updateProjectSchema.safeParse(request);
  if (!dataParsed.success) {
    return { success: false, error: dataParsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<ProjectDetailDto>(`/api/v1/admin/projects/${idParsed.data}`, {
    method: "PUT",
    body: JSON.stringify(dataParsed.data),
  });
}

export async function deleteProjectAction(id: unknown) {
  const parsed = idParamSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<void>(`/api/v1/admin/projects/${parsed.data}`, {
    method: "DELETE",
  });
}

// ==================== 阶段管理 ====================

export async function createStageAction(request: unknown) {
  const parsed = createStageSchema.safeParse(request);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<StageDto>("/api/v1/admin/stages", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}

export async function updateStageAction(id: unknown, request: unknown) {
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || "ID验证失败" };
  }
  const dataParsed = updateStageSchema.safeParse(request);
  if (!dataParsed.success) {
    return { success: false, error: dataParsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<StageDto>(`/api/v1/admin/stages/${idParsed.data}`, {
    method: "PUT",
    body: JSON.stringify(dataParsed.data),
  });
}

export async function deleteStageAction(id: unknown) {
  const parsed = idParamSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<void>(`/api/v1/admin/stages/${parsed.data}`, {
    method: "DELETE",
  });
}

// ==================== 任务池管理 ====================

export async function getTaskPoolsAction(stageId?: unknown) {
  if (stageId !== undefined) {
    const parsed = idParamSchema.safeParse(stageId);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
    }
    return await authFetch<TaskPoolDto[]>(`/api/v1/admin/pools?stageId=${parsed.data}`);
  }
  return await authFetch<TaskPoolDto[]>("/api/v1/admin/pools");
}

export async function createTaskPoolAction(request: unknown) {
  const parsed = createTaskPoolSchema.safeParse(request);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<TaskPoolDto>("/api/v1/admin/pools", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}

export async function updateTaskPoolAction(id: unknown, request: unknown) {
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || "ID验证失败" };
  }
  const dataParsed = updateTaskPoolSchema.safeParse(request);
  if (!dataParsed.success) {
    return { success: false, error: dataParsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<TaskPoolDto>(`/api/v1/admin/pools/${idParsed.data}`, {
    method: "PUT",
    body: JSON.stringify(dataParsed.data),
  });
}

export async function deleteTaskPoolAction(id: unknown) {
  const parsed = idParamSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<void>(`/api/v1/admin/pools/${parsed.data}`, {
    method: "DELETE",
  });
}

// ==================== 用户管理 ====================

export async function getUsersAction() {
  return await authFetch<UserListDto[]>("/api/v1/admin/users");
}

export async function createUserAction(request: unknown) {
  const parsed = createUserSchema.safeParse(request);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<UserListDto>("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}

export async function updateUserAction(id: unknown, request: unknown) {
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || "ID验证失败" };
  }
  const dataParsed = updateUserSchema.safeParse(request);
  if (!dataParsed.success) {
    return { success: false, error: dataParsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<UserListDto>(`/api/v1/admin/users/${idParsed.data}`, {
    method: "PUT",
    body: JSON.stringify(dataParsed.data),
  });
}

export async function resetPasswordAction(id: unknown, newPassword: unknown) {
  const idParsed = idParamSchema.safeParse(id);
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || "ID验证失败" };
  }
  const dataParsed = resetPasswordSchema.safeParse({ newPassword });
  if (!dataParsed.success) {
    return { success: false, error: dataParsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<{ message: string }>(`/api/v1/admin/users/${idParsed.data}/reset-password`, {
    method: "POST",
    body: JSON.stringify(dataParsed.data),
  });
}

export async function deleteUserAction(id: unknown) {
  const parsed = idParamSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<void>(`/api/v1/admin/users/${parsed.data}`, {
    method: "DELETE",
  });
}
