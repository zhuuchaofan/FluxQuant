"use server";

import { cookies } from "next/headers";
import type { DashboardStatsDto } from "@/components/features/dashboard/types";

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

    const data: T = await response.json();
    return { success: true, data };
  } catch {
    return { success: false, error: "网络错误" };
  }
}

/**
 * 获取仪表板统计数据
 */
export async function getDashboardStatsAction() {
  return await authFetch<DashboardStatsDto>("/api/v1/dashboard/stats");
}

/**
 * 播种测试数据（仅开发环境）
 */
export async function seedDataAction() {
  return await authFetch<{ message: string }>("/api/v1/seed", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
