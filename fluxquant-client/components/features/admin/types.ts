/**
 * 管理后台 CRUD 类型定义
 */

export interface CreateProjectRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface StageDto {
  id: number;
  projectId: number;
  name: string;
  order: number;
  description?: string;
  taskPoolCount: number;
  totalQuota: number;
}

export interface ProjectDetailDto {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  stages: StageDto[];
}

export interface CreateStageRequest {
  projectId: number;
  name: string;
  order: number;
  description?: string;
}

export interface UpdateStageRequest {
  name: string;
  order: number;
  description?: string;
}

export interface CreateTaskPoolRequest {
  stageId: number;
  name: string;
  totalQuota: number;
  description?: string;
}

export interface UpdateTaskPoolRequest {
  name: string;
  totalQuota: number;
  description?: string;
}

export interface TaskPoolDto {
  id: number;
  stageId: number;
  stageName: string;
  name: string;
  totalQuota: number;
  description?: string;
  assignedQuota: number;
  completedQuota: number;
  allocationCount: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  role: "Admin" | "Manager" | "Employee";
}

export interface UpdateUserRequest {
  displayName?: string;
  email?: string;
  role: "Admin" | "Manager" | "Employee";
  isActive: boolean;
}

export interface UserListDto {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  allocationCount: number;
}
