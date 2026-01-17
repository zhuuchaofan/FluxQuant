/**
 * 管理端矩阵相关类型
 */

export interface MatrixUserDto {
  id: number;
  name: string;
}

export interface MatrixCellDto {
  allocationId: number;
  userId: number;
  userName: string;
  targetQuota: number;
  currentValid: number;
  currentExcluded: number;
  progressPercent: number;
  isCompleted: boolean;
  isLagging: boolean;
}

export interface MatrixRowDto {
  taskPoolId: number;
  taskPoolName: string;
  stageId: number;
  stageName: string;
  totalQuota: number;
  assignedTotal: number;
  unassigned: number;
  totalValid: number;
  totalExcluded: number;
  progressPercent: number;
  exclusionRate: number;
  isAnomalous: boolean;
  allocations: MatrixCellDto[];
}

export interface MatrixStageDto {
  stageId: number;
  stageName: string;
  order: number;
  taskPools: MatrixRowDto[];
}

export interface MatrixDataDto {
  projectId: number;
  projectName: string;
  projectCode: string;
  users: MatrixUserDto[];
  stages: MatrixStageDto[];
}

export interface ProjectListDto {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  stageCount: number;
  taskPoolCount: number;
  overallProgress: number;
}

export interface UpdateAllocationRequest {
  allocationId: number;
  newTargetQuota: number;
}

export interface CreateAllocationRequest {
  taskPoolId: number;
  userId: number;
  targetQuota: number;
}

export interface AdjustQuotaRequest {
  taskPoolId: number;
  newQuota: number;
  reason: string;
}
