"use server";

import { apiGet, apiPost } from "@/lib/api";
import type { DashboardStatsDto } from "@/components/features/dashboard/types";

/**
 * 获取仪表板统计数据
 */
export async function getDashboardStatsAction() {
  return await apiGet<DashboardStatsDto>("/api/v1/dashboard/stats");
}

/**
 * 播种测试数据（仅开发环境）
 */
export async function seedDataAction() {
  return await apiPost<{ message: string }>("/api/v1/seed", {});
}
