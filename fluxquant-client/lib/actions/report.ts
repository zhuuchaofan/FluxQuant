"use server";

import { cookies } from "next/headers";
import type { ReportResult, MyAllocationDto } from "@/components/features/stream/types";
import { reportSchema, logIdSchema } from "@/lib/validations/report";

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
 * 获取我的任务分配列表
 */
export async function getMyAllocationsAction() {
  return await authFetch<MyAllocationDto[]>("/api/v1/my/allocations");
}

/**
 * 提交填报 Server Action
 */
export async function submitReportAction(request: unknown) {
  const parsed = reportSchema.safeParse(request);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<ReportResult>("/api/v1/report", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}

/**
 * 撤回填报 Server Action
 */
export async function revertReportAction(logId: unknown) {
  const parsed = logIdSchema.safeParse(logId);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "参数验证失败" };
  }
  return await authFetch<ReportResult>(`/api/v1/report/${parsed.data}/revert`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
