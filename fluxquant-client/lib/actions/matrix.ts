"use server";

import { cookies } from "next/headers";
import type { 
  MatrixDataDto, 
  ProjectListDto, 
  MatrixCellDto,
  MatrixRowDto,
  CreateAllocationRequest,
  UpdateAllocationRequest,
  AdjustQuotaRequest,
  MatrixUserDto
} from "@/components/features/matrix/types";

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
export async function getMatrixDataAction(projectId: number) {
  return await authFetch<MatrixDataDto>(`/api/v1/admin/matrix/${projectId}`);
}

/**
 * 创建分配
 */
export async function createAllocationAction(request: CreateAllocationRequest) {
  return await authFetch<MatrixCellDto>("/api/v1/admin/allocations", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * 更新分配额度
 */
export async function updateAllocationAction(allocationId: number, newQuota: number) {
  const request: UpdateAllocationRequest = { allocationId, newTargetQuota: newQuota };
  return await authFetch<MatrixCellDto>(`/api/v1/admin/allocations/${allocationId}`, {
    method: "PATCH",
    body: JSON.stringify(request),
  });
}

/**
 * 调整任务池配额
 */
export async function adjustQuotaAction(taskPoolId: number, newQuota: number, reason: string) {
  const request: AdjustQuotaRequest = { taskPoolId, newQuota, reason };
  return await authFetch<MatrixRowDto>(`/api/v1/admin/pools/${taskPoolId}/quota`, {
    method: "PATCH",
    body: JSON.stringify(request),
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
export async function toggleAllocationAction(allocationId: number) {
  return await authFetch<AllocationToggleDto>(`/api/v1/admin/allocations/${allocationId}/toggle`, {
    method: "PATCH",
  });
}
