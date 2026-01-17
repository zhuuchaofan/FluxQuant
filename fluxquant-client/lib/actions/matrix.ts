"use server";

import { apiGet, apiPost, apiPatch } from "@/lib/api";
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

/**
 * 获取项目列表
 */
export async function getProjectsAction() {
  return await apiGet<ProjectListDto[]>("/api/v1/admin/projects");
}

/**
 * 获取矩阵数据
 */
export async function getMatrixDataAction(projectId: number) {
  return await apiGet<MatrixDataDto>(`/api/v1/admin/matrix/${projectId}`);
}

/**
 * 创建分配
 */
export async function createAllocationAction(request: CreateAllocationRequest) {
  return await apiPost<MatrixCellDto>("/api/v1/admin/allocations", request);
}

/**
 * 更新分配额度
 */
export async function updateAllocationAction(allocationId: number, newQuota: number) {
  const request: UpdateAllocationRequest = { allocationId, newTargetQuota: newQuota };
  return await apiPatch<MatrixCellDto>(`/api/v1/admin/allocations/${allocationId}`, request);
}

/**
 * 调整任务池配额
 */
export async function adjustQuotaAction(taskPoolId: number, newQuota: number, reason: string) {
  const request: AdjustQuotaRequest = { taskPoolId, newQuota, reason };
  return await apiPatch<MatrixRowDto>(`/api/v1/admin/pools/${taskPoolId}/quota`, request);
}

/**
 * 获取员工列表
 */
export async function getEmployeesAction() {
  return await apiGet<MatrixUserDto[]>("/api/v1/admin/employees");
}
