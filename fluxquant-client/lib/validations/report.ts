/**
 * 填报操作的 Zod 验证 Schema
 */

import { z } from "zod";

export const reportSchema = z.object({
  allocationId: z.number().positive("分配ID必须为正整数"),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
  validQty: z.number().min(0, "有效量不能为负数"),
  excludedQty: z.number().min(0, "除外量不能为负数"),
  exclusionReason: z.string().max(200, "除外原因最多200个字符").optional(),
  comment: z.string().max(500, "备注最多500个字符").optional(),
  isBackfill: z.boolean(),
});

export const logIdSchema = z.number().positive("日志ID必须为正整数");
