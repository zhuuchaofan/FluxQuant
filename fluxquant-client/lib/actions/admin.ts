"use server";

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
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

// ==================== 项目管理 ====================

export async function getAllProjectsAction() {
  return await apiGet<ProjectDetailDto[]>("/api/v1/admin/projects/all");
}

export async function getProjectByIdAction(id: number) {
  return await apiGet<ProjectDetailDto>(`/api/v1/admin/projects/${id}`);
}

export async function createProjectAction(request: CreateProjectRequest) {
  return await apiPost<ProjectDetailDto>("/api/v1/admin/projects", request);
}

export async function updateProjectAction(id: number, request: UpdateProjectRequest) {
  return await apiPut<ProjectDetailDto>(`/api/v1/admin/projects/${id}`, request);
}

export async function deleteProjectAction(id: number) {
  return await apiDelete<void>(`/api/v1/admin/projects/${id}`);
}

// ==================== 阶段管理 ====================

export async function createStageAction(request: CreateStageRequest) {
  return await apiPost<StageDto>("/api/v1/admin/stages", request);
}

export async function updateStageAction(id: number, request: UpdateStageRequest) {
  return await apiPut<StageDto>(`/api/v1/admin/stages/${id}`, request);
}

export async function deleteStageAction(id: number) {
  return await apiDelete<void>(`/api/v1/admin/stages/${id}`);
}

// ==================== 任务池管理 ====================

export async function getTaskPoolsAction(stageId?: number) {
  const url = stageId ? `/api/v1/admin/pools?stageId=${stageId}` : "/api/v1/admin/pools";
  return await apiGet<TaskPoolDto[]>(url);
}

export async function createTaskPoolAction(request: CreateTaskPoolRequest) {
  return await apiPost<TaskPoolDto>("/api/v1/admin/pools", request);
}

export async function updateTaskPoolAction(id: number, request: UpdateTaskPoolRequest) {
  return await apiPut<TaskPoolDto>(`/api/v1/admin/pools/${id}`, request);
}

export async function deleteTaskPoolAction(id: number) {
  return await apiDelete<void>(`/api/v1/admin/pools/${id}`);
}

// ==================== 用户管理 ====================

export async function getUsersAction() {
  return await apiGet<UserListDto[]>("/api/v1/admin/users");
}

export async function createUserAction(request: CreateUserRequest) {
  return await apiPost<UserListDto>("/api/v1/admin/users", request);
}

export async function updateUserAction(id: number, request: UpdateUserRequest) {
  return await apiPut<UserListDto>(`/api/v1/admin/users/${id}`, request);
}

export async function resetPasswordAction(id: number, newPassword: string) {
  return await apiPost<{ message: string }>(`/api/v1/admin/users/${id}/reset-password`, { newPassword });
}

export async function deleteUserAction(id: number) {
  return await apiDelete<void>(`/api/v1/admin/users/${id}`);
}
