/**
 * 矩阵管理操作的 Zod 验证 Schema
 */

import { z } from "zod";

export const createAllocationSchema = z.object({
  taskPoolId: z.number().positive("任务池ID必须为正整数"),
  userId: z.number().positive("用户ID必须为正整数"),
  targetQuota: z.number().min(0, "目标配额不能为负数"),
});

export const updateAllocationSchema = z.object({
  allocationId: z.number().positive("分配ID必须为正整数"),
  newTargetQuota: z.number().min(0, "新配额不能为负数"),
});

export const adjustQuotaSchema = z.object({
  taskPoolId: z.number().positive("任务池ID必须为正整数"),
  newQuota: z.number().min(0, "新配额不能为负数"),
  reason: z.string().min(1, "调整原因不能为空").max(500, "原因最多500个字符"),
});

export const idParamSchema = z.number().positive("ID必须为正整数");
