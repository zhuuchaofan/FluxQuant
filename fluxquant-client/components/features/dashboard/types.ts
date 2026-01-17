/**
 * Dashboard 统计相关类型
 */

export interface RecentActivityDto {
  logId: number;
  userName: string;
  taskPoolName: string;
  validQty: number;
  excludedQty: number;
  createdAt: string;
}

export interface DailyTrendDto {
  date: string;
  validOutput: number;
  excludedOutput: number;
  reportCount: number;
}

export interface AnomalyHotspotDto {
  taskPoolId: number;
  taskPoolName: string;
  stageName: string;
  projectName: string;
  totalQuota: number;
  totalExcluded: number;
  exclusionRate: number;
  topReason: string;
}

export interface AllocationAnomalyDto {
  allocationId: number;
  userName: string;
  taskPoolName: string;
  projectName: string;
  targetQuota: number;
  currentValid: number;
  currentExcluded: number;
  exclusionRate: number;
  topReason: string;
}

export interface DashboardStatsDto {
  activeProjects: number;
  totalTaskPools: number;
  activeEmployees: number;
  todayReportCount: number;
  todayValidOutput: number;
  todayExcludedOutput: number;
  overallProgress: number;
  anomalousPoolCount: number;
  anomalousAllocationCount: number;
  recentActivities: RecentActivityDto[];
  dailyTrends: DailyTrendDto[];
  anomalyHotspots: AnomalyHotspotDto[];
  allocationAnomalies: AllocationAnomalyDto[];
}
