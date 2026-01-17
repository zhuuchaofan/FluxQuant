/**
 * 员工端任务流相关类型
 */

export interface LastReportDto {
  createdAt: string;
  validQty: number;
  excludedQty: number;
}

export interface MyAllocationDto {
  id: number;
  taskPoolId: number;
  taskPoolName: string;
  stageName: string;
  projectName: string;
  targetQuota: number;
  currentValid: number;
  currentExcluded: number;
  remaining: number;
  progressPercent: number;
  isCompleted: boolean;
  lastReport?: LastReportDto;
}

export interface ReportRequest {
  allocationId: number;
  logDate: string; // YYYY-MM-DD
  validQty: number;
  excludedQty: number;
  exclusionReason?: string;
  comment?: string;
  isBackfill: boolean;
}

export interface ReportResult {
  logId: number;
  newCurrentValid: number;
  newCurrentExcluded: number;
  newProgressPercent: number;
  isCompleted: boolean;
}

export const EXCLUSION_REASONS = [
  "源文件损坏",
  "数据重复",
  "信息缺失",
  "无法辨认",
  "其他",
] as const;
