"use server";

import { apiPost, apiGet } from "@/lib/api";
import { type ReportRequest, type ReportResult, type MyAllocationDto } from "@/components/features/stream/types";

/**
 * 获取我的任务分配列表
 */
export async function getMyAllocationsAction() {
  const response = await apiGet<MyAllocationDto[]>("/api/v1/my/allocations");
  return response;
}

/**
 * 提交填报 Server Action
 */
export async function submitReportAction(request: ReportRequest) {
  const response = await apiPost<ReportResult>("/api/v1/report", request);
  return response;
}

/**
 * 撤回填报 Server Action
 */
export async function revertReportAction(logId: number) {
  const response = await apiPost<ReportResult>(`/api/v1/report/${logId}/revert`, {});
  return response;
}
