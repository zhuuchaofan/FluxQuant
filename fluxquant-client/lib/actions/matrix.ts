"use server";

import { cookies } from "next/headers";
import type { 
  MatrixDataDto, 
  ProjectListDto, 
  MatrixCellDto,
  MatrixRowDto,
  MatrixUserDto
} from "@/components/features/matrix/types";
import {
  createAllocationSchema,
  updateAllocationSchema,
  adjustQuotaSchema,
  idParamSchema,
} from "@/lib/validations/matrix";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

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

    if (response.status === 204) {
      return { success: true };
    }

    const data: T = await response.json();
    return { success: true, data };
  } catch {
    return { success: false, error: "网络错误" };
  }
}

/**
 * 获取项目列表
 */
export async function getProjectsAction() {
  return await authFetch<ProjectListDto[]>("/api/v1/admin/projects");
}

/**
 * 获取矩阵数据
 */
export async function getMatrixDataAction(projectId: unknown) {
  const parsed = idParamSchema.safeParse(projectId);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<MatrixDataDto>(`/api/v1/admin/matrix/${parsed.data}`);
}

/**
 * 创建分配
 */
export async function createAllocationAction(request: unknown) {
  const parsed = createAllocationSchema.safeParse(request);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<MatrixCellDto>("/api/v1/admin/allocations", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}

/**
 * 更新分配额度
 */
export async function updateAllocationAction(allocationId: unknown, newQuota: unknown) {
  const idParsed = idParamSchema.safeParse(allocationId);
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || "分配ID验证失败" };
  }
  const quotaParsed = updateAllocationSchema.safeParse({ 
    allocationId: idParsed.data, 
    newTargetQuota: newQuota 
  });
  if (!quotaParsed.success) {
    return { success: false, error: quotaParsed.error.issues[0]?.message || "配额验证失败" };
  }
  return await authFetch<MatrixCellDto>(`/api/v1/admin/allocations/${quotaParsed.data.allocationId}`, {
    method: "PATCH",
    body: JSON.stringify(quotaParsed.data),
  });
}

/**
 * 调整任务池配额
 */
export async function adjustQuotaAction(taskPoolId: unknown, newQuota: unknown, reason: unknown) {
  const parsed = adjustQuotaSchema.safeParse({ taskPoolId, newQuota, reason });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<MatrixRowDto>(`/api/v1/admin/pools/${parsed.data.taskPoolId}/quota`, {
    method: "PATCH",
    body: JSON.stringify(parsed.data),
  });
}

/**
 * 获取员工列表
 */
export async function getEmployeesAction() {
  return await authFetch<MatrixUserDto[]>("/api/v1/admin/employees");
}

interface AllocationToggleDto {
  allocationId: number;
  userId: number;
  userName: string;
  taskPoolName: string;
  isActive: boolean;
}

/**
 * 禁用/启用分配
 */
export async function toggleAllocationAction(allocationId: unknown) {
  const parsed = idParamSchema.safeParse(allocationId);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<AllocationToggleDto>(`/api/v1/admin/allocations/${parsed.data}/toggle`, {
    method: "PATCH",
  });
}
